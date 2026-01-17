/** @format */

import {
    FileText,
    BookOpenCheck,
    CheckSquare,
    Target,
    Users,
    Calendar,
    Dice6,
    BookOpen,
    CalendarCheck,
} from "lucide-react";
import type { NavigationItem } from "./types";

export function getClassManagementItems(classId: string): NavigationItem[] {
    return [
        {
            title: "Assignments",
            description: "Manage assignments for your class",
            url: `/classes/${classId}/assignments`,
            icon: FileText,
        },
        {
            title: "Attendance",
            description: "Manage attendance for your class",
            url: `/classes/${classId}/attendance`,
            icon: CalendarCheck,
        },
        {
            title: "Gradebook",
            description: "View and manage gradebook for your class",
            url: `/classes/${classId}/gradebook`,
            icon: BookOpenCheck,
        },
        {
            title: "Tasks",
            description: "View and manage tasks for your class",
            url: `/classes/${classId}/tasks`,
            icon: CheckSquare,
        },
        {
            title: "Expectations",
            description: "View and manage expectations for your class",
            url: `/classes/${classId}/expectations`,
            icon: Target,
        },
        {
            title: "Reading",
            description: "View and manage reading for your class",
            url: `/classes/${classId}/reading`,
            icon: BookOpen,
        },
    ];
}

export function getRandomItems(classId: string): NavigationItem[] {
    return [
        {
            title: "Assigners",
            description: "View and manage assigners for your class",
            url: `/classes/${classId}/random-tools/assigners`,
            icon: Users,
        },
        {
            title: "Random Event",
            description: "View and manage random event for your class",
            url: `/classes/${classId}/random-tools/random-event`,
            icon: Calendar,
        },
        {
            title: "Randomizer",
            description: "View and manage randomizer for your class",
            url: `/classes/${classId}/random-tools/randomizer`,
            icon: Dice6,
        },
    ];
}
