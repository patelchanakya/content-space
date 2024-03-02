from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from typing import List, Optional

from modal import Image, Stub, asgi_app, Secret
import instructor
from youtube_transcript_api import YouTubeTranscriptApi
import re
import os
from openai import AsyncOpenAI

# Initialize FastAPI app and load environment variables
web_app = FastAPI()
api_key = os.getenv("OPENAI_API_KEY")

client = instructor.patch(AsyncOpenAI(api_key=api_key), mode=instructor.Mode.TOOLS)  
# Configure CORS
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class VideoTopicsRequest(BaseModel):
    link: str
    topics: List[str]

# Define models and utilities
class Topic(BaseModel):
    topic: str
    point: str

class TranscriptTopicsResponse(BaseModel):
    link: str
    video_id: str
    topics: List[Topic]  # Modified to hold a list of strings instead of Topic objects
    error: Optional[str] = None

class ExpandTopicsRequest(BaseModel):
    topicName: str
    points: List[str]

class ExpandTopicsResponse(BaseModel):
    id: str
    topicId: str
    pointId: List[str]
    content: List[str]
    createdAt: datetime
    class Config:
        arbitrary_types_allowed = True

def extract_video_id(url: str) -> str:
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    return match.group(1) if match else ""

class BlogExpansionResponse(BaseModel):
    topic_name: str
    expanded_content: str

@web_app.post("/expandblog", response_model=BlogExpansionResponse)
async def expand_blog_topics(blog_topics_details: ExpandTopicsRequest):
    topic_name = blog_topics_details.topicName
    points_summary = blog_topics_details.points
    if not topic_name.strip() or not points_summary:
        return BlogExpansionResponse(topic_name="", expanded_content="")

    seo_prompt = f"Please provide an in-depth exploration of the topic '{topic_name}', focusing on the following key points: {'; '.join(points_summary)}. Aim to structure the content with HTML, using <h2> tags for point headings and <p> tags for detailed discussions. The content should be rich in detail, offering clear, professional insights into each point. Ensure the narrative is comprehensive, covering each aspect thoroughly to maximize the value of the content. Additionally, please generate the maximum allowable tokens to ensure a detailed and informative expansion on the topic."
    try:
        seo_response = await client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": seo_prompt}
            ],
            response_model=BlogExpansionResponse,  # Correct usage as per @Instructor's custom feature
            max_retries=5
        )
        # Assuming seo_response now directly matches the BlogExpansionResponse model
        return BlogExpansionResponse(topic_name=seo_response.topic_name, expanded_content=seo_response.expanded_content)
    except Exception as error:
        print(f"Error generating SEO content for topic '{topic_name}': {str(error)}")
        return BlogExpansionResponse(topic_name="Error", expanded_content="Failed to generate SEO optimized content due to an internal error.")
    
# Define API endpoint
@web_app.post("/createblog", response_model=TranscriptTopicsResponse)
async def process_youtube_video(video_topics: VideoTopicsRequest):

    youtube_link = video_topics.link
    additional_topics = video_topics.topics
    video_id = extract_video_id(youtube_link)
    if not video_id:
        return TranscriptTopicsResponse(error="Invalid YouTube URL", video_id=None)

    try:
        captions = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = ' '.join([re.sub(r'\[.*?\]', '', caption['text']) for caption in captions]).strip()
    except Exception as error:
        return TranscriptTopicsResponse(error=str(error), video_id=video_id)

    # This OpenAI prompt is crafted for an in-depth analysis of the video transcript.
    # Its objective is to unearth at least 3 new topics that add value to content generation, while also enhancing the provided topics with insights derived from the transcript. The original topics are to remain unaltered.
    # A crucial limitation is the total number of topics, which must not exceed 5, to ensure focus and relevance.
    # The prompt is designed to prevent topic duplication, thereby maintaining the uniqueness and pertinence of each topic.
    # It mandates the inclusion of pertinent transcript excerpts for each topic to substantiate the main points for further elaboration.
    prompt = f"Analyze the following transcript: '{transcript}'. Your task is to identify and enumerate at least 2 extra new main topics, providing detailed points for each. Additionally, enrich the pre-existing topics: {additional_topics} with insights from the transcript. It is imperative to keep the original topics ({additional_topics}) intact, merely augmenting them with relevant points from the transcript. Introduce new topics directly as necessary, but ensure the total does not surpass 5, to avoid redundancy and maintain contextual relevance and efficiency. For each topic, include relevant excerpts from the transcript that illustrate the core idea for further development. Ensure there is no overlap with existing topics, preserving the uniqueness and relevance of each."
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
                {"role": "user", "content": prompt}
            ],
            response_model=TranscriptTopicsResponse,
            max_retries=5
        )

        return TranscriptTopicsResponse(link=youtube_link, video_id=video_id, topics=response.topics, error=None)
    except Exception as error:
        return TranscriptTopicsResponse(error=str(error), video_id=video_id, link=youtube_link, topics=[])

# Configure Modal stub
image = Image.debian_slim().pip_install("pydantic==2.5.3", "fastapi==0.109.0", "instructor", "youtube_transcript_api", "openai", "python-dotenv")
stub = Stub()

@stub.function(image=image, secrets=[Secret.from_dotenv()])
@asgi_app()
def fastapi_app():
    return web_app