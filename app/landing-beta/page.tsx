import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Source_Serif_4 } from 'next/font/google';
import LandingBeta from './LandingBeta';
import './landing-beta.css';

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--lb-font-sans',
  display: 'swap',
});

const serif = Source_Serif_4({
  subsets: ['latin'],
  weight: ['600'],
  variable: '--lb-font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Momentum CV — Tu carrera evoluciona. Tu CV también.',
  description: 'Crea un CV profesional en minutos con la ayuda de inteligencia artificial',
  // Preview route for the landing redesign: keep it out of search results so
  // it never competes with the real home page.
  robots: { index: false, follow: false },
};

export default function LandingBetaPage() {
  return (
    <div className={`${sans.variable} ${serif.variable}`}>
      <LandingBeta />
    </div>
  );
}
