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

export type HouseSummary = {
  id: number;
  code: string;
  name: string;
  cropCode: string;
  cropName: string;
  dayTemp: string;
  nightTemp: string;
  lightNote: string;
  batchCount: number;
  totalQuantity: number;
  sellableQuantity: number;
};

export type Summary = {
  houses: HouseSummary[];
  totalQuantity: number;
  sellableQuantity: number;
  batchCount: number;
};

export type Batch = {
  id: number;
  houseId: number;
  houseName: string;
  cropCode: string;
  cropName: string;
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
