'use client';

import * as React from 'react';
import { data as DATA, generateNav, type NavItem } from "@/Data";
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
import { Link, useNavigate } from 'react-router';
import { supabase } from '@/DB';
import { toast } from 'sonner';
import { createPortal } from 'react-dom';

interface RadixSidebarDemoProps {
  fname: string;
  lname: string;
  email: string;
  org: string;
  role: string;
  userId: string;
}

export function RadixSidebarDemo({
  fname,
  lname,
  email,
  role,
  userId,
  ...props
}: RadixSidebarDemoProps & React.ComponentProps<typeof Sidebar>) {
  const isMobile = useIsMobile();
  const main = DATA.main[0];
  const navigate = useNavigate();

  const [avatarUrl, setAvatarUrl] = React.useState<string | null>(null);
  const [mounted, setMounted] = React.useState(false);

  // Set mounted to true after component mounts (for portal)
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // ----------------------------
  // Dynamic nav items based on role
  // ----------------------------
  const navItems = React.useMemo(() => {
    if (!role) return [];
    return generateNav(role);
  }, [role]);

  // ----------------------------
  // Avatar fetching (keep intact)
  // ----------------------------
  React.useEffect(() => {
    if (!userId) return;

    const fetchAvatar = async () => {
      try {
        const { data: publicUrlData } = supabase.storage
          .from("profiles")
          .getPublicUrl(`${userId}/avatar.png`);

        const url = publicUrlData?.publicUrl;

        if (!url) {
          setAvatarUrl(null);
          return;
        }

        const res = await fetch(url, { method: "HEAD" });
        if (res.ok) {
          setAvatarUrl(url);
        } else {
          setAvatarUrl(null);
        }
      } catch (err) {
        console.error("Avatar fetch error:", err);
        setAvatarUrl(null);
      }
    };

    fetchAvatar();
  }, [userId]);

  main;

  // ----------------------------
  // Logout handler
  // ----------------------------
  const handleLogout = async () => {
    const loading = toast.loading("Logging Out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error(error.message);
      } else {
        setTimeout(() => {
          navigate("/login", { replace: true });
        }, 100);
        toast.success("Logged out successfully!");
      }
    } catch (err) {
      console.error("Logout error:", err);
      toast.error("An unexpected error occurred during logout.");
    } finally {
      toast.dismiss(loading);
    }
  };

  // Control open state. Default false; on desktop force open.
  const [open, setOpen] = React.useState<boolean>(false);

  // When isMobile changes: force open on desktop; close on mobile initially.
  React.useEffect(() => {
    if (!isMobile) {
      setOpen(true); // always open on desktop
    } else {
      setOpen(false); // start closed on mobile
    }
  }, [isMobile]);

  // Handle overlay click - use the same state setter
  const handleOverlayClick = React.useCallback(() => {
    console.log('Overlay clicked, closing sidebar');
    setOpen(false);
  }, []);

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <>
      <SidebarProvider open={open} onOpenChange={setOpen}>
        <Sidebar {...props}>
          <SidebarHeader>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton size="lg">
                  <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                    <Avatar>
                      <AvatarImage src={"logoo.png"} className="w-auto h-auto contain-content " />
                    </Avatar>
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-semibold">RECheck</span>
                    <span className="truncate text-xs">UIC REC</span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Platform</SidebarGroupLabel>
              <SidebarMenu>
                {navItems.map((item: NavItem) => (
                  <Collapsible key={item.title}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton tooltip={item.title}>
                          {item.icon && <item.icon />}
                          <span>{item.title}</span>
                          {item.items?.length ? (
                            <ChevronRight className="ml-auto transition-transform duration-300 group-data-[state=open]/collapsible:rotate-90" />
                          ) : null}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      {item.items?.length ? (
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.items.map((subItem) => (
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
                      ) : null}
                    </SidebarMenuItem>
                  </Collapsible>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <SidebarMenuButton size="lg">
                      <Avatar className="h-8 w-8 rounded-xl border-2 border-primary">
                        {avatarUrl ? (
                          <AvatarImage src={avatarUrl} className="w-full h-full object-cover" />
                        ) : (
                          <AvatarFallback className="rounded-lg">{lname[0]?.toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{`${lname}, ${fname}`}</span>
                        <span className="truncate text-xs">{email}</span>
                      </div>
                      <ChevronsUpDown className="ml-auto size-4" />
                    </SidebarMenuButton>
                  </DropdownMenuTrigger>

                  <DropdownMenuContent
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-67 md:min-w-60 rounded-md"
                    side={isMobile ? "bottom" : "bottom"}
                    align="center"
                    sideOffset={10}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <Avatar className="h-8 w-8 rounded-lg">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} />
                          ) : (
                            <AvatarFallback className="rounded-lg">{lname[0]?.toUpperCase()}</AvatarFallback>
                          )}
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                          <span className="truncate font-semibold">{`${lname}, ${fname}`}</span>
                          <span className="truncate text-xs">{email}</span>
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
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        {/* Portal for Sidebar Trigger */}
        {mounted && createPortal(
          <SidebarTrigger
            onClick={() => {
              // Only toggle when mobile — on desktop it remains open
              if (isMobile) setOpen((v) => !v);
            }}
            className="mx-2 mt-0.5 fixed top-2 left-2 md:hidden sm:visible z-[60]"
            hidden={isMobile && open}
          />,
          document.body
        )}
      </SidebarProvider>

      {/* Portal overlay only on mobile when sidebar is open */}
      {mounted && isMobile && open && createPortal(
        <div
          className="fixed right-0 top-0 w-[60.5%] h-full z-[100] bg-black/10 backdrop-blur-[0.5px]"
          onClick={handleOverlayClick}
          style={{ pointerEvents: 'auto' }}
        />,
        document.body
      )}
    </>
  );
}