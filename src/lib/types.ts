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
  batchCount: number;
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

export type Summary = {
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

export function climateText(plant: Pick<Plant, "dayTemp" | "nightTemp" | "lightNote">): string | null {
  const parts = [
    plant.dayTemp ? `낮 ${plant.dayTemp}` : null,
    plant.nightTemp ? `밤 ${plant.nightTemp}` : null,
    plant.lightNote,
  ].filter((part): part is string => Boolean(part));
  return parts.length > 0 ? parts.join(" · ") : null;
}
