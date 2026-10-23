"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { HouseSummary, Stage } from "@/lib/types";
import { STAGE_LABEL, STAGES, todayISO } from "@/lib/types";

type Props = {
  houses: HouseSummary[];
  defaultHouseId: number | null;
  onClose: () => void;
  onCreated: (id: number) => void;
};

export function CreateBatchDialog({ houses, defaultHouseId, onClose, onCreated }: Props) {
  const [houseId, setHouseId] = useState(defaultHouseId ?? houses[0]?.id ?? 0);
  const [plantedOn, setPlantedOn] = useState(todayISO);
  const [stage, setStage] = useState<Stage>("SEEDLING");
  const [quantity, setQuantity] = useState("20");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const pots = Number(quantity);
    if (!houseId) {
      setError("하우스를 선택해 주세요.");
      return;
    }
    if (!Number.isInteger(pots) || pots < 1) {
      setError("포트 수는 1 이상의 정수입니다.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const created = await api.createBatch({ houseId, plantedOn, stage, quantity: pots, note });
      onCreated(created.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "배치를 등록하지 못했습니다.");
      setPending(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-title"
        onMouseDown={(event) => event.stopPropagation()}
        onSubmit={onSubmit}
      >
        <header className="modal-head">
          <div>
            <p className="eyebrow">새 배치</p>
            <h2 id="create-title">지금 키우는 포트를 등록합니다</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="닫기">
            닫기
          </button>
        </header>

        <label>
          하우스
          <select value={houseId} onChange={(event) => setHouseId(Number(event.target.value))}>
            {houses.map((house) => (
              <option key={house.id} value={house.id}>
                {house.name} · {house.cropName}
              </option>
            ))}
          </select>
        </label>

        <div className="split">
          <label>
            심은 날
            <input type="date" value={plantedOn} onChange={(event) => setPlantedOn(event.target.value)} required />
          </label>
          <label>
            현재 단계
            <select value={stage} onChange={(event) => setStage(event.target.value as Stage)}>
              {STAGES.map((item) => (
                <option key={item} value={item}>
                  {STAGE_LABEL[item]}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label>
          포트 수
          <input
            type="number"
            min={1}
            step={1}
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            required
          />
        </label>

        <label>
          메모
          <input
            type="text"
            maxLength={200}
            value={note}
            placeholder="설 출하용, 중품"
            onChange={(event) => setNote(event.target.value)}
          />
        </label>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <footer className="modal-actions">
          <button type="button" className="ghost" onClick={onClose}>
            취소
          </button>
          <button type="submit" className="primary" disabled={pending}>
            {pending ? "등록하는 중" : "배치 등록"}
          </button>
        </footer>
      </form>
    </div>
  );
}
