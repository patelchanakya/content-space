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

    // if (!session?.user) {
    //     return redirect('/gallery')
    // } 

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
        <div className="pt-16 flex flex-col items-center justify-center my-4 gap-4">
            <div className="w-1/2 p-2 bg-transparent shadow-md rounded-lg flex flex-col items-center justify-center">
                <h2 className="text-lg font-semibold mb-2 text-gray-400">Source Blog:</h2>
                <Link href={blog.name} passHref>
                    <p className="text-sm decoration-sky-200 hover:decoration-sky-100 transition duration-300 ease-in-out text-gray-400">{blog.name}</p>
                </Link>
                {/* <div className="mt-4">
                    <Button className="w-full bg-blue-500 hover:bg-blue-600 tsext-black font-medium py-2 px-4 rounded transition-all duration-300 ease-linear" type="button">Review Topics</Button>
                </div> */}
            </div>
            <div className="w-3/4 lg:w-1/2 p-4">
                <ConfirmTopics blog={blog} />
            </div>
        </div>
    )
}

export default CreateTopics