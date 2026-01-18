/** @format */

import { BehaviorCardMobile } from "./behavior-card-mobile";
import { BehaviorCardDesktop } from "./behavior-card-desktop";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";

interface BehaviorCardProps {
    behavior: InstaQLEntity<AppSchema, "behaviors", { class?: {} }>;
    classId: string;
    canManage: boolean;
}

export function BehaviorCard({ behavior, classId, canManage }: BehaviorCardProps) {
    return (
        <>
            <div className="md:hidden">
                <BehaviorCardMobile
                    behavior={behavior}
                    classId={classId}
                    canManage={canManage}
                />
            </div>
            <div className="hidden md:block">
                <BehaviorCardDesktop
                    behavior={behavior}
                    classId={classId}
                    canManage={canManage}
                />
            </div>
        </>
    );
}
