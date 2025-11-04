import { useState, useEffect } from "react";
import { ReportCategory, Report } from "@/types/reports";
import { reportService } from "@/services/reportService";
import { reportCatalogService } from "@/services/reportCatalogService";

interface FilteredCategory extends ReportCategory {
  reports: Report[];
}

/**
 * Hook to filter reports and categories based on user permissions
 */
export const useReportPermissions = () => {
  const [filteredCategories, setFilteredCategories] = useState<FilteredCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionMap, setPermissionMap] = useState<Map<string, boolean>>(new Map());
  const [catalog, setCatalog] = useState<ReportCategory[]>([]);

  useEffect(() => {
    const checkPermissions = async () => {
      setIsLoading(true);
      
      try {
        // Load catalog from backend so non-devs can edit JSON
        const categories = await reportCatalogService.fetchCatalog();
        setCatalog(categories as ReportCategory[]);

        // Collect all reports from all categories
        const allReports: Array<{ id: string; url: string }> = [];
        categories.forEach(category => {
          category.reports.forEach(report => {
            allReports.push({ id: report.id, url: report.url });
          });
        });

        // Check permissions for all reports (default-deny)
        const permissions = await reportService.checkReportPermissions(allReports);
        setPermissionMap(permissions);

        // Filter categories and reports based on permissions
        const filtered: FilteredCategory[] = categories
          .map(category => ({
            ...category,
            reports: category.reports.filter(report => 
              permissions.get(report.id) === true
            ),
          }))
          .filter(category => category.reports.length > 0); // Remove empty categories

        setFilteredCategories(filtered);
      } catch (error) {
        console.error("Error checking report permissions:", error);
        // Default-deny on error
        setFilteredCategories([]);
      } finally {
        setIsLoading(false);
      }
    };

    checkPermissions();
  }, []);

  return {
    filteredCategories,
    isLoading,
    permissionMap,
    hasPermission: (reportId: string) => permissionMap.get(reportId) === true,
    catalog,
  };
};

