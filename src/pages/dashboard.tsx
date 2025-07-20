import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/context/auth-context";
import { useRepair } from "@/lib/context/repair-context";
import { RepairFilters } from "@/components/repair/repair-filters";
import { RepairStatus } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const { repairs, filterRepairs, technicians, totalSales } = useRepair();
  const [filteredRepairs, setFilteredRepairs] = useState(repairs);

  useEffect(() => {
    setFilteredRepairs(repairs);
  }, [repairs]);

  const handleFilter = (filters: { workWeek?: string; technicianInCharge?: string; date?: string }) => {
    setFilteredRepairs(filterRepairs(filters));
  };

  // Calculate stats for the dashboard
  const processingCount = filteredRepairs.filter(r => r.repairStatus === "Processing").length;
  const monitoringCount = filteredRepairs.filter(r => r.repairStatus === "Monitoring").length;
  const unitOkCount = filteredRepairs.filter(r => r.repairStatus === "Unit OK").length;
  const rtoCount = filteredRepairs.filter(r => r.repairStatus === "RTO").length;

  // Count repairs by technician
  const repairsByTechnician: Record<string, number> = {};
  technicians.forEach(tech => {
    repairsByTechnician[tech] = filteredRepairs.filter(r => r.technicianInCharge === tech).length;
  });

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}!
          </p>
        </div>
      </div>

      <RepairFilters onFilter={handleFilter} />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Repairs
            </CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRepairs.length}</div>
            <p className="text-xs text-muted-foreground">
              Records in current view
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{processingCount}</div>
            <p className="text-xs text-muted-foreground">
              Units currently processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unit OK</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <rect width="20" height="14" x="2" y="5" rx="2" />
              <path d="M2 10h20" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unitOkCount}</div>
            <p className="text-xs text-muted-foreground">
              Completed repairs
            </p>
          </CardContent>
        </Card>

        {(user?.role === "admin" || user?.role === "csr") && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Sales
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(totalSales)}
              </div>
              <p className="text-xs text-muted-foreground">
                Based on repair costs
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Repairs by Status</CardTitle>
            <CardDescription>Current distribution of repair statuses</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-full">
                  <div className="text-sm font-medium">Processing</div>
                  <div className="h-2 mt-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full" 
                      style={{ 
                        width: `${filteredRepairs.length ? (processingCount / filteredRepairs.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{processingCount} repairs</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full">
                  <div className="text-sm font-medium">Monitoring</div>
                  <div className="h-2 mt-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-yellow-500 rounded-full" 
                      style={{ 
                        width: `${filteredRepairs.length ? (monitoringCount / filteredRepairs.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{monitoringCount} repairs</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full">
                  <div className="text-sm font-medium">Unit OK</div>
                  <div className="h-2 mt-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-green-500 rounded-full" 
                      style={{ 
                        width: `${filteredRepairs.length ? (unitOkCount / filteredRepairs.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{unitOkCount} repairs</div>
                </div>
              </div>
              <div className="flex items-center">
                <div className="w-full">
                  <div className="text-sm font-medium">RTO</div>
                  <div className="h-2 mt-2 rounded-full bg-gray-100 overflow-hidden">
                    <div 
                      className="h-full bg-red-500 rounded-full" 
                      style={{ 
                        width: `${filteredRepairs.length ? (rtoCount / filteredRepairs.length) * 100 : 0}%` 
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{rtoCount} repairs</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Repairs by Technician</CardTitle>
            <CardDescription>Distribution of repairs by technician</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="space-y-4">
              {technicians.map((tech) => (
                <div key={tech} className="flex items-center">
                  <div className="w-full">
                    <div className="text-sm font-medium">{tech}</div>
                    <div className="h-2 mt-2 rounded-full bg-gray-100 overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full" 
                        style={{ 
                          width: `${filteredRepairs.length ? (repairsByTechnician[tech] / filteredRepairs.length) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">{repairsByTechnician[tech]} repairs</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}