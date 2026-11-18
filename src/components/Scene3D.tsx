import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Area, Building, Room } from "@/lib/types";
import { ROOM_STYLES } from "@/lib/data";
import { cn } from "@/utils/cn";

export type SceneMode = "area" | "building";
export type TimeOfDay = "day" | "dusk" | "night";
export type SceneView = "iso" | "top" | "orbit";

interface Scene3DProps {
  mode: SceneMode;
  area?: Area;
  building?: Building;
  selectedId?: string;
  onSelect?: (id: string) => void;
  timeOfDay?: TimeOfDay;
  view?: SceneView;
  className?: string;
  ariaLabel?: string;
}

const areaScale = 0.36;
const areaGrid = { w: 24, h: 17 };
const buildingScale = 0.4;
const buildingGrid = { w: 20, h: 14 };

const mat = (color: string, roughness = 0.86, metalness = 0.02) =>
  new THREE.MeshStandardMaterial({ color, roughness, metalness });

type BoxOpts = { cast?: boolean; receive?: boolean; rounded?: number; rotate?: [number, number, number] };

function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  color: string,
  position: [number, number, number],
  opts: BoxOpts = {},
) {
  const geometry =
    opts.rounded && opts.rounded > 0
      ? new RoundedBoxGeometry(size[0], size[1], size[2], 2, opts.rounded)
      : new THREE.BoxGeometry(size[0], size[1], size[2]);
  const mesh = new THREE.Mesh(geometry, mat(color));
  mesh.position.set(...position);
  mesh.castShadow = opts.cast ?? true;
  mesh.receiveShadow = opts.receive ?? true;
  if (opts.rotate) mesh.rotation.set(...opts.rotate);
  parent.add(mesh);
  return mesh;
}

function cylinder(
  parent: THREE.Object3D,
  radiusTop: number,
  radiusBottom: number,
  height: number,
  color: string,
  position: [number, number, number],
  segments = 10,
) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    mat(color),
  );
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

function labelSprite(
  text: string,
  sub: string | undefined,
  baseHeight: number,
  muted = false,
) {
  const canvas = document.createElement("canvas");
  const scale = 2;
  canvas.width = 512 * scale;
  canvas.height = 148 * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return new THREE.Sprite(new THREE.SpriteMaterial());
  ctx.scale(scale, scale);
  const w = 512;
  const h = 148;
  const background = muted ? "rgba(23,32,25,.88)" : "rgba(251,250,244,.95)";
  const foreground = muted ? "#fbfaf4" : "#172019";
  ctx.fillStyle = background;
  ctx.beginPath();
  const radius = 28;
  ctx.moveTo(radius, 8);
  ctx.lineTo(w - radius, 8);
  ctx.quadraticCurveTo(w - 8, 8, w - 8, radius);
  ctx.lineTo(w - 8, h - radius);
  ctx.quadraticCurveTo(w - 8, h - 8, w - radius, h - 8);
  ctx.lineTo(radius, h - 8);
  ctx.quadraticCurveTo(8, h - 8, 8, h - radius);
  ctx.lineTo(8, radius);
  ctx.quadraticCurveTo(8, 8, radius, 8);
  ctx.closePath();
  ctx.fill();
  if (!muted) {
    ctx.strokeStyle = "rgba(23,32,25,.12)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.fillStyle = foreground;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 42px Manrope, Arial, sans-serif";
  const maxWidth = w - 48;
  ctx.fillText(text, w / 2, sub ? 55 : h / 2, maxWidth);
  if (sub) {
    ctx.fillStyle = muted ? "rgba(251,250,244,.72)" : "rgba(23,32,25,.52)";
    ctx.font = "600 23px 'JetBrains Mono', monospace";
    ctx.fillText(sub.toUpperCase(), w / 2, 100, maxWidth);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(spriteMat);
  const aspect = canvas.width / canvas.height;
  sprite.scale.set(baseHeight * aspect, baseHeight, 1);
  return sprite;
}

function tree(parent: THREE.Object3D, x: number, z: number, size = 1) {
  const group = new THREE.Group();
  const foliageColors = ["#8cab58", "#779a4d", "#a2b96a"];
  cylinder(group, 0.035 * size, 0.055 * size, 0.26 * size, "#8d7656", [0, 0.13 * size, 0], 6);
  const crown = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.19 * size, 0),
    mat(foliageColors[Math.abs(Math.round((x + z) * 11)) % foliageColors.length]),
  );
  crown.position.y = 0.39 * size;
  crown.castShadow = true;
  crown.receiveShadow = true;
  group.add(crown);
  const crown2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.13 * size, 0), mat("#93ad60"));
  crown2.position.set(0.11 * size, 0.31 * size, 0.06 * size);
  crown2.castShadow = true;
  group.add(crown2);
  group.position.set(x, 0, z);
  parent.add(group);
  return group;
}

function lamp(parent: THREE.Object3D, x: number, z: number, nightLights: THREE.PointLight[]) {
  const group = new THREE.Group();
  cylinder(group, 0.018, 0.03, 0.6, "#545c4e", [0, 0.3, 0], 6);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.11, 8), mat("#40483f", 0.5, 0.25));
  shade.position.y = 0.64;
  shade.castShadow = true;
  group.add(shade);
  const bulb = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.MeshStandardMaterial({
      color: "#fff3cd",
      emissive: new THREE.Color("#ffd98a"),
      emissiveIntensity: 0.1,
      roughness: 0.4,
    }),
  );
  bulb.position.y = 0.6;
  group.add(bulb);
  group.position.set(x, 0, z);
  parent.add(group);
  const light = new THREE.PointLight("#ffd08a", 0, 2.4, 2);
  light.position.set(x, 0.7, z);
  parent.add(light);
  nightLights.push(light);
  return group;
}

function makePerson(color: string, hatColor: string) {
  const group = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.055, 0.12, 4, 8), mat(color, 0.8));
  body.position.y = 0.17;
  body.castShadow = true;
  group.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.062, 10, 10), mat("#d8b393"));
  head.position.y = 0.3;
  head.castShadow = true;
  group.add(head);
  const hat = new THREE.Mesh(new THREE.SphereGeometry(0.065, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat(hatColor));
  hat.position.y = 0.31;
  hat.castShadow = true;
  group.add(hat);
  return group;
}

function roomFurniture(group: THREE.Group, room: Room, width: number, depth: number) {
  const style = ROOM_STYLES[room.type];
  const desk = (x: number, z: number, rotation = 0) => {
    const deskGroup = new THREE.Group();
    box(deskGroup, [0.5, 0.035, 0.25], "#e9dfca", [0, 0.24, 0], { rounded: 0.02 });
    for (const lx of [-0.21, 0.21]) {
      for (const lz of [-0.09, 0.09]) {
        box(deskGroup, [0.025, 0.23, 0.025], "#6c7264", [lx, 0.115, lz], { cast: false });
      }
    }
    box(deskGroup, [0.19, 0.13, 0.025], "#39413b", [0, 0.325, -0.06]);
    box(deskGroup, [0.15, 0.09, 0.012], "#a9d7ec", [0, 0.335, -0.074]);
    const chair = new THREE.Group();
    cylinder(chair, 0.07, 0.07, 0.035, "#586854", [0, 0.18, 0], 8);
    box(chair, [0.11, 0.14, 0.025], "#586854", [0, 0.25, 0.07]);
    chair.position.z = 0.28;
    deskGroup.add(chair);
    deskGroup.position.set(x, 0.09, z);
    deskGroup.rotation.y = rotation;
    group.add(deskGroup);
  };

  const plant = (x: number, z: number, size = 1) => {
    cylinder(group, 0.07 * size, 0.055 * size, 0.12 * size, "#c39e75", [x, 0.15 * size, z], 8);
    const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.12 * size, 0), mat("#6f914b"));
    leaf.position.set(x, 0.27 * size, z);
    leaf.castShadow = true;
    group.add(leaf);
  };

  const maxW = Math.max(0.32, width - 0.22);
  const maxD = Math.max(0.25, depth - 0.22);

  if (room.type === "lobby") {
    box(group, [maxW * 0.7, 0.3, 0.22], "#c58f6b", [0, 0.25, -maxD * 0.16], { rounded: 0.035 });
    box(group, [maxW * 0.7 + 0.04, 0.035, 0.25], "#e9d9c4", [0, 0.41, -maxD * 0.16]);
    box(group, [maxW * 0.4, 0.19, 0.04], style.color, [0, 0.55, -maxD * 0.28]);
    plant(maxW * 0.34, maxD * 0.28, 0.85);
    box(group, [maxW * 0.35, 0.06, 0.25], "#7c8a73", [0, 0.2, maxD * 0.2], { cast: false });
    box(group, [maxW * 0.35, 0.22, 0.05], "#7c8a73", [0, 0.29, maxD * 0.3]);
  } else if (room.type === "security") {
    box(group, [maxW * 0.55, 0.2, 0.25], "#4e5750", [0, 0.22, 0], { rounded: 0.03 });
    for (let i = 0; i < 3; i += 1) {
      box(group, [0.17, 0.12, 0.02], "#33423b", [-0.18 + i * 0.18, 0.43, -maxD * 0.38]);
      box(group, [0.14, 0.09, 0.008], "#9fd5da", [-0.18 + i * 0.18, 0.43, -maxD * 0.38 + 0.014]);
    }
    cylinder(group, 0.075, 0.075, 0.035, "#3f4a43", [0, 0.18, 0.24], 8);
    plant(-maxW * 0.32, maxD * 0.24, 0.7);
  } else if (room.type === "workspace") {
    const cols = width > 2 ? 2 : 1;
    for (let i = 0; i < cols; i += 1) {
      desk(-maxW * 0.22 + (i * maxW) / Math.max(cols, 1.6), maxD * 0.05, i === 0 ? 0 : Math.PI);
    }
    if (depth > 1.4) desk(0, -maxD * 0.28, Math.PI);
    plant(maxW * 0.38, maxD * 0.32, 0.9);
  } else if (room.type === "social") {
    box(group, [maxW * 0.72, 0.36, 0.2], "#b9855f", [0, 0.25, -maxD * 0.25], { rounded: 0.03 });
    box(group, [maxW * 0.75, 0.04, 0.25], "#f0e7d7", [0, 0.45, -maxD * 0.25]);
    for (let i = 0; i < 3; i += 1) {
      cylinder(group, 0.055, 0.06, 0.18, "#a7a28f", [-0.22 + i * 0.22, 0.13, maxD * 0.08], 8);
      cylinder(group, 0.11, 0.11, 0.03, "#e5dcc8", [-0.22 + i * 0.22, 0.23, maxD * 0.08], 10);
    }
    box(group, [0.16, 0.2, 0.13], "#5f6e5b", [maxW * 0.32, 0.18, -maxD * 0.32]);
    plant(-maxW * 0.36, -maxD * 0.22, 0.8);
  } else if (room.type === "focus") {
    desk(0, 0, 0);
    box(group, [maxW * 0.5, 0.025, 0.28], "#d7d0bd", [0, 0.095, maxD * 0.23], { cast: false });
    box(group, [maxW * 0.32, 0.4, 0.05], "#7e7968", [maxW * 0.28, 0.32, -maxD * 0.32]);
    plant(-maxW * 0.3, -maxD * 0.25, 0.65);
  } else if (room.type === "garden") {
    for (let i = 0; i < 3; i += 1) {
      const px = -maxW * 0.28 + (i % 2) * maxW * 0.25;
      const pz = -maxD * 0.18 + Math.floor(i / 2) * maxD * 0.3;
      box(group, [0.24, 0.1, 0.16], "#9d7f5d", [px, 0.12, pz], { rounded: 0.02 });
      for (let j = 0; j < 3; j += 1) {
        const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.05 + j * 0.012, 0), mat(j % 2 ? "#7b9b4f" : "#9dbd69"));
        leaf.position.set(px - 0.07 + j * 0.07, 0.2 + j * 0.025, pz + 0.01);
        leaf.castShadow = true;
        group.add(leaf);
      }
    }
    cylinder(group, 0.12, 0.12, 0.055, "#a7c8ce", [maxW * 0.27, 0.1, maxD * 0.24], 12);
    tree(group, -maxW * 0.3, maxD * 0.28, 0.95);
  } else {
    const table = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.035, 16), mat("#e5dcc8"));
    table.scale.z = 0.7;
    table.position.set(0, 0.3, 0);
    table.castShadow = true;
    group.add(table);
    cylinder(group, 0.025, 0.055, 0.26, "#7c7b6c", [0, 0.15, 0], 8);
    for (let i = 0; i < 4; i += 1) {
      const angle = (i / 4) * Math.PI * 2;
      const chair = new THREE.Group();
      cylinder(chair, 0.065, 0.065, 0.035, style.color, [0, 0.18, 0], 8);
      box(chair, [0.11, 0.13, 0.025], style.color, [0, 0.25, 0.06]);
      chair.position.set(Math.cos(angle) * 0.36, 0, Math.sin(angle) * 0.3);
      chair.rotation.y = -angle + Math.PI / 2;
      group.add(chair);
    }
    box(group, [0.5, 0.26, 0.025], "#39413b", [0, 0.48, -maxD * 0.4]);
    plant(-maxW * 0.34, maxD * 0.28, 0.7);
  }
}

export function Scene3D({
  mode,
  area,
  building,
  selectedId,
  onSelect,
  timeOfDay = "day",
  view = "iso",
  className,
  ariaLabel = "Interactive 3D preview",
}: Scene3DProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<{
    select: (id?: string) => void;
    setView: (view: SceneView) => void;
    setTime: (time: TimeOfDay) => void;
  } | null>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  const roomSignature = building?.rooms.map((room) => `${room.id}:${room.x}:${room.y}`).join("|") ?? "";
  const buildingSignature = (area?.buildings ?? []).map((b) => `${b.id}:${b.plan.x}`).join("|");
  const dataKey =
    mode === "area"
      ? `${area?.id ?? "none"}-${area?.buildings.length ?? 0}-${buildingSignature}`
      : `${building?.id ?? "none"}-${building?.rooms.length ?? 0}-${roomSignature}`;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;
    container.innerHTML = "";

    const width = Math.max(container.clientWidth, 280);
    const height = Math.max(container.clientHeight, 200);
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    } catch {
      container.innerHTML =
        '<div class="grid h-full place-items-center p-6 text-center text-[12px] text-muted">WebGL is unavailable in this browser. The 2D layout plan remains fully editable.</div>';
      return;
    }
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.setClearAlpha(0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.outline = "none";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog("#e6ead9", 22, 40);

    const aspect = width / height;
    const camera = new THREE.PerspectiveCamera(32, aspect, 0.1, 100);
    const basePositions: Record<SceneView, [number, number, number]> =
      mode === "area"
        ? {
            iso: [8.8, 8.4, 9.8],
            top: [0.02, 15.2, 0.02],
            orbit: [10.5, 5.8, 6.4],
          }
        : {
            iso: [7.6, 7.2, 8.2],
            top: [0.02, 13.6, 0.02],
            orbit: [9.2, 5.1, 5.2],
          };
    const fit = Math.max(1, 1.18 / Math.max(aspect, 0.6));
    const initial = basePositions[view].map((v) => (v === basePositions[view][1] ? v * fit : v * fit)) as [
      number,
      number,
      number,
    ];
    camera.position.set(...initial);
    camera.lookAt(0, 0.35, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.25, 0);
    controls.enableDamping = true;
    controls.dampingFactor = 0.075;
    controls.enablePan = false;
    controls.minDistance = mode === "area" ? 6.5 : 5.4;
    controls.maxDistance = 24;
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = Math.PI / 2.22;
    controls.rotateSpeed = 0.62;
    controls.zoomSpeed = 0.72;

    const hemi = new THREE.HemisphereLight("#fdfbf1", "#b8c49f", 1.5);
    scene.add(hemi);
    const ambient = new THREE.AmbientLight("#fbfaf4", 0.35);
    scene.add(ambient);
    const sun = new THREE.DirectionalLight("#fff4d8", 2.3);
    sun.position.set(5, 11, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -9;
    sun.shadow.camera.right = 9;
    sun.shadow.camera.top = 9;
    sun.shadow.camera.bottom = -9;
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 30;
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.015;
    scene.add(sun);
    const fill = new THREE.DirectionalLight("#dbe8ef", 0.7);
    fill.position.set(-7, 5, -5);
    scene.add(fill);

    const windowMaterials: THREE.MeshStandardMaterial[] = [];
    const nightLights: THREE.PointLight[] = [];
    const selectionTargets = new Map<string, THREE.Object3D[]>();
    const animated: Array<{ object: THREE.Object3D; baseY: number; speed: number; phase: number }> = [];
    const walkers: Array<{ group: THREE.Group; center: THREE.Vector2; radius: number; speed: number; phase: number }> = [];

    const root = new THREE.Group();
    scene.add(root);

    const baseWidth = mode === "area" ? areaGrid.w * areaScale : buildingGrid.w * buildingScale;
    const baseDepth = mode === "area" ? areaGrid.h * areaScale : buildingGrid.h * buildingScale;

    const plinth = box(
      root,
      [baseWidth + 0.55, 0.22, baseDepth + 0.55],
      "#b5c09e",
      [0, -0.19, 0],
      { rounded: 0.1, receive: true },
    );
    plinth.castShadow = false;
    const ground = new THREE.Mesh(
      new RoundedBoxGeometry(baseWidth + 0.34, 0.16, baseDepth + 0.34, 3, 0.08),
      mat(mode === "area" ? "#dfe7cf" : "#e7e4d4", 0.95),
    );
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    root.add(ground);

    if (mode === "area" && area) {
      for (const item of area.buildings) {
        const w = item.plan.w * areaScale;
        const d = item.plan.h * areaScale;
        const cx = (item.plan.x + item.plan.w / 2 - areaGrid.w / 2) * areaScale;
        const cz = (item.plan.y + item.plan.h / 2 - areaGrid.h / 2) * areaScale;
        box(root, [w + 0.24, 0.035, d + 0.24], "#f4f0e3", [cx, 0.075, cz], {
          rounded: 0.04,
          cast: false,
        });
      }

      box(root, [baseWidth + 0.05, 0.012, 0.3], "#f5f1e4", [0, 0.09, baseDepth / 2 - 0.3], { cast: false });
      box(root, [0.3, 0.012, baseDepth - 0.6], "#f5f1e4", [-baseWidth / 2 + 0.34, 0.09, 0], { cast: false });

      const seeded = (seed: number) => {
        let t = seed;
        return () => {
          t += 0x6d2b79f5;
          let r = t;
          r = Math.imul(r ^ (r >>> 15), r | 1);
          r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
          return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
      };
      const rand = seeded(42);
      let treeCount = 0;
      let attempts = 0;
      while (treeCount < 15 && attempts < 160) {
        attempts += 1;
        const gx = 0.5 + rand() * (areaGrid.w - 1);
        const gy = 0.5 + rand() * (areaGrid.h - 1);
        const blocked = area.buildings.some(
          (item) =>
            gx > item.plan.x - 0.7 &&
            gx < item.plan.x + item.plan.w + 0.7 &&
            gy > item.plan.y - 0.7 &&
            gy < item.plan.y + item.plan.h + 0.7,
        );
        if (blocked) continue;
        tree(
          root,
          (gx - areaGrid.w / 2) * areaScale,
          (gy - areaGrid.h / 2) * areaScale,
          0.85 + rand() * 0.5,
        );
        treeCount += 1;
      }

      lamp(root, -baseWidth / 2 + 0.36, -baseDepth / 2 + 0.4, nightLights);
      lamp(root, baseWidth / 2 - 0.36, baseDepth / 2 - 0.4, nightLights);
      lamp(root, baseWidth / 2 - 0.36, -baseDepth / 2 + 0.45, nightLights);

      for (const item of area.buildings) {
        const w = (item.plan.w * areaScale) * 0.84;
        const d = (item.plan.h * areaScale) * 0.82;
        const cx = (item.plan.x + item.plan.w / 2 - areaGrid.w / 2) * areaScale;
        const cz = (item.plan.y + item.plan.h / 2 - areaGrid.h / 2) * areaScale;
        const heightBase =
          item.category.includes("Residential") || item.category.includes("Live")
            ? 1.55
            : item.category.includes("Garden")
              ? 0.72
              : item.category.includes("Social")
                ? 1.1
                : item.category.includes("Market")
                  ? 1.3
                  : item.category.includes("Film")
                    ? 1.4
                    : 1.45;
        const height = heightBase + item.level * 0.035;
        const group = new THREE.Group();
        group.position.set(cx, 0, cz);
        group.userData.selectId = item.id;
        root.add(group);

        const glass = item.category.includes("Garden");
        const bodyMat = glass
          ? new THREE.MeshPhysicalMaterial({
              color: item.accentSoft,
              transparent: true,
              opacity: 0.62,
              roughness: 0.18,
              metalness: 0.05,
            })
          : mat(item.accentSoft, 0.82);
        const body = new THREE.Mesh(new RoundedBoxGeometry(w, height, d, 3, 0.075), bodyMat);
        body.position.y = height / 2 + 0.08;
        body.castShadow = true;
        body.receiveShadow = true;
        group.add(body);

        box(group, [w + 0.07, 0.16, d + 0.07], item.accent, [0, 0.13, 0], { rounded: 0.025 });
        box(group, [w * 0.3, height * 0.55, 0.025], "#6d7468", [-w * 0.12, height * 0.36, d / 2 + 0.015], {
          cast: false,
        });
        box(group, [w * 0.205, height * 0.27, 0.01], "#f3ead8", [-w * 0.12, height * 0.43, d / 2 + 0.03], {
          cast: false,
        });
        box(group, [w * 0.21, height * 0.42, 0.028], item.roof, [w * 0.27, height * 0.3, d / 2 + 0.02], {
          cast: false,
        });

        const windowMat = new THREE.MeshStandardMaterial({
          color: "#acc4c1",
          emissive: new THREE.Color("#ffcf85"),
          emissiveIntensity: 0,
          roughness: 0.22,
          metalness: 0.22,
        });
        windowMaterials.push(windowMat);
        const columns = Math.max(3, Math.min(5, Math.round(w / 0.55)));
        for (let i = 0; i < columns; i += 1) {
          const wx = -w * 0.31 + (i * w * 0.62) / Math.max(1, columns - 1);
          const wmesh = new THREE.Mesh(new THREE.BoxGeometry(w * 0.085, height * 0.19, 0.02), windowMat);
          wmesh.position.set(wx, height * 0.48, d / 2 + 0.02);
          group.add(wmesh);
          const back = new THREE.Mesh(new THREE.BoxGeometry(w * 0.085, height * 0.19, 0.02), windowMat);
          back.position.set(wx, height * 0.48, -d / 2 - 0.02);
          group.add(back);
        }
        for (let i = 0; i < 2; i += 1) {
          for (const side of [-1, 1]) {
            const wmesh = new THREE.Mesh(new THREE.BoxGeometry(0.02, height * 0.18, d * 0.16), windowMat);
            wmesh.position.set(side * (w / 2 + 0.02), height * 0.45, -d * 0.18 + i * d * 0.32);
            group.add(wmesh);
          }
        }

        if (glass) {
          const roof = new THREE.Mesh(
            new THREE.ConeGeometry(1, 1, 4),
            new THREE.MeshPhysicalMaterial({
              color: "#e6f0d8",
              transparent: true,
              opacity: 0.5,
              roughness: 0.15,
              metalness: 0.05,
            }),
          );
          roof.position.y = height + 0.38;
          roof.rotation.y = Math.PI / 4;
          roof.scale.set(w * 0.82, 0.7, d * 0.82);
          roof.castShadow = true;
          group.add(roof);
          for (let i = 0; i < 3; i += 1) {
            box(group, [w * 0.16, 0.1, d * 0.65], "#8d7355", [-w * 0.25 + i * w * 0.25, 0.24, 0], {
              rounded: 0.02,
            });
            tree(group, -w * 0.25 + i * w * 0.25, 0, 0.5);
          }
        } else if (item.category.includes("Social") || item.category.includes("Market")) {
          box(group, [w + 0.15, 0.06, d + 0.15], item.roof, [0, height + 0.06, 0], { rounded: 0.03 });
          box(group, [w * 0.4, 0.16, d * 0.22], "#f4efdf", [w * 0.16, height + 0.16, 0], { rounded: 0.02 });
          for (let i = 0; i < 5; i += 1) {
            box(group, [w * 0.1, 0.06, 0.26], i % 2 ? "#f4e1c3" : item.accent, [-w * 0.38 + i * w * 0.12, height + 0.1, d / 2 + 0.12], {
              rotate: [0.28, 0, 0],
            });
          }
          for (let i = 0; i < 2; i += 1) {
            cylinder(group, 0.03, 0.03, 0.35, "#7e7d6b", [-w * 0.3 + i * 0.45, 0.22, d / 2 + 0.32], 6);
            const umbrella = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.12, 8), mat(i % 2 ? "#f0e6d2" : item.roof));
            umbrella.position.set(-w * 0.3 + i * 0.45, 0.42, d / 2 + 0.32);
            umbrella.castShadow = true;
            group.add(umbrella);
          }
        } else {
          box(group, [w * 1.03, 0.08, d * 1.03], item.roof, [0, height + 0.08, 0], { rounded: 0.02 });
          box(group, [w * 1.03, 0.035, d * 1.03], item.accent, [0, height + 0.14, 0], { rounded: 0.015, cast: false });
          if (item.level > 2) {
            box(group, [w * 0.26, 0.28, d * 0.22], "#e8e2d2", [-w * 0.25, height + 0.24, -d * 0.2], {
              rounded: 0.03,
            });
            cylinder(group, 0.012, 0.012, 0.4, "#59635a", [w * 0.3, height + 0.3, d * 0.1], 5);
            const antennaTip = new THREE.Mesh(
              new THREE.SphereGeometry(0.035, 8, 8),
              new THREE.MeshStandardMaterial({
                color: "#f2b47e",
                emissive: new THREE.Color("#f2b47e"),
                emissiveIntensity: 0.5,
              }),
            );
            antennaTip.position.set(w * 0.3, height + 0.52, d * 0.1);
            group.add(antennaTip);
          }
          if (item.category.includes("Innovation")) {
            for (let i = 0; i < 3; i += 1) {
              box(group, [w * 0.2, 0.05, d * 0.92], item.accent, [-w * 0.27 + i * w * 0.27, height + 0.2, 0], {
                rotate: [0.24, 0, 0],
              });
            }
          }
        }

        tree(group, w * 0.44, d * 0.41, 0.68);
        tree(group, -w * 0.45, d * 0.42, 0.58);

        const label = labelSprite(item.name, item.category, 0.52);
        label.position.set(0, height + (glass ? 1.04 : 0.74), 0);
        group.add(label);

        const highlight = new THREE.Group();
        const hlMat = new THREE.MeshBasicMaterial({ color: "#c9f95f", transparent: true, opacity: 0.28, depthWrite: false });
        const glow = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.3, d + 0.3), hlMat);
        glow.rotation.x = -Math.PI / 2;
        glow.position.y = 0.11;
        highlight.add(glow);
        const lineMat = new THREE.LineBasicMaterial({ color: "#5d7a23", transparent: true, opacity: 0.95 });
        const points = [
          new THREE.Vector3(-(w + 0.2) / 2, 0.14, -(d + 0.2) / 2),
          new THREE.Vector3((w + 0.2) / 2, 0.14, -(d + 0.2) / 2),
          new THREE.Vector3((w + 0.2) / 2, 0.14, (d + 0.2) / 2),
          new THREE.Vector3(-(w + 0.2) / 2, 0.14, (d + 0.2) / 2),
          new THREE.Vector3(-(w + 0.2) / 2, 0.14, -(d + 0.2) / 2),
        ];
        const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), lineMat);
        highlight.add(line);
        highlight.visible = false;
        highlight.userData.pulseMaterial = hlMat;
        group.add(highlight);
        selectionTargets.set(item.id, [highlight]);
      }

      const presenceColor = "#cf6d47";
      const presence = makePerson(presenceColor, "#172019");
      presence.scale.setScalar(1.3);
      presence.position.set(baseWidth * 0.28, 0.09, baseDepth * 0.35);
      root.add(presence);
      const presenceRing = new THREE.Mesh(
        new THREE.RingGeometry(0.13, 0.17, 24),
        new THREE.MeshBasicMaterial({ color: "#c9f95f", transparent: true, opacity: 0.8, side: THREE.DoubleSide }),
      );
      presenceRing.rotation.x = -Math.PI / 2;
      presenceRing.position.set(presence.position.x, 0.1, presence.position.z);
      root.add(presenceRing);
      walkers.push({
        group: presence,
        center: new THREE.Vector2(presence.position.x, presence.position.z),
        radius: 0.4,
        speed: 0.22,
        phase: 0,
      });
      for (let i = 0; i < 2; i += 1) {
        const citizen = makePerson(i === 0 ? "#5c8ca4" : "#8fa83e", "#efeadc");
        citizen.scale.setScalar(1.05);
        citizen.position.set(-baseWidth * 0.35 + i * 0.55, 0.09, -baseDepth * 0.39);
        root.add(citizen);
        walkers.push({
          group: citizen,
          center: new THREE.Vector2(citizen.position.x, citizen.position.z),
          radius: 0.3,
          speed: 0.14 + i * 0.05,
          phase: Math.PI + i,
        });
      }
    }

    if (mode === "building" && building) {
      box(root, [baseWidth + 0.34, 0.08, baseDepth + 0.34], "#ece8d8", [0.06, 0.05, 0.08], {
        rounded: 0.1,
        cast: false,
      });
      box(root, [baseWidth, 0.18, baseDepth], "#f4f0e2", [0, 0.03, 0], { rounded: 0.06, cast: false });

      const entranceX = (2.5 - buildingGrid.w / 2) * buildingScale;
      box(root, [1.15, 0.05, 0.9], "#d9d4c2", [entranceX, 0.12, baseDepth / 2 + 0.32], {
        rounded: 0.05,
        cast: false,
      });
      box(root, [1.15, 0.02, 0.9], "#f7f4e9", [entranceX, 0.155, baseDepth / 2 + 0.32], { cast: false });
      tree(root, -baseWidth / 2 - 0.16, baseDepth / 2 - 0.45, 0.72);
      tree(root, baseWidth / 2 + 0.14, baseDepth / 2 - 0.35, 0.6);
      lamp(root, baseWidth / 2 + 0.22, -baseDepth / 2 + 0.25, nightLights);

      for (const room of building.rooms) {
        const style = ROOM_STYLES[room.type];
        const rw = room.w * buildingScale - 0.05;
        const rd = room.h * buildingScale - 0.05;
        const cx = (room.x + room.w / 2 - buildingGrid.w / 2) * buildingScale;
        const cz = (room.y + room.h / 2 - buildingGrid.h / 2) * buildingScale;
        const group = new THREE.Group();
        group.position.set(cx, 0, cz);
        group.userData.selectId = room.id;
        root.add(group);

        box(group, [rw, 0.07, rd], style.floor, [0, 0.16, 0], { rounded: 0.025, cast: false });
        const wallColor = "#efe9dc";
        box(group, [rw, 0.52, 0.045], wallColor, [0, 0.45, -rd / 2], { rounded: 0.012 });
        box(group, [rw, 0.52, 0.045], wallColor, [0, 0.45, rd / 2], { rounded: 0.012 });
        box(group, [0.045, 0.52, rd], wallColor, [-rw / 2, 0.45, 0], { rounded: 0.012 });
        box(group, [0.045, 0.52, rd], wallColor, [rw / 2, 0.45, 0], { rounded: 0.012 });
        for (const sx of [-rw / 2, rw / 2]) {
          for (const sz of [-rd / 2, rd / 2]) {
            box(group, [0.075, 0.58, 0.075], style.color, [sx, 0.46, sz], { rounded: 0.015 });
          }
        }
        box(group, [rw - 0.05, 0.025, rd - 0.05], "#fbfaf4", [0, 0.08, 0], { cast: false });

        roomFurniture(group, room, rw, rd);

        const label = labelSprite(room.name, style.label, 0.27);
        label.position.set(0, 1.06, 0);
        group.add(label);
        animated.push({ object: label, baseY: 1.06, speed: 0.001, phase: room.x + room.y });

        const highlight = new THREE.Mesh(
          new THREE.BoxGeometry(rw + 0.06, 0.05, rd + 0.06),
          new THREE.MeshBasicMaterial({ color: "#c9f95f", transparent: true, opacity: 0.38, depthWrite: false }),
        );
        highlight.position.y = 0.24;
        highlight.visible = false;
        highlight.userData.pulseMaterial = highlight.material;
        group.add(highlight);
        selectionTargets.set(room.id, [highlight]);

        if (room.staff) {
          const member =
            room.staff === building.guard.name
              ? building.guard
              : room.staff === building.receptionist.name
                ? building.receptionist
                : undefined;
          if (member) {
            const person = makePerson(
              member.role === "Guard" ? "#283b4a" : "#b86443",
              member.role === "Guard" ? "#c9f95f" : "#f6e6c8",
            );
            person.position.set(
              member.role === "Guard" ? rw * 0.33 : -rw * 0.22,
              0.1,
              member.role === "Guard" ? rd * 0.22 : -rd * 0.3,
            );
            person.scale.setScalar(1.15);
            group.add(person);
            const personLabel = labelSprite(member.name.split(" ")[0], member.role, 0.17, true);
            personLabel.position.set(person.position.x, 0.66, person.position.z);
            group.add(personLabel);
          }
        }
      }

      const guard = makePerson("#283b4a", "#c9f95f");
      guard.scale.setScalar(1.35);
      guard.position.set(entranceX - 0.9, 0.1, baseDepth / 2 - 0.12);
      root.add(guard);
      animated.push({ object: guard, baseY: 0.1, speed: 0.0016, phase: 1.2 });
      walkers.push({
        group: guard,
        center: new THREE.Vector2(guard.position.x, guard.position.z),
        radius: 0.16,
        speed: 0.18,
        phase: 0.4,
      });
      const badge = labelSprite(building.guard.name.split(" ")[0], "Front guard", 0.13, true);
      badge.position.set(guard.position.x, 0.68, guard.position.z);
      root.add(badge);
    }

    const entranceLabel =
      mode === "area" && area
        ? labelSprite("YOU ARE HERE", area.lotCode, 0.17, true)
        : mode === "building" && building
          ? labelSprite("SITE ENTRY", building.category, 0.15, true)
          : null;
    if (entranceLabel) {
      const x = mode === "area" ? baseWidth * 0.24 : (2.5 - buildingGrid.w / 2) * buildingScale;
      const z = mode === "area" ? baseDepth * 0.44 : baseDepth / 2 + 0.72;
      entranceLabel.position.set(x, 0.62, z);
      root.add(entranceLabel);
    }

    let goal: { position: THREE.Vector3; target: THREE.Vector3 } | null = null;
    const setView = (next: SceneView) => {
      const base = basePositions[next];
      const currentAspect = Math.max(width / height, 0.55);
      const distanceFit = Math.max(1, 1.16 / currentAspect);
      goal = {
        position: new THREE.Vector3(base[0] * distanceFit, base[1] * distanceFit, base[2] * distanceFit),
        target: new THREE.Vector3(0, next === "top" ? 0.05 : 0.32, 0),
      };
    };

    const setTime = (next: TimeOfDay) => {
      const isNight = next === "night";
      const isDusk = next === "dusk";
      hemi.intensity = isNight ? 0.36 : isDusk ? 0.95 : 1.55;
      hemi.color.set(isNight ? "#8ba7b8" : isDusk ? "#ffd6ad" : "#fdfbf1");
      hemi.groundColor.set(isNight ? "#3f5147" : "#b8c49f");
      ambient.intensity = isNight ? 0.16 : 0.35;
      sun.intensity = isNight ? 0.4 : isDusk ? 1.2 : 2.35;
      sun.color.set(isNight ? "#a7c4d8" : isDusk ? "#ffb988" : "#fff4d8");
      fill.intensity = isNight ? 0.24 : 0.7;
      fill.color.set(isNight ? "#6b93ad" : "#dbe8ef");
      scene.fog = new THREE.Fog(isNight ? "#26342f" : isDusk ? "#d8ccb6" : "#e6ead9", 22, 40);
      for (const material of windowMaterials) {
        material.emissiveIntensity = isNight ? 1.8 : isDusk ? 0.65 : 0;
      }
      for (const light of nightLights) {
        light.intensity = isNight ? 1.1 : isDusk ? 0.45 : 0;
      }
    };

    const select = (id?: string) => {
      selectionTargets.forEach((objects, key) => {
        for (const object of objects) object.visible = key === id;
      });
    };

    select(selectedRef.current);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown = { x: 0, y: 0 };
    const onPointerDown = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
      renderer.domElement.style.cursor = "grabbing";
    };
    const onPointerUp = (event: PointerEvent) => {
      renderer.domElement.style.cursor = "grab";
      if (Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(root.children, true);
      for (const hit of intersections) {
        let object: THREE.Object3D | null = hit.object;
        while (object) {
          const id = object.userData.selectId as string | undefined;
          if (id) {
            onSelectRef.current?.(id);
            return;
          }
          object = object.parent;
        }
      }
    };
    renderer.domElement.style.cursor = "grab";
    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);

    const resize = new ResizeObserver(() => {
      const nextWidth = Math.max(container.clientWidth, 280);
      const nextHeight = Math.max(container.clientHeight, 200);
      camera.aspect = nextWidth / nextHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(nextWidth, nextHeight);
    });
    resize.observe(container);

    let frame = 0;
    const clock = new THREE.Clock();
    const animate = () => {
      frame = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();
      if (goal) {
        camera.position.lerp(goal.position, 0.085);
        controls.target.lerp(goal.target, 0.085);
        if (camera.position.distanceTo(goal.position) < 0.04) goal = null;
      }
      for (const [key, objects] of selectionTargets) {
        if (objects[0]?.visible && key === selectedRef.current) {
          const pulseMaterial = objects[0].userData.pulseMaterial as THREE.MeshBasicMaterial | undefined;
          if (pulseMaterial) pulseMaterial.opacity = 0.26 + Math.sin(elapsed * 2.6) * 0.1;
        }
      }
      for (const walker of walkers) {
        const angle = elapsed * walker.speed + walker.phase;
        walker.group.position.x = walker.center.x + Math.cos(angle) * walker.radius;
        walker.group.position.z = walker.center.y + Math.sin(angle) * walker.radius;
        walker.group.rotation.y = -angle;
      }
      for (const bob of animated) {
        if (bob.speed > 0.001) bob.object.position.y = bob.baseY + Math.sin(elapsed * 2 + bob.phase) * 0.02;
      }
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    apiRef.current = { select, setView, setTime };
    setTime(timeOfDay);

    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      scene.traverse((object) => {
        const mesh = object as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const objectMaterial = mesh.material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(objectMaterial)) {
          objectMaterial.forEach((entry) => {
            const map = (entry as THREE.MeshStandardMaterial).map;
            map?.dispose();
            entry.dispose();
          });
        } else if (objectMaterial) {
          const map = (objectMaterial as THREE.MeshStandardMaterial).map;
          map?.dispose();
          objectMaterial.dispose();
        }
      });
      renderer.dispose();
      renderer.forceContextLoss();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      apiRef.current = null;
    };
    // The scene is intentionally rebuilt only when its layout data changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, dataKey]);

  useEffect(() => {
    apiRef.current?.select(selectedId);
  }, [selectedId, dataKey]);

  useEffect(() => {
    apiRef.current?.setView(view);
  }, [view, dataKey]);

  useEffect(() => {
    apiRef.current?.setTime(timeOfDay);
  }, [timeOfDay, dataKey]);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden",
        timeOfDay === "day" ? "scene-day" : timeOfDay === "dusk" ? "scene-dusk" : "scene-night",
        className,
      )}
      role="img"
      aria-label={ariaLabel}
    >
      <div ref={mountRef} className="h-full w-full" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_10%,transparent_45%,rgba(23,32,25,.08)_100%)]" />
    </div>
  );
}
