import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import React from "react";
import Link from "next/link";
import {NearInstantButton, NearLinkButton} from "@/components/NearButton";

const geistSans = Geist({variable: "--font-geist-sans", subsets: ["latin"]});
const geistMono = Geist_Mono({variable: "--font-geist-mono", subsets: ["latin"]});

export const metadata: Metadata = {
    title: "Sanayi",
    description: "Ankara usta/servis puanlama platformu",
};

export default function RootLayout({children}: { children: React.ReactNode }) {
    return (
        <html lang="tr">
        <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b border-white/10">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center gap-4">
                <a href="/" className="font-semibold">Sanayi</a>
                <nav className="text-sm opacity-80 flex items-center gap-3">
                    <Link href="/brands" className="hover:underline underline-offset-4">Markalar</Link>
                    <Link href="/providers" className="hover:underline underline-offset-4">Ustalar</Link>
                </nav>
                <div className="ml-auto"><NearLinkButton /></div>
            </div>
        </header>
        {children}
        <div className="fixed bottom-4 right-4 z-50 md:hidden">
            <NearInstantButton className="rounded-full px-4 py-2 text-sm border bg-black/40 backdrop-blur hover:border-white/50" />
        </div>
        </body>
        </html>
    );
}
