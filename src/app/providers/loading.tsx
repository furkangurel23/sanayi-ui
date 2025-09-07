export default function Loading() {
    return (
        <main className="mx-auto max-w-5xl p-4 space-y-3">
            <div className="h-7 w-40 rounded bg-white/10 animate-pulse"/>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="h-24 rounded-2xl border border-white/10 bg-white/5 animate-pulse"/>
                ))}
            </div>
        </main>
    );
}
