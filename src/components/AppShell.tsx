"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const LINKS = [
  { href: "/", label: "모니터링" },
  { href: "/batches", label: "배치" },
  { href: "/greenhouses", label: "온실" },
  { href: "/plants", label: "식물" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="page">
      <header className="mast">
        <Link href="/" className="brand">
          <p className="eyebrow">Greenhouse ledger</p>
          <strong>온실 관리</strong>
        </Link>
        <nav className="nav" aria-label="주요 메뉴">
          {LINKS.map((link) => {
            const current = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} aria-current={current ? "page" : undefined}>
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      {children}
    </div>
  );
}
