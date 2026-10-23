"use client";

import { useCallback, useEffect, useState } from "react";
import { BatchPanel } from "@/components/BatchPanel";
import { CreateBatchDialog } from "@/components/CreateBatchDialog";
import { api } from "@/lib/api";
import type { Batch, BatchDetail, Stage, Summary } from "@/lib/types";
import { STAGE_LABEL, STAGES, daysSince, formatDate, formatPots } from "@/lib/types";

export function LedgerApp() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [houseFilter, setHouseFilter] = useState<number | "all">("all");
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const reload = useCallback(async () => {
    const [nextSummary, nextBatches] = await Promise.all([api.summary(), api.batches()]);
    setSummary(nextSummary);
    setBatches(nextBatches);
  }, []);

  useEffect(() => {
    let cancelled = false;
    reload()
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "장부를 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [reload, version]);

  useEffect(() => {
    if (selectedId == null) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    api
      .batch(selectedId)
      .then((next) => {
        if (!cancelled) setDetail(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "배치를 불러오지 못했습니다.");
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId, version]);

  function refresh() {
    setVersion((current) => current + 1);
  }

  const visible = batches.filter((batch) => {
    if (houseFilter !== "all" && batch.houseId !== houseFilter) return false;
    if (stageFilter !== "all" && batch.stage !== stageFilter) return false;
    return true;
  });

  const houses = summary?.houses ?? [];

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="eyebrow">Greenhouse ledger</p>
          <h1>네 동의 장부</h1>
          <p className="lede">
            심비디움, 호접란, 덴파레, 온시디움. 동마다 몇 포트를 어느 단계까지 키우고 있는지 기록합니다.
          </p>
        </div>
        <button type="button" className="primary" onClick={() => setCreating(true)} disabled={houses.length === 0}>
          배치 등록
        </button>
      </header>

      {error ? (
        <div className="banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            닫기
          </button>
        </div>
      ) : null}

      <section className="stats" aria-label="전체 수량">
        <article>
          <span>전체 포트</span>
          <strong>{loading ? "…" : formatPots(summary?.totalQuantity ?? 0)}</strong>
        </article>
        <article>
          <span>출하 가능</span>
          <strong>{loading ? "…" : formatPots(summary?.sellableQuantity ?? 0)}</strong>
        </article>
        <article>
          <span>배치</span>
          <strong>{loading ? "…" : `${summary?.batchCount ?? 0}개`}</strong>
        </article>
      </section>

      <section className="house-grid" aria-label="비닐하우스">
        {houses.map((house) => (
          <button
            key={house.id}
            type="button"
            className={`house-card crop-${house.cropCode} ${houseFilter === house.id ? "is-selected" : ""}`}
            aria-pressed={houseFilter === house.id}
            onClick={() => setHouseFilter((current) => (current === house.id ? "all" : house.id))}
          >
            <div className="house-top">
              <span>{house.name}</span>
              <em>{house.batchCount}배치</em>
            </div>
            <h2>{house.cropName}</h2>
            <p className="pots">{formatPots(house.totalQuantity)}</p>
            <p className="sellable">출하 가능 {formatPots(house.sellableQuantity)}</p>
            <p className="climate">
              기준 환경 · 낮 {house.dayTemp} · 밤 {house.nightTemp} · {house.lightNote}
            </p>
          </button>
        ))}
      </section>

      <div className="workspace">
        <section className="sheet">
          <div className="sheet-head">
            <h2>배치</h2>
            <label className="stage-filter">
              단계
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value as Stage | "all")}>
                <option value="all">전체</option>
                {STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABEL[stage]}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>품종</th>
                  <th>동</th>
                  <th>심은 날</th>
                  <th>경과일</th>
                  <th>단계</th>
                  <th>수량</th>
                </tr>
              </thead>
              <tbody>
                {visible.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="empty-cell">
                      {loading
                        ? "장부를 불러오는 중입니다."
                        : "이 조건에 해당하는 배치가 없습니다. 배치 등록으로 지금 키우는 포트를 남기면 됩니다."}
                    </td>
                  </tr>
                ) : (
                  visible.map((batch) => (
                    <tr
                      key={batch.id}
                      className={batch.id === selectedId ? "is-selected" : ""}
                      onClick={() => setSelectedId(batch.id)}
                    >
                      <td>
                        <button type="button" className="row-button" onClick={() => setSelectedId(batch.id)}>
                          {batch.cropName}
                        </button>
                      </td>
                      <td>{batch.houseName}</td>
                      <td>{formatDate(batch.plantedOn)}</td>
                      <td>{daysSince(batch.plantedOn)}일</td>
                      <td>
                        <span className={`pill stage-${batch.stage.toLowerCase()}`}>{STAGE_LABEL[batch.stage]}</span>
                      </td>
                      <td className="num">{formatPots(batch.quantity)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <BatchPanel
          detail={detail}
          onChanged={refresh}
          onDeleted={() => {
            setSelectedId(null);
            refresh();
          }}
        />
      </div>

      {creating ? (
        <CreateBatchDialog
          houses={houses}
          defaultHouseId={houseFilter === "all" ? (houses[0]?.id ?? null) : houseFilter}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setSelectedId(id);
            setCreating(false);
            refresh();
          }}
        />
      ) : null}
    </div>
  );
}
