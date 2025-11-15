import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import type { UserRole } from "@shared/schema";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  provider: string;
  providerId?: string | null;
  avatarUrl?: string | null;
  company?: string | null;
  role: UserRole;
  createdAt: string;
}

interface SessionResponse {
  user: SessionUser;
}

export function useSession() {
  const query = useQuery<SessionResponse | null>({
    queryKey: ["/auth/session"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  return query;
}
