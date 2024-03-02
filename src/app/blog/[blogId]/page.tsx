import { getAuthSession } from '@/lib/auth';
import { prisma } from '@/lib/db'
import { Loader2 } from 'lucide-react'
import { redirect } from 'next/navigation'
import parse from 'html-react-parser';
import styles from './BlogPage.module.css';

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
        <section className="max-w-4xl mx-auto">
            <div className="p-4">
                {blog.topics.map((topic, index) => (
                    <article key={topic.id} className="mb-8">
                        <section className="space-y-4">
                            {topic.points.map((point) => (
                                <div key={point.id} className="p-4 bg-card rounded-lg shadow-md border border-border">
                                    {/* This is the topic name for the point */}
                                    <h2 className="text-2xl font-bold mb-3 text-primary">{point.name ? point.name.replace(/^new topic:\s*/gi, '') : 'Unnamed Point'}</h2>
                                    <p className="text-lg font-semibold text-foreground mb-2">{point.summary}</p>
                                </div>
                            ))}
                        </section>
                        <section className="mt-4">
                            {topic.expandedContent.map((content) => (
                                <div key={content.id} className="p-4 bg-gray-200 rounded-lg shadow">
                                    <div className={`${styles.parsedContent} max-w-none`}>{parse(content.content)}</div>

                                    <div className="flex justify-between items-center text-xs font-medium text-gray-500 italic">
                                        <p>blog.{blogId}.topic.{content.topicId}.point.{content.pointId}</p>



                                        <p>Date: {new Date(content.createdAt).toLocaleDateString()} | Time: {new Date(content.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            ))}
                        </section>
                    </article>
                ))}
            </div>
        </section>
    );
}



