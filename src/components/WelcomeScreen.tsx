import * as LucideIcons from "lucide-react";
import { reportCategories } from "@/types/reports";

interface WelcomeScreenProps {
  onCategoryClick: (categoryId: string) => void;
}

export const WelcomeScreen = ({ onCategoryClick }: WelcomeScreenProps) => {
  return (
    <div className="flex items-center justify-center h-full bg-gradient-to-br from-background to-muted/30">
      <div className="text-center space-y-8 px-6 max-w-4xl">
        <div className="space-y-3">
          <h2 className="text-4xl font-bold text-foreground">
            Welcome to Espandar BI Portal
          </h2>
          <p className="text-lg text-muted-foreground">
            Select a category below or use the sidebar to view detailed analytics and insights
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
          {reportCategories.map((category) => {
            const Icon = (LucideIcons as any)[category.icon] || LucideIcons.BarChart3;
            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className="p-6 bg-card rounded-lg border border-border hover:border-accent hover:shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <Icon className="h-8 w-8 text-accent mx-auto mb-2 group-hover:scale-110 transition-transform" />
                <p className="text-sm font-medium">{category.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{category.reports.length} reports</p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
