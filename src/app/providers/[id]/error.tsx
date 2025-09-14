"use client";

export default function Error({error, reset}: { error: Error; reset: () => void }) {
    return (
        <main className="mx-auto max-w-4xl p-4 space-y-3">
            <h1 className="text-2xl font-bold">Bir şeyler ters gitti</h1>
            <p className="text-sm opacity-80">{error.message}</p>
            <button onClick={() => reset()} className="rounded-lg border border-white/20 px-3 py-1">
                Tekrar dene
            </button>
        </main>
    );
}
