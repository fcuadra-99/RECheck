import * as React from 'react';
import { DropdownMenu as DropdownMenuPrimitive } from 'radix-ui';
import { type HTMLMotionProps, type Transition } from 'motion/react';
type DropdownMenuProps = React.ComponentProps<typeof DropdownMenuPrimitive.Root> & {
    transition?: Transition;
    animateOnHover?: boolean;
};
declare function DropdownMenu({ children, transition, animateOnHover, ...props }: DropdownMenuProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuTriggerProps = React.ComponentProps<typeof DropdownMenuPrimitive.Trigger>;
declare function DropdownMenuTrigger(props: DropdownMenuTriggerProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuGroupProps = React.ComponentProps<typeof DropdownMenuPrimitive.Group>;
declare function DropdownMenuGroup(props: DropdownMenuGroupProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuPortalProps = React.ComponentProps<typeof DropdownMenuPrimitive.Portal>;
declare function DropdownMenuPortal(props: DropdownMenuPortalProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuSubProps = React.ComponentProps<typeof DropdownMenuPrimitive.Sub>;
declare function DropdownMenuSub(props: DropdownMenuSubProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuRadioGroupProps = React.ComponentProps<typeof DropdownMenuPrimitive.RadioGroup>;
declare function DropdownMenuRadioGroup(props: DropdownMenuRadioGroupProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuSubTriggerProps = React.ComponentProps<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
};
declare function DropdownMenuSubTrigger({ className, children, inset, disabled, ...props }: DropdownMenuSubTriggerProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuSubContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.SubContent>;
declare function DropdownMenuSubContent({ className, ...props }: DropdownMenuSubContentProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuContentProps = React.ComponentProps<typeof DropdownMenuPrimitive.Content> & HTMLMotionProps<'div'> & {
    transition?: Transition;
};
declare function DropdownMenuContent({ className, children, sideOffset, transition, ...props }: DropdownMenuContentProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
    variant?: 'default' | 'destructive';
};
declare function DropdownMenuItem({ className, children, inset, disabled, variant, ...props }: DropdownMenuItemProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuCheckboxItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.CheckboxItem>;
declare function DropdownMenuCheckboxItem({ className, children, checked, disabled, ...props }: DropdownMenuCheckboxItemProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuRadioItemProps = React.ComponentProps<typeof DropdownMenuPrimitive.RadioItem>;
declare function DropdownMenuRadioItem({ className, children, disabled, ...props }: DropdownMenuRadioItemProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuLabelProps = React.ComponentProps<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
};
declare function DropdownMenuLabel({ className, inset, ...props }: DropdownMenuLabelProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuSeparatorProps = React.ComponentProps<typeof DropdownMenuPrimitive.Separator>;
declare function DropdownMenuSeparator({ className, ...props }: DropdownMenuSeparatorProps): import("react/jsx-runtime").JSX.Element;
type DropdownMenuShortcutProps = React.ComponentProps<'span'>;
declare function DropdownMenuShortcut({ className, ...props }: DropdownMenuShortcutProps): import("react/jsx-runtime").JSX.Element;
export { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuGroup, DropdownMenuPortal, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuRadioGroup, type DropdownMenuProps, type DropdownMenuTriggerProps, type DropdownMenuContentProps, type DropdownMenuItemProps, type DropdownMenuCheckboxItemProps, type DropdownMenuRadioItemProps, type DropdownMenuLabelProps, type DropdownMenuSeparatorProps, type DropdownMenuShortcutProps, type DropdownMenuGroupProps, type DropdownMenuPortalProps, type DropdownMenuSubProps, type DropdownMenuSubContentProps, type DropdownMenuSubTriggerProps, type DropdownMenuRadioGroupProps, };
