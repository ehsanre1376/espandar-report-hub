export interface Report {
  id: string;
  name: string;
  url: string;
}

export interface ReportCategory {
  id: string;
  name: string;
  icon?: string;
  reports: Report[];
}

export const reportCategories: ReportCategory[] = [
  {
    id: "financial",
    name: "Financial",
    reports: [
      {
        id: "aacc-monthly",
        name: "AACC Monthly Report",
        url: "http://ecic-bi/Reports/powerbi/Financial/AACC_Monthly_Report?rs:embed=true"
      },
      {
        id: "cash-flow",
        name: "Cash Flow Statement",
        url: "http://ecic-bi/Reports/powerbi/Financial/Cash_Flow_Statement?rs:embed=true"
      },
      {
        id: "budget-analysis",
        name: "Budget Analysis",
        url: "http://ecic-bi/Reports/powerbi/Financial/Budget_Analysis?rs:embed=true"
      },
      {
        id: "expense-tracking",
        name: "Expense Tracking",
        url: "http://ecic-bi/Reports/powerbi/Financial/Expense_Tracking?rs:embed=true"
      },
      {
        id: "financial-overview",
        name: "Financial Overview",
        url: "http://ecic-bi/Reports/powerbi/Financial/Financial_Overview?rs:embed=true"
      }
    ]
  },
  {
    id: "sales",
    name: "Sales",
    reports: [
      {
        id: "monthly-sales",
        name: "Monthly Sales Summary",
        url: "http://ecic-bi/Reports/powerbi/Sales/Monthly_Sales_Summary?rs:embed=true"
      },
      {
        id: "regional-performance",
        name: "Regional Performance",
        url: "http://ecic-bi/Reports/powerbi/Sales/Regional_Performance?rs:embed=true"
      },
      {
        id: "sales-forecast",
        name: "Sales Forecast",
        url: "http://ecic-bi/Reports/powerbi/Sales/Sales_Forecast?rs:embed=true"
      },
      {
        id: "customer-analytics",
        name: "Customer Analytics",
        url: "http://ecic-bi/Reports/powerbi/Sales/Customer_Analytics?rs:embed=true"
      }
    ]
  },
  {
    id: "hr",
    name: "HR",
    reports: [
      {
        id: "employee-dashboard",
        name: "Employee Dashboard",
        url: "http://ecic-bi/Reports/powerbi/HR/Employee_Dashboard?rs:embed=true"
      },
      {
        id: "payroll-report",
        name: "Payroll Report",
        url: "http://ecic-bi/Reports/powerbi/HR/Payroll_Report?rs:embed=true"
      },
      {
        id: "attendance-tracking",
        name: "Attendance Tracking",
        url: "http://ecic-bi/Reports/powerbi/HR/Attendance_Tracking?rs:embed=true"
      },
      {
        id: "performance-review",
        name: "Performance Review",
        url: "http://ecic-bi/Reports/powerbi/HR/Performance_Review?rs:embed=true"
      }
    ]
  },
  {
    id: "inventory",
    name: "Inventory",
    reports: [
      {
        id: "stock-levels",
        name: "Stock Levels",
        url: "http://ecic-bi/Reports/powerbi/Inventory/Stock_Levels?rs:embed=true"
      },
      {
        id: "movement-analysis",
        name: "Movement Analysis",
        url: "http://ecic-bi/Reports/powerbi/Inventory/Movement_Analysis?rs:embed=true"
      },
      {
        id: "warehouse-overview",
        name: "Warehouse Overview",
        url: "http://ecic-bi/Reports/powerbi/Inventory/Warehouse_Overview?rs:embed=true"
      },
      {
        id: "reorder-alerts",
        name: "Reorder Alerts",
        url: "http://ecic-bi/Reports/powerbi/Inventory/Reorder_Alerts?rs:embed=true"
      }
    ]
  }
];
