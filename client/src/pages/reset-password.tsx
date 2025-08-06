import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema, type ResetPassword } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Link, useLocation } from "wouter";
import { ArrowLeft, Key, CheckCircle } from "lucide-react";


export default function ResetPasswordPage() {
  const [, setLocation] = useLocation();
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get token from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const token = urlParams.get('token') || '';

  const form = useForm<ResetPassword>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token: token,
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  const onSubmit = async (data: ResetPassword) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsSubmitted(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          setLocation('/login');
        }, 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Something went wrong');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center">
            {isSubmitted ? (
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
            ) : (
              <Key className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            )}
          </div>
          <CardTitle className="text-2xl font-bold">
            {isSubmitted ? "Password Reset Successfully" : "Reset Password"}
          </CardTitle>
          <CardDescription>
            {isSubmitted 
              ? "Your password has been updated. You'll be redirected to login shortly."
              : "Enter your new password below."
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {isSubmitted ? (
            <div className="text-center space-y-4">
              <Alert>
                <AlertDescription>
                  Password reset complete! Redirecting to login...
                </AlertDescription>
              </Alert>
              <Link href="/login">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Go to Login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!token ? (
                <div className="text-center space-y-4">
                  <Alert variant="destructive">
                    <AlertDescription>
                      Invalid or missing reset token. Please request a new password reset.
                    </AlertDescription>
                  </Alert>
                  <Link href="/forgot-password">
                    <Button variant="outline" className="w-full">
                      Request New Reset Link
                    </Button>
                  </Link>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Enter new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input 
                              type="password" 
                              placeholder="Confirm new password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full bg-orange-600 hover:bg-orange-700"
                      disabled={isLoading}
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </Button>
                  </form>
                </Form>
              )}

              <div className="text-center">
                <Link href="/login">
                  <Button variant="ghost" className="text-sm">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
                  </Button>
                </Link>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}