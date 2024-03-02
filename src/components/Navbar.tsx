import React from 'react'
import { getAuthSession } from '@/lib/auth'
import { FloatingNav } from './ui/floating-navbar';
import { IconHome, IconWriting, IconPlus, IconSettings } from '@tabler/icons-react';
type Props = {}

const NavBar = async (props: Props) => {

    const session = await getAuthSession();
    console.log(session);

    const navItems = [
        { name: 'Home', link: '/', icon: <IconHome className="h-4 w-4 text-neutral-500 dark:text-white" /> },
        { name: 'Gallery', link: '/gallery', icon: <IconWriting className="h-4 w-4 text-neutral-500 dark:text-white" /> },
        ...(session?.user ? [
            { name: 'Create Course', link: '/create', icon: <IconPlus className="h-4 w-4 text-neutral-500 dark:text-white" /> },
            { name: 'Settings', link: '/settings', icon: <IconSettings className="h-4 w-4 text-neutral-500 dark:text-white" /> },
        ] : []),
    ];

    return (
        <div className="relative w-full">
            <FloatingNav navItems={navItems} />
        </div>
    );
}

export default NavBar