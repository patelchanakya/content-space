'use client'

import { cn } from '@/lib/utils';
import { Point } from '@prisma/client';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import React from 'react'

type Props = {
    point: Point
    topicIndex: number
}

const TopicCard = ({ point, topicIndex }: Props) => {
    const [success, setSuccess] = React.useState<boolean | null>(null);
    const { mutate: getTopicExpand, isPending } = useMutation({
        mutationFn: async () => {
            const response = await axios.post('/api/topic/expand')
            return response.data

        }
    });

    return (
        <div
            key={point.id}
            className={cn(
                "px-4 py-2 mt-2 rounded-lg flex justify-between items-center",
                "bg-secondary"
            )}
        >
            <h5 className="text-white text-sm font-semibold">{point.summary}</h5>
        </div>
    )
}

export default TopicCard

