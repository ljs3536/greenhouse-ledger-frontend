"use client";

import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import type { Greenhouse } from "@/lib/types";

export function GreenhouseManager() {
  const [items, setItems] = useState<Greenhouse[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);

  async function load() {
    const next = await api.greenhouses();
    setItems(next);
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
  }, []);

  async function onCreate(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await api.createGreenhouse(name);
      setName("");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "온실을 추가하지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <header className="page-head">
        <div>
          <h1>온실</h1>
          <p className="lede">동의 수는 정해져 있지 않습니다. 새로 쓰는 온실을 여기에 추가합니다.</p>
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

      <form className="catalog-form" onSubmit={onCreate}>
        <label>
          온실 이름
          <input
            value={name}
            maxLength={40}
            placeholder="1동"
            onChange={(event) => setName(event.target.value)}
            required
          />
        </label>
        <button type="submit" className="primary" disabled={pending}>
          온실 추가
        </button>
      </form>

      <section className="sheet">
        {items.length === 0 ? (
          <p className="empty-note">{loading ? "온실을 불러오는 중입니다." : "등록된 온실이 없습니다."}</p>
        ) : (
          <ul className="catalog">
            {items.map((item) => (
              <GreenhouseRow
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

function GreenhouseRow({
  item,
  onError,
  onChanged,
}: {
  item: Greenhouse;
  onError: (message: string | null) => void;
  onChanged: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(item.name);
  const [pending, setPending] = useState(false);

  async function onSave(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    onError(null);
    try {
      await api.updateGreenhouse(item.id, name);
      setEditing(false);
      await onChanged();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "온실 이름을 바꾸지 못했습니다.");
    } finally {
      setPending(false);
    }
  }

  async function onDelete() {
    const confirmed = window.confirm(`${item.name} 온실을 삭제합니다.`);
    if (!confirmed) return;
    setPending(true);
    onError(null);
    try {
      await api.deleteGreenhouse(item.id);
      await onChanged();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "온실을 삭제하지 못했습니다.");
      setPending(false);
    }
  }

  if (editing) {
    return (
      <li>
        <form className="catalog-edit" onSubmit={onSave}>
          <input value={name} maxLength={40} onChange={(event) => setName(event.target.value)} required />
          <button type="submit" className="primary" disabled={pending}>
            저장
          </button>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              setName(item.name);
              setEditing(false);
            }}
          >
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
        <span>{item.batchCount}배치</span>
      </div>
      <div className="row-actions">
        <button type="button" className="ghost" onClick={() => setEditing(true)} disabled={pending}>
          이름 변경
        </button>
        <button type="button" className="ghost danger" onClick={onDelete} disabled={pending}>
          삭제
        </button>
      </div>
    </li>
  );
}
