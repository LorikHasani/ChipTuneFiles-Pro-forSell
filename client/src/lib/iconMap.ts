import {
  Zap, Flame, Rocket, Settings2, Filter, Wind, Droplets, Gauge,
  Thermometer, Shield, Wrench, Cpu, Cog, Star, Bolt, Car,
  Fuel, Power, CircuitBoard, Activity, TrendingUp, BarChart3,
  AlertTriangle, Ban, Eye, EyeOff, Volume2, VolumeX,
  type LucideIcon,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  Zap, Flame, Rocket, Settings2, Filter, Wind, Droplets, Gauge,
  Thermometer, Shield, Wrench, Cpu, Cog, Star, Bolt, Car,
  Fuel, Power, CircuitBoard, Activity, TrendingUp, BarChart3,
  AlertTriangle, Ban, Eye, EyeOff, Volume2, VolumeX,
};

export function getLucideIcon(name: string | null | undefined): LucideIcon | null {
  if (!name) return null;
  return iconMap[name] || null;
}
