from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
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
client = instructor.patch(AsyncOpenAI())

# Configure CORS
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define models and utilities
class Topic(BaseModel):
    topic: str
    discussion_text: str

class TranscriptTopicsResponse(BaseModel):
    link: str
    video_id: str
    topics: List[Topic]
    error: Optional[str] = None

def extract_video_id(url: str) -> str:
    match = re.search(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
    return match.group(1) if match else ""

# Define API endpoint
@web_app.post("/foo", response_model=TranscriptTopicsResponse)
async def process_youtube_video(request: Request):
    body = await request.json()
    youtube_link = body.get("link")
    video_id = extract_video_id(youtube_link)
    if not video_id:
        return TranscriptTopicsResponse(error="Invalid YouTube URL", video_id=None)

    try:
        captions = YouTubeTranscriptApi.get_transcript(video_id)
        transcript = ' '.join([re.sub(r'\[.*?\]', '', caption['text']) for caption in captions]).strip()
    except Exception as error:
        return TranscriptTopicsResponse(error=str(error), video_id=video_id)

    prompt = f"Identify and list at least 2 main topics discussed in the following transcript: {transcript}. Keep it less than 5 topics and be as comprehensive as possible with your discussion text including absolutely all relevant information for that topic without adding filler words. For each topic be super specific when associating its relevant discussion text such that that transcript is no longer needed and we can just refer to the topic discussion text. Ensure that each piece of discussion text serves as a standalone resource that accurately reflects the topics covered, without the need for further reference to the original transcript, like a blog."
    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo-0125",
            messages=[
                {"role": "system", "content": "You are a helpful assistant designed to output JSON."},
                {"role": "user", "content": prompt}
            ],
            response_model=TranscriptTopicsResponse
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