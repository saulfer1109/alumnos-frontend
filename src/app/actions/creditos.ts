// app/actions/creditos.ts

export type CreditsData = {
    current: number;   // créditos aprobados
    required: number;  // créditos necesarios para titularse
    english: {
        currentLevel: number;
        requiredLevel: number;
        scale?: number;
    };
    socialServiceFulFilled: boolean;
    professionalPracticeFulFilled: boolean;
    mobility: boolean;
};

// Lo que regresa tu backend en /users/summary
type BackendSummary = {
    name: string;
    expediente: string;
    promedioGeneral: number;
    promedioAnterior: number;
    creditosActuales: number;
    totalCreditos: number;
    porcentajeAvance: number;
    servicioSocialHabilitado: boolean;
    practicasProfesionalesHabilitado: boolean;
    nivelIngles: number | null;
};

const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function fetchJSON<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        // credentials: "include",
        ...init,
    });

    if (!res.ok) {
        const msg = await res.text().catch(() => "");
        throw new Error(`Error ${res.status}: ${msg || res.statusText}`);
    }

    return res.json() as Promise<T>;
}

export async function getCredits(): Promise<CreditsData> {
    const expediente =
        process.env.NEXT_PUBLIC_EXPEDIENTE ?? "222202156";

    const summary = await fetchJSON<BackendSummary>(
        `/users/summary?expediente=${encodeURIComponent(expediente)}`
    );

    const current = summary.creditosActuales ?? 0;
    const required = summary.totalCreditos ?? 0;

    const currentLevel = Number(summary.nivelIngles ?? 0);
    const requiredLevel = 5; // requisito de la carrera
    const scale = 7;         // niveles totales posibles

    const socialServiceFulFilled = !!summary.servicioSocialHabilitado;
    const professionalPracticeFulFilled = !!summary.practicasProfesionalesHabilitado;

    const mobility = socialServiceFulFilled;

    return {
        current,
        required,
        english: {
            currentLevel,
            requiredLevel,
            scale,
        },
        socialServiceFulFilled,
        professionalPracticeFulFilled,
        mobility,
    };
}
