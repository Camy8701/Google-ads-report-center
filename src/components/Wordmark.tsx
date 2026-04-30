interface Props { size?: "sm" | "md" | "lg"; }
const sizes = { sm: "text-[0.88rem]", md: "text-[1.05rem]", lg: "text-3xl" };
export const Wordmark = ({ size = "md" }: Props) => (
  <span className={`lynck-wordmark ${sizes[size]} text-foreground`}>
    LYNCK<span className="lynck-wordmark-dot">.</span>STUDIO
  </span>
);
