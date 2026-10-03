/**
 * All 25 districts of Sri Lanka with their main cities/towns.
 *
 * This list is static (it rarely changes), so it lives in code rather than the
 * database. Ads store the district slug and the city slug.
 */

export type Locale = "en" | "si" | "ta";

export interface District {
  slug: string;
  province: string;
  name: Record<Locale, string>;
  cities: string[];
}

/** Colombo 1 … Colombo 15 postal zones. */
const colomboZones = Array.from({ length: 15 }, (_, i) => `Colombo ${i + 1}`);

export const DISTRICTS: District[] = [
  // ---------------------------------------------------------------- Western
  {
    slug: "colombo",
    province: "Western",
    name: { en: "Colombo", si: "කොළඹ", ta: "கொழும்பு" },
    cities: [
      ...colomboZones,
      "Angoda", "Athurugiriya", "Avissawella", "Battaramulla", "Boralesgamuwa",
      "Dehiwala", "Hanwella", "Homagama", "Kaduwela", "Kesbewa", "Kolonnawa",
      "Kotte", "Kottawa", "Maharagama", "Malabe", "Moratuwa", "Mount Lavinia",
      "Nugegoda", "Padukka", "Pannipitiya", "Piliyandala", "Rajagiriya",
      "Ratmalana", "Talawatugoda", "Wellampitiya",
    ],
  },
  {
    slug: "gampaha",
    province: "Western",
    name: { en: "Gampaha", si: "ගම්පහ", ta: "கம்பஹா" },
    cities: [
      "Gampaha", "Biyagama", "Delgoda", "Divulapitiya", "Dompe", "Ganemulla",
      "Ja-Ela", "Kadawatha", "Kandana", "Katunayake", "Kelaniya", "Kiribathgoda",
      "Kirindiwela", "Minuwangoda", "Mirigama", "Negombo", "Nittambuwa",
      "Ragama", "Seeduwa", "Veyangoda", "Wattala",
    ],
  },
  {
    slug: "kalutara",
    province: "Western",
    name: { en: "Kalutara", si: "කළුතර", ta: "களுத்துறை" },
    cities: [
      "Kalutara", "Agalawatta", "Aluthgama", "Bandaragama", "Beruwala",
      "Bulathsinhala", "Horana", "Ingiriya", "Matugama", "Panadura", "Wadduwa",
    ],
  },
  // ---------------------------------------------------------------- Central
  {
    slug: "kandy",
    province: "Central",
    name: { en: "Kandy", si: "මහනුවර", ta: "கண்டி" },
    cities: [
      "Kandy", "Akurana", "Digana", "Galagedara", "Gampola", "Gelioya",
      "Kadugannawa", "Katugastota", "Kundasale", "Nawalapitiya", "Peradeniya",
      "Pilimatalawa", "Teldeniya", "Wattegama",
    ],
  },
  {
    slug: "matale",
    province: "Central",
    name: { en: "Matale", si: "මාතලේ", ta: "மாத்தளை" },
    cities: [
      "Matale", "Dambulla", "Galewela", "Naula", "Palapathwela", "Rattota",
      "Sigiriya", "Ukuwela",
    ],
  },
  {
    slug: "nuwara-eliya",
    province: "Central",
    name: { en: "Nuwara Eliya", si: "නුවරඑළිය", ta: "நுவரெலியா" },
    cities: [
      "Nuwara Eliya", "Ginigathhena", "Hanguranketha", "Hatton", "Maskeliya",
      "Nanu Oya", "Ragala", "Talawakele", "Walapane",
    ],
  },
  // ---------------------------------------------------------------- Southern
  {
    slug: "galle",
    province: "Southern",
    name: { en: "Galle", si: "ගාල්ල", ta: "காலி" },
    cities: [
      "Galle", "Ahangama", "Ambalangoda", "Baddegama", "Batapola", "Bentota",
      "Elpitiya", "Hikkaduwa", "Imaduwa", "Karapitiya", "Koggala", "Neluwa",
      "Udugama", "Unawatuna",
    ],
  },
  {
    slug: "matara",
    province: "Southern",
    name: { en: "Matara", si: "මාතර", ta: "மாத்தறை" },
    cities: [
      "Matara", "Akuressa", "Deniyaya", "Devinuwara", "Dikwella", "Hakmana",
      "Kamburupitiya", "Kekanadura", "Mirissa", "Weligama",
    ],
  },
  {
    slug: "hambantota",
    province: "Southern",
    name: { en: "Hambantota", si: "හම්බන්තොට", ta: "அம்பாந்தோட்டை" },
    cities: [
      "Hambantota", "Ambalantota", "Beliatta", "Middeniya", "Sooriyawewa",
      "Tangalle", "Tissamaharama", "Walasmulla", "Weeraketiya",
    ],
  },
  // ---------------------------------------------------------------- Northern
  {
    slug: "jaffna",
    province: "Northern",
    name: { en: "Jaffna", si: "යාපනය", ta: "யாழ்ப்பாணம்" },
    cities: [
      "Jaffna", "Chavakachcheri", "Chunnakam", "Karainagar", "Kayts", "Kopay",
      "Manipay", "Nallur", "Point Pedro", "Tellippalai", "Velanai",
    ],
  },
  {
    slug: "kilinochchi",
    province: "Northern",
    name: { en: "Kilinochchi", si: "කිලිනොච්චිය", ta: "கிளிநொச்சி" },
    cities: ["Kilinochchi", "Pallai", "Paranthan", "Poonakary"],
  },
  {
    slug: "mannar",
    province: "Northern",
    name: { en: "Mannar", si: "මන්නාරම", ta: "மன்னார்" },
    cities: ["Mannar", "Madhu", "Murunkan", "Pesalai", "Talaimannar"],
  },
  {
    slug: "vavuniya",
    province: "Northern",
    name: { en: "Vavuniya", si: "වවුනියාව", ta: "வவுனியா" },
    cities: ["Vavuniya", "Cheddikulam", "Nedunkeni", "Omanthai"],
  },
  {
    slug: "mullaitivu",
    province: "Northern",
    name: { en: "Mullaitivu", si: "මුලතිව්", ta: "முல்லைத்தீவு" },
    cities: ["Mullaitivu", "Mallavi", "Mankulam", "Oddusuddan", "Puthukudiyiruppu"],
  },
  // ---------------------------------------------------------------- Eastern
  {
    slug: "batticaloa",
    province: "Eastern",
    name: { en: "Batticaloa", si: "මඩකලපුව", ta: "மட்டக்களப்பு" },
    cities: [
      "Batticaloa", "Chenkalady", "Eravur", "Kaluwanchikudy", "Kattankudy",
      "Oddamavadi", "Valaichchenai",
    ],
  },
  {
    slug: "ampara",
    province: "Eastern",
    name: { en: "Ampara", si: "අම්පාර", ta: "அம்பாறை" },
    cities: [
      "Ampara", "Addalaichenai", "Akkaraipattu", "Dehiattakandiya", "Kalmunai",
      "Nintavur", "Pottuvil", "Sainthamaruthu", "Sammanthurai", "Uhana",
    ],
  },
  {
    slug: "trincomalee",
    province: "Eastern",
    name: { en: "Trincomalee", si: "ත්‍රිකුණාමලය", ta: "திருகோணமலை" },
    cities: [
      "Trincomalee", "Kantale", "Kinniya", "Kuchchaveli", "Mutur", "Nilaveli",
      "Seruwila",
    ],
  },
  // ---------------------------------------------------------------- North Western
  {
    slug: "kurunegala",
    province: "North Western",
    name: { en: "Kurunegala", si: "කුරුණෑගල", ta: "குருநாகல்" },
    cities: [
      "Kurunegala", "Alawwa", "Bingiriya", "Galgamuwa", "Giriulla", "Hettipola",
      "Ibbagamuwa", "Kuliyapitiya", "Maho", "Mawathagama", "Narammala",
      "Nikaweratiya", "Pannala", "Polgahawela", "Wariyapola",
    ],
  },
  {
    slug: "puttalam",
    province: "North Western",
    name: { en: "Puttalam", si: "පුත්තලම", ta: "புத்தளம்" },
    cities: [
      "Puttalam", "Anamaduwa", "Chilaw", "Dankotuwa", "Kalpitiya", "Madampe",
      "Marawila", "Nattandiya", "Nawagattegama", "Wennappuwa",
    ],
  },
  // ---------------------------------------------------------------- North Central
  {
    slug: "anuradhapura",
    province: "North Central",
    name: { en: "Anuradhapura", si: "අනුරාධපුරය", ta: "அனுராதபுரம்" },
    cities: [
      "Anuradhapura", "Eppawala", "Galenbindunuwewa", "Habarana", "Horowpothana",
      "Kebithigollewa", "Kekirawa", "Medawachchiya", "Mihintale", "Nochchiyagama",
      "Tambuttegama",
    ],
  },
  {
    slug: "polonnaruwa",
    province: "North Central",
    name: { en: "Polonnaruwa", si: "පොළොන්නරුව", ta: "பொலன்னறுவை" },
    cities: [
      "Polonnaruwa", "Aralaganwila", "Dimbulagala", "Hingurakgoda", "Kaduruwela",
      "Manampitiya", "Medirigiriya", "Welikanda",
    ],
  },
  // ---------------------------------------------------------------- Uva
  {
    slug: "badulla",
    province: "Uva",
    name: { en: "Badulla", si: "බදුල්ල", ta: "பதுளை" },
    cities: [
      "Badulla", "Bandarawela", "Diyatalawa", "Ella", "Hali-Ela", "Haputale",
      "Lunugala", "Mahiyanganaya", "Passara", "Welimada",
    ],
  },
  {
    slug: "monaragala",
    province: "Uva",
    name: { en: "Monaragala", si: "මොණරාගල", ta: "மொனராகலை" },
    cities: [
      "Monaragala", "Bibile", "Buttala", "Kataragama", "Medagama",
      "Siyambalanduwa", "Thanamalwila", "Wellawaya",
    ],
  },
  // ---------------------------------------------------------------- Sabaragamuwa
  {
    slug: "ratnapura",
    province: "Sabaragamuwa",
    name: { en: "Ratnapura", si: "රත්නපුරය", ta: "இரத்தினபுரி" },
    cities: [
      "Ratnapura", "Balangoda", "Eheliyagoda", "Embilipitiya", "Godakawela",
      "Kahawatta", "Kalawana", "Kuruwita", "Opanayaka", "Pelmadulla", "Rakwana",
    ],
  },
  {
    slug: "kegalle",
    province: "Sabaragamuwa",
    name: { en: "Kegalle", si: "කෑගල්ල", ta: "கேகாலை" },
    cities: [
      "Kegalle", "Aranayake", "Dehiowita", "Deraniyagala", "Galigamuwa",
      "Kitulgala", "Mawanella", "Rambukkana", "Ruwanwella", "Warakapola",
      "Yatiyantota",
    ],
  },
];

/** Turns a city name into a URL/DB-safe slug ("Mount Lavinia" → "mount-lavinia"). */
export function citySlug(city: string): string {
  return city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const districtMap = new Map(DISTRICTS.map((d) => [d.slug, d]));

export function getDistrict(slug: string | null | undefined): District | undefined {
  return slug ? districtMap.get(slug) : undefined;
}

/** Localised district name; falls back to the slug if it is unknown. */
export function districtName(slug: string | null | undefined, locale: Locale = "en"): string {
  if (!slug) return "";
  return districtMap.get(slug)?.name[locale] ?? slug;
}

/** Display name of a city (cities are shown in English in every locale). */
export function cityName(districtSlug: string | null | undefined, city: string | null | undefined): string {
  if (!city) return "";
  const district = getDistrict(districtSlug);
  return district?.cities.find((c) => citySlug(c) === city) ?? city;
}

/** True when `city` is a valid city slug inside `district`. */
export function isValidLocation(district: string, city: string): boolean {
  const d = getDistrict(district);
  return !!d && d.cities.some((c) => citySlug(c) === city);
}
