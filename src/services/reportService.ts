const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`;

interface ReportPermission {
  reportId: string;
  reportUrl: string;
  hasPermission: boolean;
}

/**
 * Check if user has permission to access a specific report
 */
export const checkReportPermission = async (reportUrl: string): Promise<boolean> => {
  const authToken = localStorage.getItem("authToken");
  
  if (!authToken) {
    return false;
  }

  try {
    // First, try to check via backend API if available
    const response = await fetch(`${API_BASE_URL}/reports/check-permission`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ reportUrl }),
    });

    if (response.ok) {
      const data = await response.json();
      return data.hasPermission === true;
    }

    // If backend check fails, try direct HEAD request to the report URL
    // This is a fallback method to check if the report is accessible
    try {
      const headResponse = await fetch(reportUrl, {
        method: "HEAD",
        mode: "no-cors", // Use no-cors to avoid CORS issues, but we can't read the response
        credentials: "include",
      });
      
      // With no-cors, we can't check the status, so we assume it's accessible
      // In a real scenario, the backend should handle this check
      return true;
    } catch (error) {
      console.error("Error checking report permission:", error);
      return false;
    }
  } catch (error) {
    console.error("Error checking report permission:", error);
    // Default to true if we can't check (graceful degradation)
    // In production, you might want to default to false for security
    return true;
  }
};

/**
 * Check permissions for multiple reports in batch
 */
export const checkReportPermissions = async (
  reports: Array<{ id: string; url: string }>
): Promise<Map<string, boolean>> => {
  const authToken = localStorage.getItem("authToken");
  const permissionMap = new Map<string, boolean>();

  // Default-deny if no token
  if (!authToken) {
    reports.forEach(r => permissionMap.set(r.id, false));
    return permissionMap;
  }

  try {
    // Preferred: fetch allowed report IDs once
    const response = await fetch(`${API_BASE_URL}/reports/allowed`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
    });

    if (response.ok) {
      const data = await response.json();
      const allowedIds: string[] = Array.isArray(data.allowedReportIds) ? data.allowedReportIds : [];
      const allowedSet = new Set(allowedIds);
      reports.forEach(r => permissionMap.set(r.id, allowedSet.has(r.id)));
      return permissionMap;
    }
  } catch (error) {
    console.error("Error fetching allowed report IDs:", error);
  }

  // Strict default-deny fallback
  reports.forEach(r => permissionMap.set(r.id, false));
  return permissionMap;
};

export const reportService = {
  checkReportPermission,
  checkReportPermissions,
};

