import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/server/actions/auth.actions";

export function LogoutButton() {
  return (
    <form action={signOutAction}>
      <Button type="submit" variant="ghost" size="sm">
        <LogOut className="h-4 w-4" />
        Salir
      </Button>
    </form>
  );
}
