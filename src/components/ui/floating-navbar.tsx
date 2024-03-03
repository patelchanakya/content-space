"use client";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { Button } from "./button";
import { signOut } from "next-auth/react";
import { LogOut as LogOutIcon } from 'lucide-react';
import SignInButton from "../SignInButton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./dropdown-menu";
import UserAvatar from "../UserAvatar";

export const FloatingNav = ({
    navItems,
    className,
    session,
}: {
    navItems: {
        name: string;
        link: string;
        icon?: JSX.Element;
    }[];
    className?: string;
    session?: any;
}) => {

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{
                    opacity: 1,
                    y: 0,
                }}
                animate={{
                    y: 0,
                    opacity: 1,
                }}
                transition={{
                    duration: 0.2,
                }}
                className={cn(
                    "flex max-w-fit fixed top-10 inset-x-0 mx-auto border border-transparent dark:border-white/[0.2] rounded-full dark:bg-black bg-white shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),0px_1px_0px_0px_rgba(25,28,33,0.02),0px_0px_0px_1px_rgba(25,28,33,0.08)] z-[5000] pr-2 pl-8 py-2 items-center justify-center space-x-4",
                    className
                )}
            >
                {navItems.map((navItem: any, idx: number) => (
                    <Link
                        key={`link=${idx}`}
                        href={navItem.link}
                        className={cn(
                            "relative dark:text-neutral-50 items-center flex space-x-1 text-neutral-600 dark:hover:text-neutral-300 hover:text-neutral-500"
                        )}
                    >
                        <span className="block sm:hidden">{navItem.icon}</span>
                        <span className="hidden sm:block text-sm">{navItem.name}</span>
                    </Link>
                ))}
                {session ? (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="p-0 m-0 inline-flex focus:outline-none focus:ring-0">
                                <UserAvatar user={session.user} />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="z-[6000]" sideOffset={5}>
                            <div className="flex items-center justify-start gap-2 p-2">
                                <div className="flex flex-col space-y-1 leading-none">
                                    {session.user?.email && (
                                        <p className="w-[200px] truncate text-sm text-secondary-foreground">
                                            {session.user.email}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <DropdownMenuItem
                                onSelect={() => signOut()}
                                className="text-red-600 cursor-pointer flex items-center space-x-2"
                            >
                                <span>Sign out</span>
                                <LogOutIcon className="h-4 w-4" />
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <SignInButton buttonText={"Sign In"} />
                )}
            </motion.div>
        </AnimatePresence>
    );
};
