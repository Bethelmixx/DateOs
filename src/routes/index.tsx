import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/auth/login-screen";
import { BootScreen } from "@/components/chrome/boot-screen";
import { ConfigScreen } from "@/components/chrome/config-screen";
import { MapApp } from "@/components/map/map-app";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { sessionUser, configError, localMode } = Route.useRouteContext();
  const { user, isPending } = useCurrentUserState();
  if (configError && !localMode) return <ConfigScreen message={configError} />;
  if (user || sessionUser) return <MapApp />;
  if (isPending && !localMode) return <BootScreen />;
  return <LoginScreen />;
}
