import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { 
  BarChart3, 
  Users, 
  ClipboardList, 
  Calendar,
  Train,
  LogOut,
  CheckCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

export default function AdminDashboard() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  useEffect(() => {
    if (!isLoading && (!user || (user as any).role !== 'admin')) {
      toast({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      setLocation("/");
    }
  }, [user, isLoading, toast, setLocation]);

  const { data: inspections = [] } = useQuery({
    queryKey: ["/api/inspections"],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/assignments"],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  if (isLoading || !user || (user as any).role !== 'admin') {
    return <div>Loading...</div>;
  }

  const stats = {
    total: inspections?.length || 0,
    completed: inspections?.filter((i: any) => i.status === 'completed').length || 0,
    pending: inspections?.filter((i: any) => i.status === 'draft').length || 0,
    overdue: assignments?.filter((a: any) => 
      a.status === 'pending' && new Date(a.dueDate) < new Date()
    ).length || 0,
  };

  return (
    <div className="min-h-screen bg-nr-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-nr-blue rounded-lg flex items-center justify-center">
                <BarChart3 className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-nr-navy">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Inspection Management & Tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setLocation("/inspection")}
                className="bg-nr-blue hover:bg-blue-800"
              >
                <ClipboardList className="mr-2" size={20} />
                New Inspection
              </Button>
              <Button 
                onClick={handleLogout}
                variant="ghost"
                size="sm"
                className="text-gray-500 hover:text-gray-700"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClipboardList className="text-nr-blue" size={24} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Inspections</p>
                  <p className="text-2xl font-bold text-nr-navy">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="text-nr-success" size={24} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-nr-success">{stats.completed}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Clock className="text-nr-orange" size={24} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-nr-orange">{stats.pending}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="text-red-600" size={24} />
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button className="bg-nr-blue hover:bg-blue-800 p-4 h-auto flex items-center justify-center">
                <Users className="mr-3" size={24} />
                Assign Inspection
              </Button>
              <Button className="bg-nr-success hover:bg-green-700 p-4 h-auto flex items-center justify-center">
                <BarChart3 className="mr-3" size={24} />
                View Reports
              </Button>
              <Button className="bg-nr-orange hover:bg-orange-600 p-4 h-auto flex items-center justify-center">
                <Calendar className="mr-3" size={24} />
                Export Data
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Inspections */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 text-nr-blue" size={20} />
              Recent Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {inspections && inspections.length > 0 ? (
              <div className="space-y-4">
                {inspections.slice(0, 10).map((inspection: any) => (
                  <div key={inspection.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-nr-navy">{inspection.subject}</h4>
                      <p className="text-sm text-gray-600">
                        {inspection.stationCode} • {inspection.area} • {new Date(inspection.inspectionDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      inspection.status === 'completed' ? 'bg-green-100 text-green-800' :
                      inspection.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {inspection.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClipboardList className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">No inspections yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assignment Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 text-nr-blue" size={20} />
              Assignment Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assignments && assignments.length > 0 ? (
              <div className="space-y-4">
                {assignments.slice(0, 5).map((assignment: any) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div>
                      <h4 className="font-medium text-nr-navy">
                        {assignment.area} inspection at {assignment.stationCode}
                      </h4>
                      <p className="text-sm text-gray-600">
                        Due: {new Date(assignment.dueDate).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 text-xs rounded-full ${
                      assignment.status === 'completed' ? 'bg-green-100 text-green-800' :
                      assignment.status === 'pending' && new Date(assignment.dueDate) < new Date() ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {assignment.status === 'pending' && new Date(assignment.dueDate) < new Date() ? 'overdue' : assignment.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-500">No assignments yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
