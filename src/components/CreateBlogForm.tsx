'use client'

import { createTopicsSchema } from '@/validators/link';
import React, { useEffect } from 'react';
import { z } from 'zod';
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Separator } from './ui/separator';
import { Plus, Trash } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useToast } from './ui/use-toast';
import { useRouter, useSearchParams } from 'next/navigation';


type Props = {}

// Utilizing Zod's infer method to derive TypeScript types from our schema
type Input = z.infer<typeof createTopicsSchema>;


const CreateBlogForm = (props: Props) => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { toast } = useToast();

    // Retrieve the 'link' query parameter from the URL
    const linkFromUrl = searchParams.get('ytlink');

    const { mutate: createBlog, isPending } = useMutation({
        mutationFn: async ({ link, topics }: Input) => {
            const response = await axios.post('/api/blog/createBlog', { link, topics })
            return response.data
        }
    })

    // 1. Define your form.
    const form = useForm<Input>({
        resolver: zodResolver(createTopicsSchema),
        // This sets the initial loading state for the form
        defaultValues: {
            link: linkFromUrl || '', // Use the link from the URL if available, otherwise default to empty string
            topics: ['']
        },
    })

    function onSubmit(data: Input) {
        // Check if there are any blank topics fields before proceeding
        if (data.topics.some(topic => topic === '')) {
            toast({
                title: "Incomplete Topics",
                description: "Please fill in all the topics before submitting.",
                variant: "destructive",
            });
            return
        }

        createBlog(data, {
            onSuccess: ({ blog_id }) => {
                toast({
                    title: "Blog Created",
                    description: "Your blog has been successfully created.",
                    variant: "default",
                });
                router.push(`/create/${blog_id}`)
            },
            onError: (error) => {
                console.error("Blog creation failed", error);
                toast({
                    title: "Blog Creation Failed",
                    description: "An error occurred while creating the blog. Please try again.",
                    variant: "destructive",
                });
            }
        })
    }

    form.watch()

    return (
        <div className="w-full mt-4 bg-black p-6 rounded-lg">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
                    <Button disabled={isPending} className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded" type="submit">Create</Button>
                    <FormField
                        control={form.control}
                        name="link"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel className="text-white">Enter Youtube Link</FormLabel>
                                <FormControl>
                                    <Input placeholder="Enter a youtube link to get started." className="text-white" {...field} />
                                </FormControl>
                                <FormDescription>
                                    Enter the link of the video you would like to create content on.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <AnimatePresence>
                        {form.watch("topics").map((_, index) => {
                            return (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    transition={{
                                        opacity: { duration: 0.2 },
                                        height: { duration: 0.2 },
                                    }}
                                >
                                    <FormField
                                        key={index}
                                        control={form.control}
                                        name={`topics.${index}`}
                                        render={({ field }) => {
                                            return (
                                                <FormItem className="flex flex-col items-start w-full sm:items-center sm:flex-row">
                                                    <FormLabel className="flex-[1] text-white text-xl">
                                                        Topic {index + 1}
                                                    </FormLabel>
                                                    <FormControl className="flex-[6]">
                                                        <Input
                                                            placeholder="Enter additional topics to include"
                                                            className="text-white"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            );
                                        }}
                                    />
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                    <div className="flex flex-col sm:flex-row items-center justify-center mt-4 space-y-2 sm:space-y-0">
                        <Separator className="flex-grow hidden sm:block" />
                        <div className="flex flex-wrap justify-center gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                className="font-semibold w-40"
                                onClick={() => {
                                    form.setValue("topics", [...form.watch("topics"), '']);
                                }}
                            >
                                Add Topic
                                <Plus className="w-4 h-4 ml-2 text-green-500" />
                            </Button>

                            <Button
                                type="button"
                                variant="secondary"
                                className="font-semibold w-40"
                                onClick={() => {
                                    form.setValue("topics", form.watch("topics").slice(0, -1));
                                }}
                            >
                                Remove Topic
                                <Trash className="w-4 h-4 ml-2 text-red-500" />
                            </Button>
                        </div>
                        <Separator className="flex-grow hidden sm:block" />
                    </div>

                </form>

            </Form>
        </div>
    )
}

export default CreateBlogForm