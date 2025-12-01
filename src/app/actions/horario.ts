"use server";

import type { ScheduleData } from "@/types/academico";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...init,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Error ${res.status}: ${msg || res.statusText}`);
  }

  return res.json() as Promise<T>;
}

export async function getSchedule(expediente: string): Promise<ScheduleData> {
  if (!expediente) throw new Error("Expediente requerido");

  const q = `?studentId=${encodeURIComponent(expediente)}`;

  type Summary = {
    status: string;
    type: string;
    periodLabel: string; // ej. "2025-2"
  };

  type RawRow = {
    id: number;
    materiaId: number;
    materiaCodigo: string;
    materiaNombre: string;
    estatus: string;        // siempre "INSCRITO"
    periodo: string;        // "2025-2"
  };

  const [summary, rows] = await Promise.all([
    fetchJSON<Summary>(`/horario/summary${q}`),
    fetchJSON<RawRow[]>(`/horario/list${q}`),
  ]);

  const courses = (rows ?? []).map((r) => ({
    id: String(r.id),
    code: r.materiaCodigo,
    name: r.materiaNombre,
    status: r.estatus,
    period: r.periodo,
  }));

  const data: ScheduleData = {
    student: {
      status: summary.status,
      type: summary.type,
      currentSemester: summary.periodLabel,
    },
    courses,
  };

  return data;
}
