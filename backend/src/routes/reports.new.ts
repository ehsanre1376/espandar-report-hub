import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { adminOnly } from '../middleware/adminOnly';

const router = Router();
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

interface Report {
  id: string;
  name: string;
  url: string;
  icon: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  reports: Report[];
}

interface Catalog {
  categories: Category[];
}

const getCatalogPath = () => path.join(__dirname, '..', 'config', 'reports.config.json');

// Helper function to read and parse the catalog
const readCatalog = async (): Promise<Catalog> => {
  try {
    const catalogPath = getCatalogPath();
    console.log('Reading catalog from:', catalogPath);
    const data = await readFileAsync(catalogPath, 'utf-8');
    const catalog = JSON.parse(data);
    
    if (!catalog.categories) {
      catalog.categories = [];
    }
    
    return catalog;
  } catch (error) {
    console.error('Error reading catalog:', error);
    throw new Error('Could not read reports catalog');
  }
};

// Helper function to write the catalog
const writeCatalog = async (catalog: Catalog): Promise<void> => {
  try {
    const catalogPath = getCatalogPath();
    console.log('Writing catalog to:', catalogPath);
    console.log('Catalog content:', JSON.stringify(catalog, null, 2));
    await writeFileAsync(catalogPath, JSON.stringify(catalog, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing catalog:', error);
    throw new Error('Could not write reports catalog');
  }
};

/**
 * GET /api/reports/catalog
 * Get the full reports catalog
 */
router.get('/catalog', async (req: Request, res: Response) => {
  try {
    const catalog = await readCatalog();
    res.json(catalog.categories);
  } catch (error) {
    console.error('Error getting catalog:', error);
    res.status(500).json({ error: 'Could not retrieve reports catalog' });
  }
});

/**
 * POST /api/reports/add
 * Add a new report to a category
 */
router.post('/add', adminOnly, async (req: Request, res: Response) => {
  try {
    console.log('Add report request received:', req.body);
    const { categoryId, newCategory, reportName, reportId, reportUrl, reportIcon } = req.body;

    if (!reportName || !reportId || !reportUrl) {
      return res.status(400).json({ error: 'Missing required report fields' });
    }

    const catalog = await readCatalog();

    // Handle new category creation
    if (categoryId === 'new') {
      if (!newCategory) {
        return res.status(400).json({ error: 'New category name is required' });
      }

      const newCategoryId = newCategory.toLowerCase().replace(/\s+/g, '-');
      const category: Category = {
        id: newCategoryId,
        name: newCategory,
        icon: 'Folder',
        reports: [],
      };

      console.log('Creating new category:', category);
      catalog.categories.push(category);
    }

    // Find target category
    const targetCategory = catalog.categories.find(cat => 
      categoryId === 'new' ? cat.id === newCategory.toLowerCase().replace(/\s+/g, '-') : cat.id === categoryId
    );

    if (!targetCategory) {
      return res.status(400).json({ error: 'Category not found' });
    }

    // Add new report
    const newReport: Report = {
      id: reportId,
      name: reportName,
      url: reportUrl,
      icon: reportIcon || 'FileText',
    };

    console.log('Adding report to category:', targetCategory.name, newReport);
    targetCategory.reports.push(newReport);

    // Save changes
    await writeCatalog(catalog);
    console.log('Report added successfully');
    res.status(201).json({ message: 'Report added successfully' });

  } catch (error) {
    console.error('Error adding report:', error);
    res.status(500).json({ error: 'Could not add report' });
  }
});

/**
 * DELETE /api/reports/:categoryId/:reportId
 * Delete a report from a category
 */
router.delete('/:categoryId/:reportId', adminOnly, async (req: Request, res: Response) => {
  try {
    console.log('Delete report request received:', req.params);
    const { categoryId, reportId } = req.params;

    const catalog = await readCatalog();
    
    const categoryIndex = catalog.categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const reportIndex = catalog.categories[categoryIndex].reports.findIndex(rep => rep.id === reportId);
    if (reportIndex === -1) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Remove report
    catalog.categories[categoryIndex].reports.splice(reportIndex, 1);
    console.log(`Deleted report ${reportId} from category ${categoryId}`);

    // Save changes
    await writeCatalog(catalog);
    res.json({ message: 'Report deleted successfully' });

  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ error: 'Could not delete report' });
  }
});

/**
 * DELETE /api/reports/:categoryId
 * Delete an entire category
 */
router.delete('/:categoryId', adminOnly, async (req: Request, res: Response) => {
  try {
    console.log('Delete category request received:', req.params);
    const { categoryId } = req.params;

    const catalog = await readCatalog();
    
    const categoryIndex = catalog.categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Remove category
    catalog.categories.splice(categoryIndex, 1);
    console.log(`Deleted category ${categoryId}`);

    // Save changes
    await writeCatalog(catalog);
    res.json({ message: 'Category deleted successfully' });

  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Could not delete category' });
  }
});

export default router;