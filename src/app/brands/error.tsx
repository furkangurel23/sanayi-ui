"use client";

export default function Error({error, reset}: { error: Error; reset: () => void }) {
    return (
        <main className="container page">
            <div className="empty-state">
                <div style={{fontSize: "2rem"}} aria-hidden>⚠️</div>
                <b>Bir şeyler ters gitti</b>
                <span>{error.message}</span>
                <button onClick={() => reset()} className="btn btn-outline">Tekrar dene</button>
            </div>
        </main>
    );
}
