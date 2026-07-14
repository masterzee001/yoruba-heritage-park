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
          className="grid size-9 place-items-center rounded-sm border border-border bg-background text-charcoal lg:hidden"
          aria-label="Open admin navigation"
        >
          <Menu className="size-4" aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[280px] border-r border-ivory/10 bg-forest-deep p-0 text-ivory">
        <SheetTitle className="sr-only">Admin navigation</SheetTitle>
        <AdminSidebar compact onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
