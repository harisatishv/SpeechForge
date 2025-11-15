import { useQuery } from "@tanstack/react-query";
import { Loader2, ShieldCheck } from "lucide-react";
import RequireAuth from "@/components/RequireAuth";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import type { SessionUser } from "@/hooks/use-session";

interface ProfilesResponse {
  users: SessionUser[];
}

export default function AdminProfiles() {
  const profilesQuery = useQuery<ProfilesResponse>({
    queryKey: ["/admin/profiles"],
    queryFn: async () => {
      const res = await fetch("/admin/profiles", { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || "Failed to load profiles");
      }
      return (await res.json()) as ProfilesResponse;
    },
  });

  return (
    <RequireAuth allowedRoles={["admin"]}>
      <div className="min-h-screen bg-background">
        <AppHeader variant="app" />
        <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-2xl font-semibold">Admin: User Profiles</h1>
              <p className="text-sm text-muted-foreground">
                Review registered accounts stored in the persistent database. Only admins can view this list.
              </p>
            </div>
          </div>

          <Card className="p-0 overflow-hidden">
            {profilesQuery.isLoading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Fetching profiles...
              </div>
            ) : profilesQuery.isError ? (
              <div className="py-10 text-center text-sm text-destructive">
                {(profilesQuery.error as Error).message || "Unable to load profiles"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profilesQuery.data?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell className="text-sm">{user.email}</TableCell>
                      <TableCell className="text-sm capitalize">{user.provider}</TableCell>
                      <TableCell className="text-sm">{user.company || "—"}</TableCell>
                      <TableCell className="text-sm capitalize">{user.role}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </main>
      </div>
    </RequireAuth>
  );
}
