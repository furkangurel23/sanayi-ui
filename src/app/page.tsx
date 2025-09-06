export default function Home() {
    return (
        <main className="mx-auto max-w-5xl p-4 space-y-4">
            <h1 className="text-2xl font-bold">Sanayi</h1>
            <p className="opacity-80">Ankara'da usta/servisleri görüntüle, yorumları oku, puanla.</p>
            <div>
                <a href="/brands" className="rounded-xl border border-white/20 px-3 py-2 inline-block">
                    Markaları görüntüle
                </a>
            </div>
        </main>
    );
}
