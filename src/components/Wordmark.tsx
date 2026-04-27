interface Props { size?: "sm" | "md" | "lg"; }
const sizes = { sm: "text-base", md: "text-xl", lg: "text-3xl" };
export const Wordmark = ({ size = "md" }: Props) => (
  <span className={`lynck-wordmark ${sizes[size]} text-foreground`}>
    LYNCK<span className="lynck-wordmark-dot">.</span>STUDIO
  </span>
);
