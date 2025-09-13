/*
* Server Component'ta window, document, harici harita kütüphaneleri kullanamazsın.
* */
"use client";

import {useEffect, useRef} from "react";
import type {ProviderListItem} from "@/lib/types";
import L from "leaflet";
import "leaflet-defaulticon-compatibility";

/*
* Leaflet'in global css'i ve ikon uyumluluk paketi. Eger next "global css sadece app/layout;ta import edilir" uyarisi verirse
* bu iki satiri str/app/globals.css icine
*
* @import "leaflet/dist/leaflet.css";
* @import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
* */
/*import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
*/


/*
* Disaridan provider listesi ve harita yuksekligi aliyoruz.
* Koordinat yoksa Ankara'yi merkez al.
* */
type Props = {
    items: ProviderListItem[];
    height?: number; // px
};

const DEFAULT_CENTER: [number, number] = [39.925533, 32.866287]; // Ankara
const DEFAULT_ZOOM = 11;

export default function ProvidersMap({items, height = 260}: Props) {
    // DOM'daki <div> için referans (Leaflet haritayı bu div'e çizer)
    // Bu baslangicta null ama ben yonetiyorum demektir.
    const mapDivRef = useRef<HTMLDivElement>(null!);

    //Harita ve marker layer'ını saklamka için ref'ler(re-renderdan tetiklenmeden kalıcı olarak tutarız.)
    const mapRef = useRef<L.Map | null>(null);
    const markersLayerRef = useRef<L.LayerGroup | null>(null);
    /*
    * useRef: re-render tetiklemeden kalici kutular.
    * mapDivRef: dom'daki div'e referans leaflet buraya cizim yapacak.
    * mapRef: Leaflet;in harita ornegi
    * markersLayerRef: tum markler'lari ttugumuz layer(kolay temizlemek icin)
    * */

    /*
    * Ilk effect ( bos bagimlilik listesi): yalnizca ilk mount'ta calisir.
    * haritayi bir defa olusurur, OSM title'ini ekler, bos bir marker layer ekler.
    * cleanup ile unmount'a heriayi sok(next rote degistirince bilesen kaldirilirsa sizinti olmasin)
    * Neden userRef? mapRef.current degisse bile re-render istemiyoruz;harita islemleri DOM ustunde.
    * */
    // İlk kez haritayı oluştur, sonra cleanup yap.
    useEffect(() => {

        const el: HTMLDivElement | null = mapDivRef.current;
        if (!el || mapRef.current) return; // DOM hazır değilse çık, zaten oluşturulmuşsa tekrar kurma

        //Haritayi olusturur: HTMLElement bekler (string/HTMLElement union). artik el kesin HTMLElement.
        const map = L.map(el, {
            center: DEFAULT_CENTER,
            zoom: DEFAULT_ZOOM,
            scrollWheelZoom: false,
        });
        //Altlık (OSM tile)
        L.tileLayer(
            "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
            {
                attribution:
                    '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
            }
        ).addTo(map);

        //MArker'lar icin ayri bir layer group: silmesi/yenilemesi kolay olur
        const markerLayer: L.LayerGroup = L.layerGroup().addTo(map);

        //Ref'leri doldur.
        mapRef.current = map;
        markersLayerRef.current = markerLayer;

        // unmount bellek sizintisi olmasin
        return () => {
            mapRef.current?.remove(); // cleanup: memory leak olmasin. leaflet map cleanup
            mapRef.current = null;
            markersLayerRef.current = null;
        };
    }, []); // [] => sadece ilk mount + unmount


    /*
    * ikinci effect items(liste) her degistiginde calisir.
    * once eski marker'lari temizle clearlayers() sonrasi yeni gelen kayitlari marker olaraak cizer.
    * marker'lara basit bir popup baglariz (isim/ilce/sehir/puan).
    * viewport ayari: marker varsa fitBounds ile uygun zoom/center, yoksa Ankara'ya don
    *
    * Bu pattern, render -> effect ile DOM guncelle yaklasimidir/ react "harita icerigini" degil, "parametreleri" yonetir; DOM isini Leaflet halleder.
    * */

    /*
    * Marker'ları her items değişiminde güncelle
    * Önce eski markler'ları temizle (clearLayers), sonra yeni gelen kayıtları marker olarak çizer.
    * Markerlara basit bir popup bağlarız (isim, ilçe-şehir, puan).
    * Viewport ayarı: marker varsa fitBounds ile uygun zoom/center, yoksa Ankara'ya dön.
    * Bu pattern, render -> effect ile DOM güncelle yaklaşımdır. React harita içeriğini değil,
    * parametreleri yönetir; DOM işini Leaflet halleder.
    *
    * */
    useEffect(() => {
        // Ref'leri tip güvenli değişkenlere alıp daraltıyoruz
        const mapInstance = mapRef.current;
        const layer = markersLayerRef.current;

        // Biri yoksa (daha kurulum bitmemişse) hiçbir şey yapma
        if (!mapInstance || !layer) return;

        // Eski marker'ları temizle (liste değiştikçe yeniden çizeceğiz)
        layer.clearLayers();


        const withCoords = items.filter(
            (p): p is ProviderListItem & {
                lat: number;
                lng: number
            } => typeof p.lat === "number" && typeof p.lng === "number"
        );

        //Her kayıt için bir karker oluştur ve layer'a ekle.
        for (const p of withCoords) {
            const marker = L.marker([p.lat, p.lng]); // Marker konumu
            const lines = [
                `<strong>${p.name}</strong>`,
                [p.district, p.city].filter(Boolean).join(" / "),
                typeof p.avgScore === "number"
                    ? `Puan: ${p.avgScore.toFixed(1)} (${p.ratingCount ?? 0} oy)`
                    : undefined,
            ].filter(Boolean);
            marker.bindPopup(lines.join("<br/>"));
            marker.addTo(layer);
        }

        // Uygun zoom/center: marker varsa fitBounds, yoksa default
        if (withCoords.length > 0) {
            const bounds = L.latLngBounds(
                withCoords.map((p) => [p.lat as number, p.lng as number] as [number, number])
            );
            mapRef.current?.fitBounds(bounds, {padding: [20, 20]});
        } else {
            mapRef.current?.setView(DEFAULT_CENTER, DEFAULT_ZOOM);
        }
    }, [items]); // items değişince bu effect çalışır.


    /*
    * sunucu tarafinda Next bu <div>'i HTML'e yazar. (SSR)
    * Tarayici da hydrate olduktan sonra effect'ler calisir ve Leaflet bu div'in icine canvasi/tiles'i cizer.
    * aria-label ve role erisilebilirlik icin
    * */
    return (
        <div
            ref={mapDivRef}                         // Leaflet bu div'e render eder
            className="rounded-2xl border border-white/10"
            style={{height}}                      // Yüksekliği dışarıdan yönetilebilir kıldık
            aria-label="Harita"
            role="region"
        />
    );

    /*
    *       Next.js ile iliskisi
    * bu bilesen client component; server component olan providers/page.tsx'de server-render edilen HTML'e gomulur.
    * SSR ilk yuklemeyi hizli ve SEO-dostu kilar; harita ise client'ta progressively enhace edilir.
    * eger css import'lariyla uyari alirsan, leaflet css'lerini glabals.css'e @import ile tasi.
    *
    *   useRef ve useEffect kisa ozet.
    * useRef: render'larda arasinda kalici ve re-render tatiklemeyen degeri sakla (map instance, DOM node, timer id vb.).
    * useEffect: render'dan sonra calisir; yan etkiler icin ( 3rd-oart li init, event listener, network. localstorage).
    * bagimlilik dizisi [] -> bir kere (ount/unmount
    * [items] -> items degisince.
    *
    * */
}
