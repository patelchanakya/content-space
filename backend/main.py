from fastapi import FastAPI, Request, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

from modal import Image, Stub, asgi_app, Secret

# Assuming OpenAISchema and dsl are part of the instructor package or your own definitions
import instructor

from youtube_transcript_api import YouTubeTranscriptApi

import re
import os

# import instructor
from openai import AsyncOpenAI

from dotenv import load_dotenv,find_dotenv
load_dotenv(find_dotenv())
api_key = os.environ.get("OPENAI_API_KEY")
 # Enables response_model
# Enables response_model
client = instructor.patch(AsyncOpenAI())
web_app = FastAPI()


# Load environment variables from .env file
# load_dotenv(find_dotenv())
# api_key = os.environ.get("OPENAI_API_KEY")

# # Patch the OpenAI client with Instructor
# client = instructor.patch(OpenAI(api_key=api_key))

# Set up CORS middleware options
web_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

stub = Stub()

image = Image.debian_slim().pip_install("pydantic==2.5.3", "fastapi==0.109.0", "instructor", "youtube_transcript_api", "openai", "instructor", "python-dotenv")
# Helper function to comment a bit on the YouTube video's transcript
def parse_youtube_url(url: str) -> str:
        data = re.findall(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
        if data:
            return data[0]
        return ""


class TranscriptTopicsResponse(BaseModel):
    link: str
    video_id: str
    topics: List[str]
    error: Optional[str] = None

@web_app.post("/foo", response_model=TranscriptTopicsResponse)
async def process_youtube_video(request: Request):
    # # Patch the OpenAI client with Instructor
    # client = instructor.patch(OpenAI(api_key=api_key))

    body = await request.json()
    youtube_link = body.get("link")
    discussion_topics = body.get("topics")

    # Extract the video ID from the provided YouTube link
    video_id = parse_youtube_url(youtube_link)
    if not video_id:
        return {"error": "Invalid YouTube URL", "video_id": None}

    try:
        # Fetch the transcript for the extracted video ID
        captions = YouTubeTranscriptApi.get_transcript(video_id)
        # Concatenate all text from the captions, removing any annotations (text within square brackets)
        transcript = ' '.join([re.sub(r'\[.*?\]', '', caption['text']) for caption in captions]).strip()
    except Exception as error:
        # Return an error if fetching the transcript fails
        return {"error": str(error), "video_id": video_id}

    # Crafted prompt for topic extraction
    prompt = f"Identify and list the main topics discussed in the following transcript. Keep it less than 7 topics :\n\n{transcript}"

    try:
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "Identify and list the main topics discussed in the following transcript:"},
                {"role": "user", "content": transcript}
            ]
        )
    # Assuming the response structure has a 'choices' attribute that is a list of completion choices
    # and you need to access the 'content' of the message in the first choice.
        topics_response = response.choices[0].message.content.strip()
        topics = topics_response.split('\n')  # Example processing, adjust based on actual response format
    except Exception as error:
        return {"error": str(error), "video_id": video_id}

    return {
        "link": youtube_link,
        "video_id": video_id,
        "topics": topics,
        "error": None
    }

@stub.function(image=image, secrets=[Secret.from_dotenv()])
@asgi_app()
def fastapi_app():
    return web_app