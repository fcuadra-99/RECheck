import * as React from 'react';
import { type HTMLMotionProps } from 'motion/react';
type ScrollProgressProps = React.ComponentProps<'div'> & {
    progressProps?: HTMLMotionProps<'div'>;
};
declare function ScrollProgress({ ref, className, children, progressProps, ...props }: ScrollProgressProps): import("react/jsx-runtime").JSX.Element;
export { ScrollProgress, type ScrollProgressProps };
