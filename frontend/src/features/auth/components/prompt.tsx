import Link from "next/link";

type PromptProps = {
  text: string;
  linkText: string;
  href: string;
};

export const Prompt = ({ text, linkText, href }: PromptProps) => (
  <p className="text-center text-sm text-muted-foreground">
    {text}{" "}
    <Link href={href} className="text-primary-strong font-medium hover:underline">
      {linkText}
    </Link>
  </p>
);
