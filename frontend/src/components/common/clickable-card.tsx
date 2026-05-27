"use client";

import { Card } from "@components/ui/card";
import { cn } from "@utils";

export type ClickableCardProps = {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
};

export const ClickableCard = ({
  onClick,
  children,
  className,
}: ClickableCardProps) => (
  <Card
    className={cn(
      "hover:shadow-md transition-shadow cursor-pointer",
      className,
    )}
    onClick={onClick}
  >
    <div className="flex items-center gap-4 p-5">{children}</div>
  </Card>
);
