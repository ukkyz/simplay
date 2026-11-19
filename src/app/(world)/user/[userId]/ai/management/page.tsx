import { requireAccount } from "@/auth/server";
import { AiManagementPage } from "@/screens/AiManagementPage";

export const metadata = { title: "AI Management" };

export default async function Page() {
  await requireAccount();
  return <AiManagementPage />;
}
