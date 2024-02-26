import React from 'react'
import { getAuthSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/db'
import ConfirmTopics from '@/components/ConfirmTopics'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'


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
        <div className="flex flex-col md:flex-row gap-4 items-start justify-center">
            <Card className="w-full md:w-1/2 mt-4">
                <div className="p-8">
                    <p className="text-lg text-gray-600">Check out the source: <a href={blog.name} className="text-blue-500 hover:underline">{blog.name}</a></p>
                    <div className="mt-4">
                        <label className="inline-flex items-center">
                            <input type="checkbox" className="form-checkbox" />
                            <span className="ml-2">Include Images</span>
                        </label>
                        <label className="inline-flex items-center ml-4">
                            <input type="checkbox" className="form-checkbox" />
                            <span className="ml-2">Include Key Takeaways</span>
                        </label>
                        <label className="inline-flex items-center ml-4">
                            <input type="checkbox" className="form-checkbox" />
                            <span className="ml-2">Include Quotes</span>
                        </label>
                        <Button className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 mt-5 px-4 rounded" type="submit">Create Blog</Button>
                    </div>
                </div>
            </Card>
            <div className="w-full md:w-1/2">
                <ConfirmTopics blog={blog} />
            </div>
        </div>
    )
}

export default CreateTopics