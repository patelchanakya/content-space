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
                    points: {
                        select: {
                            expandedContent: true,
                        },
                        where: {
                            expandedContent: {
                                some: {},
                            },
                        },
                    },
                },
                where: {
                    points: {
                        some: {
                            expandedContent: {
                                some: {},
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
                {blogs.slice(0).reverse().map((blog) => {
                    const hasExpandedContent = blog.topics.some(topic => topic.points.some(point => point.expandedContent.length > 0));
                    return (
                        <Card key={blog.id} className="flex flex-col justify-between cursor-pointer p-6 bg-black rounded-lg border border-gray-200 shadow-md hover:bg-gray-800 transition duration-300 ease-in-out">
                            <div className="flex-1">
                                <div className="flex flex-col items-center justify-center">
                                    <div className="text-gray-400">
                                        {blog.topics.map((topic, index) => (
                                            <span key={index} className="inline-block bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold text-gray-200 mr-2 mb-2">{topic.name}</span>
                                        ))}
                                    </div>
                                    {hasExpandedContent && (
                                        <div className="mt-2 flex items-center justify-center">
                                            <InfoIcon className="text-blue-500 w-5 h-5" />
                                            <span className="text-xs text-gray-300 ml-1">Contains in-depth content</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Link href={`/blog/${blog.id}`} className="block mt-4 text-center text-sm text-blue-600 hover:text-blue-800">
                                View Blog
                            </Link>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
};

export default GalleryPage;
