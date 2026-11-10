/*
 * DÜKKANLARIM (003 / T098) — sunucu kabuğu (metadata + robots); liste kişiye özel -> client.
 */
import type {Metadata} from "next";
import OwnedProvidersClient from "./OwnedProvidersClient";

export const metadata: Metadata = {title: "Dükkanlarım", robots: {index: false}};

export default function OwnedProvidersPage() {
    return <OwnedProvidersClient/>;
}
