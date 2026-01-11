/** @format */

import { Crown, GraduationCap, Heart, Shield, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function OwnerIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <Crown
            {...props}
            className={cn(
                "text-amber-600 dark:text-amber-400",
                props.className
            )}
        />
    );
}

export function AdminIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <Shield
            {...props}
            className={cn("text-blue-600 dark:text-blue-400", props.className)}
        />
    );
}

export function TeacherIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <User
            {...props}
            className={cn(
                "text-purple-600 dark:text-purple-400",
                props.className
            )}
        />
    );
}

export function ParentIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <Heart
            {...props}
            className={cn("text-pink-600 dark:text-pink-400", props.className)}
        />
    );
}

export function StudentIcon(props: React.SVGProps<SVGSVGElement>) {
    return (
        <GraduationCap
            {...props}
            className={cn(
                "text-green-600 dark:text-green-400",
                props.className
            )}
        />
    );
}
