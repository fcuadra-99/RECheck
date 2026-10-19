import * as React from 'react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { type HTMLMotionProps, type Transition } from 'motion/react';
import { type VariantProps } from 'class-variance-authority';
type SheetContextType = {
    isOpen: boolean;
};
declare const useSheet: () => SheetContextType;
type SheetProps = React.ComponentProps<typeof SheetPrimitive.Root>;
declare function Sheet({ children, ...props }: SheetProps): import("react/jsx-runtime").JSX.Element;
type SheetTriggerProps = React.ComponentProps<typeof SheetPrimitive.Trigger>;
declare function SheetTrigger(props: SheetTriggerProps): import("react/jsx-runtime").JSX.Element;
type SheetCloseProps = React.ComponentProps<typeof SheetPrimitive.Close>;
declare function SheetClose(props: SheetCloseProps): import("react/jsx-runtime").JSX.Element;
type SheetPortalProps = React.ComponentProps<typeof SheetPrimitive.Portal>;
declare function SheetPortal(props: SheetPortalProps): import("react/jsx-runtime").JSX.Element;
type SheetOverlayProps = React.ComponentProps<typeof SheetPrimitive.Overlay>;
declare function SheetOverlay({ className, ...props }: SheetOverlayProps): import("react/jsx-runtime").JSX.Element;
declare const sheetVariants: (props?: ({
    side?: "bottom" | "left" | "right" | "top" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type SheetContentProps = React.ComponentProps<typeof SheetPrimitive.Content> & VariantProps<typeof sheetVariants> & HTMLMotionProps<'div'> & {
    transition?: Transition;
    overlay?: boolean;
};
declare function SheetContent({ side, className, transition, overlay, children, ...props }: SheetContentProps): import("react/jsx-runtime").JSX.Element;
type SheetHeaderProps = React.ComponentProps<'div'>;
declare function SheetHeader({ className, ...props }: SheetHeaderProps): import("react/jsx-runtime").JSX.Element;
type SheetFooterProps = React.ComponentProps<'div'>;
declare function SheetFooter({ className, ...props }: SheetFooterProps): import("react/jsx-runtime").JSX.Element;
type SheetTitleProps = React.ComponentProps<typeof SheetPrimitive.Title>;
declare function SheetTitle({ className, ...props }: SheetTitleProps): import("react/jsx-runtime").JSX.Element;
type SheetDescriptionProps = React.ComponentProps<typeof SheetPrimitive.Description>;
declare function SheetDescription({ className, ...props }: SheetDescriptionProps): import("react/jsx-runtime").JSX.Element;
export { useSheet, Sheet, SheetPortal, SheetOverlay, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, type SheetProps, type SheetPortalProps, type SheetOverlayProps, type SheetTriggerProps, type SheetCloseProps, type SheetContentProps, type SheetHeaderProps, type SheetFooterProps, type SheetTitleProps, type SheetDescriptionProps, };
