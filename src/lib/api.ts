import type { Batch, BatchDetail, MovementType, Stage, Summary } from "./types";

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
  batches: () => request<Batch[]>("/api/batches"),
  batch: (id: number) => request<BatchDetail>(`/api/batches/${id}`),
  createBatch: (input: {
    houseId: number;
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
