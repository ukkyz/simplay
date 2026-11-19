import { readWorld } from "@/db/server-world";
import { BuildingPage } from "@/screens/BuildingPage";

type Props = { params: Promise<{ userId: string; areaId: string; buildingId: string }> };

export async function generateMetadata({ params }: Props) {
  const [{ areaId, buildingId }, { world }] = await Promise.all([params, readWorld()]);
  const building = world.areas.find(({ id }) => id === areaId)?.buildings.find(({ id }) => id === buildingId);
  return { title: building ? `${building.name} · Building` : "Building not found" };
}

export default async function Page({ params }: Props) {
  return <BuildingPage {...await params} />;
}
