import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { 
  ClipboardList, 
  Calendar, 
  MapPin, 
  FileText,
  Train,
  LogOut,
  Save,
  CheckCircle,
  Upload
} from "lucide-react";
import { stations } from "@/data/stations";
import CateringForm from "@/components/catering-form";

const inspectionAreas = [
  { value: "catering", label: "Catering", icon: "🍽️" },
  { value: "sanitation", label: "Sanitation", icon: "🧹" },
  { value: "publicity", label: "Publicity", icon: "📢" },
  { value: "uts_prs", label: "UTS/PRS", icon: "🎫" },
  { value: "parking", label: "Parking", icon: "🅿️" },
];

export default function InspectionForm() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const [formData, setFormData] = useState({
    subject: "",
    stationCode: "",
    inspectionDate: "",
    referenceNo: "",
    area: "",
    observations: {},
    actionTaken: "",
    inspectors: [{ name: "", designation: "" }],
  });

  const createInspectionMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("POST", "/api/inspections", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Inspection created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/inspections"] });
      setLocation("/");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create inspection",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (status: 'draft' | 'submitted') => {
    createInspectionMutation.mutate({
      ...formData,
      status,
      inspectionDate: new Date(formData.inspectionDate),
    });
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  const addInspector = () => {
    setFormData(prev => ({
      ...prev,
      inspectors: [...prev.inspectors, { name: "", designation: "" }]
    }));
  };

  const updateInspector = (index: number, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      inspectors: prev.inspectors.map((inspector, i) => 
        i === index ? { ...inspector, [field]: value } : inspector
      )
    }));
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
                <p className="text-sm text-gray-600">Digital Inspection Form</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                onClick={() => setLocation("/")}
                variant="outline"
              >
                Back to Home
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
        {/* Inspection Details Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <ClipboardList className="mr-3 text-nr-blue" size={24} />
              Inspection Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="Enter inspection subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="stationCode">Station Code</Label>
                <Select 
                  value={formData.stationCode} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, stationCode: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.code} value={station.code}>
                        {station.code} - {station.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="inspectionDate">Inspection Date</Label>
                <Input
                  id="inspectionDate"
                  type="date"
                  value={formData.inspectionDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, inspectionDate: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="referenceNo">Reference Letter No. (Optional)</Label>
                <Input
                  id="referenceNo"
                  placeholder="Control Message Number"
                  value={formData.referenceNo}
                  onChange={(e) => setFormData(prev => ({ ...prev, referenceNo: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Area of Inspection Selection */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="mr-3 text-nr-blue" size={24} />
              Area of Inspection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {inspectionAreas.map((area) => (
                <Label key={area.value} className="cursor-pointer">
                  <input
                    type="radio"
                    name="inspectionArea"
                    value={area.value}
                    checked={formData.area === area.value}
                    onChange={(e) => setFormData(prev => ({ ...prev, area: e.target.value }))}
                    className="peer hidden"
                  />
                  <div className="p-4 border-2 border-gray-200 rounded-lg text-center hover:border-nr-blue peer-checked:border-nr-blue peer-checked:bg-blue-50 transition-colors">
                    <div className="text-2xl mb-2">{area.icon}</div>
                    <p className="font-medium text-gray-700">{area.label}</p>
                  </div>
                </Label>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Area-specific forms */}
        {formData.area === 'catering' && (
          <CateringForm 
            observations={formData.observations}
            onObservationsChange={(observations) => 
              setFormData(prev => ({ ...prev, observations }))
            }
          />
        )}

        {/* Action Taken */}
        {formData.area && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Action Taken</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Describe actions taken during inspection"
                value={formData.actionTaken}
                onChange={(e) => setFormData(prev => ({ ...prev, actionTaken: e.target.value }))}
                rows={4}
              />
            </CardContent>
          </Card>
        )}

        {/* Inspector Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-3 text-nr-blue" size={24} />
              Inspector Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {formData.inspectors.map((inspector, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Label>Name</Label>
                    <Input
                      placeholder="Inspector Name"
                      value={inspector.name}
                      onChange={(e) => updateInspector(index, 'name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Designation</Label>
                    <Input
                      placeholder="Designation"
                      value={inspector.designation}
                      onChange={(e) => updateInspector(index, 'designation', e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            <Button 
              onClick={addInspector}
              className="mt-4 bg-nr-blue hover:bg-blue-800"
            >
              Add Another Inspector
            </Button>
          </CardContent>
        </Card>

        {/* QR Code Upload */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="mr-3 text-nr-blue" size={24} />
              QR Code for Photo Gallery (Optional)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-nr-blue transition-colors">
                <Upload className="mx-auto text-gray-400 mb-4" size={48} />
                <p className="text-gray-600 mb-2">Upload QR code containing all inspection photos</p>
                <p className="text-sm text-gray-500 mb-4">QR code should show "Scan me to see all pics of the inspection"</p>
                <Input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  id="qrUpload" 
                />
                <Label 
                  htmlFor="qrUpload" 
                  className="bg-nr-blue text-white px-6 py-3 rounded-lg hover:bg-blue-800 transition-colors cursor-pointer inline-flex items-center"
                >
                  <Upload className="mr-2" size={20} />
                  Choose QR Code Image
                </Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-4">
          <Button 
            onClick={() => handleSubmit('draft')}
            variant="outline"
            disabled={createInspectionMutation.isPending}
          >
            <Save className="mr-2" size={20} />
            Save Draft
          </Button>
          <Button 
            onClick={() => handleSubmit('submitted')}
            className="bg-nr-success hover:bg-green-700"
            disabled={createInspectionMutation.isPending}
          >
            <CheckCircle className="mr-2" size={20} />
            Submit Inspection
          </Button>
        </div>
      </main>
    </div>
  );
}
