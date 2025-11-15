import { type ReactNode, useEffect } from "react";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { useSession, type SessionUser } from "@/hooks/use-session";

interface RequireAuthProps {
  children: ReactNode;
  allowedRoles?: Array<SessionUser["role"]>;
}

export default function RequireAuth({ children, allowedRoles }: RequireAuthProps) {
  const [location, navigate] = useLocation();
  const session = useSession();

  useEffect(() => {
    if (session.isLoading) {
      return;
    }

    const user = session.data?.user;

    if (!user) {
      const nextTarget = encodeURIComponent(location || "/studio");
      navigate(`/auth/login?next=${nextTarget}`);
      return;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      navigate("/");
    }
  }, [session.isLoading, session.data, allowedRoles, location, navigate]);

  const user = session.data?.user;

  if (session.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin mr-2" />
        <span>Checking access...</span>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}
