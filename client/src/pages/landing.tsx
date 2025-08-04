import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NorthernRailwayLogo } from "@/components/northern-railway-logo";
import { useState } from "react";

export default function Landing() {
  const [userType, setUserType] = useState<'general' | 'admin'>('general');

  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  const handleRegister = () => {
    // For now, redirect to login as Replit handles registration
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl">
          <CardContent className="p-8">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="flex justify-center mb-4">
                <NorthernRailwayLogo size={100} />
              </div>
              <h1 className="text-2xl font-bold text-nr-navy mb-2">
                Welcome to Delhi Division
              </h1>
              <h2 className="text-lg text-nr-blue font-semibold">
                Digital Inspection Platform
              </h2>
            </div>

            {/* Login Form */}
            <div className="space-y-6">
              {/* User Type Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Login Type</Label>
                <div className="flex space-x-4">
                  <button
                    onClick={() => setUserType('general')}
                    className={`flex-1 py-2 px-4 text-sm rounded-md border transition-colors ${
                      userType === 'general'
                        ? 'bg-nr-blue text-white border-nr-blue'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    General User
                  </button>
                  <button
                    onClick={() => setUserType('admin')}
                    className={`flex-1 py-2 px-4 text-sm rounded-md border transition-colors ${
                      userType === 'admin'
                        ? 'bg-nr-blue text-white border-nr-blue'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>

              {/* User ID */}
              <div className="space-y-2">
                <Label htmlFor="userId" className="text-sm font-medium">
                  User ID
                </Label>
                <Input
                  id="userId"
                  placeholder="Enter your User ID"
                  className="w-full"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your Password"
                  className="w-full"
                />
              </div>

              {/* Buttons */}
              <div className="space-y-3">
                <Button 
                  onClick={handleLogin}
                  className="w-full bg-nr-blue hover:bg-blue-800 text-white py-2"
                >
                  Login
                </Button>
                
                <Button 
                  onClick={handleRegister}
                  variant="outline"
                  className="w-full border-nr-blue text-nr-blue hover:bg-nr-blue hover:text-white py-2"
                >
                  Register
                </Button>
              </div>

              {/* User Type Description */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  {userType === 'general' 
                    ? 'General Users: CMIs and inspection personnel can create and submit inspection reports.'
                    : 'Administrators: Can manage inspection assignments, view all reports, and access dashboard analytics.'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            &copy; 2025 Northern Railway Delhi Division. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
