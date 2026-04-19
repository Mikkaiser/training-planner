import localFont from "next/font/local";

/** Comfortaa — body / UI copy (variable font). */
export const fontComfortaa = localFont({
  src: "../public/Fonts/Comfortaa/Comfortaa-VariableFont_wght.ttf",
  variable: "--font-comfortaa",
  display: "swap",
  weight: "300 700",
});

/** Poppins — headings (static weights; no variable file in bundle). */
export const fontPoppins = localFont({
  src: [
    {
      path: "../public/Fonts/Poppins/Poppins-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/Fonts/Poppins/Poppins-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../public/Fonts/Poppins/Poppins-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../public/Fonts/Poppins/Poppins-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-poppins",
  display: "swap",
});
