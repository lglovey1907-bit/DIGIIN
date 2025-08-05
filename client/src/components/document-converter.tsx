import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Download, Settings, Sparkles, RefreshCw } from "lucide-react";

interface DocumentConverterProps {
  inspectionId: string;
  inspectionData?: {
    stationCode: string;
    inspectionDate: string;
    subject: string;
  };
}

export function DocumentConverter({ inspectionId, inspectionData }: DocumentConverterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [letterReference, setLetterReference] = useState(() => {
    const currentDate = new Date().toLocaleDateString('en-GB');
    return `Ref: (i) Letter No.23AC/Decoy Checks dated ${currentDate}.
      (ii) Control Message No.1006/CC/DLI/2025 dated ${currentDate}.`;
  });
  const { toast } = useToast();

  const handleConvertToDoc = async () => {
    if (!inspectionId) {
      toast({
        title: "Error",
        description: "No inspection selected for conversion.",
        variant: "destructive",
      });
      return;
    }

    setIsConverting(true);
    try {
      // Get auth headers including both cookie-based and token-based auth
      const authHeaders: HeadersInit = {
        'Content-Type': 'application/json',
      };
      
      // Add authorization header if available
      const authToken = localStorage.getItem('authToken');
      if (authToken) {
        authHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await fetch(`/api/inspections/${inspectionId}/convert-to-doc`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders,
        body: JSON.stringify({
          letterReference: letterReference.trim()
        })
      });

      if (!response.ok) {
        throw new Error('Failed to convert to DOC');
      }

      // Get the filename from response headers or create one
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'Inspection_Report.doc';
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Conversion Complete",
        description: "Your inspection has been converted to DOC format and downloaded.",
      });

      setIsOpen(false);
    } catch (error) {
      console.error('Error converting to DOC:', error);
      toast({
        title: "Conversion Failed",
        description: "Failed to convert inspection to DOC format. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const generateDefaultReference = () => {
    const currentDate = new Date().toLocaleDateString('en-GB');
    const generatedRef = `Ref: (i) Letter No.23AC/Decoy Checks dated ${currentDate}.
      (ii) Control Message No.1006/CC/DLI/2025 dated ${currentDate}.`;
    setLetterReference(generatedRef);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          className="flex items-center space-x-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
        >
          <FileText size={14} />
          <span>Convert to DOC</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Sparkles className="mr-2 text-blue-500" size={20} />
            Convert Inspection to DOC Format
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium flex items-center">
                <FileText className="mr-2 text-green-600" size={16} />
                Document Conversion Details
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              <div className="space-y-2">
                <p><strong>Station:</strong> {inspectionData?.stationCode || 'N/A'}</p>
                <p><strong>Date:</strong> {inspectionData?.inspectionDate ? new Date(inspectionData.inspectionDate).toLocaleDateString() : 'N/A'}</p>
                <p><strong>Subject:</strong> {inspectionData?.subject || 'N/A'}</p>
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700">
                  <strong>AI-Powered Conversion:</strong> This feature uses advanced AI to convert your inspection data into professional Northern Railway format with proper English narrative, company organization, and official document structure.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Letter Reference Configuration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="letterReference" className="text-sm font-medium">
                Letter Reference
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={generateDefaultReference}
                className="text-xs"
              >
                <RefreshCw size={12} className="mr-1" />
                Generate Default
              </Button>
            </div>
            <Textarea
              id="letterReference"
              value={letterReference}
              onChange={(e) => setLetterReference(e.target.value)}
              placeholder="Enter letter reference numbers..."
              className="min-h-24 text-sm"
            />
            <p className="text-xs text-gray-500">
              This will appear in the reference section of your converted document.
            </p>
          </div>

          {/* Features Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Conversion Features</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Official Railway Format</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>AI-Generated English Text</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Company-wise Organization</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Tabular Observations</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Professional Language</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    <span>Action Tracking</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConvertToDoc}
              disabled={isConverting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isConverting ? (
                <>
                  <RefreshCw className="animate-spin mr-2" size={16} />
                  Converting...
                </>
              ) : (
                <>
                  <Download className="mr-2" size={16} />
                  Convert & Download
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default DocumentConverter;