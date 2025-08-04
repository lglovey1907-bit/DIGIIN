import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NorthernRailwayLogo } from "@/components/northern-railway-logo";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, 
  BarChart3, 
  Download, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  UserCheck,
  Settings,
  LogOut,
  Plus,
  Eye,
  TrendingUp
} from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface CMI {
  id: string;
  name: string;
  email: string;
  designation: string;
  stationSection: string;
  createdAt: string;
}

interface PendingUser {
  id: string;
  name: string;
  email: string;
  designation: string;
  stationSection: string;
  role: string;
  createdAt: string;
}

interface Assignment {
  id: string;
  cmiId: string;
  stationCode: string;
  area: string;
  dueDate: string;
  status: string;
}

interface Inspection {
  id: string;
  userId: string;
  subject: string;
  stationCode: string;
  area: string;
  status: string;
  inspectionDate: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCMI, setSelectedCMI] = useState<string | null>(null);

  const { data: cmis = [] } = useQuery<CMI[]>({
    queryKey: ["/api/admin/cmis"],
  });

  const { data: pendingUsers = [] } = useQuery<PendingUser[]>({
    queryKey: ["/api/admin/pending-users"],
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: inspections = [] } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections"],
  });

  const approveUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/admin/approve-user/${userId}`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to approve user');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pending-users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/cmis"] });
      toast({
        title: "User Approved",
        description: "User has been approved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to approve user.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const handleDownloadPDF = async (inspectionId: string) => {
    try {
      const response = await fetch(`/api/inspections/${inspectionId}/export-pdf`, {
        method: 'GET',
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to download PDF');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `inspection-${inspectionId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Error",
        description: "Failed to download PDF.",
        variant: "destructive",
      });
    }
  };

  // Calculate statistics
  const totalAssignments = assignments.length;
  const completedInspections = inspections.filter(i => i.status === 'completed').length;
  const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
  const overdueAssignments = assignments.filter(a => 
    a.status === 'overdue' || (a.status === 'pending' && new Date(a.dueDate) < new Date())
  ).length;

  // CMI performance data
  const cmiPerformance = cmis.map(cmi => {
    const cmiAssignments = assignments.filter(a => a.cmiId === cmi.id);
    const cmiInspections = inspections.filter(i => i.userId === cmi.id);
    const completed = cmiInspections.filter(i => i.status === 'completed').length;
    
    return {
      ...cmi,
      totalAssigned: cmiAssignments.length,
      completed,
      pending: cmiAssignments.length - completed,
      completionRate: cmiAssignments.length > 0 ? Math.round((completed / cmiAssignments.length) * 100) : 0,
    };
  });

  return (
    <div className="min-h-screen bg-nr-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <NorthernRailwayLogo size={48} />
              <div>
                <h1 className="text-xl font-bold text-nr-navy">Administrator Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                onClick={handleLogout}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <LogOut size={20} />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-nr-blue rounded-lg flex items-center justify-center mr-4">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-nr-navy">Total CMIs</h3>
                  <p className="text-2xl font-bold text-nr-blue">{cmis.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                  <CheckCircle className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-nr-navy">Completed</h3>
                  <p className="text-2xl font-bold text-green-600">{completedInspections}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-nr-navy">Pending</h3>
                  <p className="text-2xl font-bold text-blue-600">{pendingAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center mr-4">
                  <AlertTriangle className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-nr-navy">Overdue</h3>
                  <p className="text-2xl font-bold text-red-600">{overdueAssignments}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cmis">CMI Management</TabsTrigger>
            <TabsTrigger value="approvals">User Approvals</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* CMI Performance Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="mr-2 text-nr-blue" size={20} />
                    CMI Performance Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cmiPerformance.slice(0, 5).map((cmi) => (
                      <div key={cmi.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-nr-navy">{cmi.name}</p>
                          <p className="text-sm text-gray-600">{cmi.stationSection}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-nr-blue">{cmi.completionRate}%</p>
                          <p className="text-xs text-gray-600">{cmi.completed}/{cmi.totalAssigned}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Inspections</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {inspections.slice(0, 5).map((inspection) => (
                      <div key={inspection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-nr-navy">{inspection.subject}</p>
                          <p className="text-sm text-gray-600">
                            {inspection.stationCode} • {inspection.area}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => handleDownloadPDF(inspection.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Download size={14} />
                          </Button>
                          <Badge variant={inspection.status === 'completed' ? 'default' : 'secondary'}>
                            {inspection.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CMI Management Tab */}
          <TabsContent value="cmis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="mr-2 text-nr-blue" size={20} />
                    CMI Management
                  </span>
                  <Link href="/register">
                    <Button className="bg-nr-blue hover:bg-blue-800">
                      <Plus size={16} className="mr-2" />
                      Add CMI
                    </Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cmiPerformance.map((cmi) => (
                    <div key={cmi.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-nr-navy">{cmi.name}</h3>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline">{cmi.completionRate}% Complete</Badge>
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {cmi.designation} • {cmi.stationSection} • {cmi.email}
                          </p>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="text-green-600">
                              <CheckCircle size={16} className="inline mr-1" />
                              {cmi.completed} Completed
                            </span>
                            <span className="text-blue-600">
                              <Clock size={16} className="inline mr-1" />
                              {cmi.pending} Pending
                            </span>
                            <span className="text-gray-600">
                              Total: {cmi.totalAssigned}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            onClick={() => setSelectedCMI(selectedCMI === cmi.id ? null : cmi.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Eye size={16} />
                          </Button>
                        </div>
                      </div>
                      
                      {selectedCMI === cmi.id && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="font-medium mb-3">Recent Inspections</h4>
                          <div className="space-y-2">
                            {inspections
                              .filter(i => i.userId === cmi.id)
                              .slice(0, 3)
                              .map((inspection) => (
                                <div key={inspection.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div>
                                    <p className="text-sm font-medium">{inspection.subject}</p>
                                    <p className="text-xs text-gray-600">
                                      {inspection.stationCode} • {new Date(inspection.inspectionDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                  <Button
                                    onClick={() => handleDownloadPDF(inspection.id)}
                                    size="sm"
                                    variant="ghost"
                                  >
                                    <Download size={14} />
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Approvals Tab */}
          <TabsContent value="approvals" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <UserCheck className="mr-2 text-nr-blue" size={20} />
                  Pending User Approvals ({pendingUsers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {pendingUsers.length > 0 ? (
                  <div className="space-y-4">
                    {pendingUsers.map((user) => (
                      <div key={user.id} className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-nr-navy">{user.name}</h3>
                            <p className="text-sm text-gray-600 mb-1">
                              {user.designation} • {user.stationSection}
                            </p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <div className="mt-2">
                              <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                {user.role.toUpperCase()}
                              </Badge>
                              <span className="text-xs text-gray-500 ml-2">
                                Requested: {new Date(user.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <Button
                            onClick={() => approveUserMutation.mutate(user.id)}
                            disabled={approveUserMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck size={16} className="mr-2" />
                            {approveUserMutation.isPending ? 'Approving...' : 'Approve'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="mx-auto text-gray-400 mb-4" size={48} />
                    <p className="text-gray-500">No pending approvals</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 text-nr-blue" size={20} />
                  System Reports & Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-nr-navy">Performance Summary</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total CMIs:</span>
                        <span className="font-medium">{cmis.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Inspections:</span>
                        <span className="font-medium">{inspections.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Completion Rate:</span>
                        <span className="font-medium text-green-600">
                          {totalAssignments > 0 ? Math.round((completedInspections / totalAssignments) * 100) : 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pending Approvals:</span>
                        <span className="font-medium text-yellow-600">{pendingUsers.length}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-semibold text-nr-navy">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button className="w-full justify-start" variant="outline">
                        <Download size={16} className="mr-2" />
                        Export All Reports
                      </Button>
                      <Button className="w-full justify-start" variant="outline">
                        <BarChart3 size={16} className="mr-2" />
                        Generate Analytics
                      </Button>
                      <Link href="/register">
                        <Button className="w-full justify-start bg-nr-blue hover:bg-blue-800">
                          <Plus size={16} className="mr-2" />
                          Add New CMI
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}