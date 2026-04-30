import { ReactNode } from "react";

export const PageHeader = ({
  eyebrow,
  title,
  emphasize,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  emphasize?: string;
  description?: string;
  actions?: ReactNode;
}) => (
  <div className="flex flex-col gap-6 border-b border-border/70 pb-8 lg:flex-row lg:items-end lg:justify-between">
    <div className="max-w-3xl">
      {eyebrow && (
        <p className="lynck-section-label crm-eyebrow-pill mb-5 inline-flex rounded-full px-3 py-1.5">
          {eyebrow}
        </p>
      )}
      <h1 className="lynck-hero-title text-4xl md:text-5xl lg:text-6xl">
        {title}
        {emphasize && <em className="not-italic text-primary"> {emphasize}</em>}
      </h1>
      {description && <p className="mt-5 max-w-2xl text-[1.02rem] leading-7 lynck-muted">{description}</p>}
    </div>
    {actions && <div className="shrink-0 flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
