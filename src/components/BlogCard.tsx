'use client'

import React from 'react';
import { Card } from '@/components/ui/card';
import Link from 'next/link'; // Updated import to use Link for navigation

interface BlogCardProps {
    blog: {
        id: string;
        name: string;
    };
}

const BlogCard: React.FC<BlogCardProps> = ({ blog }) => {
    const { id, name } = blog;

    return (
        <Link href={`/blog/${id}`} passHref>
            <Card className="flex flex-col cursor-pointer p-6 w-full max-w-sm bg-white rounded-lg border border-gray-200 shadow-md hover:bg-gray-100">
                <h5 className="mb-2 text-xl sm:text-2xl font-bold tracking-tight text-gray-900 break-words">{name}</h5>
            </Card>
        </Link>
    );
};

export default BlogCard;