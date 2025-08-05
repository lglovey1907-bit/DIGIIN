import { useQuery } from "@tanstack/react-query";

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

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    refetch,
  };
}
