import { redirect } from "next/navigation";

// Redirect old /dashboard/settings (Danger Zone) to Account Settings tab
export default function SettingsRedirect() {
  redirect("/dashboard/account?tab=settings");
}
