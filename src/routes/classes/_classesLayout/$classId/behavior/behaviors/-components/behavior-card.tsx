/** @format */

import { BehaviorCardMobile } from "./behavior-card-mobile";
import { BehaviorCardDesktop } from "./behavior-card-desktop";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface BehaviorCardProps {
    behavior: InstaQLEntity<AppSchema, "behaviors", { class?: {} }>;
    classId: string;
    canManage: boolean;
    /** When true, always use desktop layout (e.g. in List view on mobile). */
    preferDesktop?: boolean;
    /** When true, always use mobile layout. */
    preferMobile?: boolean;
}

export function BehaviorCard({
    behavior,
    classId,
    canManage,
    preferDesktop = false,
    preferMobile = false,
}: BehaviorCardProps) {
    if (preferMobile) {
        return (
            <BehaviorCardMobile
                behavior={behavior}
                classId={classId}
                canManage={canManage}
            />
        );
    }
    if (preferDesktop) {
        return (
            <BehaviorCardDesktop
                behavior={behavior}
                classId={classId}
                canManage={canManage}
            />
        );
    }
    return (
        <>
            <div className="lg:hidden">
                <BehaviorCardMobile
                    behavior={behavior}
                    classId={classId}
                    canManage={canManage}
                />
            </div>
            <div className="hidden lg:block">
                <BehaviorCardDesktop
                    behavior={behavior}
                    classId={classId}
                    canManage={canManage}
                />
            </div>
        </>
    );
}
