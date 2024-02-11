/**
 * The `cn` function is a utility designed to simplify the process of combining Tailwind CSS classes.
 * It allows for the conditional merging of styles, making it easier to apply dynamic styling based on
 * application state or props. This function is particularly useful in projects utilizing Tailwind CSS
 * for styling, as it enhances readability and maintainability of class strings.
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}