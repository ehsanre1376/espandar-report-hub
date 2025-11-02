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
    <div className="relative w-full h-full bg-background">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
          <div className="text-center space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Loading {reportName}...</p>
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
