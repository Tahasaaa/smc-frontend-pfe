export const REGION_CODE_TO_NAME: Record<string, string> = {
  ARI: "Ariana",
  TUN: "Tunis",
  BEN: "Ben Arous",
  MAN: "Manouba",
  NAB: "Nabeul",
  BIZ: "Bizerte",
  BEJ: "Béja",
  JEN: "Jendouba",
  KEF: "Le Kef",
  SIL: "Siliana",
  KAI: "Kairouan",
  KAS: "Kasserine",
  GAF: "Gafsa",
  TOZ: "Tozeur",
  KEB: "Kébili",
  SBO: "Sidi Bouzid",
  SFA: "Sfax",
  SOU: "Sousse",
  MON: "Monastir",
  MAH: "Mahdia",
  GAB: "Gabès",
  MED: "Médenine",
  TAT: "Tataouine",
  ZAG: "Zaghouan",
};

export const REGION_CODE_ALIASES: Record<string, string> = {
  BAR: "BEN",
  SMB: "SBO",
};

export const REGION_NAME_ALIASES: Record<string, string> = {
  "beja": "beja",
  "medenine": "medenine",
  "kebili": "kebili",
  "gabes": "gabes",

  "sfax governorate": "sfax",
  "sousse governorate": "sousse",
  "monastir governorate": "monastir",
  "mahdia governorate": "mahdia",
  "nabeul governorate": "nabeul",
  "zaghouan governorate": "zaghouan",
  "tataouine governorate": "tataouine",

  "sidi bou zid": "sidi bouzid",

  "kef": "le kef",
  "el kef": "le kef",
  "le kef governorate": "le kef",
  "el kef governorate": "le kef",

  "manouba": "manouba",
  "la manouba": "manouba",
  "manouba governorate": "manouba",
  "la manouba governorate": "manouba",

  "ben arous": "ben arous",
  "ben-arous": "ben arous",
  "ben arous governorate": "ben arous",
};

export function normalizeRegionCode(value: string | null | undefined) {
  const code = String(value ?? "").trim().toUpperCase();
  return REGION_CODE_ALIASES[code] ?? code;
}

export function getRegionDisplayName(code: string | null | undefined) {
  const normalizedCode = normalizeRegionCode(code);
  return REGION_CODE_TO_NAME[normalizedCode] ?? normalizedCode;
}

export function normalizeRegionName(value: string | null | undefined) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\bgovernorate\b/gi, "")
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function resolveRegionName(value: string | null | undefined) {
  const normalized = normalizeRegionName(value);
  return REGION_NAME_ALIASES[normalized] ?? normalized;
}