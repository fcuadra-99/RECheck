import { ChevronRight } from "lucide-react"
import { useLocation } from 'react-router-dom';
import { memo } from 'react';
import { createPortal } from "react-dom";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { NotificationBell } from "@/components/NotificationBell";

export interface AppBreadcrumbProps {
  userId?: string;
}

export const AppBreadcrumb = memo(function AppBreadcrumb({ userId }: AppBreadcrumbProps) {
  function Pathingy() {
    const path = useLocation().pathname
    const paths = path.split("/")
    const pathc: React.ReactNode[] = []
    paths.shift()

    let root = ""

    for (let p = 0; p < paths.length; p++) {
      root = `${root}/${paths[p]}`
      if (root == path) {
        pathc.push(
          <BreadcrumbItem key={root}>
            <BreadcrumbPage>{paths[p]}</BreadcrumbPage>
          </BreadcrumbItem>
        )
      } else {
        pathc.push(
          <span key={root} className="flex items-center">
            <BreadcrumbItem>
              <BreadcrumbLink href={root}>{paths[p]}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
          </span>
        )
      }
    }

    return pathc
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="bg-white/30 backdrop-blur-xs fixed top-0 md:left-64 right-0 z-[1] py-3 border-b-2 md:pl-5 sm:pl-14.5 pl-14.5 flex items-center justify-between pr-4">
      <BreadcrumbList className="ml-0 transition-all duration-150 ease-out w-auto">
        {Pathingy()}
      </BreadcrumbList>
      {userId && (
        <div className="flex-shrink-0">
          <NotificationBell userId={userId} />
        </div>
      )}
    </div>,
    document.body
  );
});
