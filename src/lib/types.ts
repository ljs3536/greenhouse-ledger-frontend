export const STAGES = ["SEEDLING", "GROWTH", "SPIKE", "BLOOM", "READY"] as const;
export const MOVEMENT_TYPES = ["INBOUND", "DISPOSAL", "SALE"] as const;

export type Stage = (typeof STAGES)[number];
export type MovementType = (typeof MOVEMENT_TYPES)[number];

export const STAGE_LABEL: Record<Stage, string> = {
  SEEDLING: "육묘",
  GROWTH: "생장",
  SPIKE: "꽃대",
  BLOOM: "개화",
  READY: "출하 가능",
};

export const MOVEMENT_LABEL: Record<MovementType, string> = {
  INBOUND: "입고",
  DISPOSAL: "폐기",
  SALE: "판매",
};

export type Greenhouse = {
  id: number;
  name: string;
  batchCount: number;
};

export type Plant = {
  id: number;
  name: string;
  dayTemp: string | null;
  nightTemp: string | null;
  lightNote: string | null;
  seedlingDays: number | null;
  growthDays: number | null;
  spikeDays: number | null;
  bloomDays: number | null;
  dayTempMin: number | null;
  dayTempMax: number | null;
  nightTempMin: number | null;
  nightTempMax: number | null;
  humidityMin: number | null;
  humidityMax: number | null;
  lightMin: number | null;
  lightMax: number | null;
  batchCount: number;
};

export type SensorReading = {
  greenhouseId: number;
  greenhouseName: string;
  temperature: number;
  humidity: number;
  light: number;
  recordedAt: string;
};

export type AttentionItem = {
  batchId: number;
  greenhouseId: number;
  greenhouseName: string;
  plantName: string;
  stage: Stage;
  quantity: number;
  daysInStage: number;
  referenceDays: number | null;
};

export type GreenhouseSummary = Greenhouse & {
  totalQuantity: number;
  sellableQuantity: number;
};

export type PlantSummary = Plant & {
  totalQuantity: number;
  sellableQuantity: number;
};

export type StageQuantity = {
  stage: Stage;
  quantity: number;
};

export type ClimateAlert = {
  greenhouseId: number;
  greenhouseName: string;
  plantId: number;
  plantName: string;
  label: string;
  value: string;
  range: string;
};

export type Summary = {
  attention: AttentionItem[];
  climate: ClimateAlert[];
  greenhouses: GreenhouseSummary[];
  plants: PlantSummary[];
  stages: StageQuantity[];
  totalQuantity: number;
  sellableQuantity: number;
  batchCount: number;
};

export type Batch = {
  id: number;
  greenhouseId: number;
  greenhouseName: string;
  plantId: number;
  plantName: string;
  plantedOn: string;
  stage: Stage;
  note: string | null;
  quantity: number;
};

export type HistoryItem = {
  id: string;
  kind: "movement" | "stage";
  date: string;
  memo: string | null;
  type?: MovementType;
  quantity?: number;
  fromStage?: Stage;
  toStage?: Stage;
};

export type BatchDetail = Batch & {
  history: HistoryItem[];
};

export function todayISO(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatDate(value: string): string {
  const [year, month, day] = value.split("-");
  return `${year}.${month}.${day}`;
}

export function daysSince(value: string): number {
  const [year, month, day] = value.split("-").map(Number);
  const planted = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - planted.getTime()) / 86_400_000));
}

export function formatPots(value: number): string {
  return `${value.toLocaleString("ko-KR")}포트`;
}

export function stageDaysText(
  plant: Pick<Plant, "seedlingDays" | "growthDays" | "spikeDays" | "bloomDays">,
): string | null {
  const parts = [
    plant.seedlingDays ? `육묘 ${plant.seedlingDays}일` : null,
    plant.growthDays ? `생장 ${plant.growthDays}일` : null,
    plant.spikeDays ? `꽃대 ${plant.spikeDays}일` : null,
    plant.bloomDays ? `개화 ${plant.bloomDays}일` : null,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function thresholdText(plant: Pick<Plant, "dayTempMin" | "dayTempMax" | "nightTempMin" | "nightTempMax" | "humidityMin" | "humidityMax" | "lightMin" | "lightMax">): string | null {
  const parts = [
    span("낮", plant.dayTempMin, plant.dayTempMax, "°C", true),
    span("밤", plant.nightTempMin, plant.nightTempMax, "°C", true),
    span("습도", plant.humidityMin, plant.humidityMax, "%", false),
    span("광", plant.lightMin, plant.lightMax, "lx", false),
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}

function span(label: string, min: number | null, max: number | null, unit: string, decimal: boolean): string | null {
  if (min == null && max == null) return null;
  const text = (value: number) => (decimal ? value.toFixed(1) : value.toLocaleString("ko-KR"));
  if (min != null && max != null) return `${label} ${text(min)}–${text(max)}${unit}`;
  if (min != null) return `${label} ${text(min)}${unit} 이상`;
  return `${label} ${text(max as number)}${unit} 이하`;
}

export function climateText(plant: Pick<Plant, "dayTemp" | "nightTemp" | "lightNote">): string | null {
  const parts = [
    plant.dayTemp ? `낮 ${plant.dayTemp}` : null,
    plant.nightTemp ? `밤 ${plant.nightTemp}` : null,
    plant.lightNote,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}
