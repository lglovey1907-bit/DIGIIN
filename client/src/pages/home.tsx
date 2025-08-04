import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { 
  ClipboardList, 
  BarChart3, 
  Users, 
  Calendar,
  Train,
  LogOut
} from "lucide-react";

export default function Home() {
  const { user } = useAuth();
  
  const { data: inspections = [] } = useQuery({
    queryKey: ["/api/inspections"],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ["/api/assignments"],
  });

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-nr-bg">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-nr-blue rounded-lg flex items-center justify-center">
                <Train className="text-white" size={24} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-nr-navy">Northern Railway Delhi Division</h1>
                <p className="text-sm text-gray-600">Digital Inspection Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {(user as any)?.firstName || (user as any)?.email}
              </span>
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-nr-navy mb-2">Dashboard</h2>
          <p className="text-gray-600">Manage your inspections and track performance</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/inspection">
            <Card className="cursor-pointer hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-nr-blue rounded-lg flex items-center justify-center mr-4">
                    <ClipboardList className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-nr-navy">New Inspection</h3>
                    <p className="text-sm text-gray-600">Start inspection</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          {(user as any)?.role === 'admin' && (
            <Link href="/admin">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-nr-success rounded-lg flex items-center justify-center mr-4">
                      <BarChart3 className="text-white" size={24} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-nr-navy">Admin Dashboard</h3>
                      <p className="text-sm text-gray-600">Manage assignments</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-nr-orange rounded-lg flex items-center justify-center mr-4">
                  <Users className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-nr-navy">My Inspections</h3>
                  <p className="text-sm text-gray-600">{inspections?.length || 0} total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <Calendar className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-nr-navy">Assignments</h3>
                  <p className="text-sm text-gray-600">{assignments?.length || 0} pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Inspections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-2 text-nr-blue" size={20} />
              Recent Inspections
            </CardTitle>
          </CardHeader>
          <CardContent>
            {Array.isArray(inspections) && inspections.length > 0 ? (
              <div className="space-y-4">
                {inspections.slice(0, 5).map((inspection: any) => (
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
                <Link href="/inspection">
                  <Button className="mt-4 bg-nr-blue hover:bg-blue-800">
                    Start Your First Inspection
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
