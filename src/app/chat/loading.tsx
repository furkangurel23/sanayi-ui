export default function Loading() {
    return (
        <main className="container page">
            <div className="skeleton" style={{height: 32, width: "16rem"}}/>
            <div className="grid-3">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="skeleton" style={{height: 84}}/>
                ))}
            </div>
        </main>
    );
}
