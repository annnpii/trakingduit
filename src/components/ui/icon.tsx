"use client";

import {
  Banknote,
  Building2,
  Car,
  CirclePlus,
  Clapperboard,
  CreditCard,
  Ellipsis,
  Gift,
  GraduationCap,
  HeartPulse,
  Home,
  Landmark,
  Laptop,
  PiggyBank,
  Plane,
  Receipt,
  ShoppingBag,
  Smartphone,
  Target,
  TrendingUp,
  Utensils,
  Wallet,
  type LucideIcon,
} from "lucide-react";

const MAP: Record<string, LucideIcon> = {
  banknote: Banknote,
  bank: Building2,
  car: Car,
  "circle-plus": CirclePlus,
  clapperboard: Clapperboard,
  "credit-card": CreditCard,
  ellipsis: Ellipsis,
  gift: Gift,
  "graduation-cap": GraduationCap,
  "heart-pulse": HeartPulse,
  home: Home,
  landmark: Landmark,
  laptop: Laptop,
  "piggy-bank": PiggyBank,
  plane: Plane,
  receipt: Receipt,
  "shopping-bag": ShoppingBag,
  smartphone: Smartphone,
  target: Target,
  "trending-up": TrendingUp,
  utensils: Utensils,
  wallet: Wallet,
};

export const ICON_NAMES = Object.keys(MAP);

export function DynIcon({ name, className }: { name?: string; className?: string }) {
  const Cmp = (name && MAP[name]) || Ellipsis;
  return <Cmp className={className} />;
}
