"use client";
import React from "react"; // Removed useState import as it's no longer needed
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/cn";
import Link from "next/link";
import SignInButton from "../SignInButton";

export const FloatingNav = ({
    navItems,
    className,
}: {
    navItems: {
        name: string;
        link: string;
        icon?: JSX.Element;
    }[];
    className?: string;
}) => {
    // Removed useScroll, useMotionValueEvent, and visible state logic

    return (
        <AnimatePresence mode="wait">
            <motion.div
                initial={{
                    opacity: 1,
                    y: 0, // Changed from -100 to 0 to make it always visible
                }}
                animate={{
                    y: 0, // Always visible
                    opacity: 1, // Always visible
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
                <SignInButton />
            </motion.div>
        </AnimatePresence>
    );
};
