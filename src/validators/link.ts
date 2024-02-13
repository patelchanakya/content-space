"use client"

import { z } from "zod"

export const createChapterSchema = z.object({
    link: z.string().min(3).max(200),
    topics: z.array(z.string()),
});
