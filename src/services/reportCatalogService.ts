const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  `${window.location.protocol}//${window.location.hostname}:3000/api`;

export interface CatalogReport {
  id: string;
  name: string;
  icon?: string;
  url: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  icon: string;
  reports: CatalogReport[];
}

export interface ReportCatalogResponse {
  categories: CatalogCategory[];
}

export const reportCatalogService = {
  async fetchCatalog(): Promise<CatalogCategory[]> {
    const response = await fetch(`${API_BASE_URL}/reports/catalog`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to load catalog (${response.status})`);
    }

    const data: ReportCatalogResponse = await response.json();
    return data.categories || [];
  }
};


