import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import AppHeader from "@/components/AppHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useSession } from "@/hooks/use-session";

export default function Login() {
  const [location, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const next = params.get("next") || "/studio";
  const [form, setForm] = useState({ email: "", password: "" });
  const { toast } = useToast();
  const session = useSession();

  useEffect(() => {
    if (!session.isLoading && session.data?.user) {
      navigate(next);
    }
  }, [session.isLoading, session.data, navigate, next]);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/auth/login", form);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/auth/session"] });
      toast({ title: "Welcome back" });
      navigate(next);
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to sign in",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    loginMutation.mutate();
  };

  const handleGoogleLogin = () => {
    window.location.href = `/auth/google?next=${encodeURIComponent(next)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader variant="marketing" />
      <main className="max-w-md mx-auto px-6 py-12">
        <Card className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">Sign in to SpeechForge</h1>
            <p className="text-sm text-muted-foreground">Access the studio and manage your voices securely.</p>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleLogin}>
            Continue with Google
          </Button>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            New to SpeechForge?{" "}
            <Link href={`/auth/register?next=${encodeURIComponent(next)}`} className="text-primary underline-offset-4 underline">
              Create an account
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
