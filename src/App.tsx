import { ArrowLeft, Compass, MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button, Wordmark } from "@/components/ui";
import { navigate, usePageTitle, useRoute } from "@/lib/router";
import { SimplayzProvider } from "@/lib/store";
import { AiManagementPage } from "@/pages/AiManagementPage";
import { AreaPage } from "@/pages/AreaPage";
import { BuildingPage } from "@/pages/BuildingPage";
import { WorldPage } from "@/pages/WorldPage";

function NotFound({ path }: { path: string }) {
  usePageTitle("Page not found");
  return (
    <div className="mx-auto flex min-h-[76svh] max-w-2xl flex-col items-center justify-center px-5 py-16 text-center">
      <Wordmark />
      <div className="mt-8 grid h-14 w-14 place-items-center rounded-2xl border border-line bg-paper text-muted">
        <Compass size={22} />
      </div>
      <p className="mt-4 font-mono text-[9px] uppercase tracking-[.15em] text-muted">Error 404 · off the plot</p>
      <h1 className="mt-2 font-display text-4xl font-semibold tracking-[-.05em]">This path isn&apos;t paved yet.</h1>
      <p className="mt-2 max-w-[46ch] text-[12px] leading-relaxed text-muted">
        <span className="rounded bg-bone-deep px-1 py-0.5 font-mono text-[10px] text-ink">{path}</span> is outside your
        surveyed world. Head back to Rotterdam or jump into one of your player areas.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Button onClick={() => navigate("/")}>
          <ArrowLeft size={14} />
          World map
        </Button>
        <Button variant="secondary" onClick={() => navigate("/user/alex/area/delfshaven-yard")}>
          <MapPin size={14} />
          Delfshaven Yard
        </Button>
      </div>
      <div className="mt-10 grid w-full max-w-md grid-cols-3 gap-2">
        {[
          ["Explore", "OpenStreetMap"],
          ["Build", "Areas & rooms"],
          ["Manage", "AI crew"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-line bg-paper/60 px-2 py-2.5 text-center">
            <div className="font-mono text-[7px] uppercase tracking-[.06em] text-muted">{label}</div>
            <div className="mt-1 text-[9.5px] font-bold text-ink">{value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RoutedApp() {
  const route = useRoute();
  if (route.name === "world") {
    return (
      <AppShell>
        <WorldPage />
      </AppShell>
    );
  }
  if (route.name === "area") {
    return (
      <AppShell>
        <AreaPage userId={route.userId} areaId={route.areaId} />
      </AppShell>
    );
  }
  if (route.name === "building") {
    return (
      <AppShell>
        <BuildingPage userId={route.userId} areaId={route.areaId} buildingId={route.buildingId} />
      </AppShell>
    );
  }
  if (route.name === "ai") {
    return (
      <AppShell>
        <AiManagementPage userId={route.userId} />
      </AppShell>
    );
  }
  return (
    <AppShell>
      <NotFound path={route.path} />
    </AppShell>
  );
}

export default function App() {
  return (
    <SimplayzProvider>
      <RoutedApp />
    </SimplayzProvider>
  );
}
