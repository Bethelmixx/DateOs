import { createFileRoute, Navigate } from "@tanstack/react-router";
import { LoginScreen } from "@/components/auth/login-screen";
import { BootScreen } from "@/components/chrome/boot-screen";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  const { sessionUser } = Route.useRouteContext();
  const { user, isPending } = useCurrentUserState();
  if (user || sessionUser) return <Navigate to="/" />;
  if (isPending) return <BootScreen />;
  return <LoginScreen />;
}
