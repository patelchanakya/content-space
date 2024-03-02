'use client'

import React from 'react'
import { Blog, Topic, Point, ExpandedContent } from '@prisma/client';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TopicCard, { TopicCardHandler } from './TopicCard';

type Props = {
    blog: Blog & {
        topics: (Topic & {
            points: Point[];
            expandedContent: ExpandedContent[];
        })[];
    };
};

const ConfirmTopics = ({ blog }: Props) => {
    // Initializing an object to store references to each topic component
    const topicRefs: Record<string, React.RefObject<TopicCardHandler>> = {};
    // Looping through each topic to bind the topic ID to a new React ref
    blog.topics.forEach((topic) => {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        topicRefs[topic.id] = React.useRef(null);
    });

    const [loading, setLoading] = React.useState(false);
    const [completedTopics, setCompletedTopics] = React.useState<Set<String>>(new Set());
    const totalTopicsCount = React.useMemo(() => blog.topics.length, [blog.topics]);

    return (
        <div className="p-4">
            {blog.topics.map((topic, topicIndex) => (
                <div key={topic.id}>
                    <TopicCard
                        completedTopics={completedTopics}
                        setCompletedTopics={setCompletedTopics}
                        ref={topicRefs[topic.id]}
                        key={topic.id}
                        topic={topic}
                        topicIndex={topicIndex}
                    />
                </div>

            ))}
            <div className="flex justify-center items-center mt-4">
                <Separator className="flex-[1]" />
                <div className="flex items-center mx-4">
                    <Link href="/create" className={buttonVariants({ variant: "secondary" })}>
                        <ChevronLeft className="w-4 h-4 mr-2" strokeWidth={2} />
                        Back
                    </Link>
                    {/* When the "Generate" button is clicked, we loop through each topicRef and call the 
                    triggerLoad function on the referenced TopicCard component. This effectively simulates 
                    a "load" action for each topic, utilizing the imperative handle pattern to directly 
                    invoke component methods. */}

                    {totalTopicsCount === completedTopics.size ? (
                        <Link href={`/blog/${blog.id}`} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Save & Continue
                            <ChevronRight className="w-4 h-4 ml-2" strokeWidth={2} />
                        </Link>
                    ) : (
                        <Button
                            type="button"
                            className="ml-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            disabled={loading}
                            onClick={() => {
                                setLoading(true);
                                Object.values(topicRefs).forEach((ref) => {
                                    ref.current?.triggerLoad();
                                });
                            }}>
                            Generate
                            <ChevronRight className="w-4 h-4 ml-2" strokeWidth={2} />
                        </Button>
                    )}
                </div>
                <Separator className="flex-[1]" />
            </div>
        </div>
    );
}

export default ConfirmTopics;