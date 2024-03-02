import React from 'react';
import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Card } from '@/components/ui/card';

const GalleryPage = async () => {
    const blogs = await prisma.blog.findMany({
        select: {
            id: true,
            name: true,
        }
    });

    return (
        <div className="p-4 pt-16 mx-auto max-w-7xl">
            <h1 className="text-2xl pt-12 font-bold text-center mb-4">Gallery Page</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {blogs.map((blog) => (
                    <div key={blog.id} className="flex justify-center">
                        <Card className="flex flex-col cursor-pointer p-6 w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100">
                            <Link href={`/blog/${blog.id}`} key={blog.id}>
                                <h5 className="mb-2 text-xl sm:text-2xl font-bold tracking-tight text-gray-900 break-words">{blog.name}</h5>
                            </Link>
                        </Card>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GalleryPage;
