import { z } from "zod"

export const createTopicsSchema = z.object({
    link: z.string().min(3).max(200),
    topics: z.array(z.string()),
});
