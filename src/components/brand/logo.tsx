/** @format */

import logo from "/brand/classclarus-logo.webp";
import icon from "/brand/classclarus-icon.webp";
import { ImageSkeleton } from "../ui/image-skeleton";

export function LogoBig() {
    return (
        <ImageSkeleton
            src={logo}
            alt="ClassClarus Logo"
            width={434}
            height={106}
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

export function Icon() {
    return (
        <ImageSkeleton
            src={icon}
            alt="ClassClarus Icon"
            width={64}
            height={64}
        />
    );
}
