import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerUserSchema, type RegisterUser } from "@shared/schema";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { Train, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm<RegisterUser>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      designation: "",
      stationSection: "",
      email: "",
      password: "",
      role: "cmi",
    },
  });

  const onSubmit = async (data: RegisterUser) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || "Registration failed");
      }
      
      toast({
        title: "Registration Successful",
        description: result.user.isApproved 
          ? "You can now log in to your account." 
          : "Your account is pending admin approval.",
      });
      
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Please check your information and try again.",
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
            <NorthernRailwayLogo size={80} />
          </div>
          <h1 className="text-2xl font-bold text-nr-navy mb-2">Register</h1>
          <p className="text-gray-600">Delhi Division Digital Inspection Platform</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center text-nr-navy">Create Account</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Chief Metropolitan Inspector" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stationSection"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Station/Section Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., New Delhi Railway Station" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email ID</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter your email" {...field} />
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
                        <Input type="password" placeholder="Create a password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Registration Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select registration type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="cmi">CMI (Chief Metropolitan Inspector)</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full bg-nr-blue hover:bg-blue-800"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </form>
            </Form>

            <div className="mt-6 text-center">
              <Link href="/">
                <Button variant="ghost" className="text-nr-navy">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Administrator accounts require approval from existing administrators.</p>
          <p>The default administrator is: commercialcmig@gmail.com</p>
        </div>
      </div>
    </div>
  );
}