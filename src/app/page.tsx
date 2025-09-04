import {getBrands} from "@/lib/api";

export default async function Home() {
    const data = await getBrands();
    return (
        <main className="max-w-3xl mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Sanayi – Ankara</h1>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
        </main>
    );
}