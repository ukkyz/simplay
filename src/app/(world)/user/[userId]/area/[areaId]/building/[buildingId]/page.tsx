import { getAccount, requireAccount } from "@/auth/server";
import { readWorld } from "@/db/server-world";
import { BuildingPage } from "@/screens/BuildingPage";

type Props = { params: Promise<{ userId: string; areaId: string; buildingId: string }> };

export async function generateMetadata({ params }: Props) {
  if (!await getAccount()) return { title: "Sign in" };
  const [{ userId, areaId, buildingId }, { player, world }] = await Promise.all([params, readWorld()]);
  const building = userId === player.id ? world.areas.find(({ id }) => id === areaId)?.buildings.find(({ id }) => id === buildingId) : undefined;
  return { title: building ? `${building.name} · Building` : "Building not found" };
}

export default async function Page({ params }: Props) {
  await requireAccount();
  return <BuildingPage {...await params} />;
}
