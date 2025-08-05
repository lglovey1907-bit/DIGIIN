import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export function useAuth() {
  const { data: user, isLoading, error, refetch } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: 2,
    retryDelay: 500,
    refetchOnWindowFocus: true,
    staleTime: 0, // Always fresh
    gcTime: 30 * 1000, // 30 seconds
  });

  console.log('useAuth hook:', { user, isLoading, error, hasUser: !!user });

  const logout = async () => {
    try {
      // Clear token first
      localStorage.removeItem('authToken');
      
      // Call logout endpoint
      await apiRequest('POST', '/api/logout');
      
      // Force refresh auth state
      await refetch();
      
      // Navigate to landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      // Clear token anyway and redirect
      localStorage.removeItem('authToken');
      window.location.href = '/';
    }
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
    logout,
  };
}
