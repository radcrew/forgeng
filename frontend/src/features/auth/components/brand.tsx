import { Logo } from "@components/brand/logo";

export const Brand = ({ centered = false }: { centered?: boolean }) => (
  <div
    className={`flex items-center gap-2${centered ? " justify-center" : ""}`}
  >
    <Logo size={28} priority />
    <span className="font-bold text-lg tracking-tight">Forgeng</span>
  </div>
);
