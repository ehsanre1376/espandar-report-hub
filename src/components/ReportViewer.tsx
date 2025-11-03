import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { authService } from "@/services/authService";

interface ReportViewerProps {
  reportUrl: string;
  reportName: string;
}

export const ReportViewer = ({ reportUrl, reportName }: ReportViewerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [authenticatedUrl, setAuthenticatedUrl] = useState(reportUrl);

  useEffect(() => {
    setIsLoading(true);
    
    // Get Power BI token and append to URL if available
    const setupPowerBiAuth = async () => {
      try {
        const powerBiToken = await authService.getPowerBiToken();
        
        try {
          if (powerBiToken) {
            // Append Power BI token to the URL for SSO
            const url = new URL(reportUrl);
            url.searchParams.set("access_token", powerBiToken);
            // Ensure rs:embed is set
            if (!url.searchParams.has("rs:embed")) {
              url.searchParams.set("rs:embed", "true");
            }
            setAuthenticatedUrl(url.toString());
          } else {
            // Use original URL, ensure rs:embed is set
            const url = new URL(reportUrl);
            if (!url.searchParams.has("rs:embed")) {
              url.searchParams.set("rs:embed", "true");
            }
            setAuthenticatedUrl(url.toString());
          }
        } catch (urlError) {
          // If URL parsing fails, use original URL
          console.error("URL parsing error:", urlError);
          setAuthenticatedUrl(reportUrl);
        }
      } catch (error) {
        console.error("Power BI auth setup error:", error);
        // Fallback to original URL
        setAuthenticatedUrl(reportUrl);
      } finally {
        const timer = setTimeout(() => setIsLoading(false), 1000);
        return () => clearTimeout(timer);
      }
    };

    setupPowerBiAuth();
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
        src={authenticatedUrl}
        title={reportName}
        className="w-full h-full border-0"
        onLoad={() => setIsLoading(false)}
        allowFullScreen
      />
    </div>
  );
};
