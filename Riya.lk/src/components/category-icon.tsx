import {
  Armchair,
  Bike,
  BusFront,
  Car,
  CarFront,
  CircleDot,
  Cog,
  Disc3,
  HardHat,
  KeyRound,
  Lightbulb,
  Motorbike,
  Sailboat,
  Settings,
  Settings2,
  Snowflake,
  Sparkles,
  Speaker,
  SprayCan,
  Tractor,
  Truck,
  Van,
  Wrench,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";

/** Three-wheeler ("tuk-tuk") icon drawn in the same style as lucide icons. */
function TukTuk(props: LucideProps) {
  const { size = 24, strokeWidth = 2, className, ...rest } = props;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
      {...(rest as React.SVGProps<SVGSVGElement>)}
    >
      <path d="M4 16V9a4 4 0 0 1 4-4h7a3 3 0 0 1 3 3v2" />
      <path d="M18 10h1.5a1.5 1.5 0 0 1 1.5 1.5V16h-2" />
      <path d="M4 10h9v6" />
      <path d="M8.5 16h6" />
      <circle cx="6" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  );
}

const ICONS: Record<string, LucideIcon | typeof TukTuk> = {
  car: Car,
  motorbike: Motorbike,
  tuktuk: TukTuk,
  van: Van,
  suv: CarFront,
  truck: Truck,
  bus: BusFront,
  tractor: Tractor,
  boat: Sailboat,
  bicycle: Bike,
  parts: Cog,
  engine: Settings,
  body: SprayCan,
  electrical: Zap,
  tyre: Disc3,
  suspension: Settings2,
  brakes: CircleDot,
  gear: Cog,
  lights: Lightbulb,
  interior: Armchair,
  cooling: Snowflake,
  accessories: Sparkles,
  audio: Speaker,
  carcare: SprayCan,
  helmet: HardHat,
  services: Wrench,
  rent: KeyRound,
  tow: Truck,
};

/** Icon keys available to admins when creating categories. */
export const CATEGORY_ICON_KEYS = Object.keys(ICONS);

export function CategoryIcon({ icon, ...props }: { icon: string } & LucideProps) {
  const Icon = ICONS[icon] ?? Car;
  return <Icon {...props} />;
}
