import React, { Suspense } from 'react';
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Card } from '@/components/ui/card';
import VideoComponent from '@/components/ui/video-component';
import { Loader2, InfoIcon } from 'lucide-react'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Button } from '@/components/ui/button';

const GalleryPage = async () => {
    const blogs = await prisma.blog.findMany({
        select: {
            id: true,
            name: true,
            topics: {
                select: {
                    name: true,
                    points: {
                        select: {
                            name: true,
                            expandedContent: {
                                select: {
                                    content: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    return (
        <div className="p-4 pt-12 mx-auto max-w-7xl">
            <h1 className="text-2xl pt-12 font-bold text-center mb-4">Gallery Page</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {blogs.slice(0).reverse().map((blog) => (
                    <Card key={blog.id} className="flex flex-col justify-between cursor-pointer p-6 bg-black rounded-lg border border-gray-200 shadow-md hover:bg-gray-800 transition duration-300 ease-in-out">
                        {/* Move the Long Read tag to the top and ensure visibility */}
                        {blog.topics.some(topic => topic.points.some(point => point.expandedContent.some(content => content.content.trim() !== ''))) && (
                            <div className="bg-indigo-600 rounded-t-lg p-2 text-center">
                                <span className="inline-block rounded-full px-3 py-1 text-sm font-semibold text-white">Long Read</span>
                            </div>
                        )}
                        <div className="flex-1 p-4">
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-gray-400">
                                    {blog.topics.map((topic, index) => (
                                        <span key={index} className="inline-block bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-200 mr-2 mb-2">{topic.name}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex justify-center">
                            <Link href={`/blog/${blog.id}`} passHref>
                                <Button variant="outline" color="white" className="hover:text-indigo-500 hover:border-indigo-500">
                                    View Blog
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default GalleryPage;
