import { ReactNode } from "react";
export const PageContainer = ({ children }: { children: ReactNode }) => (
  <div
    className="mx-auto w-full"
    style={{ maxWidth: 1320, paddingLeft: 24, paddingRight: 24, paddingTop: 40, paddingBottom: 96 }}
  >
    {children}
  </div>
);
