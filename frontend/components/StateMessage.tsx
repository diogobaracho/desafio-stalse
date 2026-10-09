import type { ReactNode } from "react";

type Variant = "loading" | "empty" | "error";

interface Props {
  variant: Variant;
  title: string;
  description?: string;
  action?: ReactNode;
}

/** One consistent component for loading / empty / error states (announced to screen readers). */
export function StateMessage({ variant, title, description, action }: Props) {
  const alertVariant = variant === "error" ? "danger" : variant === "loading" ? "primary" : "light";

  return (
    <div
      className={`alert alert-${alertVariant} border shadow-sm mb-0`}
      role={variant === "error" ? "alert" : "status"}
      aria-busy={variant === "loading" || undefined}
      data-state={variant}
    >
      <p className="fw-semibold mb-1 text-break">{title}</p>
      {description && <p className="mb-0 text-break">{description}</p>}
      {action && <div className="mt-3 d-grid d-sm-block">{action}</div>}
    </div>
  );
}
