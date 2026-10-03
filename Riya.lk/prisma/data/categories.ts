/**
 * Initial categories (admins can add/edit/remove them later in /admin/categories).
 * `icon` keys are mapped to icons in src/components/category-icon.tsx.
 */

export type CategoryTypeSeed = "VEHICLE" | "PART" | "ACCESSORY" | "SERVICE";

export interface CategorySeed {
  slug: string;
  nameEn: string;
  nameSi: string;
  nameTa: string;
  type: CategoryTypeSeed;
  icon: string;
  children?: Omit<CategorySeed, "type" | "children">[];
}

export const CATEGORY_SEED: CategorySeed[] = [
  { slug: "cars", nameEn: "Cars", nameSi: "මෝටර් රථ", nameTa: "கார்கள்", type: "VEHICLE", icon: "car" },
  { slug: "motorbikes", nameEn: "Motorbikes", nameSi: "යතුරුපැදි", nameTa: "மோட்டார் சைக்கிள்கள்", type: "VEHICLE", icon: "motorbike" },
  { slug: "three-wheelers", nameEn: "Three-wheelers", nameSi: "ත්‍රීරෝද රථ", nameTa: "முச்சக்கர வண்டிகள்", type: "VEHICLE", icon: "tuktuk" },
  { slug: "vans", nameEn: "Vans", nameSi: "වෑන් රථ", nameTa: "வேன்கள்", type: "VEHICLE", icon: "van" },
  { slug: "suvs-jeeps", nameEn: "SUVs / Jeeps", nameSi: "SUV / ජීප් රථ", nameTa: "SUV / ஜீப்கள்", type: "VEHICLE", icon: "suv" },
  { slug: "lorries", nameEn: "Lorries", nameSi: "ලොරි", nameTa: "லொறிகள்", type: "VEHICLE", icon: "truck" },
  { slug: "buses", nameEn: "Buses", nameSi: "බස් රථ", nameTa: "பேருந்துகள்", type: "VEHICLE", icon: "bus" },
  { slug: "heavy-vehicles", nameEn: "Heavy Vehicles", nameSi: "බර වාහන", nameTa: "கனரக வாகனங்கள்", type: "VEHICLE", icon: "tractor" },
  { slug: "boats", nameEn: "Boats", nameSi: "බෝට්ටු", nameTa: "படகுகள்", type: "VEHICLE", icon: "boat" },
  { slug: "bicycles", nameEn: "Bicycles", nameSi: "බයිසිකල්", nameTa: "மிதிவண்டிகள்", type: "VEHICLE", icon: "bicycle" },
  {
    slug: "vehicle-parts",
    nameEn: "Vehicle Parts",
    nameSi: "වාහන අමතර කොටස්",
    nameTa: "வாகன உதிரிப்பாகங்கள்",
    type: "PART",
    icon: "parts",
    children: [
      { slug: "engine-parts", nameEn: "Engine Parts", nameSi: "එන්ජින් කොටස්", nameTa: "இயந்திர பாகங்கள்", icon: "engine" },
      { slug: "body-parts", nameEn: "Body Parts", nameSi: "බොඩි කොටස්", nameTa: "உடல் பாகங்கள்", icon: "body" },
      { slug: "electrical-parts", nameEn: "Electrical Parts", nameSi: "විදුලි කොටස්", nameTa: "மின் பாகங்கள்", icon: "electrical" },
      { slug: "tyres-wheels", nameEn: "Tyres & Wheels", nameSi: "ටයර් සහ රෝද", nameTa: "டயர்கள் & சக்கரங்கள்", icon: "tyre" },
      { slug: "suspension-steering", nameEn: "Suspension & Steering", nameSi: "සස්පෙන්ෂන් සහ සුක්කානම", nameTa: "சஸ்பென்ஷன் & ஸ்டீயரிங்", icon: "suspension" },
      { slug: "brakes", nameEn: "Brakes", nameSi: "තිරිංග", nameTa: "பிரேக்குகள்", icon: "brakes" },
      { slug: "transmission-clutch", nameEn: "Transmission & Clutch", nameSi: "ගියර් පෙට්ටිය සහ ක්ලච්", nameTa: "கியர்பாக்ஸ் & கிளட்ச்", icon: "gear" },
      { slug: "lights", nameEn: "Lights", nameSi: "ලයිට්", nameTa: "விளக்குகள்", icon: "lights" },
      { slug: "interior-parts", nameEn: "Interior Parts", nameSi: "අභ්‍යන්තර කොටස්", nameTa: "உட்புற பாகங்கள்", icon: "interior" },
      { slug: "ac-cooling", nameEn: "A/C & Cooling", nameSi: "A/C සහ සිසිලන", nameTa: "A/C & குளிரூட்டல்", icon: "cooling" },
      { slug: "other-parts", nameEn: "Other Parts", nameSi: "වෙනත් කොටස්", nameTa: "பிற பாகங்கள்", icon: "parts" },
    ],
  },
  {
    slug: "accessories",
    nameEn: "Accessories",
    nameSi: "උපාංග",
    nameTa: "துணைக்கருவிகள்",
    type: "ACCESSORY",
    icon: "accessories",
    children: [
      { slug: "audio-electronics", nameEn: "Audio & Electronics", nameSi: "ශ්‍රව්‍ය සහ ඉලෙක්ට්‍රොනික", nameTa: "ஆடியோ & மின்னணு", icon: "audio" },
      { slug: "car-care", nameEn: "Car Care & Cleaning", nameSi: "වාහන රැකවරණය", nameTa: "வாகன பராமரிப்பு", icon: "carcare" },
      { slug: "seat-covers-mats", nameEn: "Seat Covers & Mats", nameSi: "සීට් කවර සහ පාපිසි", nameTa: "இருக்கை உறைகள் & விரிப்புகள்", icon: "interior" },
      { slug: "helmets-riding-gear", nameEn: "Helmets & Riding Gear", nameSi: "හිස් ආවරණ සහ රයිඩින් ගියර්", nameTa: "தலைக்கவசங்கள் & சவாரி உபகரணங்கள்", icon: "helmet" },
      { slug: "other-accessories", nameEn: "Other Accessories", nameSi: "වෙනත් උපාංග", nameTa: "பிற துணைக்கருவிகள்", icon: "accessories" },
    ],
  },
  {
    slug: "services",
    nameEn: "Services",
    nameSi: "සේවා",
    nameTa: "சேவைகள்",
    type: "SERVICE",
    icon: "services",
    children: [
      { slug: "repair-maintenance", nameEn: "Repair & Maintenance", nameSi: "අලුත්වැඩියා සහ නඩත්තු", nameTa: "பழுதுபார்ப்பு & பராமரிப்பு", icon: "services" },
      { slug: "rent-a-car", nameEn: "Rent-a-Car", nameSi: "කුලී රථ", nameTa: "வாடகை கார்", icon: "rent" },
      { slug: "towing-recovery", nameEn: "Towing & Recovery", nameSi: "ඇදගෙන යාම", nameTa: "இழுவை சேவை", icon: "tow" },
      { slug: "detailing-washing", nameEn: "Detailing & Washing", nameSi: "සේදීම සහ ඩිටේලින්", nameTa: "கழுவுதல் & டீடெய்லிங்", icon: "carcare" },
      { slug: "other-services", nameEn: "Other Services", nameSi: "වෙනත් සේවා", nameTa: "பிற சேவைகள்", icon: "services" },
    ],
  },
];
