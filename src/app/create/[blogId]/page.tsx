import React from 'react'
import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'

type Props = {
    params: {
        blogId: string;
    }
}

const CreateTopics = async ({ params: { blogId } }: Props) => {


    const session = await getAuthSession()

    if (!session?.user) {
        return redirect('/gallery')
    }

    const blog = await prisma.blog.findUnique({
        where: {
            id: blogId
        },
        include: {
            topics: {
                include: {
                    points: true
                }
            }
        }
    })

    if (!blog) {
        return redirect("/create")
    }

    return (
        <pre>{JSON.stringify(blog, null, 2)}</pre>
    )
}

export default CreateTopics