/** @format */

import type { LucideIcon } from "lucide-react";

export interface NavigationItem {
    title: string;
    description?: string;
    url: string;
    icon: LucideIcon | React.ComponentType<{ className?: string }>;
}
