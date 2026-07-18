import type { ReactNode } from "react";
import { AppPage } from "../app-page";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      {children}
      <AppPage />
    </>
  );
}
