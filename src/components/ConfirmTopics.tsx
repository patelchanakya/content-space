'use client'

import React from 'react'
import { Blog, Topic, Point } from '@prisma/client';
import { Separator } from './ui/separator';
import Link from 'next/link';
import { Button, buttonVariants } from './ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import TopicCard, { TopicCardHandler } from './TopicCard';

type Props = {
    blog: Blog & {
        topics: (Topic & {
            points: Point[];
        })[];
    };
};

const ConfirmTopics = ({ blog }: Props) => {
    // Initializing an object to store references to each topic component
    const topicRefs: Record<string, React.RefObject<TopicCardHandler>> = {};

    // Looping through each topic to bind the topic ID to a new React ref
    blog.topics.forEach(topic => {

        topicRefs[topic.id] = React.useRef(null);
    });

    const handleLoadTopic = (topicId: string) => {
        const topicRef = topicRefs[topicId];
        if (topicRef.current) {
            topicRef.current.triggerLoad();
        }
    };

    console.log(topicRefs)
    return (
        <div className="p-4">



            {blog.topics.map((topic, index) => (
                <div key={topic.id}>
                    <TopicCard
                        ref={topicRefs[topic.id]}
                        topic={topic}
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
                    <Button type="button" className="ml-4 font-semibold" onClick={() => {
                        // Iterating over each topic reference
                        Object.values(topicRefs).forEach((ref) => {
                            // Calling the triggerLoad function defined in the TopicCard component
                            ref.current?.triggerLoad();
                        });
                    }}>
                        Generate
                        <ChevronRight className="w-4 h-4 ml-2" strokeWidth={2} />
                    </Button>
                </div>
                <Separator className="flex-[1]" />
            </div>



        </div>
    );
}

export default ConfirmTopics;