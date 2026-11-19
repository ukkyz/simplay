import { requireAccount } from "@/auth/server";
import { WorldPage } from "@/screens/WorldPage";

export const metadata = { title: "World" };

export default async function Page() {
  await requireAccount();
  return <WorldPage />;
}
