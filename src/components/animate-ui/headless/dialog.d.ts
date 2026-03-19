import * as React from 'react';
import { Description as DialogDescriptionPrimitive, type DialogProps as DialogPrimitiveProps, type DialogBackdropProps as DialogBackdropPrimitiveProps, type DialogPanelProps as DialogPanelPrimitiveProps, type DialogTitleProps as DialogTitlePrimitiveProps } from '@headlessui/react';
import { motion, type Transition, type HTMLMotionProps } from 'motion/react';
type DialogProps<TTag extends React.ElementType = 'div'> = Omit<DialogPrimitiveProps<TTag>, 'static'> & {
    className?: string;
    as?: TTag;
};
declare function Dialog<TTag extends React.ElementType = 'div'>({ className, ...props }: DialogProps<TTag>): import("react/jsx-runtime").JSX.Element;
type DialogBackdropProps<TTag extends React.ElementType = typeof motion.div> = DialogBackdropPrimitiveProps<TTag> & {
    className?: string;
    as?: TTag;
};
declare function DialogBackdrop<TTag extends React.ElementType = typeof motion.div>(props: DialogBackdropProps<TTag>): import("react/jsx-runtime").JSX.Element;
type FlipDirection = 'top' | 'bottom' | 'left' | 'right';
type DialogPanelProps<TTag extends React.ElementType = typeof motion.div> = Omit<DialogPanelPrimitiveProps<typeof motion.div>, 'transition'> & Omit<HTMLMotionProps<'div'>, 'children'> & {
    from?: FlipDirection;
    transition?: Transition;
    as?: TTag;
};
declare function DialogPanel<TTag extends React.ElementType = typeof motion.div>(props: DialogPanelProps<TTag>): import("react/jsx-runtime").JSX.Element;
type DialogHeaderProps<TTag extends React.ElementType = 'div'> = React.ComponentProps<TTag> & {
    as?: TTag;
};
declare function DialogHeader<TTag extends React.ElementType = 'div'>({ className, as: Component, ...props }: DialogHeaderProps<TTag>): import("react/jsx-runtime").JSX.Element;
type DialogFooterProps<TTag extends React.ElementType = 'div'> = React.ComponentProps<TTag> & {
    as?: TTag;
};
declare function DialogFooter({ className, as: Component, ...props }: DialogFooterProps): import("react/jsx-runtime").JSX.Element;
type DialogTitleProps<TTag extends React.ElementType = 'h2'> = DialogTitlePrimitiveProps<TTag> & {
    className?: string;
    as?: TTag;
};
declare function DialogTitle<TTag extends React.ElementType = 'h2'>({ className, ...props }: DialogTitleProps<TTag>): import("react/jsx-runtime").JSX.Element;
type DialogDescriptionProps<TTag extends React.ElementType = 'div'> = React.ComponentProps<typeof DialogDescriptionPrimitive<TTag>> & {
    className?: string;
    as?: TTag;
};
declare function DialogDescription<TTag extends React.ElementType = 'div'>({ className, ...props }: DialogDescriptionProps<TTag>): import("react/jsx-runtime").JSX.Element;
export { Dialog, DialogBackdrop, DialogPanel, DialogTitle, DialogDescription, DialogHeader, DialogFooter, type DialogProps, type DialogBackdropProps, type DialogPanelProps, type DialogTitleProps, type DialogDescriptionProps, type DialogHeaderProps, type DialogFooterProps, };
