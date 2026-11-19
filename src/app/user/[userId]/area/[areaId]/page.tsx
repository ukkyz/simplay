import { readWorld } from "@/db/server-world";
import { AreaPage } from "@/screens/AreaPage";

type Props = { params: Promise<{ userId: string; areaId: string }> };

export async function generateMetadata({ params }: Props) {
  const [{ areaId }, { world }] = await Promise.all([params, readWorld()]);
  const area = world.areas.find(({ id }) => id === areaId);
  return { title: area ? `${area.name} · Area` : "Area not found" };
}

export default async function Page({ params }: Props) {
  return <AreaPage {...await params} />;
}
