'use client'

import { cn } from '@/lib/utils';
import { Point, Topic } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react'

type Props = {
    topic: Topic & {
        points: Point[];
    };
};

export type TopicCardHandler = {
    triggerLoad: () => void;
}

const TopicCard = React.forwardRef<TopicCardHandler, Props>(
    ({ topic }, ref) => {

        const [success, setSuccess] = React.useState<boolean>(false);
        const { mutate: getTopicInfo, isPending } = useMutation({
            mutationFn: async () => {
                const response = await axios.post("/api/topic/expand", {
                    topicId: topic.id,
                });
                return response.data;
            },
        });


        React.useImperativeHandle(ref, () => ({
            triggerLoad: async () => {
                getTopicInfo(undefined, {
                    onSuccess: () => {
                        console.log("success");
                    },
                });
            },
        }));




        return (
            <div key={topic.id} className="mb-4 rounded-lg border border-gray-300 p-4">
                <h3 className="text-xl font-semibold">{topic.name}</h3>
                <div className="mt-2">
                    {topic.points.map((point, index) => (
                        <div key={point.id} className="px-4 py-2 mt-2 rounded-lg bg-secondary flex justify-between items-center">
                            <h5 className="text-white text-sm font-semibold">{point.summary}</h5>
                            {/* Include any other point details you want to display here */}
                        </div>
                    ))}
                </div>
            </div>
        );
    });

TopicCard.displayName = 'TopicCard';

export default TopicCard;