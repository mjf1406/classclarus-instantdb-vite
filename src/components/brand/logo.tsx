/** @format */

import logo from "/brand/icon-left-of-text-different-sizes-removebg-preview.webp";
import icon from "/brand/icon.webp";
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
