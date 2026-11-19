import { redirect } from "next/navigation";
import { getAccount } from "@/auth/server";
import { AuthScreen } from "@/components/AuthScreen";

export const metadata = { title: "Create an account" };

export default async function Page() {
  if (await getAccount()) redirect("/");
  return <AuthScreen mode="register" />;
}
