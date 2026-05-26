"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Code2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { Separator } from "@components/ui/separator";
import { homeForRole, useCurrentUser } from "@lib/auth";
import type { UserRole } from "@lib/types";

const DEMO_ROLES: { role: UserRole; label: string }[] = [
  { role: "student", label: "Student" },
  { role: "mentor", label: "Mentor" },
  { role: "admin", label: "Admin" },
];

export default function SignInPage() {
  const router = useRouter();
  const { signInAs } = useCurrentUser();

  const handleDemoSignIn = (role: UserRole) => {
    const next = signInAs(role);
    if (!next) {
      toast.error(`No demo ${role} account is seeded.`);
      return;
    }
    toast.success(`Signed in as ${next.name ?? next.email}.`);
    router.push(homeForRole(role));
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Code2 className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg tracking-tight">Forgeng</span>
          </div>
          <div>
            <CardTitle className="text-2xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in to continue to your dashboard.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="you@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" />
          </div>
          <Button className="w-full" type="button" disabled>
            Sign In <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <Separator />

          <p className="text-center text-xs text-muted-foreground">
            Real auth isn&apos;t wired yet. Use a demo account to explore each
            role:
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            {DEMO_ROLES.map(({ role, label }) => (
              <Button
                key={role}
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoSignIn(role)}
              >
                {label}
              </Button>
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            New here?{" "}
            <Link
              href="/sign-up"
              className="text-primary font-medium hover:underline"
            >
              Create an account
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
