export const lightColors = {
  page: "#F7F6FB",
  surface: "#FFFFFF",
  surface2: "#FBFAFD",
  text1: "#16151F",
  text2: "#5B5A6B",
  muted: "#93909F",
  border: "rgba(22,21,31,0.09)",
  grid: "#ECEAF4",

  brand: "#5B4FE9",
  brandStrong: "#4438CE",
  brandSoft: "#EDEBFE",
  brandSoftText: "#4438CE",

  premium: "#00B0A2",
  premiumSoft: "#DFF7F4",
  premiumSoftText: "#00786E",

  good: "#17A34A",
  goodSoft: "#E6F7ED",
  warn: "#F59E0B",
  warnSoft: "#FEF3DC",
  crit: "#E5484D",
  critSoft: "#FDE7E7",
};

export const darkColors = {
  page: "#100F19",
  surface: "#1B1A29",
  surface2: "#211F30",
  text1: "#F5F4FB",
  text2: "#B9B7C9",
  muted: "#847F97",
  border: "rgba(245,244,251,0.10)",
  grid: "#2A2839",

  brand: "#8B80FF",
  brandStrong: "#A79CFF",
  brandSoft: "#2A2650",
  brandSoftText: "#C1B8FF",

  premium: "#2FD1C2",
  premiumSoft: "#0E2E2C",
  premiumSoftText: "#5CE6D8",

  good: "#3DC673",
  goodSoft: "#123321",
  warn: "#FBBF3F",
  warnSoft: "#3A2B0C",
  crit: "#FF6B6E",
  critSoft: "#3A1414",
};

/** Category identity colors — fixed regardless of theme or budget status. */
export const categoryPalette: Record<string, string> = {
  Comida: "#EB6834",
  Ropa: "#E15C93",
  Calzado: "#4A3AA7",
  Transporte: "#2A78D6",
  Salud: "#1BAF7A",
  Entretenimiento: "#D18E00",
  Inversión: "#1A8F3D",
  Deudas: "#D5433F",
  Otros: "#8B899B",
};

export type SemaphoreStatus = "green" | "yellow" | "red";

export function semaphoreColor(colors: typeof lightColors, status: SemaphoreStatus) {
  if (status === "red") return colors.crit;
  if (status === "yellow") return colors.warn;
  return colors.good;
}

export function semaphoreSoft(colors: typeof lightColors, status: SemaphoreStatus) {
  if (status === "red") return colors.critSoft;
  if (status === "yellow") return colors.warnSoft;
  return colors.goodSoft;
}
