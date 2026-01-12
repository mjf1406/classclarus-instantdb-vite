/** @format */

import logo from "/brand/icon-left-of-text-different-sizes-removebg-preview.webp";
import icon from "/brand/icon-removebg.webp";
import textLogo from "/brand/text-removebg-preview.webp";
import { ImageSkeleton } from "../ui/image-skeleton";

export function LogoBig() {
    return (
        <ImageSkeleton
            src={logo}
            alt="ClassClarus Logo"
            width={399}
            height={125}
        />
    );
}

export function Logo() {
    return (
        <ImageSkeleton
            src={logo}
            alt="ClassClarus Logo"
            width={217}
            height={53}
        />
    );
}

export function Icon({ className }: { className?: string } = {}) {
    // If className is provided, don't set fixed dimensions to allow className sizing
    const width = className ? undefined : 64;
    const height = className ? undefined : 64;
    return (
        <ImageSkeleton
            src={icon}
            alt="ClassClarus Icon"
            width={width}
            height={height}
            className={className}
        />
    );
}

export function TextLogo({ className }: { className?: string } = {}) {
    // If className is provided, don't set fixed dimensions to allow className sizing
    const width = className ? undefined : 200;
    const height = className ? undefined : 40;
    return (
        <ImageSkeleton
            src={textLogo}
            alt="ClassClarus Text Logo"
            width={width}
            height={height}
            className={className}
        />
    );
}
