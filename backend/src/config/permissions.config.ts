/**
 * Map AD groups to allowed report IDs.
 * Report IDs must match `report.id` in the frontend `reportCategories`.
 */
export const permissionsConfig = {
  defaultDeny: true,
  ttlSeconds: parseInt(process.env.PERMISSIONS_TTL_SECONDS || '600', 10),
  groupToReportIds: new Map<string, string[]>([
    // Example mappings (update to your org):
    ["BI_Everyone", [
      "ECIC Performance Report",
    ]],
    ["BI_GMR_Viewers", [
      "EBSC Monthly Report",
      "ECIC Monthly Report",
      "ETCC Monthly Report",
      "ETSC Monthly Report",
    ]],
    ["BI_HR_Viewers", [
      "HR Personnel Report",
    ]],
    ["BI_Procurement_Viewers", [
      "ELCC Purchase Report",
    ]],
    ["BI_Sales_Viewers", [
      "IME Sales Report",
    ]],
  ]),
};


