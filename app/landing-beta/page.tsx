import type { Metadata } from 'next';
import { Inter_Tight } from 'next/font/google';
import LandingBeta from './LandingBeta';
import './landing-beta.css';

/* Display face for headlines only — same family DNA as Inter (the brand
   text face), but drawn for large sizes, so headings get tighter, more
   editorial shapes without leaving the Momentum identity. */
const display = Inter_Tight({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--lb-font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Momentum — Crea tu CV con IA',
  description: 'Crea un CV profesional en minutos con la ayuda de inteligencia artificial',
  // Preview route for the landing redesign: keep it out of search results so
  // it never competes with the real home page.
  robots: { index: false, follow: false },
};

export default function LandingBetaPage() {
  return (
    <div className={display.variable}>
      <LandingBeta />
    </div>
  );
}
