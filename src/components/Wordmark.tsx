interface Props { size?: "sm" | "md" | "lg"; }
const sizes = { sm: "text-[0.88rem]", md: "text-[1.05rem]", lg: "text-3xl" };
const logoSizes = { sm: "h-5 w-5", md: "h-6 w-6", lg: "h-9 w-9" };

export const Wordmark = ({ size = "md" }: Props) => (
  <span className="inline-flex items-center gap-2.5">
    <img src="/lynck-logo.png" alt="LYNCK Studio logo" className={`${logoSizes[size]} object-contain`} />
    <span className={`lynck-wordmark ${sizes[size]} text-foreground`}>
      LYNCK<span className="lynck-wordmark-dot">.</span>STUDIO
    </span>
  </span>
);
