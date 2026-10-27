"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { Plant } from "@/lib/types";
import { climateText } from "@/lib/types";

type PlantInput = {
  name: string;
  dayTemp: string;
  nightTemp: string;
  lightNote: string;
};

const EMPTY: PlantInput = { name: "", dayTemp: "", nightTemp: "", lightNote: "" };

export function PlantManager() {
  const [items, setItems] = useState<Plant[]>([]);
  const [form, setForm] = useState<PlantInput>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  async function load() {
    setItems(await api.plants());
  }

  useEffect(() => {
    let cancelled = false;
    load()
      .catch((caught: unknown) => {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "식물을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api.createPlant(form);
      setForm(EMPTY);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "식물을 추가하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>식물</h1>
          <p className="lede">관리하는 식물을 추가하거나 빼 둡니다. 다른 식물을 들이면 여기에 이름을 넣으면 됩니다.</p>
        </div>
      </header>

      {error ? (
        <div className="banner" role="alert">
          <span>{error}</span>
          <button type="button" onClick={() => setError(null)}>
            닫기
          </button>
        </div>
      ) : null}

      <form className="catalog-form plant-form" onSubmit={onCreate}>
        <label>
          식물 이름
          <input
            value={form.name}
            maxLength={40}
            placeholder="심비디움"
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
        </label>
        <label>
          낮 온도
          <input
            value={form.dayTemp}
            maxLength={40}
            placeholder="20–24°C"
            onChange={(event) => setForm({ ...form, dayTemp: event.target.value })}
          />
        </label>
        <label>
          밤 온도
          <input
            value={form.nightTemp}
            maxLength={40}
            placeholder="10–15°C"
            onChange={(event) => setForm({ ...form, nightTemp: event.target.value })}
          />
        </label>
        <label>
          광
          <input
            value={form.lightNote}
            maxLength={80}
            placeholder="밝게"
            onChange={(event) => setForm({ ...form, lightNote: event.target.value })}
          />
        </label>
        <button type="submit" className="primary" disabled={pending}>
          식물 추가
        </button>
      </form>

      <section className="sheet">
        {items.length === 0 ? (
          <p className="empty-note">{loading ? "식물을 불러오는 중입니다." : "등록된 식물이 없습니다."}</p>
        ) : (
          <ul className="catalog">
            {items.map((item) => (
              <PlantRow
                key={item.id}
                item={item}
                onError={setError}
                onChanged={async () => {
                  await load();
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function PlantRow({
  item,
  onError,
  onChanged,
}: {
  item: Plant;
  onError: (message: string | null) => void;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<PlantInput>({
    name: item.name,
    dayTemp: item.dayTemp ?? "",
    nightTemp: item.nightTemp ?? "",
    lightNote: item.lightNote ?? "",
  });
  const [pending, setPending] = useState(false);
  const climate = climateText(item);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    onError(null);
    try {
      await api.updatePlant(item.id, form);
      setEditing(false);
      await onChanged();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "식물을 수정하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(`${item.name}을 식물 목록에서 삭제합니다.`);
    if (!confirmed) return;
    setPending(true);
    onError(null);
    try {
      await api.deletePlant(item.id);
      await onChanged();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "식물을 삭제하지 못했습니다.");
      setPending(false);
    }
  }

  if (editing) {
    return (
      <li>
        <form className="catalog-edit plant-edit" onSubmit={onSave}>
          <input value={form.name} maxLength={40} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          <input
            value={form.dayTemp}
            maxLength={40}
            placeholder="낮 온도"
            onChange={(event) => setForm({ ...form, dayTemp: event.target.value })}
          />
          <input
            value={form.nightTemp}
            maxLength={40}
            placeholder="밤 온도"
            onChange={(event) => setForm({ ...form, nightTemp: event.target.value })}
          />
          <input
            value={form.lightNote}
            maxLength={80}
            placeholder="광"
            onChange={(event) => setForm({ ...form, lightNote: event.target.value })}
          />
          <button type="submit" className="primary" disabled={pending}>
            저장
          </button>
          <button type="button" className="ghost" onClick={() => setEditing(false)}>
            취소
          </button>
        </form>
      </li>
    );
  }

  return (
    <li>
      <div>
        <strong>{item.name}</strong>
        <span>
          {item.batchCount}배치{climate ? ` · ${climate}` : ""}
        </span>
      </div>
      <div className="row-actions">
        <button type="button" className="ghost" onClick={() => setEditing(true)} disabled={pending}>
          수정
        </button>
        <button type="button" className="ghost danger" onClick={onDelete} disabled={pending}>
          삭제
        </button>
      </div>
    </li>
  );
}
