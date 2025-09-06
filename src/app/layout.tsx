import type {Metadata} from "next";
import {Geist, Geist_Mono} from "next/font/google";
import "./globals.css";
import React from "react";

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
                    <a href="/brands" className="hover:underline underline-offset-4">Markalar</a>
                    <a href="/providers" className="hover:underline underline-offset-4">Ustalar</a>
                </nav>
            </div>
        </header>
        {children}
        </body>
        </html>
    );
}
