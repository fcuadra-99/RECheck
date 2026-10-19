import * as React from 'react';
import { type Transition } from 'motion/react';
type MotionHighlightMode = 'children' | 'parent';
type Bounds = {
    top: number;
    left: number;
    width: number;
    height: number;
};
type MotionHighlightContextType<T extends string> = {
    mode: MotionHighlightMode;
    activeValue: T | null;
    setActiveValue: (value: T | null) => void;
    setBounds: (bounds: DOMRect) => void;
    clearBounds: () => void;
    id: string;
    hover: boolean;
    className?: string;
    activeClassName?: string;
    setActiveClassName: (className: string) => void;
    transition?: Transition;
    disabled?: boolean;
    enabled?: boolean;
    exitDelay?: number;
    forceUpdateBounds?: boolean;
};
declare function useMotionHighlight<T extends string>(): MotionHighlightContextType<T>;
type BaseMotionHighlightProps<T extends string> = {
    mode?: MotionHighlightMode;
    value?: T | null;
    defaultValue?: T | null;
    onValueChange?: (value: T | null) => void;
    className?: string;
    transition?: Transition;
    hover?: boolean;
    disabled?: boolean;
    enabled?: boolean;
    exitDelay?: number;
};
type ParentModeMotionHighlightProps = {
    boundsOffset?: Partial<Bounds>;
    containerClassName?: string;
    forceUpdateBounds?: boolean;
};
type ControlledParentModeMotionHighlightProps<T extends string> = BaseMotionHighlightProps<T> & ParentModeMotionHighlightProps & {
    mode: 'parent';
    controlledItems: true;
    children: React.ReactNode;
};
type ControlledChildrenModeMotionHighlightProps<T extends string> = BaseMotionHighlightProps<T> & {
    mode?: 'children' | undefined;
    controlledItems: true;
    children: React.ReactNode;
};
type UncontrolledParentModeMotionHighlightProps<T extends string> = BaseMotionHighlightProps<T> & ParentModeMotionHighlightProps & {
    mode: 'parent';
    controlledItems?: false;
    itemsClassName?: string;
    children: React.ReactElement | React.ReactElement[];
};
type UncontrolledChildrenModeMotionHighlightProps<T extends string> = BaseMotionHighlightProps<T> & {
    mode?: 'children';
    controlledItems?: false;
    itemsClassName?: string;
    children: React.ReactElement | React.ReactElement[];
};
type MotionHighlightProps<T extends string> = React.ComponentProps<'div'> & (ControlledParentModeMotionHighlightProps<T> | ControlledChildrenModeMotionHighlightProps<T> | UncontrolledParentModeMotionHighlightProps<T> | UncontrolledChildrenModeMotionHighlightProps<T>);
declare function MotionHighlight<T extends string>({ ref, ...props }: MotionHighlightProps<T>): import("react/jsx-runtime").JSX.Element;
type MotionHighlightItemProps = React.ComponentProps<'div'> & {
    children: React.ReactElement;
    id?: string;
    value?: string;
    className?: string;
    transition?: Transition;
    activeClassName?: string;
    disabled?: boolean;
    exitDelay?: number;
    asChild?: boolean;
    forceUpdateBounds?: boolean;
};
declare function MotionHighlightItem({ ref, children, id, value, className, transition, disabled, activeClassName, exitDelay, asChild, forceUpdateBounds, ...props }: MotionHighlightItemProps): import("react/jsx-runtime").JSX.Element;
export { MotionHighlight, MotionHighlightItem, useMotionHighlight, type MotionHighlightProps, type MotionHighlightItemProps, };
