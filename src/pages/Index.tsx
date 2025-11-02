import { useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Sidebar } from "@/components/Sidebar";
import { Breadcrumb } from "@/components/Breadcrumb";
import { ReportViewer } from "@/components/ReportViewer";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import { CategoryReportsView } from "@/components/CategoryReportsView";
import { reportCategories } from "@/types/reports";

const Index = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
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
      setSelectedCategoryId(null);
      setIsSidebarOpen(false);
    }
  };

  const handleBack = () => {
    setActiveReport(null);
    setSelectedCategoryId(null);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setActiveReport(null);
  };

  const handleHomeClick = () => {
    setActiveReport(null);
    setSelectedCategoryId(null);
    setIsSidebarOpen(false);
  };

  const currentCategory = reportCategories.find(c => c.id === activeReport?.categoryId || c.id === selectedCategoryId);
  const selectedCategory = selectedCategoryId ? reportCategories.find(c => c.id === selectedCategoryId) : null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        onHomeClick={handleHomeClick}
      />
      
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

        <main className="flex-1 flex flex-col min-h-[calc(100vh-4rem)]">
          {activeReport && (
            <Breadcrumb
              categoryName={currentCategory?.name}
              reportName={activeReport?.reportName}
              onBack={handleBack}
            />
          )}
          
          <div className="flex-1">
            {activeReport ? (
              <ReportViewer
                reportUrl={activeReport.reportUrl}
                reportName={activeReport.reportName}
              />
            ) : selectedCategory ? (
              <CategoryReportsView
                category={selectedCategory}
                onReportSelect={handleReportSelect}
                onBack={handleBack}
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
