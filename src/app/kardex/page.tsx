import type { Metadata } from "next";
import KardexUpload from "@/components/kardex/kardexUpload";
import { getKardexHistory } from "../actions/kardex";
import { getUserSummary } from "../actions/me";
import BroadcastUserSummary from "@/components/kardex/broadcastUserSummary";

export const metadata: Metadata = {
    title: "Carga de archivos | Kardex",
    description: "Sube tu Kardex en PDF y consulta el historial de cargas.",
}

export default async function KardexPage(){
    const [history, summary] = await Promise.all([
        getKardexHistory().catch(() => [] as any[]),
        getUserSummary().catch(() => null),
    ]);

    return (
        <main className="w-full mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">

            <BroadcastUserSummary summary={summary} />

            <section>
                {/* <h1 className="text-xl sm:text-2xl font-semibold mb-4">Carga de archivos</h1> */}
            <KardexUpload maxSizeMB={5} initialHistory={history} />
            </section>
        </main>
    );
}