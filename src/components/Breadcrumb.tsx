import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbProps {
  categoryName?: string;
  categoryId?: string;
  reportName?: string;
  onBack: () => void;
  onHomeClick: () => void;
  onCategoryClick?: (categoryId: string) => void;
}

export const Breadcrumb = ({ categoryName, categoryId, reportName, onBack, onHomeClick, onCategoryClick }: BreadcrumbProps) => {
  return (
    <div className="flex items-center gap-3 p-4 bg-card border-b border-border">
      {(categoryName || reportName) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-2 hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      )}
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Home className="h-4 w-4" />
        <button
          onClick={onHomeClick}
          className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
        >
          Home
        </button>
        
        {categoryName && (
          <>
            <ChevronRight className="h-4 w-4" />
            {onCategoryClick && categoryId ? (
              <button
                onClick={() => onCategoryClick(categoryId)}
                className="font-medium text-foreground hover:text-primary transition-colors cursor-pointer"
              >
                {categoryName}
              </button>
            ) : (
              <span className="font-medium text-foreground">{categoryName}</span>
            )}
          </>
        )}
        
        {reportName && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground">{reportName}</span>
          </>
        )}
      </div>
    </div>
  );
};
