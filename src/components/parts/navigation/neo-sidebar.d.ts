import * as React from 'react';
import { Sidebar } from '@/components/animate-ui/radix/sidebar';
export interface RadixSidebarDemoProps {
    fname: string;
    lname: string;
    email: string;
    org: string;
    role: string;
    userId: string;
}
export declare function RadixSidebarDemo({ fname, lname, email, role, userId, ...props }: RadixSidebarDemoProps & React.ComponentProps<typeof Sidebar>): import("react/jsx-runtime").JSX.Element;
