"use client";

import { useEffect, useState } from "react";
import { getSchedule } from "../actions/horario";

// Tipos: alineados con lo que arma getSchedule (ahora sin horario real)
export interface ScheduleCourse {
    id: string;
    code: string;
    name: string;
    // estos pueden venir sin valor desde el backend y se rellenan en el fallback
    day?: number;        // 1..5
    startTime?: string;  // "HH:MM" 24h
    endTime?: string;    // "HH:MM" 24h
    classroom?: string;
    professor?: string;
    status?: string;     // opcional: "INSCRITO"
    period?: string;     // opcional: "2025-2"
}

export interface ScheduleData {
    student: {
        status: string;
        type: string;
        currentSemester: string; // ej. "2025-2"
    };
    courses: ScheduleCourse[];
}

// Slots: 07:00 – 21:00
const TIME_SLOTS = [
    { start: "07:00", end: "08:00" },
    { start: "08:00", end: "09:00" },
    { start: "09:00", end: "10:00" },
    { start: "10:00", end: "11:00" },
    { start: "11:00", end: "12:00" },
    { start: "12:00", end: "13:00" },
    { start: "13:00", end: "14:00" },
    { start: "14:00", end: "15:00" },
    { start: "15:00", end: "16:00" },
    { start: "16:00", end: "17:00" },
    { start: "17:00", end: "18:00" },
    { start: "18:00", end: "19:00" },
    { start: "19:00", end: "20:00" },
    { start: "20:00", end: "21:00" },
];

const DAYS = [
    { id: 1, name: "Lunes" },
    { id: 2, name: "Martes" },
    { id: 3, name: "Miércoles" },
    { id: 4, name: "Jueves" },
    { id: 5, name: "Viernes" },
];

// ── utils de tiempo ─────────────────────────────────────────────────────────────
const toMinutes = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h * 60 + m;
};

// ── colores por materia ────────────────────────────────────────
const COLOR_VARIANTS = [
    // bg, border, title, text
    ["bg-[#8AB875]", "border-[#77AC5E]", "text-[#000000]", "text-[#000000]"],
    ["bg-[#75B8B5]", "border-[#5EACA8]", "text-[#000000]", "text-[#000000]"],
    ["bg-[#8975B8]", "border-[#755EAC]", "text-[#000000]", "text-[#000000]"],
    ["bg-[#7588B8]", "border-[#5E74AC]", "text-[#000000]", "text-[#000000]"],
    ["bg-[#B575B8]", "border-[#A85EAC]", "text-[#000000]", "text-[#000000]"],
    ["bg-[#B87576]", "border-[#A85EAC]", "text-[#000000]", "text-[#000000]"],
    ["bg-[#B6B875]", "border-[#A9AC5E]", "text-[#000000]", "text-[#000000]"],
];

const pickColor = (key: string) => {
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    return COLOR_VARIANTS[h % COLOR_VARIANTS.length];
};

// ── formateo de semestre ───────────────────────────────────────────────────────
function formatSemester(label: string): string {
    if (!label) return "----";
    const t = label.trim();

    // Caso tipo "2025-1" o "2025 1"
    const m = t.match(/^(\d{4})\s*[- ]\s*(\d)$/);
    if (m) return `${m[1]} - ${m[2]}`;

    // Caso viejo tipo "2511"
    if (/^\d{4}$/.test(t)) {
        const year = `20${t.slice(0, 2)}`;
        const period = t.slice(2);
        const sem = period === "11" || period === "12" ? "1" : "2";
        return `${year} - ${sem}`;
    }

    // Cualquier otra cosa, la mostramos tal cual
    return t;
}

/**
 * Genera un horario de fallback si no hay day/startTime/endTime:
 * - Asigna a cada materia el primer N bloques horarios (07–08, 08–09, …).
 * - Luego, la tabla la pintará ocupando TODA la fila (todas las columnas de días).
 */
function buildCoursesForRender(courses: ScheduleCourse[]) {
    const hasRealSchedule = courses.some(
        (c) => c.day && c.startTime && c.endTime
    );

    if (hasRealSchedule) {
        return { coursesForRender: courses, isFallback: false };
    }

    const coursesWithSlots = courses.map((c, index) => {
        const slot = TIME_SLOTS[index % TIME_SLOTS.length];
        return {
            ...c,
            // day aquí no lo usamos para el fallback de “toda la fila”
            day: 1,
            startTime: slot.start,
            endTime: slot.end,
        };
    });

    return { coursesForRender: coursesWithSlots, isFallback: true };
}

export default function HorariosPage() {
    const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const expediente =
                    typeof window !== "undefined"
                        ? localStorage.getItem("expediente")
                        : null;
                if (!expediente) {
                    setLoading(false);
                    return;
                }
                const data = await getSchedule(expediente);
                setScheduleData(data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50">
                <p className="text-gray-600">Cargando horarios…</p>
            </div>
        );
    }

    if (!scheduleData) {
        return (
            <div className="min-h-screen grid place-items-center bg-gray-50">
                <p className="text-red-600">No fue posible cargar el horario.</p>
            </div>
        );
    }

    const { student } = scheduleData;
    const { coursesForRender, isFallback } = buildCoursesForRender(
        scheduleData.courses
    );

    return (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Título */}
            <section className="mb-4">
                <div className="flex items-center gap-3">
                    <div className="flex w-1/10 h-1 bg-[#E6B10F]" />
                    <h1 className="text-2xl text-[#525252] font-extrabold">
                        Consulta de Horarios
                    </h1>
                    <div className="h-1 flex-1 rounded bg-[#E6B10F]" />
                </div>
            </section>

            {/* Chip gris con info del alumno */}
            <div className="mb-6 inline-flex flex-wrap items-center gap-3 rounded-full bg-[#E0E0E0] px-4 py-2 text-sm text-[#3F3F3F]">
                <span className="font-semibold">Semestre:</span>
                <span>{formatSemester(student.currentSemester)}</span>

                <span className="ml-4 font-semibold">Estatus:</span>
                <span>{student.status}</span>

                <span className="ml-4 font-semibold">Tipo de alumno:</span>
                <span>{student.type}</span>
            </div>

            {/* Tabla de horarios (mismo diseño) */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm w-full">
                <table className="w-full table-fixed border-collapse">
                    <colgroup>
                        {/* ancho exacto para que "11:00 - 12:00" quepa sin cortarse */}
                        <col style={{ width: "88px" }} />
                        <col style={{ width: "calc((100% - 88px)/5)" }} />
                        <col style={{ width: "calc((100% - 88px)/5)" }} />
                        <col style={{ width: "calc((100% - 88px)/5)" }} />
                        <col style={{ width: "calc((100% - 88px)/5)" }} />
                        <col style={{ width: "calc((100% - 88px)/5)" }} />
                    </colgroup>

                    <thead className="sticky top-0 z-10">
                        <tr className="bg-[#D9D9D9] text-[#525252]">
                            <th className="px-1 py-2 text-[13px] font-semibold border-r border-gray-700 whitespace-nowrap text-center">
                                Hora
                            </th>
                            {DAYS.map((d) => (
                                <th
                                    key={d.id}
                                    className="px-3 py-2 text-center text-[13px] font-semibold border-r border-[#777777] last:border-r-0"
                                >
                                    {d.name}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody>
                        {TIME_SLOTS.map((slot, rowIndex) => {
                            // Curso que corresponde a este bloque horario (por inicio)
                            const courseAtSlot = coursesForRender.find(
                                (c) => c.startTime === slot.start
                            );

                            return (
                                <tr
                                    key={slot.start}
                                    className="border-b border-gray-200 last:border-b-0"
                                >
                                    {/* Columna de hora */}
                                    <td className="px-1 py-2 text-[12px] font-medium text-[#000000] bg-gray-50 border-r whitespace-nowrap text-center">
                                        {slot.start} - {slot.end}
                                    </td>

                                    {DAYS.map((day) => {
                                        // MODO FALLBACK: materia ocupa TODA LA FILA
                                        if (isFallback) {
                                            if (!courseAtSlot) {
                                                return (
                                                    <td
                                                        key={`${day.id}-${slot.start}`}
                                                        className="px-2 py-2 border-r last:border-r-0 align-top text-xs h-[70px]"
                                                    />
                                                );
                                            }
                                            const [bg, border, title, text] =
                                                pickColor(courseAtSlot.code);
                                            return (
                                                <td
                                                    key={`${day.id}-${slot.start}`}
                                                    className="px-2 py-2 border-r last:border-r-0 align-top text-xs h-[70px]"
                                                >
                                                    <div
                                                        className={`${bg} ${border} rounded-lg border px-3 py-2 shadow-sm w-full h-full flex flex-col justify-center`}
                                                    >
                                                        <div
                                                            className={`font-semibold text-[13px] truncate ${title}`}
                                                        >
                                                            {courseAtSlot.name}
                                                        </div>
                                                        <div
                                                            className={`text-[11px] ${text}`}
                                                        >
                                                            {courseAtSlot.code}
                                                            {courseAtSlot.period
                                                                ? ` · ${courseAtSlot.period}`
                                                                : ""}
                                                        </div>
                                                        <div className="flex justify-between text-[10px] text-[#000000] mt-1">
                                                            <span>
                                                                {
                                                                    courseAtSlot.startTime
                                                                }
                                                                –
                                                                {
                                                                    courseAtSlot.endTime
                                                                }
                                                            </span>
                                                            {courseAtSlot.status && (
                                                                <span>
                                                                    {
                                                                        courseAtSlot
                                                                            .status
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            );
                                        }

                                        // MODO HORARIO REAL (si en el futuro vuelves a mandar day/startTime/endTime desde el backend)
                                        const starters = coursesForRender.filter(
                                            (c) =>
                                                c.day === day.id &&
                                                c.startTime === slot.start
                                        );

                                        const coveredByPrev =
                                            coursesForRender.some((c) => {
                                                if (c.day !== day.id)
                                                    return false;
                                                if (c.startTime === slot.start)
                                                    return false;
                                                const slotStart =
                                                    toMinutes(slot.start);
                                                return (
                                                    slotStart >=
                                                    toMinutes(c.startTime!) &&
                                                    slotStart <
                                                    toMinutes(c.endTime!)
                                                );
                                            });

                                        if (coveredByPrev) return null;

                                        return (
                                            <td
                                                key={`${day.id}-${slot.start}`}
                                                className="px-2 py-2 border-r last:border-r-0 align-top text-xs h-[70px]"
                                                rowSpan={
                                                    starters.length === 1
                                                        ? Math.max(
                                                            1,
                                                            TIME_SLOTS.filter(
                                                                (s) =>
                                                                    toMinutes(
                                                                        s.start
                                                                    ) >=
                                                                    toMinutes(
                                                                        starters[0]
                                                                            .startTime!
                                                                    ) &&
                                                                    toMinutes(
                                                                        s.end
                                                                    ) <=
                                                                    toMinutes(
                                                                        starters[0]
                                                                            .endTime!
                                                                    )
                                                            ).length
                                                        )
                                                        : 1
                                                }
                                            >
                                                {starters.map((course) => {
                                                    const [
                                                        bg,
                                                        border,
                                                        title,
                                                        text,
                                                    ] = pickColor(course.code);
                                                    return (
                                                        <div
                                                            key={course.id}
                                                            className={`${bg} ${border} rounded-lg border px-3 py-2 shadow-sm w-full h-full flex flex-col justify-center`}
                                                        >
                                                            <div
                                                                className={`font-semibold text-[13px] truncate ${title}`}
                                                            >
                                                                {course.name}
                                                            </div>
                                                            <div
                                                                className={`text-[11px] ${text}`}
                                                            >
                                                                {course.code}
                                                            </div>
                                                            <div className="flex justify-between text-[10px] text-[#000000] mt-1">
                                                                <span>
                                                                    {
                                                                        course.startTime
                                                                    }
                                                                    –
                                                                    {
                                                                        course.endTime
                                                                    }
                                                                </span>
                                                                {course.classroom && (
                                                                    <span>
                                                                        Aula{" "}
                                                                        {
                                                                            course.classroom
                                                                        }
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </main>
    );
}
