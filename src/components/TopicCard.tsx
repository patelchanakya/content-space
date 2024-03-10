'use client'

import { cn } from '@/lib/utils';
import { ExpandedContent, Point, Topic } from '@prisma/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react'
import { useToast } from './ui/use-toast';
import { Loader2 } from 'lucide-react';

type Props = {
    topic: Topic & {
        points: Point[];
        expandedContent: ExpandedContent[];
    };
    topicIndex: number;
    completedTopics: Set<String>;
    setCompletedTopics: React.Dispatch<React.SetStateAction<Set<String>>>;
};

export type TopicCardHandler = {
    triggerLoad: () => void;
}

const TopicCard = React.forwardRef<TopicCardHandler, Props>(

    ({ topic, topicIndex, setCompletedTopics, completedTopics }, ref) => {

        const { toast } = useToast();
        const queryClient = useQueryClient();

        const [success, setSuccess] = React.useState<boolean | null>(null);
        const [isPollingComplete, setIsPollingComplete] = React.useState(false);
        const [isPending, setIsPending] = React.useState(false);

        console.log(`Initial state - Success: ${success}, IsPollingComplete: ${isPollingComplete}, IsPending: ${isPending}`);

        const getTopicInfo = useMutation({
            mutationFn: async () => {
                setIsPending(true); // Set isPending to true at the start of the mutation
                console.log('Initiating POST request to expand topic API endpoint with topic ID:', topic.id);
                const response = await axios.post("/api/topic/expand", {
                    topicId: topic.id,
                });

                if (response.status !== 202) {
                    console.error('Failed to initiate blog expansion. Response status:', response.status);
                    throw new Error('Failed to initiate blog expansion');
                }

                console.log('Response data:', response.data);
                // Do not reset isPending here to ensure loader remains visible until polling is complete
                console.log(`Mutation completed - IsPending: ${isPending}`);
                return response.data.data.call_id; // Ensure we return the call_id for polling

            },
            onError: () => {
                setIsPending(false); // Ensure isPending is reset on error as well
                setSuccess(false);
                console.log(`Mutation error - IsPending: ${isPending}, Success: ${success}`);
                toast({
                    title: "Error",
                    description: "Failed to load topic information.",
                    variant: "destructive",
                });
            }
        }).mutate;

        const maxPollingRetries = 30; // Set a maximum number of retries
        const pollInterval = 2000; // Base interval between polls in milliseconds
        let retryCount = 0;


        const pollForExpansionResult = async (callId: string) => {
            console.log(`Polling started for call ID: ${callId}`);
            const pollInterval = 1250; // Interval between polls in milliseconds
            const maxRetries = 40; // Maximum number of retries
            let retryCount = 0;

            const checkPollingResult = async () => {
                if (retryCount >= maxRetries) {
                    console.error('Maximum polling retries reached.');
                    setIsPollingComplete(true);
                    setIsPending(false);
                    setSuccess(false);
                    toast({
                        title: "Error",
                        description: "Failed to load topic information after maximum retries.",
                        variant: "destructive",
                    });
                    return;
                }

                try {
                    const response = await axios.get(`/api/poll/result/${callId}`);
                    const responseData = response.data;

                    if (response.status === 202) {
                        console.log('Processing is ongoing. Waiting before next poll.');
                        setTimeout(checkPollingResult, pollInterval);
                        retryCount++;
                    } else if (response.status === 200) {
                        console.log('Polling successful.');
                        setIsPollingComplete(true);
                        setIsPending(false);
                        setSuccess(true);
                        // Handle successful polling...
                    } else {
                        console.error(`Unexpected response status: ${response.status}`);
                        // Consider retrying or handling specific status codes differently
                        setTimeout(checkPollingResult, pollInterval);
                        retryCount++;
                    }
                } catch (error) {
                    console.error(`Polling error: ${error}`);
                    // Consider retrying or handling specific errors differently
                    setTimeout(checkPollingResult, pollInterval);
                    retryCount++;
                }
            };

            checkPollingResult(); // Initiate the polling process
        };

        const addTopicIdToSet = React.useCallback(() => {
            if (!completedTopics.has(topic.id)) {
                setCompletedTopics(prevCompletedTopics => {
                    const updatedSet = new Set(prevCompletedTopics);
                    updatedSet.add(topic.id);
                    console.log(`Added topic ID to set: ${topic.id}`);
                    return updatedSet;
                });
            }
        }, [setCompletedTopics, topic.id, completedTopics]);

        React.useEffect(() => {
            console.log(`Checking if topic has expanded content - Length: ${topic.expandedContent.length}`);
            if (topic.expandedContent.length > 0) {
                addTopicIdToSet();
                setSuccess(true);
                console.log(`Effect hook - Success: ${success}`);
            }
        }, [topic, addTopicIdToSet]);

        React.useImperativeHandle(ref, () => ({
            triggerLoad: async () => {
                console.log(`Trigger load called - ExpandedContent Length: ${topic.expandedContent.length}, IsPending: ${isPending}`);
                if (topic.expandedContent.length === 0 && !isPending) {
                    getTopicInfo(undefined, {
                        onSuccess: (callId) => {
                            console.log(`Get topic info success - Call ID: ${callId}`);
                            pollForExpansionResult(callId);
                        },
                        onError: (error) => {
                            setSuccess(false);
                            addTopicIdToSet();
                            console.log(`Get topic info error - Error: ${error}`);
                            toast({
                                title: "Error",
                                description: "Failed to load topic information.",
                                variant: "destructive",
                            });
                        },
                    });
                }
            },
        }));
        return (
            <div key={topic.id} className={cn(
                "mb-4 rounded-lg border p-4 flex flex-col md:flex-row justify-between",
                {
                    "border-green-500": success === true,
                    "border-red-500": success === false,
                    "border-gray-300": success === null,
                }
            )}>
                <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white">{topic.name ? topic.name.replace(/^new topic:\s*/gi, '') : 'Unnamed Topic'}</h3>
                    <div className="mt-2 bg-black">
                        {topic.points.map((point, index) => (
                            <div key={point.id} className="px-4 py-2 mt-2 rounded-lg bg-black flex justify-between items-center">
                                <h5 className="text-white text-sm font-semibold">{point.summary}</h5>
                            </div>
                        ))}
                    </div>
                </div>
                {isPending && (success === null || !isPollingComplete) && (
                    <div className="flex justify-center items-center ml-4">
                        <Loader2 className="animate-spin h-6 w-6 text-white" />
                    </div>
                )}
            </div>
        );
    });

TopicCard.displayName = 'TopicCard';

export default TopicCard;