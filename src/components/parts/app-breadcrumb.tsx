import { ChevronRight } from "lucide-react"
import { useLocation } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function AppBreadcrumb() {
  function Pathingy() {
    const path = useLocation().pathname
    const paths = path.split("/")
    const pathc = []
    paths.shift()

    let root = ""

    for (let p = 0; p < paths.length; p++) {
      root = `${root}/${paths[p]}`
      if (root == path) {
        pathc.push(
          <BreadcrumbItem>
            <BreadcrumbPage>{paths[p]}</BreadcrumbPage>
          </BreadcrumbItem>
        )
      }
      else {
        pathc.push(
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={root}>
                {paths[p]}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
          </>
        )
      }
    }

    return pathc
  }

  return (
    <Breadcrumb className="bg-accent z-100 backdrop-blur-md md:pl-64">
      <BreadcrumbPortal>
        {Pathingy()}
      </BreadcrumbPortal>
    </Breadcrumb>
  )
}


"use client";

import { createPortal } from "react-dom";

export function BreadcrumbPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === "undefined") return null; // SSR guard

  return createPortal(
    <Breadcrumb className="bg-white/30 backdrop-blur-xs fixed top-0 md:left-64 w-full z-[1] py-3 border-b-2 md:pl-5 sm:pl-14.5 pl-14.5">
      <BreadcrumbList className="ml-0 transition-all duration-150 ease-out w-auto">
        {children}
      </BreadcrumbList>
    </Breadcrumb>,
    document.body
  );
}