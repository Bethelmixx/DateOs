import { createFileRoute } from "@tanstack/react-router";
import { RedirectToSignIn } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { ProfileView } from "@/components/profile/profile-view";
import { BootScreen } from "@/components/chrome/boot-screen";

export const Route = createFileRoute("/perfil")({ component: Perfil });

function Perfil() {
  const { sessionUser } = Route.useRouteContext();
  const { user, isPending } = useCurrentUserState();
  if (user || sessionUser) return <ProfileView />;
  if (isPending) return <BootScreen />;
  return <RedirectToSignIn />;
}
