import type { LucideIcon } from "lucide-react";

import { CardDescription, CardHeader, CardTitle } from "@components/ui/card";

import { AuthBrand } from "./auth-brand";

type AuthCardHeaderProps = {
  title: React.ReactNode;
  description: React.ReactNode;
  /** When set, a circular badge with this icon renders under the brand. */
  icon?: LucideIcon;
};

export const AuthCardHeader = ({
  title,
  description,
  icon: Icon,
}: AuthCardHeaderProps) => (
  <CardHeader className="space-y-4">
    <AuthBrand centered={!!Icon} />
    {Icon && (
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-6 w-6" />
      </div>
    )}
    <div>
      <CardTitle className="text-2xl">{title}</CardTitle>
      <CardDescription>{description}</CardDescription>
    </div>
  </CardHeader>
);
