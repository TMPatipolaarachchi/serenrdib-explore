import { Noto_Sans_Sinhala, Noto_Sans_Tamil, Plus_Jakarta_Sans } from "next/font/google";

/** Latin text */
export const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

/** Sinhala script (සිංහල) */
export const sinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sinhala",
  display: "swap",
});

/** Tamil script (தமிழ்) */
export const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-tamil",
  display: "swap",
});
