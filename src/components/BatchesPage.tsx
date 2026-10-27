"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BatchPanel } from "@/components/BatchPanel";
import { CreateBatchDialog } from "@/components/CreateBatchDialog";
import { api } from "@/lib/api";
import type { Batch, BatchDetail, Greenhouse, Plant, Stage } from "@/lib/types";
import { STAGE_LABEL, STAGES, daysSince, formatDate, formatPots } from "@/lib/types";

function initialId(value: string | null): number | "all" {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : "all";
}

export function BatchesPage() {
  const params = useSearchParams();
  const [greenhouses, setGreenhouses] = useState<Greenhouse[]>([]);
  const [plants, setPlants] = useState<Plant[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [detail, setDetail] = useState<BatchDetail | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [greenhouseFilter, setGreenhouseFilter] = useState<number | "all">(() => initialId(params.get("greenhouse")));
  const [plantFilter, setPlantFilter] = useState<number | "all">(() => initialId(params.get("plant")));
  const [stageFilter, setStageFilter] = useState<Stage | "all">("all");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [version, setVersion] = useState(0);

  const reload = useCallback(async () => {
    const [nextGreenhouses, nextPlants, nextBatches] = await Promise.all([
      api.greenhouses(),
      api.plants(),
      api.batches(),
    ]);
    setGreenhouses(nextGreenhouses);
    setPlants(nextPlants);
    setBatches(nextBatches);
  }, []);

  useEffect(() => {
    let cancelled = false;
    reload()
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "배치를 불러오지 못했습니다.");
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
    if (greenhouseFilter !== "all" && batch.greenhouseId !== greenhouseFilter) return false;
    if (plantFilter !== "all" && batch.plantId !== plantFilter) return false;
    if (stageFilter !== "all" && batch.stage !== stageFilter) return false;
    return true;
  });

  const canCreate = greenhouses.length > 0 && plants.length > 0;

  return (
    <>
      <header className="page-head">
        <div>
          <h1>배치</h1>
          <p className="lede">심은 날과 단계, 입고·폐기·판매를 배치로 남깁니다.</p>
        </div>
        <button type="button" className="primary" onClick={() => setCreating(true)} disabled={!canCreate}>
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

      {!loading && !canCreate ? (
        <p className="empty-note">배치를 등록하려면 온실과 식물이 하나씩은 있어야 합니다.</p>
      ) : null}

      <div className="workspace">
        <section className="sheet">
          <div className="sheet-head filters">
            <h2>목록</h2>
            <label>
              온실
              <select
                value={greenhouseFilter}
                onChange={(event) =>
                  setGreenhouseFilter(event.target.value === "all" ? "all" : Number(event.target.value))
                }
              >
                <option value="all">전체</option>
                {greenhouses.map((greenhouse) => (
                  <option key={greenhouse.id} value={greenhouse.id}>
                    {greenhouse.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              식물
              <select
                value={plantFilter}
                onChange={(event) => setPlantFilter(event.target.value === "all" ? "all" : Number(event.target.value))}
              >
                <option value="all">전체</option>
                {plants.map((plant) => (
                  <option key={plant.id} value={plant.id}>
                    {plant.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
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
                  <th>식물</th>
                  <th>온실</th>
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
                      {loading ? "배치를 불러오는 중입니다." : "이 조건에 해당하는 배치가 없습니다."}
                    </td>
                  </tr>
                ) : (
                  visible.map((batch) => (
                    <tr key={batch.id} className={batch.id === selectedId ? "is-selected" : ""}>
                      <td>
                        <button type="button" className="row-button" onClick={() => setSelectedId(batch.id)}>
                          {batch.plantName}
                        </button>
                      </td>
                      <td>{batch.greenhouseName}</td>
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
          greenhouses={greenhouses}
          plants={plants}
          defaultGreenhouseId={greenhouseFilter === "all" ? (greenhouses[0]?.id ?? null) : greenhouseFilter}
          defaultPlantId={plantFilter === "all" ? (plants[0]?.id ?? null) : plantFilter}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setSelectedId(id);
            setCreating(false);
            refresh();
          }}
        />
      ) : null}
    </>
  );
}
