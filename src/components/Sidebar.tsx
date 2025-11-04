import { useState } from "react";
import { ChevronDown } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { cn } from "@/lib/utils";
import { ReportCategory } from "@/types/reports";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface SidebarProps {
  categories: ReportCategory[];
  isOpen: boolean;
  onReportSelect: (categoryId: string, reportId: string, reportName: string) => void;
  activeReport?: { categoryId: string; reportId: string };
}

export const Sidebar = ({ categories, isOpen, onReportSelect, activeReport }: SidebarProps) => {
  const [openCategories, setOpenCategories] = useState<string[]>(["financial"]);

  return (
    <aside
      className={cn(
        "fixed top-16 left-0 h-[calc(100vh-4rem)] bg-sidebar border-r border-sidebar-border z-40 transition-transform duration-300 overflow-y-auto",
        isOpen ? "translate-x-0" : "-translate-x-full",
        "w-72"
      )}
    >
      <nav className="p-4 space-y-2">
        {categories.map((category) => {
          const CategoryIcon = (LucideIcons as any)[category.icon] || LucideIcons.BarChart3;

          return (
            <Collapsible
              key={category.id}
              open={openCategories.includes(category.id)}
              onOpenChange={(isOpen) => {
                setOpenCategories(prev =>
                  isOpen
                    ? [...prev, category.id]
                    : prev.filter(id => id !== category.id)
                );
              }}
              className="space-y-1"
            >
              <CollapsibleTrigger asChild>
                <button className="w-full flex items-center gap-2 px-3 py-2.5 text-sidebar-foreground hover:bg-sidebar-primary rounded-md transition-colors group">
                  <CategoryIcon className="h-5 w-5 flex-shrink-0" />
                  <span className="flex-1 text-left font-medium">{category.name}</span>
                  <ChevronDown className="h-4 w-4 transition-transform duration-200 group-data-[state=closed]:-rotate-90" />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent className="overflow-hidden transition-all data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
                <div className="ml-4 pl-4 border-l-2 border-sidebar-border space-y-1 py-1">
                  {category.reports.map((report) => {
                    const isActive =
                      activeReport?.categoryId === category.id &&
                      activeReport?.reportId === report.id;

                    const ReportIcon = report.icon
                      ? (LucideIcons as any)[report.icon] || LucideIcons.FileText
                      : LucideIcons.FileText;

                    return (
                      <button
                        key={report.id}
                        onClick={() => onReportSelect(category.id, report.id, report.name)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-all duration-200 flex items-center gap-2",
                          isActive
                            ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-sm"
                            : "text-sidebar-foreground/80 hover:bg-sidebar-primary hover:text-sidebar-foreground"
                        )}
                      >
                        <ReportIcon className="h-4 w-4 flex-shrink-0" />
                        <span>{report.name}</span>
                      </button>
                    );
                  })}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </nav>
    </aside>
  );
};
