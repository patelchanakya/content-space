import React from 'react'
import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import ConfirmTopics from '@/components/ConfirmTopics'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'


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
                    points: true,
                    expandedContent: true // Include expandedContents for each topic
                }
            }
        }
    })

    if (!blog) {
        return redirect("/create")
    }

    return (
        <div className="flex flex-col items-center justify-center  pt-16">

            <div className="max-w-4xl w-full px-4 sm:px-6 lg:px-8">
                <ConfirmTopics blog={blog} />
            </div>
        </div>
    )
}

export default CreateTopics