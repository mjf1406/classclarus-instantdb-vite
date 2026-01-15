/** @format */

import * as React from "react";
import { ImageSkeleton } from "@/components/ui/image-skeleton";
import { cn } from "@/lib/utils";

interface UnderConstructionProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function UnderConstruction({
    className,
    ...props
}: UnderConstructionProps) {
    return (
        <div
            className={cn("w-full h-full", className)}
            {...props}
        >
            <ImageSkeleton
                src="/img/under-construction.webp"
                alt="Under Construction"
                className="object-cover"
                width="500"
                height="384"
            />
        </div>
    );
}
