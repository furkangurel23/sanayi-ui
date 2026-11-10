/*
 * ANA SAYFA — Server Component (async function!).
 *
 * App Router'da bir sayfa fonksiyonu async olabilir ve doğrudan await ile veri
 * çekebilir; bu kod SUNUCUDA çalışır, tarayıcıya yalnızca hazır HTML gider.
 * getBrandsAllSorted/getCategoriesAllSorted ISR cache'lidir (5 dk) — her ziyaretçi
 * için backend'e gitmez.
 *
 * .catch(() => []): backend kapalıysa ana sayfa yine açılır (boş listelerle) —
 * "graceful degradation". Promise.all: iki isteği PARALEL atar (seri beklemek yerine).
 */
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import {getBrandsAllSorted, getCategoriesAllSorted} from "@/lib/api";

export default async function Home() {
    // Meta listeler ISR ile cache'lenir; hata olursa boş listeyle devam et
    const [brands, categories] = await Promise.all([
        getBrandsAllSorted().catch(() => []),
        getCategoriesAllSorted().catch(() => []),
    ]);

    return (
        <main>
            <section className="hero">
                <div className="container stack">
                    <span className="eyebrow">Ankara</span>
                    <h1>Sanayide doğru ustayı bul.</h1>
                    <p>
                        Oto elektrikten kaportaya, markana bakan güvenilir ustaları keşfet.
                        Gerçek kullanıcı puanlarını gör, deneyimini paylaş, marka sohbet odalarına katıl.
                    </p>
                    <div className="hero-actions">
                        <Link href="/providers" className="btn btn-primary btn-lg">Ustaları keşfet</Link>
                        <Link href="/chat" className="btn btn-outline btn-lg">Sohbet odaları</Link>
                    </div>
                </div>
            </section>

            <div className="container page">
                {categories.length > 0 && (
                    <section className="stack">
                        <div className="row-between">
                            <h2 className="section-title">Kategoriler</h2>
                            <Link href="/providers" className="btn btn-ghost btn-sm">Tümü →</Link>
                        </div>
                        {/* 26 kategori: serbest sarmal yerine 2 satırlık kaydırmalı rail
                            (.chip-rail — açıklama globals.css'te). Sağ kenar eriyerek
                            "devamı var" hissi verir; mobilde parmakla kaydırılır. */}
                        <div className="chip-rail">
                            {categories.map(c => (
                                <Link key={c.id} href={`/providers?categoryId=${c.id}`} className="chip">
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {brands.length > 0 && (
                    <section className="stack">
                        <div className="row-between">
                            <h2 className="section-title">Markalar</h2>
                            <Link href="/brands" className="btn btn-ghost btn-sm">Tümü →</Link>
                        </div>
                        <div className="grid-3">
                            {brands.slice(0, 6).map(b => (
                                <Link key={b.id} href={`/providers?brandId=${b.id}`}
                                      className="card card-hover room-card">
                                    <BrandLogo name={b.name} size={46}/>
                                    <div>
                                        <div className="card-title">{b.name}</div>
                                        <div className="card-sub">Ustaları gör →</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <section className="grid-3">
                    <div className="card stack-sm">
                        <span className="eyebrow">Puanla</span>
                        <h3 className="card-title">-5&apos;ten +5&apos;e dürüst puanlama</h3>
                        <p className="card-sub">
                            Kötü deneyim de puan. Eksi puanlarla gerçek kaliteyi gör; üye olmadan da IP başına bir kez
                            oy verebilirsin.
                        </p>
                    </div>
                    <div className="card stack-sm">
                        <span className="eyebrow">Keşfet</span>
                        <h3 className="card-title">Haritada yakınındakiler</h3>
                        <p className="card-sub">
                            Konumunu paylaş, çevrendeki en yüksek puanlı ustaları mesafeleriyle listele.
                        </p>
                    </div>
                    <div className="card stack-sm">
                        <span className="eyebrow">Sohbet</span>
                        <h3 className="card-title">Marka sohbet odaları</h3>
                        <p className="card-sub">
                            Honda&apos;cılar Honda odasında: soru sor, fotoğraf ve video paylaş, tecrübeleri dinle.
                        </p>
                    </div>
                </section>
            </div>
        </main>
    );
}
