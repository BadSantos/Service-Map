export type ViewLevel = "cluster" | "service" | "internal" | "external";

export interface UrlState {
  view: ViewLevel;
  type: "all" | "http" | "external" | "internal" | "server";
  lat: number;
  t: number;
  node: string | null;
  svc: string | null;
}

export const DEFAULT_URL_STATE: UrlState = {
  view: "cluster",
  type: "all",
  lat: 0,
  t: 0,
  node: null,
  svc: null,
};

const VIEW_VALUES: ViewLevel[] = ["cluster", "service", "internal", "external"];
const TYPE_VALUES = ["all", "http", "external", "internal", "server"] as const;
type TypeVal = (typeof TYPE_VALUES)[number];

export function readUrlState(): UrlState {
  if (typeof window === "undefined") return DEFAULT_URL_STATE;
  const p = new URLSearchParams(window.location.search);

  const viewParam = p.get("view");
  const typeParam = p.get("type");
  const latParam = p.get("lat");
  const tParam = p.get("t");

  const view: ViewLevel = (VIEW_VALUES as string[]).includes(viewParam ?? "")
    ? (viewParam as ViewLevel)
    : DEFAULT_URL_STATE.view;

  const type: TypeVal = (TYPE_VALUES as readonly string[]).includes(typeParam ?? "")
    ? (typeParam as TypeVal)
    : DEFAULT_URL_STATE.type;

  let lat = Number(latParam);
  if (!Number.isFinite(lat) || lat < 0 || lat > 200) lat = DEFAULT_URL_STATE.lat;

  let t = Number(tParam);
  if (!Number.isFinite(t) || t < 0 || t > 1440) t = DEFAULT_URL_STATE.t;

  return {
    view,
    type,
    lat,
    t,
    node: p.get("node") || null,
    svc: p.get("svc") || null,
  };
}

export function writeUrlState(state: UrlState) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams();

  if (state.view !== DEFAULT_URL_STATE.view) p.set("view", state.view);
  if (state.type !== DEFAULT_URL_STATE.type) p.set("type", state.type);
  if (state.lat !== DEFAULT_URL_STATE.lat) p.set("lat", String(state.lat));
  if (state.t !== DEFAULT_URL_STATE.t) p.set("t", String(state.t));
  if (state.node) p.set("node", state.node);
  if (state.svc && state.view !== "cluster") p.set("svc", state.svc);

  const qs = p.toString();
  const newPath = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  const current = window.location.pathname + window.location.search;
  if (newPath !== current) {
    window.history.replaceState(null, "", newPath);
  }
}

export async function copyShareableLink(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const url = window.location.href;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(url);
      return true;
    }
  } catch {
    // fall through to fallback
  }
  // Fallback: textarea + execCommand
  try {
    const ta = document.createElement("textarea");
    ta.value = url;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}
