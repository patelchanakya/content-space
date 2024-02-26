'use client'

import React from 'react'
import { Blog, Topic, Point } from '@prisma/client';
import TopicCard from './TopicCard';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Props = {
    blog: Blog & {
        topics: (Topic & {
            points: Point[]
        })[];
    }
};

const ConfirmTopics = ({ blog }: Props) => {


    return (
        <div className="p-4">
            {blog.topics.map((topic, topicIndex) => (
                <div key={topic.id} className="mb-4 rounded-lg border border-gray-300 p-4">
                    <h3 className="text-xl font-semibold">Topic {topicIndex + 1}: {topic.name}</h3>
                    <div className="mt-2"> {/* Changed from <p> to <div> and removed text-gray-600 */}
                        {topic.points.map((point, pointIndex) => ( // Changed variable name to pointIndex for clarity
                            <TopicCard key={point.id} point={point} topicIndex={pointIndex} />
                        ))}
                    </div>
                </div>
            ))}
            <div className="flex justify-center items-center mt-4">
                <Separator className="flex-[1]" />
                <div className="flex items-center mx-4">
                    <Link href="/create" className={buttonVariants({ variant: "secondary" })}>
                        <ChevronLeft className="w-4 h-4 mr-2" strokeWidth={2} />
                        Back
                    </Link>
                    <Button type="button" className="ml-4 font-semibold" >
                        Generate
                        <ChevronRight className="w-4 h-4 ml-2" strokeWidth={2} />
                    </Button>
                </div>
                <Separator className="flex-[1]" />
            </div>
        </div>
    )
}

export default ConfirmTopics