"use client";

export default function Error({error, reset}: { error: Error; reset: () => void }) {
    return (
        <main className="mx-auto max-w-5xl p-4 space-y-3">
            <h1 className="text-2xl font-bold">Bir şeyler ters gitti</h1>
            <p className="opacity-80 text-sm">{error.message}</p>
            <button
                onClick={() => reset()}
                className="rounded-lg border border-white/20 px-3 py-1"
            >
                Tekrar dene
            </button>
        </main>
    );
}

/*
*
* error.tsx segment icin hata siniri (error boundary). reset() -> yeniden dene.
*
* */