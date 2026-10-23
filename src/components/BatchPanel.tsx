"use client";

import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { BatchDetail, MovementType, Stage } from "@/lib/types";
import {
  MOVEMENT_LABEL,
  MOVEMENT_TYPES,
  STAGE_LABEL,
  STAGES,
  daysSince,
  formatDate,
  formatPots,
  todayISO,
} from "@/lib/types";

type Props = {
  detail: BatchDetail | null;
  onChanged: () => void;
  onDeleted: () => void;
};

export function BatchPanel({ detail, onChanged, onDeleted }: Props) {
  if (!detail) {
    return (
      <aside className="panel empty-panel">
        <p className="eyebrow">배치</p>
        <h2>배치를 고르면 단계와 수량을 기록합니다</h2>
        <p>입고, 폐기, 판매는 이 화면에 날짜와 함께 남습니다.</p>
      </aside>
    );
  }

  return <BatchEditor key={detail.id} detail={detail} onChanged={onChanged} onDeleted={onDeleted} />;
}

function BatchEditor({
  detail,
  onChanged,
  onDeleted,
}: {
  detail: BatchDetail;
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const [type, setType] = useState<MovementType>("INBOUND");
  const [quantity, setQuantity] = useState("1");
  const [occurredOn, setOccurredOn] = useState(todayISO);
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [stagePending, setStagePending] = useState(false);

  const saleLocked = type === "SALE" && detail.stage !== "READY";
  const emptyOutbound = type !== "INBOUND" && detail.quantity === 0;

  async function onStage(stage: Stage) {
    if (stage === detail.stage || stagePending) return;
    setStagePending(true);
    setError(null);
    try {
      await api.changeStage(detail.id, stage);
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "단계를 바꾸지 못했습니다.");
    } finally {
      setStagePending(false);
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const pots = Number(quantity);
    if (!Number.isInteger(pots) || pots < 1) {
      setError("수량은 1 이상의 정수입니다.");
      return;
    }
    setPending(true);
    setError(null);
    try {
      await api.addMovement(detail.id, { type, quantity: pots, occurredOn, memo });
      setQuantity("1");
      setMemo("");
      onChanged();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "수량을 기록하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(`${detail.cropName} 배치와 수량 기록을 삭제합니다.`);
    if (!confirmed) return;
    setPending(true);
    setError(null);
    try {
      await api.deleteBatch(detail.id);
      onDeleted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "배치를 삭제하지 못했습니다.");
      setPending(false);
    }
  }

  return (
    <aside className="panel">
      <p className="eyebrow">{detail.houseName}</p>
      <h2>{detail.cropName}</h2>
      <p className="meta">
        심은 날 {formatDate(detail.plantedOn)} · {daysSince(detail.plantedOn)}일째
      </p>
      {detail.note ? <p className="note-line">{detail.note}</p> : null}

      <div className="quantity-block">
        <span>현재 수량</span>
        <strong>{formatPots(detail.quantity)}</strong>
        {detail.quantity === 0 ? <em>소진</em> : null}
        {detail.stage === "READY" && detail.quantity > 0 ? <em className="ready">출하 가능</em> : null}
      </div>

      <div className="stage-row" role="group" aria-label="생장 단계">
        {STAGES.map((stage) => (
          <button
            key={stage}
            type="button"
            className={stage === detail.stage ? "is-current" : ""}
            aria-pressed={stage === detail.stage}
            disabled={stagePending}
            onClick={() => onStage(stage)}
          >
            {STAGE_LABEL[stage]}
          </button>
        ))}
      </div>

      <form className="movement-form" onSubmit={onSubmit}>
        <div className="segment" role="group" aria-label="수량 기록 종류">
          {MOVEMENT_TYPES.map((item) => (
            <button key={item} type="button" aria-pressed={type === item} onClick={() => setType(item)}>
              {MOVEMENT_LABEL[item]}
            </button>
          ))}
        </div>

        <div className="split">
          <label>
            수량
            <input
              type="number"
              min={1}
              max={type === "INBOUND" ? undefined : detail.quantity || undefined}
              step={1}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <label>
            날짜
            <input type="date" value={occurredOn} onChange={(event) => setOccurredOn(event.target.value)} required />
          </label>
        </div>

        <label>
          메모
          <input
            type="text"
            maxLength={200}
            value={memo}
            placeholder={type === "SALE" ? "매장 판매" : type === "DISPOSAL" ? "잎마름" : "추가 모종"}
            onChange={(event) => setMemo(event.target.value)}
          />
        </label>

        {saleLocked ? <p className="hint">판매 출고는 출하 가능 단계에서 기록합니다.</p> : null}
        {emptyOutbound ? <p className="hint">이 배치의 현재 수량은 0포트입니다.</p> : null}
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}

        <button type="submit" className="primary wide" disabled={pending || saleLocked || emptyOutbound}>
          {pending ? "기록하는 중" : `${MOVEMENT_LABEL[type]} 기록`}
        </button>
      </form>

      <section className="history">
        <h3>기록</h3>
        {detail.history.length === 0 ? <p className="hint">아직 기록이 없습니다.</p> : null}
        <ol>
          {detail.history.map((item) => (
            <li key={item.id}>
              <time dateTime={item.date}>{formatDate(item.date)}</time>
              {item.kind === "movement" && item.type && item.quantity != null ? (
                <span className={`history-main ${item.type.toLowerCase()}`}>
                  {MOVEMENT_LABEL[item.type]} {item.type === "INBOUND" ? "+" : "−"}
                  {item.quantity}
                </span>
              ) : (
                <span className="history-main stage">
                  {item.fromStage ? STAGE_LABEL[item.fromStage] : ""} → {item.toStage ? STAGE_LABEL[item.toStage] : ""}
                </span>
              )}
              {item.memo ? <span className="history-memo">{item.memo}</span> : null}
            </li>
          ))}
        </ol>
      </section>

      <button type="button" className="text-danger" onClick={onDelete} disabled={pending}>
        이 배치 삭제
      </button>
    </aside>
  );
}
