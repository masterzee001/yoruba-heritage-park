import { useState } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { AdminSidebar } from "./AdminSidebar";

export function AdminMobileNavigation() {
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="admin-focus grid size-10 place-items-center rounded-sm border border-border bg-background text-charcoal transition hover:border-forest lg:hidden"
          aria-label="Open admin navigation"
          aria-expanded={open}
        >
          <Menu className="size-5" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[280px] max-w-[85vw] border-r border-ivory/10 bg-forest-deep p-0 text-ivory"
      >
        <SheetTitle className="sr-only">Admin navigation</SheetTitle>
        <AdminSidebar compact onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
