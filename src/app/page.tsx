/*
 * ANA SAYFA (vitrin) — Server Component (async function!).
 *
 * App Router'da bir sayfa fonksiyonu async olabilir ve doğrudan await ile veri
 * çekebilir; bu kod SUNUCUDA çalışır, tarayıcıya yalnızca hazır HTML gider.
 * getBrandsAllSorted/getCategoriesAllSorted ISR cache'lidir (5 dk) — her ziyaretçi
 * için backend'e gitmez.
 *
 * .catch(() => []): backend kapalıysa ana sayfa yine açılır (boş listelerle) —
 * "graceful degradation". Promise.all: iki isteği PARALEL atar (seri beklemek yerine).
 *
 * 002 tasarım notları (Apple Pro sayfası dili):
 *  - Vitrin: .display başlık (375 px'te 40, 1440 px'te 72 px — FR-002), .lead açıklama
 *    (≤ 62ch) ve birincil CTA İLK EKRANDA (375×667 ve 1440×900). Arka planda yalnızca
 *    belirteçle çizilmiş çok hafif bir vurgu ışığı (.hero::before) — tek seferlik renk yok.
 *  - Bölümler .sections kabında: arada mobil 64 px, masaüstü 96 px (FR-002: ≥56 / ≥96).
 *  - "Tümü" / "Ustaları gör" yanındaki metin okları ikonla değişti (ChevronRight — FR-006).
 *  - "Nasıl çalışır" bölümü: üç kart, her birinde belirteç renkli ikon karosu.
 *  - aria-labelledby: her <section> başlığıyla adlandırılır -> ekran okuyucunun
 *    "bölgeler" listesinde anlamlı adlarla görünür.
 */
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import {getBrandsAllSorted, getCategoriesAllSorted} from "@/lib/api";
import {Chat, ChevronRight, Pin, Star} from "@/components/icons";

export default async function Home() {
    // Meta listeler ISR ile cache'lenir; hata olursa boş listeyle devam et
    const [brands, categories] = await Promise.all([
        getBrandsAllSorted().catch(() => []),
        getCategoriesAllSorted().catch(() => []),
    ]);

    return (
        <main>
            <section className="hero" aria-labelledby="hero-title">
                <div className="container hero-inner">
                    <span className="eyebrow">Ankara</span>
                    <h1 id="hero-title" className="display">Sanayide doğru ustayı bul.</h1>
                    <p className="lead">
                        Oto elektrikten kaportaya, markana bakan güvenilir ustaları keşfet.
                        Gerçek kullanıcı puanlarını gör, deneyimini paylaş, marka sohbet odalarına katıl.
                    </p>
                    <div className="hero-actions">
                        <Link href="/providers" className="btn btn-primary btn-lg">Ustaları keşfet</Link>
                        <Link href="/chat" className="btn btn-outline btn-lg">Sohbet odaları</Link>
                    </div>
                </div>
            </section>

            <div className="container sections">
                {categories.length > 0 && (
                    <section className="section" aria-labelledby="cat-title">
                        <div className="section-head">
                            <h2 id="cat-title" className="headline">Kategoriler</h2>
                            <Link href="/providers" className="btn btn-ghost btn-sm">
                                Tümü <ChevronRight size="sm"/>
                            </Link>
                        </div>
                        {/* 26 kategori: eşit aralıklı SARAN küme (.chip-cluster — açıklama
                            globals.css'te). Onay kapısında 1440 px'te düzensiz sütunlar ve
                            sağda kırpılan chip'ler bulundu; düz satır akışı ikisini de çözer,
                            375 ve 1440 px'te aynı kural. Hepsi görünür -> kaydırma/maske yok. */}
                        <div className="chip-cluster">
                            {categories.map(c => (
                                <Link key={c.id} href={`/providers?categoryId=${c.id}`} className="chip">
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                {brands.length > 0 && (
                    <section className="section" aria-labelledby="brand-title">
                        <div className="section-head">
                            <h2 id="brand-title" className="headline">Markalar</h2>
                            <Link href="/brands" className="btn btn-ghost btn-sm">
                                Tümü <ChevronRight size="sm"/>
                            </Link>
                        </div>
                        <div className="grid-3">
                            {brands.slice(0, 6).map(b => (
                                <Link key={b.id} href={`/providers?brandId=${b.id}`}
                                      className="card card-hover room-card">
                                    <BrandLogo name={b.name} size={46}/>
                                    <div className="min-w-0">
                                        <div className="card-title truncate">{b.name}</div>
                                        <div className="card-sub room-card-cta">
                                            Ustaları gör <ChevronRight size="sm"/>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}

                <section className="section" aria-labelledby="how-title">
                    <h2 id="how-title" className="headline">Nasıl çalışır</h2>
                    <div className="grid-3">
                        <div className="card stack">
                            <span className="feature-icon"><Star/></span>
                            <div className="stack-sm">
                                <span className="eyebrow">Puanla</span>
                                <h3 className="card-title">-5&apos;ten +5&apos;e dürüst puanlama</h3>
                                <p className="card-sub">
                                    Kötü deneyim de puan. Eksi puanlarla gerçek kaliteyi gör; üye olmadan da IP başına
                                    bir kez oy verebilirsin.
                                </p>
                            </div>
                        </div>
                        <div className="card stack">
                            <span className="feature-icon"><Pin/></span>
                            <div className="stack-sm">
                                <span className="eyebrow">Keşfet</span>
                                <h3 className="card-title">Haritada yakınındakiler</h3>
                                <p className="card-sub">
                                    Konumunu paylaş, çevrendeki en yüksek puanlı ustaları mesafeleriyle listele.
                                </p>
                            </div>
                        </div>
                        <div className="card stack">
                            <span className="feature-icon"><Chat/></span>
                            <div className="stack-sm">
                                <span className="eyebrow">Sohbet</span>
                                <h3 className="card-title">Marka sohbet odaları</h3>
                                <p className="card-sub">
                                    Honda&apos;cılar Honda odasında: soru sor, fotoğraf ve video paylaş, tecrübeleri
                                    dinle.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
