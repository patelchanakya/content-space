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
        const { mutate: getTopicInfo, isPending } = useMutation({
            mutationFn: async () => {
                const response = await axios.post("/api/topic/expand", {
                    topicId: topic.id,
                });
                return response.data;
            },
        });

        /**
         * This function is designed to add the current topic's ID to a set of completed topics.
         * It's wrapped in React.useCallback to ensure that it doesn't get recreated unless its dependencies change.
         * This is important for performance reasons, especially in components that might re-render often.
         */
        const addTopicIdToSet = React.useCallback(() => {
            // First, check if the current topic's ID is already in the set of completed topics.
            if (completedTopics.has(topic.id)) {
                // If it is, log a message to the console for debugging purposes and exit the function early.
                // This prevents adding duplicate IDs to the set.
                console.log(`Topic ID ${topic.id} is already processed.`);
                return;
            }
            setCompletedTopics(prevCompletedTopics => {
                const updatedSet = new Set(prevCompletedTopics);
                updatedSet.add(topic.id);
                return updatedSet;
            });
        }, [setCompletedTopics, topic.id, completedTopics]); // Included completedTopics in the dependencies array as per the warning fix.


        React.useEffect(() => {
            if (topic.expandedContent.length > 0) {
                setSuccess(true);
                addTopicIdToSet();
            }
        }, [topic, addTopicIdToSet]);

        React.useImperativeHandle(ref, () => ({
            triggerLoad: async () => {
                if (topic.expandedContent.length > 0) {
                    console.log('Topic already has expanded content.');
                    toast({
                        title: "Content Generated",
                        description: `Generated content already exists for "${topic.name}".`,
                        variant: "default",

                    });
                    addTopicIdToSet(); // Add topic ID to set when expanded content exists
                    return;
                }
                getTopicInfo(undefined, {
                    onSuccess: () => {
                        setSuccess(true);
                        addTopicIdToSet(); // Add topic ID to set when expanded content exists

                        toast({
                            title: "Success",
                            description: "Topic information loaded successfully.",
                        });
                    },
                    onError: (error) => {
                        console.log(error)
                        setSuccess(false);
                        addTopicIdToSet(); // Add topic ID to set when expanded content exists
                        toast({
                            title: "Error",
                            description: "Failed to load topic information.",
                            variant: "destructive",
                        });
                    },
                });
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
                                {/* Include any other point details you want to display here */}
                            </div>
                        ))}
                    </div>
                </div>
                {isPending && (
                    <div className="flex justify-center items-center ml-4">
                        <Loader2 className="animate-spin h-6 w-6 text-white" />
                    </div>
                )}
            </div>
        );
    });

TopicCard.displayName = 'TopicCard';

export default TopicCard;