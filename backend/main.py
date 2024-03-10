import asyncio
import fastapi
import modal

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime

from typing import List, Optional

from modal import Image, Stub, asgi_app, Secret
from modal.functions import FunctionCall  # Added import
import instructor
from youtube_transcript_api import YouTubeTranscriptApi
import re
import os
from openai import AsyncOpenAI

# Initialize FastAPI app and load environment variables
web_app = FastAPI()
api_key = os.getenv("OPENAI_API_KEY")
# Configure CORS
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define your Pydantic models and utility functions here

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

class BlogExpansionResponse(BaseModel):
    call_id: str

class BlogPollExpansionResponse(BaseModel):
    topic_name: str
    expanded_content: str

# helper function 
def extract_video_id(url: str) -> str:
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    return match.group(1) if match else ""


# Configure Modal stub
image = Image.debian_slim().pip_install("pydantic==2.5.3", "fastapi==0.109.0", "instructor", "youtube_transcript_api", "openai", "python-dotenv")
stub = Stub("my-content-go-crazy")

# Define API endpoint
@web_app.post("/createblog", response_model=TranscriptTopicsResponse)
async def process_youtube_video(video_topics: VideoTopicsRequest):
    client = instructor.patch(AsyncOpenAI(api_key=api_key), mode=instructor.Mode.TOOLS)  
    youtube_link = video_topics.link
    additional_topics = video_topics.topics
    video_id = extract_video_id(youtube_link)
    if not video_id:
        return TranscriptTopicsResponse(error="Invalid YouTube URL", video_id=None)

    try:
        captions = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = ' '.join([re.sub(r'\[.*?\]', '', caption['text']) for caption in captions]).strip()
    except Exception as error:
        print(f"Error getting transcript: {str(error)}")
        return TranscriptTopicsResponse(error=str(error), video_id=video_id)

    prompt = f"Analyze the following transcript: '{transcript}'. Your task is to identify and enumerate at least 2 extra new main topics, providing detailed points for each. Additionally, enrich the pre-existing topics: {additional_topics} with insights from the transcript. It is imperative to keep the original topics ({additional_topics}) intact, merely augmenting them with relevant points from the transcript. Introduce new topics directly as necessary, but ensure the total does not surpass 5, to avoid redundancy and maintain contextual relevance and efficiency. For each topic, include relevant excerpts from the transcript that illustrate the core idea for further development. Ensure there is no overlap with existing topics, preserving the uniqueness and relevance of each. If the {additional_topics} is not in the final list of topics then try again and make sure it is."
    print(f"Prompt: {prompt}")
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
        print(f"Response: {response}")

        # Ensure the response structure matches the expected output for the frontend
        return TranscriptTopicsResponse(link=youtube_link, video_id=video_id, topics=response.topics, error=None)
    except Exception as error:
        print(f"Error from OpenAI: {str(error)}")
        return TranscriptTopicsResponse(error=str(error), video_id=video_id, link=youtube_link, topics=[])

# polling mechanism 
@stub.function(image=image, secrets=[modal.Secret.from_dotenv(__file__)], keep_warm=1, retries=modal.Retries(max_retries=10, backoff_coefficient=1.0, initial_delay=1.5), allow_concurrent_inputs=20, concurrency_limit=20)
async def generate_expanded_blog_content(topic_name: str, points_summary: List[str]) -> BlogPollExpansionResponse:
    print(f"Starting content generation for topic: {topic_name} with points: {', '.join(points_summary)}")
    client = instructor.patch(AsyncOpenAI(api_key=api_key), mode=instructor.Mode.TOOLS)  
    if not topic_name.strip() or not points_summary:
        print("Either topic name is empty or points summary is empty.")
        return BlogPollExpansionResponse(topic_name="", expanded_content="")
    try:
        seo_prompt = f"Please provide an in-depth exploration of the topic '{topic_name}', focusing on the following key points: {'; '.join(points_summary)}. Aim to structure the content with HTML, using <h2> tags for point headings (wihtout using introduction or conclusion style generic headings) and <p> tags for detailed discussions. The content should be rich in detail, offering clear, professional insights into each point. Ensure the narrative is comprehensive, covering each aspect thoroughly to maximize the value of the content. Additionally, please generate the maximum allowable tokens to ensure a detailed and informative expansion on the topic."
        print(f"Sending SEO prompt to OpenAI: {seo_prompt[:100]}...")  # Print the first 100 characters of the prompt to avoid clutter
        seo_response = await client.chat.completions.create(
            model="gpt-4", #gpt-3.5-turbo-0125
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": seo_prompt}
            ],
            max_retries=5,
            response_model=BlogPollExpansionResponse,
        )  

        # print("Waiting 15 seconds before mocking SEO response for testing purposes.")
        # await asyncio.sleep(20)  # Wait for 15 seconds
        # seo_response = BlogPollExpansionResponse(
        #     topic_name=topic_name,
        #     expanded_content="This is a mocked response for the SEO content generation after a 15-second wait."
        # )
        print(f"SEO response from OpenAI: {seo_response}")
        # Correctly access 'topic_name' and 'expanded_content' from the seo_response object
        topic_name_str = seo_response.topic_name
        expanded_content_str = seo_response.expanded_content

        return BlogPollExpansionResponse(topic_name=topic_name_str, expanded_content=expanded_content_str)
    except Exception as error:
        print(f"Error generating SEO content for topic '{topic_name}': {str(error)}")
        return BlogPollExpansionResponse(topic_name="Error", expanded_content="Failed to generate SEO optimized content due to an internal error.")
@web_app.post("/expandblog", response_model=BlogExpansionResponse)
async def expand_blog_topics(blog_topics_details: ExpandTopicsRequest):
    topic_name = blog_topics_details.topicName
    points_summary = blog_topics_details.points
    if not topic_name.strip() or not points_summary:
        return BlogExpansionResponse(call_id="")
    call = generate_expanded_blog_content.spawn(topic_name=topic_name, points_summary=points_summary)
    return BlogExpansionResponse(call_id=call.object_id)

@web_app.get("/result/{call_id}")
async def poll_results(call_id: str):
    from modal.functions import FunctionCall

    function_call = FunctionCall.from_id(call_id)
    try:
        result = function_call.get(timeout=0)
    except TimeoutError:
        return fastapi.responses.JSONResponse(content={"success": False, "error": "Result not ready"}, status_code=202)
    except Exception as e:
        return fastapi.responses.JSONResponse(content={"success": False, "error": str(e)}, status_code=500)
    return result

@stub.function(image=image, secrets=[modal.Secret.from_dotenv(__file__)])
@asgi_app()
def fastapi_app():
    return web_app