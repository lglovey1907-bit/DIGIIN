import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";

export default function Home() {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    if (!isLoading && user) {
      // Redirect based on user role
      const userRole = (user as any)?.role;
      console.log('User data:', user);
      console.log('User role:', userRole);
      
      if (userRole === 'admin') {
        console.log('Redirecting to admin dashboard');
        setLocation('/admin');
      } else if (userRole === 'cmi') {
        console.log('Redirecting to CMI dashboard');
        setLocation('/cmi');
      } else {
        console.log('Unknown role or no role found');
      }
    } else {
      console.log('Loading or no user:', { isLoading, user });
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-nr-bg flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nr-blue mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-nr-bg flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-nr-blue mx-auto"></div>
        <p className="mt-4 text-gray-600">Redirecting...</p>
      </div>
    </div>
  );
}