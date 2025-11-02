import * as LucideIcons from "lucide-react";
import { ReportCategory } from "@/types/reports";

interface CategoryReportsViewProps {
  category: ReportCategory;
  onReportSelect: (categoryId: string, reportId: string, reportName: string) => void;
  onBack: () => void;
}

export const CategoryReportsView = ({ category, onReportSelect, onBack }: CategoryReportsViewProps) => {
  const CategoryIcon = (LucideIcons as any)[category.icon] || LucideIcons.BarChart3;

  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-muted/30 p-6">
      <div className="w-full max-w-6xl space-y-6">
        <div className="flex items-center gap-4 mb-8 animate-fade-in">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted rounded-md transition-all duration-300 hover:scale-110 transform hover:rotate-[-5deg]"
          >
            <LucideIcons.ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <CategoryIcon className="h-8 w-8 text-accent transition-transform duration-300 hover:scale-110" />
            <h2 className="text-3xl font-bold text-foreground">{category.name}</h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {category.reports.map((report) => {
            const ReportIcon = report.icon 
              ? (LucideIcons as any)[report.icon] || LucideIcons.FileText
              : LucideIcons.FileText;

            return (
              <button
                key={report.id}
                onClick={() => onReportSelect(category.id, report.id, report.name)}
                className="p-6 bg-card rounded-lg border border-border hover:border-accent hover:shadow-xl transition-all duration-300 cursor-pointer group flex flex-col items-center text-center hover:scale-105 hover:-translate-y-2 transform"
              >
                <ReportIcon className="h-10 w-10 text-accent mb-3 group-hover:scale-125 group-hover:rotate-6 transition-all duration-300" />
                <p className="text-sm font-medium">{report.name}</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

