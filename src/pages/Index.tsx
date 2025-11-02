import { useState, useEffect, useRef } from "react";
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const lastScrollTop = useRef(0);

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
    setIsFullscreen(false);
    setIsHeaderVisible(true);
  };

  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setActiveReport(null);
  };

  const handleHomeClick = () => {
    setActiveReport(null);
    setSelectedCategoryId(null);
    setIsSidebarOpen(false);
    setIsFullscreen(false);
    setIsHeaderVisible(true);
  };

  // Handle F11 key to toggle fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F11" && activeReport) {
        e.preventDefault();
        setIsFullscreen(prev => {
          const newFullscreen = !prev;
          // When entering fullscreen, hide header; when exiting, show it
          if (newFullscreen) {
            setIsHeaderVisible(false);
          } else {
            setIsHeaderVisible(true);
          }
          return newFullscreen;
        });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeReport]);

  // Handle scroll to show header at top in fullscreen mode
  useEffect(() => {
    if (!isFullscreen || !activeReport) {
      return;
    }

    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      
      // Show header when at top of page
      if (scrollTop <= 50) {
        setIsHeaderVisible(true);
      } else if (scrollTop > lastScrollTop.current && scrollTop > 100) {
        // Scrolling down - hide header
        setIsHeaderVisible(false);
      } else if (scrollTop < lastScrollTop.current) {
        // Scrolling up - show header
        setIsHeaderVisible(true);
      }

      lastScrollTop.current = scrollTop;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFullscreen, activeReport]);

  const currentCategory = reportCategories.find(c => c.id === activeReport?.categoryId || c.id === selectedCategoryId);
  const selectedCategory = selectedCategoryId ? reportCategories.find(c => c.id === selectedCategoryId) : null;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader 
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} 
        onHomeClick={handleHomeClick}
        isVisible={isHeaderVisible}
      />
      
      <div className={`flex w-full transition-all duration-300 ${isFullscreen && !isHeaderVisible ? 'pt-0' : 'pt-16'}`}>
        {!isFullscreen && (
          <Sidebar
            categories={reportCategories}
            isOpen={isSidebarOpen}
            onReportSelect={handleReportSelect}
            activeReport={activeReport ? {
              categoryId: activeReport.categoryId,
              reportId: activeReport.reportId
            } : undefined}
          />
        )}

        {isSidebarOpen && !isFullscreen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        <main className={`flex-1 flex flex-col transition-all duration-300 ${isFullscreen ? 'min-h-screen' : 'min-h-[calc(100vh-4rem)]'}`}>
          {activeReport && !isFullscreen && (
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
