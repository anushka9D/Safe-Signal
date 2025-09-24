
import * as Localization from "expo-localization";

export type PreferredLanguage = "si" | "en";

export function getDefaultLanguage(): PreferredLanguage {
  const code = Localization.getLocales?.()[0]?.languageCode?.toLowerCase();
  return code === "si" ? "si" : "en";  
}
