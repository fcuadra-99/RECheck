'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogBackdrop,
    DialogPanel,
    DialogTitle,
    DialogDescription,
    DialogHeader,
    DialogFooter,
} from '@/components/animate-ui/headless/dialog';

export const Diademo: React.FC<{
    title: string;
    desc: string;
    cont: string;
}> = ({ title, desc, cont }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div>
            <a onClick={() => setIsOpen(true)} className='select-none cursor-pointer'>
                <u>{title}</u>
            </a>

            <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
                <DialogBackdrop />

                <DialogPanel className="sm:max-w-[425px] overflow-y-scroll max-h-150">
                    <DialogHeader>
                        <DialogTitle>{title}</DialogTitle>
                        <DialogDescription>
                            {desc}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <p>
                            {cont}
                        </p>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>
                            Decline
                        </Button>
                        <Button type="submit" onClick={() => setIsOpen(false)}>
                            Accept
                        </Button>
                    </DialogFooter>
                </DialogPanel>
            </Dialog>
        </div>
    );
};