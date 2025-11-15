import { Link } from "wouter";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Mic, Languages, ShieldCheck, Sparkles } from "lucide-react";

const featureHighlights = [
  {
    title: "Expressive AI narration",
    description: "Ultra-realistic voices capture every pause, breath, and emotion for storytelling that feels human.",
    Icon: Mic,
  },
  {
    title: "Instant multilingual reach",
    description: "Translate and synthesize into 30+ languages with the built-in translator and multilingual models.",
    Icon: Languages,
  },
  {
    title: "Studio-grade security",
    description: "Role-based access, encrypted storage, and human-in-the-loop safeguards keep your data protected.",
    Icon: ShieldCheck,
  },
];

const pricingRows = [
  {
    plan: "Creator Free",
    price: "$0",
    characters: "10k characters / month",
    voiceAccess: "Preset voices + translator",
    support: "Community forum",
    cta: "Get started",
    href: "/auth/register",
  },
  {
    plan: "Pro Studio",
    price: "$5",
    characters: "100k characters / month",
    voiceAccess: "Custom neural voices & priority routing",
    support: "Priority email & chat",
    cta: "Upgrade now",
    href: "/auth/register",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader variant="marketing" />
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-16">
        <section id="hero" className="grid grid-cols-1 gap-10 lg:grid-cols-2 items-center">
          <div className="space-y-6">
            <p className="text-sm font-semibold tracking-wide uppercase text-primary">New • AI voice platform</p>
            <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight">
              Text-to-speech that sounds like your most trusted storyteller.
            </h1>
            <p className="text-lg text-muted-foreground">
              SpeechForge blends neural rendering, translator-assisted prompts, and curated AI voices so product teams
              can launch lifelike narration, IVR agents, and localized media in minutes instead of weeks.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" asChild>
                <Link href="/auth/register">Create account</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/studio">Open studio</Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">Studio access is available once you sign in or create an account.</p>
          </div>
          <Card className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ship faster</p>
                <p className="text-lg font-medium">From idea to dialogue in 60 seconds.</p>
              </div>
            </div>
            <Separator />
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>• Upload a script or paste live customer chat.</li>
              <li>• Select a multilingual neural voice that fits your brand.</li>
              <li>• Export clean MP3 or stream via WebSocket.</li>
            </ul>
          </Card>
        </section>

        <section id="features" className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Why SpeechForge</p>
            <h2 className="text-3xl font-semibold tracking-tight">Built for content teams and AI agents.</h2>
            <p className="text-muted-foreground mt-2">
              Tap into realistic prosody while keeping every workflow secure, collaborative, and measurable.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {featureHighlights.map(({ title, description, Icon }) => (
              <Card key={title} className="p-5 space-y-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section id="pricing" className="space-y-6">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary uppercase tracking-wide">Pricing</p>
            <h2 className="text-3xl font-semibold tracking-tight">Simple tiers for every team.</h2>
            <p className="text-muted-foreground mt-2">
              Start free, then unlock studio automation, premium voices, and priority support for just $5 per month.
            </p>
          </div>
          <Card className="overflow-hidden">
            <div className="px-6 py-6 border-b">
              <p className="text-sm text-muted-foreground">Compare plans</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr>
                    <th className="px-6 py-3 font-medium text-foreground">Plan</th>
                    <th className="px-6 py-3 font-medium text-foreground">Monthly price</th>
                    <th className="px-6 py-3 font-medium text-foreground">Included characters</th>
                    <th className="px-6 py-3 font-medium text-foreground">Voice access</th>
                    <th className="px-6 py-3 font-medium text-foreground">Support</th>
                    <th className="px-6 py-3 font-medium text-foreground"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {pricingRows.map((row) => (
                    <tr key={row.plan} className={row.plan === "Pro Studio" ? "bg-primary/5" : undefined}>
                      <td className="px-6 py-4 font-medium">{row.plan}</td>
                      <td className="px-6 py-4">{row.price}</td>
                      <td className="px-6 py-4">{row.characters}</td>
                      <td className="px-6 py-4">{row.voiceAccess}</td>
                      <td className="px-6 py-4">{row.support}</td>
                      <td className="px-6 py-4 text-right">
                        <Button variant={row.plan === "Pro Studio" ? "default" : "outline"} size="sm" asChild>
                          <Link href={row.href}>{row.cta}</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </section>

        <section className="border rounded-xl px-8 py-10 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wide">Get early access</p>
              <h3 className="text-2xl font-semibold mt-1">Ready to create lifelike speech?</h3>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Sign in with Google or create an account with basic info. You&apos;ll unlock the speech studio, premium
                AI voices, and team controls instantly.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild>
                <Link href="/auth/login">Sign in</Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/auth/register">Create account</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
