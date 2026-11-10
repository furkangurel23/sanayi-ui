/*
 * VERİ KAYNAKLARI ve ATIF (002, US3 / FR-015). Backend kaynak KODLARINI gönderir
 * (ProviderDetailDto.sources); görünen ad ve lisans burada eşlenir — tek kaynak.
 *
 * Lisanslar: OpenStreetMap ODbL (atıf "© OpenStreetMap katkıcıları"), Overture Maps
 * CDLA-Permissive-2.0, Foursquare OS Places Apache-2.0 (Overture kayıtlarının bir kısmı
 * Foursquare üst kaynaklıdır — içe aktarma raporu: 224 kayıt).
 */
export const SOURCE_LABELS: Record<string, string> = {
    openstreetmap: "OpenStreetMap",
    overture: "Overture Maps",
    foursquare: "Foursquare",
};

export function sourceLabel(code: string): string {
    return SOURCE_LABELS[code] ?? code;
}

/** Alt bilgi atfı (research R18 metni): sırayla kaynak sahibi + lisans; lisans adı lisans metnine,
 *  Overture adı Overture'ın atıf rehberine bağlanır. */
export const DATA_ATTRIBUTIONS: ReadonlyArray<{
    holder: string; holderHref?: string; license: string; licenseHref: string;
}> = [
    {holder: "© OpenStreetMap katkıcıları", holderHref: "https://www.openstreetmap.org/copyright",
        license: "ODbL", licenseHref: "https://opendatacommons.org/licenses/odbl/"},
    {holder: "Overture Maps Foundation", holderHref: "https://docs.overturemaps.org/attribution/",
        license: "CDLA-Permissive-2.0", licenseHref: "https://cdla.dev/permissive-2-0/"},
    {holder: "Foursquare", license: "Apache 2.0", licenseHref: "https://www.apache.org/licenses/LICENSE-2.0"},
];
