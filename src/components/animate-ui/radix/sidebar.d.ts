import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { type Transition } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { TooltipContent } from '@/components/animate-ui/radix/tooltip';
type SidebarContextProps = {
    state: 'expanded' | 'collapsed';
    open: boolean;
    setOpen: (open: boolean) => void;
    openMobile: boolean;
    setOpenMobile: (open: boolean) => void;
    isMobile: boolean;
    toggleSidebar: () => void;
};
declare function useSidebar(): SidebarContextProps;
type SidebarProviderProps = React.ComponentProps<'div'> & {
    defaultOpen?: boolean;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
};
declare function SidebarProvider({ defaultOpen, open: openProp, onOpenChange: setOpenProp, className, style, children, ...props }: SidebarProviderProps): import("react/jsx-runtime").JSX.Element;
type SidebarProps = React.ComponentProps<'div'> & {
    side?: 'left' | 'right';
    variant?: 'sidebar' | 'floating' | 'inset';
    collapsible?: 'offcanvas' | 'icon' | 'none';
    containerClassName?: string;
    animateOnHover?: boolean;
    transition?: Transition;
};
declare function Sidebar({ side, variant, collapsible, className, children, animateOnHover, containerClassName, transition, ...props }: SidebarProps): import("react/jsx-runtime").JSX.Element;
type SidebarTriggerProps = React.ComponentProps<typeof Button>;
declare function SidebarTrigger({ className, onClick, ...props }: SidebarTriggerProps): import("react/jsx-runtime").JSX.Element;
type SidebarRailProps = React.ComponentProps<'button'>;
declare function SidebarRail({ className, ...props }: SidebarRailProps): import("react/jsx-runtime").JSX.Element;
type SidebarInsetProps = React.ComponentProps<'main'>;
declare function SidebarInset({ className, ...props }: SidebarInsetProps): import("react/jsx-runtime").JSX.Element;
type SidebarInputProps = React.ComponentProps<typeof Input>;
declare function SidebarInput({ className, ...props }: SidebarInputProps): import("react/jsx-runtime").JSX.Element;
type SidebarHeaderProps = React.ComponentProps<'div'>;
declare function SidebarHeader({ className, ...props }: SidebarHeaderProps): import("react/jsx-runtime").JSX.Element;
type SidebarFooterProps = React.ComponentProps<'div'>;
declare function SidebarFooter({ className, ...props }: SidebarFooterProps): import("react/jsx-runtime").JSX.Element;
type SidebarSeparatorProps = React.ComponentProps<typeof Separator>;
declare function SidebarSeparator({ className, ...props }: SidebarSeparatorProps): import("react/jsx-runtime").JSX.Element;
type SidebarContentProps = React.ComponentProps<'div'>;
declare function SidebarContent({ className, ...props }: SidebarContentProps): import("react/jsx-runtime").JSX.Element;
type SidebarGroupProps = React.ComponentProps<'div'>;
declare function SidebarGroup({ className, ...props }: SidebarGroupProps): import("react/jsx-runtime").JSX.Element;
type SidebarGroupLabelProps = React.ComponentProps<'div'> & {
    asChild?: boolean;
};
declare function SidebarGroupLabel({ className, asChild, ...props }: SidebarGroupLabelProps): import("react/jsx-runtime").JSX.Element;
type SidebarGroupActionProps = React.ComponentProps<'button'> & {
    asChild?: boolean;
};
declare function SidebarGroupAction({ className, asChild, ...props }: SidebarGroupActionProps): import("react/jsx-runtime").JSX.Element;
type SidebarGroupContentProps = React.ComponentProps<'div'>;
declare function SidebarGroupContent({ className, ...props }: SidebarGroupContentProps): import("react/jsx-runtime").JSX.Element;
type SidebarMenuProps = React.ComponentProps<'ul'>;
declare function SidebarMenu({ className, ...props }: SidebarMenuProps): import("react/jsx-runtime").JSX.Element;
type SidebarMenuItemProps = React.ComponentProps<'li'>;
declare function SidebarMenuItem({ className, ...props }: SidebarMenuItemProps): import("react/jsx-runtime").JSX.Element;
declare const sidebarMenuButtonVariants: (props?: ({
    variant?: "default" | "outline" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
type SidebarMenuButtonProps = React.ComponentProps<'button'> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string | React.ComponentProps<typeof TooltipContent>;
} & VariantProps<typeof sidebarMenuButtonVariants>;
declare function SidebarMenuButton({ asChild, isActive, variant, size, tooltip, className, ...props }: SidebarMenuButtonProps): import("react/jsx-runtime").JSX.Element;
type SidebarMenuActionProps = React.ComponentProps<'button'> & {
    asChild?: boolean;
    showOnHover?: boolean;
};
declare function SidebarMenuAction({ className, asChild, showOnHover, ...props }: SidebarMenuActionProps): import("react/jsx-runtime").JSX.Element;
type SidebarMenuBadgeProps = React.ComponentProps<'div'>;
declare function SidebarMenuBadge({ className, ...props }: SidebarMenuBadgeProps): import("react/jsx-runtime").JSX.Element;
type SidebarMenuSkeletonProps = React.ComponentProps<'div'> & {
    showIcon?: boolean;
};
declare function SidebarMenuSkeleton({ className, showIcon, ...props }: SidebarMenuSkeletonProps): import("react/jsx-runtime").JSX.Element;
type SidebarMenuSubProps = React.ComponentProps<'ul'>;
declare function SidebarMenuSub({ className, ...props }: SidebarMenuSubProps): import("react/jsx-runtime").JSX.Element;
type SidebarMenuSubItemProps = React.ComponentProps<'li'>;
declare function SidebarMenuSubItem({ className, ...props }: SidebarMenuSubItemProps): import("react/jsx-runtime").JSX.Element;
type SidebarMenuSubButtonProps = React.ComponentProps<'a'> & {
    asChild?: boolean;
    size?: 'sm' | 'md';
    isActive?: boolean;
};
declare function SidebarMenuSubButton({ asChild, size, isActive, className, ...props }: SidebarMenuSubButtonProps): import("react/jsx-runtime").JSX.Element;
export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInput, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar, type SidebarProps, type SidebarContentProps, type SidebarFooterProps, type SidebarGroupProps, type SidebarGroupActionProps, type SidebarGroupContentProps, type SidebarGroupLabelProps, type SidebarHeaderProps, type SidebarInputProps, type SidebarInsetProps, type SidebarMenuProps, type SidebarMenuActionProps, type SidebarMenuBadgeProps, type SidebarMenuButtonProps, type SidebarMenuItemProps, type SidebarMenuSkeletonProps, type SidebarMenuSubProps, type SidebarMenuSubItemProps, type SidebarMenuSubButtonProps, type SidebarProviderProps, type SidebarRailProps, type SidebarSeparatorProps, type SidebarTriggerProps, };
