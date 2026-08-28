import * as React from 'react';
import { Collapsible as CollapsiblePrimitive } from 'radix-ui';
import { type HTMLMotionProps, type Transition } from 'motion/react';
type CollapsibleContextType = {
    isOpen: boolean;
};
declare const useCollapsible: () => CollapsibleContextType;
type CollapsibleProps = React.ComponentProps<typeof CollapsiblePrimitive.Root>;
declare function Collapsible({ children, ...props }: CollapsibleProps): import("react/jsx-runtime").JSX.Element;
type CollapsibleTriggerProps = React.ComponentProps<typeof CollapsiblePrimitive.Trigger>;
declare function CollapsibleTrigger(props: CollapsibleTriggerProps): import("react/jsx-runtime").JSX.Element;
type CollapsibleContentProps = React.ComponentProps<typeof CollapsiblePrimitive.Content> & HTMLMotionProps<'div'> & {
    transition?: Transition;
};
declare function CollapsibleContent({ className, children, transition, ...props }: CollapsibleContentProps): import("react/jsx-runtime").JSX.Element;
export { Collapsible, CollapsibleTrigger, CollapsibleContent, useCollapsible, type CollapsibleContextType, type CollapsibleProps, type CollapsibleTriggerProps, type CollapsibleContentProps, };
