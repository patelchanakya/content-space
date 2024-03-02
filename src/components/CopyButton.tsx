'use client'

import { useCallback, useState } from 'react'
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface CopyButtonProps {
    text: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ text }) => {
    const [copiedText, setCopiedText] = useState<string | null>(null);

    const copyToClipboard = useCallback(async (text: string) => {
        if (!navigator.clipboard) {
            console.error('Clipboard API not available');
            return;
        }

        try {
            await navigator.clipboard.writeText(text);
            setCopiedText(text);
            console.log('Copied!', { text });
        } catch (error) {
            console.error('Failed to copy!', error);
            setCopiedText(null);
        }
    }, []);

    return (
        // No changes needed based on the current implementation.
        // Consider adding a title attribute for better accessibility and usability.
        <Button
            title={copiedText ? "Text Copied!" : "Copy text to clipboard"}
            variant={copiedText ? "default" : "outline"}
            size="sm"
            disabled={!!copiedText} // Disable button when text is copied
            className={cn(
                "transition-all duration-300 ease-in-out",
                copiedText ? "bg-transparent text-success" : "bg-primary text-white"
            )}
            onClick={() => {
                copyToClipboard(text);
                setTimeout(() => setCopiedText(null), 1100); // Clears copiedText after 2 seconds
            }}
        >
            {copiedText ? "Copied!" : "Copy"}
        </Button>
    )
}
export default CopyButton;

