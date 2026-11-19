import { redirect } from "next/navigation";
import { getAccount } from "@/auth/server";
import { AuthScreen } from "@/components/AuthScreen";

export const metadata = { title: "Sign in" };

export default async function Page() {
  if (await getAccount()) redirect("/");
  return <AuthScreen mode="login" />;
}
