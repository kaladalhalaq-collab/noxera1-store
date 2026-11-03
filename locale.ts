import { cookies } from "next/headers";
import type { Locale } from "./types";

export function getLocale(): Locale {
  return cookies().get("noxera_locale")?.value === "ar" ? "ar" : "en";
}
