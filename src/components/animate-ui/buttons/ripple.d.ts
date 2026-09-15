import * as React from 'react';
import { type HTMLMotionProps, type Transition } from 'motion/react';
import { type VariantProps } from 'class-variance-authority';
declare const buttonVariants: (props?: ({
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | null | undefined;
    size?: "default" | "sm" | "lg" | "icon" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type RippleButtonProps = HTMLMotionProps<'button'> & {
    children: React.ReactNode;
    rippleClassName?: string;
    scale?: number;
    transition?: Transition;
} & VariantProps<typeof buttonVariants>;
declare function RippleButton({ ref, children, onClick, className, rippleClassName, variant, size, scale, transition, ...props }: RippleButtonProps): import("react/jsx-runtime").JSX.Element;
export { RippleButton, type RippleButtonProps };
