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
    const candidates = ['reports.catalog.json', '/reports.catalog.json'];
    let lastError: any = null;
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'no-cache' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: ReportCatalogResponse = await res.json();
        return data.categories || [];
      } catch (err) {
        lastError = err;
        // try next candidate
      }
    }
    console.error('Failed to load report catalog:', lastError);
    return [];
  }
};
