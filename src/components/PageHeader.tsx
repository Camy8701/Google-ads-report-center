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
  <div className="flex items-start justify-between gap-6 pb-8">
    <div>
      {eyebrow && <p className="lynck-section-label mb-3">{eyebrow}</p>}
      <h1 className="lynck-hero-title text-4xl md:text-5xl">
        {title}
        {emphasize && <em className="not-italic text-primary"> {emphasize}</em>}
      </h1>
      {description && <p className="mt-3 lynck-muted max-w-2xl">{description}</p>}
    </div>
    {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
  </div>
);
