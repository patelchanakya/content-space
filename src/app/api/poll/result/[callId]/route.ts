import { prisma } from '@/lib/db';
import axios from 'axios';
import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

interface BlogPollExpansionResponse {
    topic_name: string;
    expanded_content: string;
}

// Utilize the Next.js App Router conventions for dynamic routes
export async function GET(request: NextRequest, { params }: { params: { callId: string } }) {
    const callId = params.callId;
    console.log(`Incoming request for path: ${request.nextUrl.pathname}`);
    console.log(`Polling results for call ID: ${callId}`);

    if (!callId) {
        console.log('Call ID is required');
        return new Response(
            JSON.stringify({ success: false, error: 'Call ID is required' }),
            { status: 404, headers: { 'Content-Type': 'application/json' } }
        );
    }


    const topicDetails = await prisma.topic.findFirst({
        where: {
            callId: callId,
        },
        include: {
            points: {
                include: {
                    expandedContent: true,
                },
            },
            blog: true,
        },
    });

    if (!topicDetails) {
        console.log(`No topic found for call ID: ${callId}`);
        return NextResponse.json(
            { success: false, error: `No topic found for call ID: ${callId}` },
            { status: 404 }
        );
    }

    try {
        console.log('Trying to poll for results...');
        const pollForResults = async (callId: string): Promise<BlogPollExpansionResponse> => {
            const resultEndpoint = `https://patelchanakya--my-content-go-crazy-fastapi-app.modal.run/result/${callId}`;
            let result: BlogPollExpansionResponse | null = null;
            while (!result) {
                console.log('Waiting for results...');

                const response = await axios.get<BlogPollExpansionResponse>(resultEndpoint, {
                    headers: {
                        Authorization: `Token ${process.env.MODAL_TOKEN_ID}:${process.env.MODAL_TOKEN_SECRET}`,
                        'Content-Type': 'application/json',
                    },
                });
                if (response.status === 202) {
                    console.log('Processing not complete, retrying...');
                    await new Promise(r => setTimeout(r, Math.random() * 2000));
                } else if (response.status === 200) {
                    console.log('Processing complete');
                    result = response.data;
                    break;
                } else {
                    console.log('Failed to poll for results');
                    throw new Error('Failed to poll for results');
                }
            }
            if (!result) {
                console.log('Result is null after polling');
                throw new Error('Result is null after polling');
            }

            return result;
        };

        const expandedContentResult = await pollForResults(callId);

        const expandedContentRecord = await prisma.expandedContent.create({
            data: {
                topicId: topicDetails.id,
                pointId: topicDetails.points[0].id, // Added pointId to match the required structure
                content: expandedContentResult.expanded_content, // The expanded content from the API response
            },
        });

        return NextResponse.json({
            success: true,
            message: "Success",
            data: expandedContentRecord,
        }, { status: 200 });
    } catch (error) {
        console.error('Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 404 }
        );
    }
}

