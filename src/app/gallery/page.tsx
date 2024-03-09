import React, { Suspense } from 'react';
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Card } from '@/components/ui/card';
import VideoComponent from '@/components/ui/video-component';
import { Loader2, InfoIcon } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

const GalleryPage = async () => {
    const blogs = await prisma.blog.findMany({
        select: {
            id: true,
            name: true,
            topics: {
                select: {
                    name: true,
                }
            }
        }
    });

    return (
        <div className="p-4 pt-12 mx-auto max-w-7xl">
            <h1 className="text-2xl pt-12 font-bold text-center mb-4">Gallery Page</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.slice(0).reverse().map((blog) => (
                    <Card key={blog.id} className="flex flex-col cursor-pointer p-6 bg-black rounded-lg border border-gray-200 shadow-md hover:bg-gray-800 transition duration-300 ease-in-out">
                        <HoverCard>
                            <HoverCardTrigger>
                                <InfoIcon className="w-5 h-5 text-gray-400" />
                            </HoverCardTrigger>
                            <HoverCardContent className="space-y-2 bg-black text-white">
                                {blog.topics.map((topic, index) => (
                                    <p key={index} className="text-sm font-medium text-center">
                                        {topic.name}
                                    </p>
                                ))}
                            </HoverCardContent>
                        </HoverCard>
                        <br />
                        {/* <Suspense fallback={<Loader2 className="animate-spin" />}>
                            <VideoComponent videoUrl={blog.name} />
                        </Suspense> */}
                        <Link href={`/blog/${blog.id}`} className="mt-4 text-center text-sm text-blue-600 hover:text-blue-800">
                            View Blog
                        </Link>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default GalleryPage;
