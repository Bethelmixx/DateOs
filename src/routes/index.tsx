import { createFileRoute } from "@tanstack/react-router";
import { LoginScreen } from "@/components/auth/login-screen";
import { BootScreen } from "@/components/chrome/boot-screen";
import { MapApp } from "@/components/map/map-app";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { sessionUser } = Route.useRouteContext();
  const { user, isPending } = useCurrentUserState();
  if (user || sessionUser) return <MapApp />;
  if (isPending) return <BootScreen />;
  return <LoginScreen />;
}
