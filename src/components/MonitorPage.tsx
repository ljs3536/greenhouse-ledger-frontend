"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { SensorReading, Summary } from "@/lib/types";
import { STAGE_LABEL, climateText, formatPots } from "@/lib/types";

export function MonitorPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sensors, setSensors] = useState<SensorReading[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .summary()
      .then((next) => {
        if (!cancelled) setSummary(next);
      })
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "현황을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const source = new EventSource("/api/sensors/stream");
    source.addEventListener("readings", (event) => {
      const message = event as MessageEvent<string>;
      try {
        setSensors(JSON.parse(message.data) as SensorReading[]);
      } catch {
        setSensors([]);
      }
      api.summary().then(setSummary).catch(() => undefined);
    });
    return () => source.close();
  }, []);

  const greenhouses = summary?.greenhouses ?? [];
  const plants = summary?.plants ?? [];

  return (
    <>
      <header className="page-head">
        <div>
          <h1>모니터링</h1>
          <p className="lede">오늘 확인할 배치와, 센서가 식물 범위를 벗어난 온실을 봅니다.</p>
        </div>
      </header>

      {error ? <p className="banner">{error}</p> : null}

      <section className="block" aria-label="환경 범위">
        <div className="block-head">
          <h2>환경 범위</h2>
        </div>
        {loading ? (
          <p className="empty-note">현황을 불러오는 중입니다.</p>
        ) : (summary?.climate?.length ?? 0) === 0 ? (
          <p className="empty-note">
            범위를 벗어난 온실이 없습니다. 식물에 온도·습도·광 범위를 적으면, 그 식물이 있는 동의 센서가 벗어날 때 여기에 모입니다.
          </p>
        ) : (
          <ul className="attention">
            {summary?.climate.map((item) => (
              <li key={`${item.greenhouseId}-${item.plantId}-${item.label}`}>
                <Link href={`/batches?greenhouse=${item.greenhouseId}`} className="out">
                  <span>
                    <strong>
                      {item.greenhouseName} · {item.plantName}
                    </strong>
                    <em>
                      {item.label} {item.value} · 기준 {item.range}
                    </em>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="block" aria-label="오늘 볼 배치">
        <div className="block-head">
          <h2>오늘 볼 배치</h2>
        </div>
        {loading ? (
          <p className="empty-note">현황을 불러오는 중입니다.</p>
        ) : (summary?.attention?.length ?? 0) === 0 ? (
          <p className="empty-note">
            기준 일수를 넘긴 배치와 출하 가능한 배치가 없습니다. 식물에 단계별 일수를 적으면 오래 머문 배치가 여기에 모입니다.
          </p>
        ) : (
          <ul className="attention">
            {summary?.attention.map((item) => (
              <li key={item.batchId}>
                <Link
                  href={`/batches?greenhouse=${item.greenhouseId}`}
                  className={item.stage === "READY" ? "ready" : "overdue"}
                >
                  <span>
                    <strong>
                      {item.greenhouseName} · {item.plantName}
                    </strong>
                    <em>
                      {item.stage === "READY"
                        ? `출하 가능 · 이 단계 ${item.daysInStage}일`
                        : `${STAGE_LABEL[item.stage]} ${item.daysInStage}일 · 기준 ${item.referenceDays}일`}
                    </em>
                  </span>
                  <b>{formatPots(item.quantity)}</b>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

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

      <section className="stage-board" aria-label="단계별 수량">
        {(summary?.stages ?? []).map((item) => (
          <article key={item.stage}>
            <span>{STAGE_LABEL[item.stage]}</span>
            <strong>{formatPots(item.quantity)}</strong>
          </article>
        ))}
      </section>

      <section className="block">
        <div className="block-head">
          <h2>온실</h2>
          <Link href="/greenhouses">온실 관리</Link>
        </div>
        {greenhouses.length === 0 ? (
          <p className="empty-note">
            {loading ? "현황을 불러오는 중입니다." : "등록된 온실이 없습니다. 온실 메뉴에서 동을 추가하면 여기에 수량이 나타납니다."}
          </p>
        ) : (
          <div className="house-grid">
            {greenhouses.map((greenhouse) => {
              const reading = sensors.find((item) => item.greenhouseId === greenhouse.id);
              return (
                <Link key={greenhouse.id} href={`/batches?greenhouse=${greenhouse.id}`} className="house-card">
                  <div className="house-top">
                    <span>온실</span>
                    <em>{greenhouse.batchCount}배치</em>
                  </div>
                  <h2>{greenhouse.name}</h2>
                  <p className="pots">{formatPots(greenhouse.totalQuantity)}</p>
                  <p className="sellable">출하 가능 {formatPots(greenhouse.sellableQuantity)}</p>
                  <p className="climate">
                    {reading
                      ? `센서 · ${reading.temperature.toFixed(1)}°C · 습도 ${reading.humidity}% · 광 ${reading.light.toLocaleString("ko-KR")}lx · ${reading.recordedAt.slice(11, 19)}`
                      : "센서 값 없음"}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      <section className="block">
        <div className="block-head">
          <h2>식물</h2>
          <Link href="/plants">식물 관리</Link>
        </div>
        {plants.length === 0 ? (
          <p className="empty-note">
            {loading ? "현황을 불러오는 중입니다." : "등록된 식물이 없습니다. 새로 들이는 식물은 식물 메뉴에 추가합니다."}
          </p>
        ) : (
          <div className="house-grid">
            {plants.map((plant) => {
              const climate = climateText(plant);
              return (
                <Link key={plant.id} href={`/batches?plant=${plant.id}`} className="house-card">
                  <div className="house-top">
                    <span>식물</span>
                    <em>{plant.batchCount}배치</em>
                  </div>
                  <h2>{plant.name}</h2>
                  <p className="pots">{formatPots(plant.totalQuantity)}</p>
                  <p className="sellable">출하 가능 {formatPots(plant.sellableQuantity)}</p>
                  {climate ? <p className="climate">기준 환경 · {climate}</p> : null}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
