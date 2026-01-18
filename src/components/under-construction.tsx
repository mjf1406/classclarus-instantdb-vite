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
            className={cn(
                "w-full h-full min-h-[300px] flex flex-col items-center justify-center py-8 px-4 md:py-0 md:px-0",
                className
            )}
            {...props}
        >
            {/* Mobile: smaller image (larger than before, still below desktop) */}
            <ImageSkeleton
                src="/img/under-construction.webp"
                alt="Under Construction"
                className="object-cover block md:hidden"
                width="300"
                height="230"
            />
            {/* Desktop: full-size image */}
            <ImageSkeleton
                src="/img/under-construction.webp"
                alt="Under Construction"
                className="object-cover hidden md:block"
                width="500"
                height="384"
            />
        </div>
    );
}
