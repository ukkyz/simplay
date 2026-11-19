import { getAccount, requireAccount } from "@/auth/server";
import { readWorld } from "@/db/server-world";
import { AreaPage } from "@/screens/AreaPage";

type Props = { params: Promise<{ userId: string; areaId: string }> };

export async function generateMetadata({ params }: Props) {
  if (!await getAccount()) return { title: "Sign in" };
  const [{ userId, areaId }, { player, world }] = await Promise.all([params, readWorld()]);
  const area = userId === player.id ? world.areas.find(({ id }) => id === areaId) : undefined;
  return { title: area ? `${area.name} · Area` : "Area not found" };
}

export default async function Page({ params }: Props) {
  await requireAccount();
  return <AreaPage {...await params} />;
}
