"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Controls, GreenhouseDetail as Detail, SensorReading } from "@/lib/types";
import { STAGE_LABEL, formatDate, formatPots } from "@/lib/types";

const DEVICES = [
  { key: "heater", device: "HEATER", label: "난방", effect: "온도를 올립니다" },
  { key: "cooler", device: "COOLER", label: "냉방", effect: "온도를 내립니다" },
  { key: "vent", device: "VENT", label: "환기", effect: "습도를 내립니다" },
  { key: "humidifier", device: "HUMIDIFIER", label: "가습", effect: "습도를 올립니다" },
  { key: "growLight", device: "GROW_LIGHT", label: "보광", effect: "광을 올립니다" },
  { key: "shade", device: "SHADE", label: "차광", effect: "광을 내립니다" },
] as const;

type DeviceKey = (typeof DEVICES)[number]["key"];

export function GreenhouseDetail({ greenhouseId }: { greenhouseId: number }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [sensor, setSensor] = useState<SensorReading | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  async function load() {
    const next = await api.greenhouse(greenhouseId);
    setDetail(next);
    setSensor(next.sensor);
  }

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "온실을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [greenhouseId]);

  useEffect(() => {
    const source = new EventSource("/api/sensors/stream");
    source.addEventListener("readings", (event) => {
      const message = event as MessageEvent<string>;
      try {
        const readings = JSON.parse(message.data) as SensorReading[];
        const mine = readings.find((item) => item.greenhouseId === greenhouseId) ?? null;
        setSensor(mine);
      } catch {
        setSensor(null);
      }
      api.greenhouse(greenhouseId).then(setDetail).catch(() => undefined);
    });
    return () => source.close();
  }, [greenhouseId]);

  async function setDevice(key: DeviceKey, enabled: boolean) {
    if (!detail) return;
    setPending(true);
    setError(null);
    const controls: Controls = { ...detail.controls, [key]: enabled };
    try {
      const next = await api.updateControls(greenhouseId, controls);
      setDetail({ ...detail, controls: next });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "장치를 바꾸지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  const controls = detail?.controls;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="eyebrow">온실</p>
          <h1>{detail?.name ?? "온실"}</h1>
          <p className="lede">
            센서가 식물 범위를 벗어나면 난방, 냉방, 환기, 가습, 보광, 차광 중 맞는 장치를 켭니다. 켜 둔 장치는 센서 에뮬레이터가 값을 보낼 때마다 그 방향으로 움직입니다.
          </p>
        </div>
        <Link href="/greenhouses" className="ghost">
          온실 목록
        </Link>
      </header>

      {error ? <p className="banner">{error}</p> : null}

      <section className="block" aria-label="현재 센서">
        <div className="block-head">
          <h2>현재 센서</h2>
        </div>
        {loading ? (
          <p className="empty-note">온실을 불러오는 중입니다.</p>
        ) : sensor ? (
          <p className="climate">
            {sensor.temperature.toFixed(1)}°C · 습도 {sensor.humidity}% · 광 {sensor.light.toLocaleString("ko-KR")}lx · {sensor.recordedAt.slice(11, 19)}
          </p>
        ) : (
          <p className="empty-note">아직 이 동의 센서 값이 없습니다. 센서 에뮬레이터에서 보내면 여기에 나타납니다.</p>
        )}
      </section>

      <section className="block" aria-label="필요한 조작">
        <div className="block-head">
          <h2>필요한 조작</h2>
        </div>
        {loading ? (
          <p className="empty-note">온실을 불러오는 중입니다.</p>
        ) : (detail?.suggestions.length ?? 0) === 0 ? (
          <p className="empty-note">지금 범위를 벗어난 항목이 없습니다.</p>
        ) : (
          <ul className="suggestions">
            {detail?.suggestions.map((item) => {
              const device = DEVICES.find((entry) => entry.device === item.device);
              const enabled = device ? controls?.[device.key] : false;
              return (
                <li key={`${item.device}-${item.plantName}`} className="suggestion">
                  <strong>
                    {item.plantName} · {item.label}
                  </strong>
                  <em>
                    {item.reason} · {item.effect}
                  </em>
                  {device ? (
                    <button type="button" className="primary" disabled={pending || enabled} onClick={() => setDevice(device.key, true)}>
                      {enabled ? `${item.label} 켜짐` : `${item.label} 켜기`}
                    </button>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="block" aria-label="장치">
        <div className="block-head">
          <h2>장치</h2>
        </div>
        <div className="control-grid">
          {DEVICES.map((device) => {
            const enabled = controls?.[device.key] ?? false;
            return (
              <article key={device.key} className={enabled ? "control-card on" : "control-card"}>
                <strong>{device.label}</strong>
                <p>{device.effect}</p>
                <button type="button" className="ghost" disabled={pending || !controls} onClick={() => setDevice(device.key, !enabled)}>
                  {enabled ? "끄기" : "켜기"}
                </button>
              </article>
            );
          })}
        </div>
      </section>

      <section className="block" aria-label="이 동의 배치">
        <div className="block-head">
          <h2>이 동의 배치</h2>
          <Link href={`/batches?greenhouse=${greenhouseId}`}>배치 목록</Link>
        </div>
        {(detail?.batches.length ?? 0) === 0 ? (
          <p className="empty-note">{loading ? "온실을 불러오는 중입니다." : "이 온실에 등록된 배치가 없습니다."}</p>
        ) : (
          <ul className="catalog">
            {detail?.batches.map((batch) => (
              <li key={batch.id}>
                <div>
                  <strong>{batch.plantName}</strong>
                  <span>
                    {STAGE_LABEL[batch.stage]} · {formatPots(batch.quantity)} · {formatDate(batch.plantedOn)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
