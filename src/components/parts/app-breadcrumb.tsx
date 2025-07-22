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

export function AppBreadcrumb({
  items,
}: {
  items: {
    title: string
    url: string
    items?: {
      title: string
      url: string
    }[]
  }[]
}) {


  function FTWU(items: any[], targetUrl: string): string | null {
    for (const item of items) {
      if (item.url === targetUrl) {
        return item.title;
      }

      if (item.items) {
        const foundInChildren = FTWU(item.items, targetUrl);
        if (foundInChildren) {
          return foundInChildren;
        }
      }
    }
    return null;
  }


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
            <BreadcrumbPage>{FTWU(items, path)}</BreadcrumbPage>
          </BreadcrumbItem>
        )
      }
      else {
        pathc.push(
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={root}>
                {FTWU(items, root)}
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

  //console.log(path.split("/").length - 1)

  return (
    <Breadcrumb className="flex space-1">
      <BreadcrumbList className="ml-9 md:ml-0 transition-all duration-150 ease-out" >
        {Pathingy()}
      </BreadcrumbList>
    </Breadcrumb>
  )
}