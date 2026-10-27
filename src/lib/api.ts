import type { Batch, BatchDetail, Greenhouse, MovementType, Plant, Stage, Summary } from "./types";

type PlantWrite = {
  name: string;
  dayTemp: string;
  nightTemp: string;
  lightNote: string;
  seedlingDays: number | null;
  growthDays: number | null;
  spikeDays: number | null;
  bloomDays: number | null;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, {
      ...init,
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("서버에 연결하지 못했습니다. 백엔드와 MariaDB가 켜져 있는지 확인해 주세요.");
  }

  const text = await response.text();
  let data: { message?: string } | null = null;
  if (text) {
    try {
      data = JSON.parse(text) as { message?: string };
    } catch {
      data = null;
    }
  }
  if (!response.ok) {
    throw new Error(data?.message ?? "요청을 처리하지 못했습니다.");
  }
  return data as T;
}

export const api = {
  summary: () => request<Summary>("/api/summary"),
  greenhouses: () => request<Greenhouse[]>("/api/greenhouses"),
  createGreenhouse: (name: string) =>
    request<{ id: number }>("/api/greenhouses", { method: "POST", body: JSON.stringify({ name }) }),
  updateGreenhouse: (id: number, name: string) =>
    request<{ ok: boolean }>(`/api/greenhouses/${id}`, { method: "PATCH", body: JSON.stringify({ name }) }),
  deleteGreenhouse: (id: number) => request<{ ok: boolean }>(`/api/greenhouses/${id}`, { method: "DELETE" }),
  plants: () => request<Plant[]>("/api/plants"),
  createPlant: (input: PlantWrite) =>
    request<{ id: number }>("/api/plants", { method: "POST", body: JSON.stringify(input) }),
  updatePlant: (id: number, input: PlantWrite) =>
    request<{ ok: boolean }>(`/api/plants/${id}`, { method: "PATCH", body: JSON.stringify(input) }),
  deletePlant: (id: number) => request<{ ok: boolean }>(`/api/plants/${id}`, { method: "DELETE" }),
  batches: () => request<Batch[]>("/api/batches"),
  batch: (id: number) => request<BatchDetail>(`/api/batches/${id}`),
  createBatch: (input: {
    greenhouseId: number;
    plantId: number;
    plantedOn: string;
    stage: Stage;
    quantity: number;
    note: string;
  }) =>
    request<{ id: number }>("/api/batches", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  changeStage: (id: number, stage: Stage) =>
    request<{ ok: boolean }>(`/api/batches/${id}/stage`, {
      method: "PATCH",
      body: JSON.stringify({ stage }),
    }),
  addMovement: (
    id: number,
    input: { type: MovementType; quantity: number; occurredOn: string; memo: string },
  ) =>
    request<{ ok: boolean }>(`/api/batches/${id}/movements`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteBatch: (id: number) => request<{ ok: boolean }>(`/api/batches/${id}`, { method: "DELETE" }),
};
