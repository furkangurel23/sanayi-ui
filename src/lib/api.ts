const API = process.env.NEXT_PUBLIC_API_URL!;

export async function getBrands(page = 0, size = 10) {
    const res = await fetch(`${API}/brands?page=${page}&size=${size}`, {cache: 'no-store'});
    if (!res.ok) throw new Error(`Brands ${res.status}`);
    return res.json();
}
