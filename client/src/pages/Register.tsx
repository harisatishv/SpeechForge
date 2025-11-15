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

export default function Register() {
  const [location, navigate] = useLocation();
  const params = useMemo(() => new URLSearchParams(location.split("?")[1] ?? ""), [location]);
  const next = params.get("next") || "/studio";
  const session = useSession();
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    company: "",
  });

  useEffect(() => {
    if (!session.isLoading && session.data?.user) {
      navigate(next);
    }
  }, [session.isLoading, session.data, navigate, next]);

  const signupMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        company: form.company,
      };
      const res = await apiRequest("POST", "/auth/signup", payload);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/auth/session"] });
      toast({ title: "Account created", description: "Welcome to SpeechForge!" });
      navigate(next);
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to create account",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    signupMutation.mutate();
  };

  const handleGoogleSignup = () => {
    window.location.href = `/auth/google?next=${encodeURIComponent(next)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader variant="marketing" />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <Card className="p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-2xl font-semibold">Create your VoiceForge account</h1>
            <p className="text-sm text-muted-foreground">Unlock the speech studio and premium neural voices.</p>
          </div>

          <Button type="button" variant="outline" className="w-full" onClick={handleGoogleSignup}>
            Continue with Google
          </Button>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  required
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Priya Rathi"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="company">Team or Company (optional)</Label>
                <Input
                  id="company"
                  value={form.company}
                  onChange={(event) => setForm((prev) => ({ ...prev, company: event.target.value }))}
                  placeholder="Forge Studios"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Work email</Label>
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
                minLength={8}
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                placeholder="••••••••"
              />
              <p className="text-xs text-muted-foreground">Use at least 8 characters for security.</p>
            </div>
            <Button type="submit" className="w-full" disabled={signupMutation.isPending}>
              {signupMutation.isPending ? "Creating account..." : "Create account"}
            </Button>
          </form>

          <p className="text-sm text-muted-foreground text-center">
            Already have an account?{" "}
            <Link href={`/auth/login?next=${encodeURIComponent(next)}`} className="text-primary underline-offset-4 underline">
              Sign in
            </Link>
          </p>
        </Card>
      </main>
    </div>
  );
}
