import React, { Suspense } from 'react';
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Card } from '@/components/ui/card';
import VideoComponent from '@/components/ui/video-component';

const GalleryPage = async () => {
    const blogs = await prisma.blog.findMany({
        select: {
            id: true,
            name: true,
        }
    });

    return (
        <div className="p-4 pt-10 mx-auto max-w-7xl">
            <h1 className="text-2xl pt-12 font-bold text-center mb-4">Gallery Page</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {blogs.map((blog) => (
                    <div key={blog.id} className="flex justify-center">
                        <Card className="flex flex-col cursor-pointer p-6 w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100">
                            <h3 className="text-lg font-semibold text-center">{blog.name}</h3>
                            <Link href={`/blog/${blog.id}`} className="mt-4 text-center text-sm text-blue-600 hover:text-blue-800 transition duration-300 ease-in-out">
                                View Blog
                            </Link>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GalleryPage;
