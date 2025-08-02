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
    <Breadcrumb className="flex space-1">
      <BreadcrumbList className="ml-9 md:ml-0 transition-all duration-150 ease-out" >
        {Pathingy()}
      </BreadcrumbList>
    </Breadcrumb>
  )
}