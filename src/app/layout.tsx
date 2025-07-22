import { AppSidebar } from "@/components/app/app-sidebar";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <AppSidebar className="w-[240px] border-r" />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  );
}