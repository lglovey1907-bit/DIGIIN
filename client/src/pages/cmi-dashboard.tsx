import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NorthernRailwayLogo } from "@/components/northern-railway-logo";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Download, Clock, CheckCircle, AlertTriangle, Plus, LogOut } from "lucide-react";
import { Link } from "wouter";

interface Assignment {
  id: string;
  stationCode: string;
  area: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'overdue';
  createdAt: string;
}

interface Inspection {
  id: string;
  subject: string;
  stationCode: string;
  area: string;
  inspectionDate: string;
  status: string;
}

export default function CMIDashboard() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/assignments"],
  });

  const { data: inspections = [] } = useQuery<Inspection[]>({
    queryKey: ["/api/inspections"],
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
      alert('Failed to download PDF. Please try again.');
    }
  };

  // Filter assignments by status
  const upcomingAssignments = assignments.filter(a => a.status === 'pending' && new Date(a.dueDate) > new Date());
  const overdueAssignments = assignments.filter(a => a.status === 'overdue' || (a.status === 'pending' && new Date(a.dueDate) < new Date()));
  const completedAssignments = assignments.filter(a => a.status === 'completed');

  // Get assignments for selected date (basic calendar functionality)
  const selectedDateAssignments = assignments.filter(a => {
    const assignmentDate = new Date(a.dueDate);
    return assignmentDate.toDateString() === selectedDate.toDateString();
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
                <h1 className="text-xl font-bold text-nr-navy">CMI Dashboard</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.name || 'CMI User'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/inspection">
                <Button className="bg-nr-blue hover:bg-blue-800">
                  <Plus size={16} className="mr-2" />
                  New Inspection
                </Button>
              </Link>
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
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <Clock className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-nr-navy">Upcoming</h3>
                  <p className="text-2xl font-bold text-nr-blue">{upcomingAssignments.length}</p>
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
                  <p className="text-2xl font-bold text-red-600">{overdueAssignments.length}</p>
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
                  <p className="text-2xl font-bold text-green-600">{completedAssignments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-nr-blue rounded-lg flex items-center justify-center mr-4">
                  <Download className="text-white" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-nr-navy">Reports</h3>
                  <p className="text-2xl font-bold text-nr-blue">{inspections.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar View - Simplified */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="mr-2 text-nr-blue" size={20} />
                Inspection Calendar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Date
                  </label>
                  <input
                    type="date"
                    value={selectedDate.toISOString().split('T')[0]}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-nr-blue"
                  />
                </div>
                
                <div>
                  <h4 className="font-medium text-nr-navy mb-2">
                    Assignments for {selectedDate.toLocaleDateString()}
                  </h4>
                  {selectedDateAssignments.length > 0 ? (
                    <div className="space-y-2">
                      {selectedDateAssignments.map((assignment) => (
                        <div key={assignment.id} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{assignment.stationCode}</p>
                              <p className="text-sm text-gray-600">{assignment.area}</p>
                            </div>
                            <Badge
                              variant={
                                assignment.status === 'completed' ? 'default' :
                                assignment.status === 'overdue' ? 'destructive' : 'secondary'
                              }
                            >
                              {assignment.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No assignments for this date</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* My Conducted Inspections */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CheckCircle className="mr-2 text-green-600" size={20} />
                My Conducted Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {inspections.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {inspections.map((inspection) => (
                    <div key={inspection.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-nr-navy">{inspection.subject}</h4>
                        <p className="text-sm text-gray-600">
                          {inspection.stationCode} • {inspection.area} • {new Date(inspection.inspectionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          onClick={() => handleDownloadPDF(inspection.id)}
                          size="sm"
                          variant="outline"
                          className="flex items-center space-x-1"
                        >
                          <Download size={14} />
                          <span>PDF</span>
                        </Button>
                        <Badge
                          variant={
                            inspection.status === 'completed' ? 'default' :
                            inspection.status === 'submitted' ? 'secondary' : 'outline'
                          }
                        >
                          {inspection.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
                  <p className="text-gray-500">No inspections conducted yet</p>
                  <Link href="/inspection">
                    <Button className="mt-4 bg-nr-blue hover:bg-blue-800">
                      Conduct Your First Inspection
                    </Button>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Upcoming & Overdue Assignments */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upcoming Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-blue-600">
                <Clock className="mr-2" size={20} />
                Upcoming Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingAssignments.length > 0 ? (
                <div className="space-y-3">
                  {upcomingAssignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="p-3 border border-blue-200 rounded-lg bg-blue-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-nr-navy">{assignment.stationCode}</p>
                          <p className="text-sm text-gray-600">{assignment.area}</p>
                          <p className="text-xs text-blue-600">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                        </div>
                        <Link href="/inspection">
                          <Button size="sm" className="bg-nr-blue hover:bg-blue-800">
                            Start
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No upcoming inspections</p>
              )}
            </CardContent>
          </Card>

          {/* Overdue Assignments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center text-red-600">
                <AlertTriangle className="mr-2" size={20} />
                Overdue Inspections
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overdueAssignments.length > 0 ? (
                <div className="space-y-3">
                  {overdueAssignments.slice(0, 5).map((assignment) => (
                    <div key={assignment.id} className="p-3 border border-red-200 rounded-lg bg-red-50">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-nr-navy">{assignment.stationCode}</p>
                          <p className="text-sm text-gray-600">{assignment.area}</p>
                          <p className="text-xs text-red-600">Due: {new Date(assignment.dueDate).toLocaleDateString()}</p>
                        </div>
                        <Link href="/inspection">
                          <Button size="sm" variant="destructive">
                            Urgent
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No overdue inspections</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}