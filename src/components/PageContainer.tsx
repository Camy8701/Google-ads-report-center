import { ReactNode } from "react";
export const PageContainer = ({ children }: { children: ReactNode }) => (
  <div className="mx-auto w-full" style={{ maxWidth: 1060, paddingLeft: 60, paddingRight: 60, paddingTop: 56, paddingBottom: 80 }}>
    {children}
  </div>
);
