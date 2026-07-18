import { isSupportedAppPathname } from "@/app-shell/app-routes";
import { notFound } from "next/navigation";

type WorkspaceRoutePageProps = {
  params: Promise<{
    workspacePath?: string[];
  }>;
};

export default async function WorkspaceRoutePage({
  params,
}: WorkspaceRoutePageProps) {
  const { workspacePath = [] } = await params;
  const pathname = workspacePath.length
    ? `/${workspacePath.map(encodeURIComponent).join("/")}`
    : "/";

  if (!isSupportedAppPathname(pathname)) {
    notFound();
  }

  return null;
}
