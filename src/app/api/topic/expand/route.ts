// api/topic/expand

import { prisma } from '@/lib/db';
import axios from 'axios';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const topicExpandSchema = z.object({
    topicId: z.string(),
});

const sleep = async () => new Promise((resolve) => setTimeout(resolve, Math.random() * 4000));

interface BlogExpansionResponse {
    topic_name: string;
    expanded_content: string;
}

export async function POST(req: Request, res: Response) {
    try {
        const data = await req.json();
        const { topicId } = topicExpandSchema.parse(data);
        const url = new URL(req.url);
        const pathSegments = url.pathname.split('/');

        const blogId = pathSegments[pathSegments.length - 1];
        const topicDetails = await prisma.topic.findUnique({
            where: {
                id: topicId,
            },
            include: {
                points: true, // Include all points associated with the topic
                blog: {
                    select: {
                        id: true, // Select the blog ID based on the topic
                    },
                },
            },
        });

        if (!topicDetails || topicDetails.points.length === 0) {
            return NextResponse.json(
                { success: false, error: 'Topic details not found or no points associated' },
                { status: 404 }
            );
        }

        const backendAPI = "https://patelchanakya--my-content-go-crazy-fastapi-app.modal.run/expandblog";
        const requestBody = {
            topicName: topicDetails.name,
            points: topicDetails.points.map(point => point.summary),
        };

        const expandTopicsResponse = await axios.post<BlogExpansionResponse>(backendAPI, requestBody, {
            headers: {
                Authorization: `Token ${process.env.MODAL_TOKEN_ID}:${process.env.MODAL_TOKEN_SECRET}`
            },
        });
        const { expanded_content, topic_name } = expandTopicsResponse.data;

        // Extract the blogId from the topicDetails
        const blogIdFromTopic = topicDetails.blog?.id;

        if (!blogIdFromTopic) {
            return NextResponse.json(
                { success: false, error: 'Blog associated with the topic not found' },
                { status: 404 }
            );
        }

        // Since there's only one point, no need to iterate
        const point = topicDetails.points[0];
        const expandedContentRecord = await prisma.expandedContent.create({
            data: {
                topicId: topicId,
                pointId: point.id,
                content: expanded_content, // The expanded content from the API response
            },
        });

        // Directly use the blogId associated with the topic from the database
        // This ensures we are working with a valid blogId for the response

        return NextResponse.json({
            success: true,
            message: "Content expanded successfully",
            data: {
                topicName: topic_name,
                expandedContentId: expandedContentRecord.id,
                blogId: blogIdFromTopic,
            },
        }, { status: 200 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { success: false, error: error.errors },
                { status: 400 }
            );
        } else {
            return NextResponse.json(
                { success: false, error: 'An unexpected error occurred' },
                { status: 500 }
            );
        }
    }
}
