import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ReportViewerProps {
  reportUrl: string;
  reportName: string;
}

export const ReportViewer = ({ reportUrl, reportName }: ReportViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [reportUrl]);

  return (
    <div className="relative w-full h-full bg-background animate-fade-in">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/90 z-10 backdrop-blur-sm">
          <div className="text-center space-y-4 animate-fade-in">
            <Loader2 className="h-10 w-10 animate-spin text-accent mx-auto" />
            <p className="text-sm text-muted-foreground font-medium">Loading {reportName}...</p>
            <div className="w-32 h-1 bg-muted rounded-full overflow-hidden mx-auto">
              <div className="h-full bg-accent animate-slide-in w-full"></div>
            </div>
          </div>
        </div>
      )}
      
      <iframe
        src={reportUrl}
        title={reportName}
        className="w-full h-full border-0"
        onLoad={() => setIsLoading(false)}
      />
    </div>
  );
};
