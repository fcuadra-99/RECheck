import * as React from 'react';
import { Tooltip as TooltipPrimitive } from 'radix-ui';
import { type Transition } from 'motion/react';
type TooltipContextType = {
    isOpen: boolean;
};
declare const useTooltip: () => TooltipContextType;
type TooltipProviderProps = React.ComponentProps<typeof TooltipPrimitive.Provider>;
declare function TooltipProvider(props: TooltipProviderProps): import("react/jsx-runtime").JSX.Element;
type TooltipProps = React.ComponentProps<typeof TooltipPrimitive.Root>;
declare function Tooltip(props: TooltipProps): import("react/jsx-runtime").JSX.Element;
type TooltipTriggerProps = React.ComponentProps<typeof TooltipPrimitive.Trigger>;
declare function TooltipTrigger(props: TooltipTriggerProps): import("react/jsx-runtime").JSX.Element;
type TooltipContentProps = React.ComponentProps<typeof TooltipPrimitive.Content> & {
    transition?: Transition;
    arrow?: boolean;
};
declare function TooltipContent({ className, side, sideOffset, transition, arrow, children, ...props }: TooltipContentProps): import("react/jsx-runtime").JSX.Element;
export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider, useTooltip, type TooltipContextType, type TooltipProps, type TooltipTriggerProps, type TooltipContentProps, type TooltipProviderProps, };
