
import { ReactNode, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthProtection } from '@/hooks/use-auth-protection';
import { useNavigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated, error } = useAuthProtection();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      console.log("Protected route: Not authenticated, redirecting to /auth");
      navigate('/auth', { replace: true });
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen text-destructive">
        <div className="text-center">
          <p className="font-medium mb-2">Authentication error</p>
          <p className="text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Please try refreshing the page'}</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
