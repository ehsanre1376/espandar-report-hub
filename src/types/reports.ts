/**
 * HOW TO ADD NEW REPORTS AND CATEGORIES:
 * 
 * 1. To add a new category, copy this template and add to reportCategories array:
 *    {
 *      id: "your-category-id",
 *      name: "Your Category Name",
 *      icon: "BarChart3",  // lucide-react icon name
 *      reports: []
 *    }
 * 
 * 2. To add a new report to a category, copy this template and add to reports array:
 *    {
 *      id: "your-report-id",
 *      name: "Your Report Name",
 *      icon: "FileText",  // optional lucide-react icon name
 *      url: "http://ecic-bi/Reports/powerbi/Category/Report_Name?rs:embed=true"
 *    }
 * 
 * Available icons: BarChart3, TrendingUp, Users, Package, FileText, DollarSign, 
 *                  ShoppingCart, Calendar, PieChart, Activity, etc.
 * See all icons at: https://lucide.dev/icons/
 */

export interface Report {
  id: string;
  name: string;
  icon?: string;  // lucide-react icon name (optional)
  url: string;
}

export interface ReportCategory {
  id: string;
  name: string;
  icon: string;  // lucide-react icon name
  reports: Report[];
}

// =============================================================================
// SIMPLE CONFIG: Just add lines below to add new categories and reports!
// =============================================================================

export const reportCategories: ReportCategory[] = [
  {
    id: "financial",
    name: "Financial",
    icon: "BarChart3",
    reports: [
      { id: "aacc-monthly", name: "AACC Monthly Report", icon: "FileText", url: "http://ecic-bi/Reports/powerbi/Financial/AACC_Monthly_Report?rs:embed=true" },
      { id: "cash-flow", name: "Cash Flow Statement", icon: "TrendingUp", url: "http://ecic-bi/Reports/powerbi/Financial/Cash_Flow_Statement?rs:embed=true" },
      { id: "budget-analysis", name: "Budget Analysis", icon: "PieChart", url: "http://ecic-bi/Reports/powerbi/Financial/Budget_Analysis?rs:embed=true" },
      { id: "expense-tracking", name: "Expense Tracking", icon: "DollarSign", url: "http://ecic-bi/Reports/powerbi/Financial/Expense_Tracking?rs:embed=true" },
      { id: "financial-overview", name: "Financial Overview", icon: "Activity", url: "http://ecic-bi/Reports/powerbi/Financial/Financial_Overview?rs:embed=true" }
    ]
  },
  {
    id: "sales",
    name: "Sales",
    icon: "TrendingUp",
    reports: [
      { id: "monthly-sales", name: "Monthly Sales Summary", icon: "Calendar", url: "http://ecic-bi/Reports/powerbi/Sales/Monthly_Sales_Summary?rs:embed=true" },
      { id: "regional-performance", name: "Regional Performance", icon: "MapPin", url: "http://ecic-bi/Reports/powerbi/Sales/Regional_Performance?rs:embed=true" },
      { id: "sales-forecast", name: "Sales Forecast", icon: "TrendingUp", url: "http://ecic-bi/Reports/powerbi/Sales/Sales_Forecast?rs:embed=true" },
      { id: "customer-analytics", name: "Customer Analytics", icon: "Users", url: "http://ecic-bi/Reports/powerbi/Sales/Customer_Analytics?rs:embed=true" }
    ]
  },
  {
    id: "hr",
    name: "HR",
    icon: "Users",
    reports: [
      { id: "employee-dashboard", name: "Employee Dashboard", icon: "LayoutDashboard", url: "http://ecic-bi/Reports/powerbi/HR/Employee_Dashboard?rs:embed=true" },
      { id: "payroll-report", name: "Payroll Report", icon: "Wallet", url: "http://ecic-bi/Reports/powerbi/HR/Payroll_Report?rs:embed=true" },
      { id: "attendance-tracking", name: "Attendance Tracking", icon: "Clock", url: "http://ecic-bi/Reports/powerbi/HR/Attendance_Tracking?rs:embed=true" },
      { id: "performance-review", name: "Performance Review", icon: "Star", url: "http://ecic-bi/Reports/powerbi/HR/Performance_Review?rs:embed=true" }
    ]
  },
  {
    id: "inventory",
    name: "Inventory",
    icon: "Package",
    reports: [
      { id: "stock-levels", name: "Stock Levels", icon: "Boxes", url: "http://ecic-bi/Reports/powerbi/Inventory/Stock_Levels?rs:embed=true" },
      { id: "movement-analysis", name: "Movement Analysis", icon: "ArrowRightLeft", url: "http://ecic-bi/Reports/powerbi/Inventory/Movement_Analysis?rs:embed=true" },
      { id: "warehouse-overview", name: "Warehouse Overview", icon: "Warehouse", url: "http://ecic-bi/Reports/powerbi/Inventory/Warehouse_Overview?rs:embed=true" },
      { id: "reorder-alerts", name: "Reorder Alerts", icon: "AlertTriangle", url: "http://ecic-bi/Reports/powerbi/Inventory/Reorder_Alerts?rs:embed=true" }
    ]
  }
];
