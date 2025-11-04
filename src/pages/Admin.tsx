import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useReportPermissions } from '@/hooks/useReportPermissions';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import { reportService } from '@/services/reportService';
import { authService } from '@/services/authService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Admin: React.FC = () => {
  const { catalog, refreshCatalog } = useReportPermissions();
  const { token } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [newCategory, setNewCategory] = useState<string>('');
  const [reportName, setReportName] = useState<string>('');
  const [reportId, setReportId] = useState<string>('');
  const [reportUrl, setReportUrl] = useState<string>('');
  const [reportIcon, setReportIcon] = useState<string>('');
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState<string>('');

  useEffect(() => {
    const fetchAdmins = async () => {
      if (token) {
        try {
          const adminList = await authService.getAdmins(token);
          setAdmins(adminList);
        } catch (error) {
          console.error("Failed to fetch admins", error);
        }
      }
    };
    fetchAdmins();
  }, [token]);

  const handleAddReport = async () => {
    if (!token) {
      toast({ title: "Error", description: "You must be logged in to add a report.", variant: "destructive" });
      return;
    }
    try {
      const response = await reportService.addReport({ categoryId: selectedCategory, newCategory, reportName, reportId, reportUrl, reportIcon }, token);
      if (response.message) {
        toast({ title: "Success", description: "Report added successfully." });
        setSelectedCategory('');
        setNewCategory('');
        setReportName('');
        setReportId('');
        setReportUrl('');
        setReportIcon('');
        refreshCatalog();
      } else {
        throw new Error(response.error || "An unknown error occurred.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add report.", variant: "destructive" });
    }
  };

  const handleDeleteReport = async (categoryId: string, reportId: string) => {
    if (!token) {
      toast({ title: "Error", description: "You must be logged in to delete a report.", variant: "destructive" });
      return;
    }
    try {
      const response = await reportService.deleteReport(categoryId, reportId, token);
      if (response.message) {
        toast({ title: "Success", description: "Report deleted successfully." });
        refreshCatalog();
      } else {
        throw new Error(response.error || "An unknown error occurred.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete report.", variant: "destructive" });
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!token) {
      toast({ title: "Error", description: "You must be logged in to delete a category.", variant: "destructive" });
      return;
    }
    try {
      const response = await reportService.deleteCategory(categoryId, token);
      if (response.message) {
        toast({ title: "Success", description: "Category deleted successfully." });
        refreshCatalog();
      } else {
        throw new Error(response.error || "An unknown error occurred.");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete category.", variant: "destructive" });
    }
  };

  const handleAddAdmin = async () => {
    if (token && newAdmin) {
      try {
        await authService.addAdmin(newAdmin, token);
        setAdmins([...admins, newAdmin]);
        setNewAdmin('');
        toast({ title: "Success", description: "Admin added successfully." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to add admin.", variant: "destructive" });
      }
    }
  };

  const handleRemoveAdmin = async (adminToRemove: string) => {
    if (token) {
      try {
        await authService.removeAdmin(adminToRemove, token);
        setAdmins(admins.filter(admin => admin !== adminToRemove));
        toast({ title: "Success", description: "Admin removed successfully." });
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "Failed to remove admin.", variant: "destructive" });
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <Tabs defaultValue="reports">
        <TabsList>
          <TabsTrigger value="reports">Manage Reports</TabsTrigger>
          <TabsTrigger value="admins">Manage Admins</TabsTrigger>
        </TabsList>
        <TabsContent value="reports">
          <Card className="max-w-2xl mx-auto mt-4">
            <CardHeader>
              <CardTitle>Add New Report</CardTitle>
              <CardDescription>Add a new report to the catalog.</CardDescription>
            </CardHeader>
            <CardContent>
              <form>
                <div className="grid w-full items-center gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={setSelectedCategory} value={selectedCategory}>
                      <SelectTrigger id="category"><SelectValue placeholder="Select a category" /></SelectTrigger>
                      <SelectContent position="popper">
                        {catalog.map((category) => (
                          <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                        ))}
                        <SelectItem value="new">Create a new category</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {selectedCategory === 'new' && (
                    <div className="flex flex-col space-y-1.5">
                      <Label htmlFor="new-category">New Category Name</Label>
                      <Input id="new-category" placeholder="Enter new category name" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} />
                    </div>
                  )}
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="report-name">Report Name</Label>
                    <Input id="report-name" placeholder="Enter report name" value={reportName} onChange={(e) => setReportName(e.target.value)} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="report-id">Report ID</Label>
                    <Input id="report-id" placeholder="Enter report ID" value={reportId} onChange={(e) => setReportId(e.target.value)} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="report-url">Report URL</Label>
                    <Input id="report-url" placeholder="Enter report URL" value={reportUrl} onChange={(e) => setReportUrl(e.target.value)} />
                  </div>
                  <div className="flex flex-col space-y-1.5">
                    <Label htmlFor="report-icon">Report Icon</Label>
                    <Input id="report-icon" placeholder="Enter icon name (e.g., BarChart3)" value={reportIcon} onChange={(e) => setReportIcon(e.target.value)} />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="flex justify-end">
              <Button onClick={handleAddReport}>Add Report</Button>
            </CardFooter>
          </Card>
          <Card className="max-w-2xl mx-auto mt-4">
            <CardHeader>
              <CardTitle>Existing Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {catalog.map(category => (
                <div key={category.id} className="mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{category.name}</h3>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCategory(category.id)}>Delete Category</Button>
                  </div>
                  <ul className="list-disc pl-5 mt-2">
                    {category.reports.map(report => (
                      <li key={report.id} className="flex justify-between items-center">
                        {report.name}
                        <Button variant="destructive" size="sm" onClick={() => handleDeleteReport(category.id, report.id)}>Delete Report</Button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="admins">
          <Card className="max-w-2xl mx-auto mt-4">
            <CardHeader>
              <CardTitle>Manage Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="new-admin">Add New Admin</Label>
                <div className="flex space-x-2">
                  <Input id="new-admin" placeholder="Enter username" value={newAdmin} onChange={(e) => setNewAdmin(e.target.value)} />
                  <Button onClick={handleAddAdmin}>Add Admin</Button>
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-semibold">Current Admins</h3>
                <ul className="list-disc pl-5 mt-2">
                  {admins.map(admin => (
                    <li key={admin} className="flex justify-between items-center">
                      {admin}
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveAdmin(admin)}>Remove</Button>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
