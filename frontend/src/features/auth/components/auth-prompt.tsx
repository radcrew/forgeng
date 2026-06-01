import Link from "next/link";

type AuthPromptProps = {
  text: string;
  linkText: string;
  href: string;
};

export const AuthPrompt = ({ text, linkText, href }: AuthPromptProps) => (
  <p className="text-center text-sm text-muted-foreground">
    {text}{" "}
    <Link href={href} className="text-primary font-medium hover:underline">
      {linkText}
    </Link>
  </p>
);
