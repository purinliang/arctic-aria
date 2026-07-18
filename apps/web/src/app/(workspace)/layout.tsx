import type { ReactNode } from "react";
import { AppPage } from "../app-page";

export default function WorkspaceLayout({
  children,
}: {
  children: ReactNode;
}) {
  void children;

  return <AppPage />;
}
