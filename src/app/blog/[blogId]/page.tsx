import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import parse from 'html-react-parser';
import styles from './BlogPage.module.css';
import CopyButton from '@/components/CopyButton';

interface BlogDetails {
    id: string;
    name: string;
    topics: {
        id: string;
        name: string;
        blogId: string;
        points: {
            id: string;
            topicId: string;
            name: string;
            summary: string;
            expandedContent: {
                id: string;
                topicId: string;
                pointId: string;
                content: string;
                createdAt: Date;
            }[];
        }[];
        expandedContent: {
            id: string;
            topicId: string;
            content: string;
            createdAt: Date;
        }[];
    }[];
}

type Props = {
    params: {
        blogId: string;
    }
}

export default async function BlogPage({ params: { blogId } }: Props) {
    const session = await getAuthSession();
    if (!session) {
        return redirect('/gallery');
    }

    const blog = await prisma.blog.findUnique({
        where: {
            id: blogId
        },
        include: {
            topics: {
                include: {
                    points: true,
                    expandedContent: true
                }
            }
        }
    });

    if (!blog) {
        return redirect('/gallery');
    }

    if (!blog) {
        return <div className="flex justify-center items-center h-screen">
            <Loader2 className="animate-spin" />
        </div>;
    }

    return (
        <section className="max-w-4xl mx-auto px-4 pt-16 sm:px-6 lg:px-8">
            <h1 className="text-3xl font-bold text-center mb-6">Unique Blog Title - {blogId}</h1>
            {blog.topics.map((topic) => (
                <article key={topic.id} className="mb-8">
                    <div className="space-y-4">
                        {topic.points.map((point) => (
                            <div key={point.id} className="p-4 bg-card rounded-lg shadow-md border border-border min-w-0 break-words">
                                {/* This is the topic name for the point */}
                                <h2 className="text-2xl font-bold mb-3 text-primary sm:break-words">{point.name ? point.name.replace(/^new topic:\s*/gi, '') : 'Unnamed Point'}</h2>
                                <p className="text-md font-semibold text-foreground mb-2 sm:break-words">{point.summary}</p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4">
                        {topic.expandedContent.map((content) => (
                            <div key={content.id} className="p-4 bg-gray-200 rounded-lg shadow overflow-hidden min-w-0 break-words">
                                <div className={`${styles.parsedContent} max-w-none sm:break-words overflow-hidden`}>{parse(content.content)}</div>

                                <div className="flex flex-col sm:flex-row justify-between items-end text-xs font-medium text-gray-500 italic overflow-hidden">
                                    <div className="flex-1 mb-2 sm:mb-0 break-words">
                                        {/* <div>blog.{blogId}.topic.{content.topicId}.point.{content.pointId}</div> */}
                                        <div>Date: {new Date(content.createdAt).toLocaleDateString()} | Time: {new Date(content.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                    </div>

                                    <CopyButton text={content.content} />
                                </div>
                            </div>
                        ))}
                    </div>
                </article>
            ))}
        </section>
    );
}



