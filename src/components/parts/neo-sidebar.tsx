'use client';

import * as React from 'react';
import { data as DATA } from "@/Data"
import {
  SidebarProvider,
  SidebarTrigger,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from '@/components/animate-ui/radix/sidebar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/animate-ui/radix/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/animate-ui/radix/dropdown-menu';
import {
  ChevronRight,
  ChevronsUpDown,
  CircleUserRound,
  LogOut,
  Settings,
} from 'lucide-react';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import { useIsMobile } from '@/hooks/use-mobile';
import { Link } from 'react-router';
import { supabase } from '@/DB';
import { toast } from 'sonner';
import { useNavigate } from 'react-router';

interface RadixSidebarDemoProps {
  fname: string,
  lname: string,
  email: string,
  org: string,
  avatar: string,
  role: string,
}

export function RadixSidebarDemo({
  fname,
  lname,
  email,
  org,
  avatar,
  role,
  ...props
}: RadixSidebarDemoProps & React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile();
  const main = DATA.main[0];
  const navigate = useNavigate()

  const handleLogout = async () => {
    const loading = toast.loading("Logging Out...")
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Logged out successfully!");
        navigate('/login');
      }
    } catch (err) {
      console.error('Logout error:', err);
      toast.error('An unexpected error occurred during logout.');
    }
    finally {
      toast.dismiss(loading)
    }
  };

  return (
    <>
      <SidebarProvider>
        <Sidebar {...props} className=''>
          <SidebarHeader>
            {/* Team Switcher */}
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <main.logo className="size-4" />
                    </div>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        RECheck
                      </span>
                      <span className="truncate text-xs">
                        UIC REC
                      </span>
                    </div>
                  </SidebarMenuButton>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
            {/* Team Switcher */}
          </SidebarHeader>

          <SidebarContent>
            {/* Nav Main */}
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarMenu>
                {DATA.navMain.map((item) => (
                  <Collapsible>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <SidebarMenuSub>
                          {item.items?.map((subItem) => (
                            <SidebarMenuSubItem key={subItem.title}>
                              <SidebarMenuSubButton asChild>
                                <Link to={subItem.url}>
                                  <span>{subItem.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          ))}
                        </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarGroup>
            {/* Nav Main */}

          </SidebarContent>
          <SidebarFooter>
            {/* Nav User */}
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                      size="lg"
                      className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                      <Avatar className="h-8 w-8 rounded-lg">
                        <AvatarImage
                          src={avatar}
                        />
                        <AvatarFallback className="rounded-lg">{lname[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">
                          {`${lname}, ${fname}`}
                        </span>
                        <span className="truncate text-xs">
                          {email}
                        </span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-67 md:min-w-60 rounded-md"
                    side={isMobile ? 'bottom' : 'bottom'}
                    align="center"
                    sideOffset={10}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          <AvatarImage
                            src={avatar}
                          />
                          <AvatarFallback className="rounded-lg">
                            {lname[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">
                            {`${lname}, ${fname}`}
                          </span>
                          <span className="truncate text-xs">
                            {email}
                          </span>
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                      <Link to="/profile">
                        <DropdownMenuItem>
                          <CircleUserRound />
                          Profile
                        </DropdownMenuItem>
                      </Link>
                      <Link to="/settings">
                        <DropdownMenuItem>
                          <Settings />
                          Settings
                        </DropdownMenuItem>
                      </Link>
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                    >
                      <LogOut />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
            {/* Nav User */}
          </SidebarFooter>
        </Sidebar>
        <SidebarTrigger
          className="mx-4 my-2 min-md:invisible md:transition-none z-50 fixed"
          onClick={() => console.log("ww")}
        />
      </SidebarProvider >
    </>
  );
};