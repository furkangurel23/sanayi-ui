export default function Loading() {
    return (
        <main className="mx-auto max-w-4xl p-4 space-y-4">
            <div className="h-8 w-56 rounded bg-white/10 animate-pulse"/>
            <div className="h-4 w-80 rounded bg-white/10 animate-pulse"/>
            <div className="h-4 w-40 rounded bg-white/10 animate-pulse"/>
            <div className="h-6 w-24 rounded bg-white/10 animate-pulse"/>
            <div className="h-32 rounded-xl border border-white/10 bg-white/5 animate-pulse"/>
        </main>
    );
}
