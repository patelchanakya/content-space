import CreateCourseForm from '@/components/CreateBlogForm';
import { getAuthSession } from '@/lib/auth'
import { InfoIcon } from 'lucide-react';
import { redirect } from 'next/navigation';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"

import React from 'react'

type Props = {};

const CreatePage = async (props: Props) => {

    const session = await getAuthSession();
    if (!session?.user) {
        return redirect("/gallery");
    }

    return (
        <div className="flex flex-col items-start max-w-xl px-8 mx-auto my-16 pt-16 sm:px-0">
            <h1 className="self-center text-3xl font-bold text-center text-white sm:text-6xl">
                Content Copilot
            </h1>
            <div className="flex p-4 mt-5 border-none bg-secondary">
                <HoverCard>
                    <HoverCardTrigger>
                        <InfoIcon className="w-5 h-5 mr-2 mt-2 text-gray-600" />
                    </HoverCardTrigger>
                    <HoverCardContent>
                        We use OpenAI GPT models for generations.
                    </HoverCardContent>
                </HoverCard>
                <div>
                    Input a YouTube link, and let our AI craft a personalized blog post from the video content. Experience the future of content creation today.
                </div>
            </div>

            <CreateCourseForm />

        </div>
    );
};

export default CreatePage;