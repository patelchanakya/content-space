from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from modal import Image, Stub, asgi_app

from youtube_transcript_api import YouTubeTranscriptApi

import re
import os


import os
# import instructor
# from openai import OpenAI
# from pydantic import BaseModel
# from dotenv import load_dotenv,find_dotenv

web_app = FastAPI()

# # Load environment variables from .env file
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

image = Image.debian_slim().pip_install("youtube-transcript-api")

# Helper function to comment a bit on the YouTube video's transcript
def parse_youtube_url(url: str) -> str:
        data = re.findall(r"(?:v=|\/)([0-9A-Za-z_-]{11}).*", url)
        if data:
            return data[0]
        return ""

@web_app.post("/foo")
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

    # Return the original link, topics, video ID, and the cleaned transcript
    return {"link": youtube_link, "topics": discussion_topics, "video_id": video_id, "transcript": transcript}

@stub.function(image=image)
@asgi_app()
def fastapi_app():
    return web_app