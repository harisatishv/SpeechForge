import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import UserMenu from "@/components/UserMenu";
import { Sparkles } from "lucide-react";

type HeaderVariant = "marketing" | "app";

interface AppHeaderProps {
  variant?: HeaderVariant;
}

export default function AppHeader({ variant = "marketing" }: AppHeaderProps) {
  const [, navigate] = useLocation();
  const { data } = useSession();
  const user = data?.user;

  const marketingLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
  ];

  const appLinks = [{ href: "/studio", label: "Studio" }];

  const navLinks = variant === "marketing" ? marketingLinks : appLinks;

  return (
    <header className={cn("border-b", variant === "marketing" && "sticky top-0 z-40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60")}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <Link href="/" className="text-2xl font-semibold hover:text-primary transition-colors">
            VoiceForge
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="hover:text-foreground transition-colors">
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => navigate("/studio")}>
                Open studio
              </Button>
              <UserMenu user={user} />
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/auth/register">Get started</Link>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
