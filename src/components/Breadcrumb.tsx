import { ChevronRight, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BreadcrumbProps {
  categoryName?: string;
  reportName?: string;
  onBack: () => void;
}

export const Breadcrumb = ({ categoryName, reportName, onBack }: BreadcrumbProps) => {
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
        <span className="font-medium text-foreground">Home</span>
        
        {categoryName && (
          <>
            <ChevronRight className="h-4 w-4" />
            <span className="font-medium text-foreground">{categoryName}</span>
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
