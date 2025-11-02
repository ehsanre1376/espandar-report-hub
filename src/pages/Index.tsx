import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ReportViewer } from "@/components/ReportViewer";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { reportCategories } from "@/types/reports";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeReport, setActiveReport] = useState<{
    categoryId: string;
    reportId: string;
    reportName: string;
    reportUrl: string;
  } | null>(null);

  const handleReportSelect = (categoryId: string, reportId: string, reportName: string) => {
    const category = reportCategories.find(c => c.id === categoryId);
    const report = category?.reports.find(r => r.id === reportId);
    
    if (report) {
      setActiveReport({
        categoryId,
        reportId,
        reportName,
        reportUrl: report.url
      });
      setIsSidebarOpen(false);
    }
  };

  const handleBack = () => {
    setActiveReport(null);
  };

  const handleCategoryClick = (categoryId: string) => {
    const category = reportCategories.find(c => c.id === categoryId);
    if (category && category.reports.length > 0) {
      // Expand the category and open sidebar
      setIsSidebarOpen(true);
      // Optionally, select the first report in the category
      const firstReport = category.reports[0];
      handleReportSelect(categoryId, firstReport.id, firstReport.name);
    }
  };

  const currentCategory = reportCategories.find(c => c.id === activeReport?.categoryId);

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      
      <div className="flex pt-16 w-full">
        <Sidebar
          categories={reportCategories}
          isOpen={isSidebarOpen}
          onReportSelect={handleReportSelect}
          activeReport={activeReport ? {
            categoryId: activeReport.categoryId,
            reportId: activeReport.reportId
          } : undefined}
        />

        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className="flex-1 flex flex-col min-h-[calc(100vh-4rem)] lg:ml-0">
          <Breadcrumb
            categoryName={currentCategory?.name}
            reportName={activeReport?.reportName}
            onBack={handleBack}
          />
          
          <div className="flex-1">
            {activeReport ? (
              <ReportViewer
                reportUrl={activeReport.reportUrl}
                reportName={activeReport.reportName}
              />
            ) : (
              <WelcomeScreen onCategoryClick={handleCategoryClick} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
