export default function Loading() {
    return (
        <main className="container page">
            <div className="skeleton" style={{height: 32, width: "12rem"}}/>
            <div className="skeleton" style={{height: 180}}/>
            <div className="grid-2">
                {Array.from({length: 6}).map((_, i) => (
                    <div key={i} className="skeleton" style={{height: 96}}/>
                ))}
            </div>
        </main>
    );
}
