import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NorthernRailwayLogo } from "@/components/northern-railway-logo";
import { UserPlus } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginUserSchema, type LoginUser } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Landing() {
  const [loginType, setLoginType] = useState<'cmi' | 'admin'>('cmi');
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const form = useForm<LoginUser>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginUser) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Login failed");
      }
      
      // Store token if provided
      if (result.token) {
        localStorage.setItem('authToken', result.token);
      }
      
      toast({
        title: "Login Successful",
        description: `Welcome, ${result.user.name}!`,
      });
      
      // Navigate to home page and refresh auth state
      setTimeout(() => {
        setLocation('/');
        // Force page reload to ensure session is properly loaded
        window.location.reload();
      }, 500);
    } catch (error: any) {
      toast({
        title: "Login Failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-nr-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-nr-navy">Login</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Login Type Selection */}
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Login Type</Label>
              <div className="flex space-x-4">
                <button
                  onClick={() => setLoginType('cmi')}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    loginType === 'cmi'
                      ? 'bg-nr-blue text-white border-nr-blue'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  CMI
                </button>
                <button
                  onClick={() => setLoginType('admin')}
                  className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-colors ${
                    loginType === 'admin'
                      ? 'bg-nr-blue text-white border-nr-blue'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Administrator
                </button>
              </div>
            </div>

            {/* Login Form */}
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User ID / Email</FormLabel>
                      <FormControl>
                        <Input 
                          type="email" 
                          placeholder="Enter your User ID or Email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Enter your password" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-nr-blue hover:bg-blue-800"
                  disabled={isLoading}
                >
                  {isLoading ? "Logging in..." : `Login as ${loginType === 'cmi' ? 'CMI' : 'Administrator'}`}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/register">
                <Button variant="outline" className="w-full border-nr-navy text-nr-navy hover:bg-nr-navy hover:text-white">
                  <UserPlus size={16} className="mr-2" />
                  New User Registration
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>For technical support, contact: Northern Railway Delhi Division</p>
        </div>
      </div>
    </div>
  );
}