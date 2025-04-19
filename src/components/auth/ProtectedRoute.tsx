
import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuthProtection } from '@/hooks/use-auth-protection';

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoading, isAuthenticated } = useAuthProtection();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect from useAuthProtection
  }

  return <>{children}</>;
}
