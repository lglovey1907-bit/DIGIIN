import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Train } from "lucide-react";

export default function Landing() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-nr-blue to-nr-navy px-4">
      <Card className="max-w-md w-full shadow-2xl">
        <CardContent className="pt-8 p-8">
          {/* Northern Railway Logo Section */}
          <div className="text-center mb-8">
            <div className="w-24 h-24 mx-auto mb-4 bg-nr-blue rounded-full flex items-center justify-center">
              <Train className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-nr-navy mb-2">Northern Railway</h1>
            <p className="text-lg text-gray-600">Welcome to Delhi Division</p>
            <p className="text-base text-gray-500 font-medium">Digital Inspection Platform</p>
          </div>

          {/* Login Button */}
          <div className="space-y-4">
            <Button 
              onClick={handleLogin}
              className="w-full bg-nr-blue hover:bg-blue-800 text-white py-3 h-auto"
            >
              <Train className="mr-2" size={20} />
              Login to Continue
            </Button>
            
            <p className="text-center text-sm text-gray-500">
              Please login with your authorized credentials to access the inspection platform
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
