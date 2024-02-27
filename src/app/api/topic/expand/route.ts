// api/topic/expand

import { prisma } from '@/lib/db';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const topicExpandSchema = z.object({
    topicId: z.string(),
});

export const config = {
    runtime: 'experimental-edge',
};

const sleep = async () => new Promise((resolve) => setTimeout(resolve, Math.random() * 4000));

export async function POST(req: Request, res: Response) {
    try {
        console.log("Attempting to parse request data");
        const data = await req.json();
        console.log("Request data parsed, validating with schema");
        const { topicId } = topicExpandSchema.parse(data);
        console.log(`Validated data, searching for topic with ID: ${topicId}`);

        const topic = await prisma.topic.findUnique({
            where: {
                id: topicId,
            },
        });

        console.log(topic ? `Topic found: ${topic.name}` : "Topic not found");


        if (!topic) {
            console.log("Returning 404 response: Topic not found");
            return NextResponse.json(
                { success: false, error: 'Topic not found' },
                { status: 404 }
            );
        }

        // Return a successful response when the topic is found
        return NextResponse.json(
            { success: true, topic: topic },
            { status: 200 }
        );

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
