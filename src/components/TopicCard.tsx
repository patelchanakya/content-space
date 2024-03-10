'use client'

import { cn } from '@/lib/utils';
import { ExpandedContent, Point, Topic } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
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

        const [success, setSuccess] = React.useState<boolean | null>(null);
        const [isPollingComplete, setIsPollingComplete] = React.useState(false);
        const [isPending, setIsPending] = React.useState(false);

        const getTopicInfo = useMutation({
            mutationFn: async () => {
                setIsPending(true); // Set isPending to true at the start of the mutation
                const response = await axios.post("/api/topic/expand", {
                    topicId: topic.id,
                });

                if (response.status !== 202) {
                    console.error('Failed to initiate blog expansion. Response status:', response.status);
                    throw new Error('Failed to initiate blog expansion');
                }
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

        const pollForExpansionResult = async (callId: string) => {
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
                        addTopicIdToSet(); // Add topic ID to set upon successful polling
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
                    return updatedSet;
                });
            }
        }, [setCompletedTopics, topic.id, completedTopics]);

        React.useEffect(() => {
            if (topic.expandedContent.length > 0) {
                addTopicIdToSet();
                setSuccess(true);
            }
        }, [topic, addTopicIdToSet]);

        React.useImperativeHandle(ref, () => ({
            triggerLoad: async () => {
                if (topic.expandedContent.length === 0 && !isPending) {
                    getTopicInfo(undefined, {
                        onSuccess: (callId) => {
                            pollForExpansionResult(callId);
                        },
                        onError: (error) => {
                            setSuccess(false);
                            addTopicIdToSet();
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