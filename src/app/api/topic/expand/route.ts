// api/topic/expand

import { prisma } from '@/lib/db';
import axios from 'axios';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const topicExpandSchema = z.object({
    topicId: z.string(),
});

const sleep = async () => new Promise((resolve) => setTimeout(resolve, Math.random() * 4000));

interface BlogPollExpansionResponse {
    topic_name: string;
    expanded_content: string;
}

// New response structure based on the updated backend implementation
interface BlogExpansionResponse {
    call_id: string;
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

        // Extract the blogId from the topicDetails
        const blogIdFromTopic = topicDetails.blog?.id;

        if (!blogIdFromTopic) {
            return NextResponse.json(
                { success: false, error: 'Blog associated with the topic not found' },
                { status: 404 }
            );
        }

        const backendAPI = "https://patelchanakya--my-content-go-crazy-fastapi-app-dev.modal.run/expandblog";
        const requestBody = {
            topicName: topicDetails.name,
            points: topicDetails.points.map(point => point.summary),
        };

        console.log("Request body: ", requestBody);

        const expandTopicsResponse = await axios.post<BlogExpansionResponse>(backendAPI, requestBody, {
            headers: {
                Authorization: `Token ${process.env.MODAL_TOKEN_ID}:${process.env.MODAL_TOKEN_SECRET}`,
                'Content-Type': 'application/json',
            },
        });

        console.log("Expand topics response: ", expandTopicsResponse.data);

        // Inside the POST function, after initiating the blog expansion process
        const { call_id } = expandTopicsResponse.data;

        if (call_id) {
            try {
                const updatedTopic = await prisma.topic.update({
                    where: {
                        id: topicId,
                    },
                    data: {
                        callId: call_id, // Ensure this field matches the schema definition
                    },
                });
                console.log("Prisma update successful. Call ID saved to Topic model:", updatedTopic.callId);
            } catch (error) {
                console.error("Prisma update failed:", error);
                throw new Error('Prisma update operation failed');
            }
        } else {
            // Handle the case where call_id is not returned by the expandTopicsResponse
            console.error("No call_id returned from the expansion process");
            return NextResponse.json({
                success: false,
                error: "Blog expansion process did not return a call_id",
            }, { status: 500 }); // Use a 500 status code to indicate a server error
        }

        return NextResponse.json({
            success: true,
            message: "Blog expansion initiated successfully",
            data: {
                call_id: call_id,
            },
        }, { status: 202 });

        // console.log("Call ID: ", call_id);

        // // Poll the backend for the result of the blog expansion
        // const pollForResults = async (callId: string): Promise<BlogPollExpansionResponse> => {
        //     const resultEndpoint = `https://patelchanakya--my-content-go-crazy-fastapi-app.modal.run/result/${callId}`;
        //     let result: BlogPollExpansionResponse | null = null;
        //     while (!result) {
        //         const response = await axios.get<BlogPollExpansionResponse>(resultEndpoint, {
        //             headers: {
        //                 Authorization: `Token ${process.env.MODAL_TOKEN_ID}:${process.env.MODAL_TOKEN_SECRET}`,
        //             },
        //         });
        //         if (response.status === 202) {
        //             // The processing is not yet complete, wait for a bit before retrying
        //             await sleep();
        //         } else if (response.status === 200) {
        //             // The processing is complete, break the loop
        //             result = response.data;
        //             break;
        //         } else {
        //             // An error occurred, throw an exception
        //             throw new Error('Failed to poll for results');
        //         }
        //     }
        //     if (!result) {
        //         throw new Error('Result is null after polling');
        //     }
        //     return result;
        // };

        // // Call the polling function and wait for the result
        // const expandedContentResult = await pollForResults(call_id);

        // console.log("Expanded content result: ", expandedContentResult);

        // // Assuming expandedContentResult matches the expected structure
        // if (!expandedContentResult || !expandedContentResult.expanded_content) {
        //     return NextResponse.json(
        //         { success: false, error: 'Failed to expand content' },
        //         { status: 500 }
        //     );
        // }

        // // Save the expanded content to the database
        // // Since there's only one point, no need to iterate
        // const point = topicDetails.points[0];
        // const expandedContentRecord = await prisma.expandedContent.create({
        //     data: {
        //         topicId: topicId,
        //         pointId: point.id, // Added pointId to match the required structure
        //         content: expandedContentResult.expanded_content, // The expanded content from the API response
        //     },
        // });

        // console.log("Expanded content record: ", expandedContentRecord);

        // // Return the expanded content to the client
        // return NextResponse.json({
        //     success: true,
        //     message: "Content expanded successfully",
        //     data: {
        //         topicName: expandedContentResult.topic_name,
        //         expandedContentId: expandedContentRecord.id,
        //         blogId: blogIdFromTopic,
        //     },
        // }, { status: 200 });

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

