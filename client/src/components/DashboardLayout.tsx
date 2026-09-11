import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { startLogin } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { BookOpenCheck, Compass, Database, LogOut, PanelLeft, ShieldCheck } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";
import { useLanguage } from "@/i18n";

const menuItems = [
  { icon: Compass, key: "dlWorkspace" as const, path: "/" },
];

const navigationNotes = [
  { icon: BookOpenCheck, key: "dlNoteFramework" as const },
  { icon: Database, key: "dlNoteSources" as const },
  { icon: ShieldCheck, key: "dlNoteJudgement" as const },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 276;
const MIN_WIDTH = 200;
const MAX_WIDTH = 420;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();
  const { ui } = useLanguage();

  useEffect(() => { localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString()); }, [sidebarWidth]);
  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <div className="flex items-center justify-center min-h-screen bg-[#f5f7f4] p-5"><div className="flex flex-col items-center gap-6 p-8 max-w-md w-full rounded-2xl border border-[#dbe5de] bg-white text-center shadow-sm"><div className="grid h-12 w-12 place-items-center rounded-xl bg-[#e6f4ea] text-[#1f704d]"><Compass className="h-6 w-6" /></div><div><h1 className="font-serif text-2xl font-medium tracking-tight text-[#183c2e]">{ui("dlSignInTitle")}</h1><p className="mt-2 text-sm leading-6 text-[#68786f]">{ui("dlSignInDesc")}</p></div><Button onClick={() => startLogin()} size="lg" className="w-full bg-[#123c31] hover:bg-[#0d3026]">{ui("dlSignIn")}</Button></div></div>;

  return <SidebarProvider style={{ "--sidebar-width": `${sidebarWidth}px` } as CSSProperties}><DashboardLayoutContent setSidebarWidth={setSidebarWidth}>{children}</DashboardLayoutContent></SidebarProvider>;
}

function DashboardLayoutContent({ children, setSidebarWidth }: { children: React.ReactNode; setSidebarWidth: (width: number) => void }) {
  const { user, logout } = useAuth();
  const { ui } = useLanguage();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => { if (isCollapsed) setIsResizing(false); }, [isCollapsed]);
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const nextWidth = event.clientX - sidebarLeft;
      if (nextWidth >= MIN_WIDTH && nextWidth <= MAX_WIDTH) setSidebarWidth(nextWidth);
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return <><div className="relative" ref={sidebarRef}><Sidebar collapsible="icon" className="border-r-0"><SidebarHeader className="h-[76px] justify-center"><div className="flex items-center gap-3 px-3 transition-all w-full"><button onClick={toggleSidebar} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#bfe5ce] hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a5dfbe]" aria-label={ui("dlToggleNav")}><PanelLeft className="h-4 w-4" /></button>{!isCollapsed && <div className="min-w-0"><span className="block font-serif text-[15px] leading-none tracking-tight text-white">Global Entry</span><span className="mt-1 block text-[9px] font-bold uppercase tracking-[.14em] text-[#a8d2b8]">Strategy Studio</span></div>}</div></SidebarHeader><SidebarContent className="gap-0"><SidebarMenu className="px-3 py-3">{menuItems.map((item) => <SidebarMenuItem key={item.path}><SidebarMenuButton isActive={location === item.path} onClick={() => setLocation(item.path)} tooltip={ui(item.key)} className="h-10 text-[13px] font-normal"><item.icon className="h-4 w-4" /><span>{ui(item.key)}</span></SidebarMenuButton></SidebarMenuItem>)}</SidebarMenu><div className="mx-3 mt-3 border-t border-white/10 pt-5 group-data-[collapsible=icon]:hidden"><p className="mb-3 px-2 text-[9px] font-bold uppercase tracking-[.12em] text-[#80ad91]">{ui("dlPrinciples")}</p><div className="space-y-1">{navigationNotes.map((note) => <div key={note.key} className="flex gap-2 px-2 py-1.5 text-[11px] leading-4 text-[#b4d0bf]"><note.icon className="mt-[1px] h-3.5 w-3.5 shrink-0 text-[#78ba91]" /><span>{ui(note.key)}</span></div>)}</div></div></SidebarContent><SidebarFooter className="p-3"><DropdownMenu><DropdownMenuTrigger asChild><button className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-white/10 transition-colors w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#a5dfbe]"><Avatar className="h-8 w-8 shrink-0 border border-white/15"><AvatarFallback className="bg-[#2b5847] text-[11px] font-medium text-[#e5f5eb]">{user?.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback></Avatar><div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden"><p className="truncate text-xs font-medium leading-none text-white">{user?.name || ui("dlUser")}</p><p className="mt-1.5 truncate text-[10px] text-[#a6c4b1]">{ui("dlPersonalAnalysis")}</p></div></button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48"><DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" /><span>{ui("dlSignOut")}</span></DropdownMenuItem></DropdownMenuContent></DropdownMenu></SidebarFooter></Sidebar><div className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-[#86cba4]/50 transition-colors ${isCollapsed ? "hidden" : ""}`} onMouseDown={() => { if (!isCollapsed) setIsResizing(true); }} style={{ zIndex: 50 }} /></div><SidebarInset>{isMobile && <div className="flex h-14 items-center border-b border-[#dbe5de] bg-[#f5f7f4]/95 px-2 backdrop-blur"><SidebarTrigger className="h-9 w-9 rounded-lg" /><span className="ml-2 font-serif text-sm text-[#234634]">Global Entry Strategy</span></div>}<main className="min-h-screen flex-1">{children}</main></SidebarInset></>;
}
