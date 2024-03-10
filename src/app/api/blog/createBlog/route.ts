// /api/blog/createBlog
import { NextResponse } from "next/server";
import { createTopicsSchema } from "@/validators/server-link"; // server schema duplicate of client schema just w/o 'use client'
import { ZodError } from "zod";
import axios from 'axios';
import { prisma } from "@/lib/db";

// Define TypeScript interfaces to mirror the Python Pydantic models
interface Topic {
    topic: string;
    point: string;
}

interface TranscriptTopicsResponse {
    link: string;
    video_id: string;
    topics: Topic[];
    error?: string;
}

export async function POST(req: Request) {
    const body = await req.json() as TranscriptTopicsResponse; // Cast the body to the correct type
    const { link, topics } = createTopicsSchema.parse(body);

    try {
        const backendAPI = "https://patelchanakya--my-content-go-crazy-fastapi-app.modal.run/createblog";
        const response = await axios.post<TranscriptTopicsResponse>(backendAPI, { link, topics }, {
            headers: {
                Authorization: `Token ${process.env.MODAL_TOKEN_ID}:${process.env.MODAL_TOKEN_SECRET}`,
                'Content-Type': 'application/json'
            },
        });
        const blog = await prisma.blog.create({
            data: {
                name: link, // Using 'link' as the blog name for demonstration; adjust as needed
                // Optionally, you can add more fields here as your Blog model evolves
            },
        });
        // Iterate over each topic in the 'topics' array
        for (const { topic, point } of response.data.topics) {
            // Create a new Topic entry linked to the Blog
            await prisma.topic.create({
                data: {
                    name: topic, // 'topic' is now correctly referenced
                    blogId: blog.id, // Link this topic to the newly created blog
                    points: {
                        create: [{
                            name: topic, // Reusing 'topic' as the point name for simplicity; adjust as needed
                            summary: point, // 'point' is now correctly referenced
                            // Add other fields as necessary
                        }],
                    },
                },
            });
        }
        // we return a blog id
        return NextResponse.json({ blog_id: blog.id });
    } catch (error) {
        console.error("Error details:", error);
        if (error instanceof ZodError) {
            return new NextResponse("Invalid body", { status: 400 });
        } else if (axios.isAxiosError(error)) {
            // Structure the error response in a similar way to the success response
            const errorResponse: Partial<TranscriptTopicsResponse> = {
                error: error.message,
                link: body.link,
                video_id: "", // You might not have the video_id in case of an error
                topics: []
            };
            return new NextResponse(JSON.stringify(errorResponse), { status: error.response?.status || 500 });
        } else {
            const unexpectedErrorResponse: Partial<TranscriptTopicsResponse> = {
                error: "An error occured displaying the topics",
                link: body.link,
                video_id: "",
                topics: []
            };
            return new NextResponse(JSON.stringify(unexpectedErrorResponse), { status: 500 });
        }
    }
}
