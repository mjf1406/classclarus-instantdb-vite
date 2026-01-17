/** @format */

// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react";

const _schema = i.schema({
    entities: {
        $files: i.entity({
            path: i.string().unique().indexed(),
            url: i.string(),
        }),
        $users: i.entity({
            // System Columns
            email: i.string().unique().indexed().optional(),
            imageURL: i.string().optional(),
            type: i.string().optional(),
            // Custom Columns
            avatarURL: i.string().optional(),
            plan: i.string().optional(),
            firstName: i.string().optional(),
            lastName: i.string().optional(),
            created: i.date().optional(),
            updated: i.date().optional(),
            lastLogon: i.date().optional(),
            countHelper: i.boolean().optional(),
            // Billing fields (updated via Polar webhook)
            polarCustomerId: i.string().indexed().optional(),
            polarSubscriptionId: i.string().optional(),
            // Google Classroom integration
            googleRefreshToken: i.string().optional(),
        }),
        organizations: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            icon: i.string().optional(),
            created: i.date(),
            updated: i.date(),
            code: i.string().unique().indexed(),
        }),
        classes: i.entity({
            name: i.string(),
            description: i.string().optional(),
            icon: i.string().optional(),
            year: i.number().indexed().optional(),
            created: i.date(),
            updated: i.date(),
            archivedAt: i.date().indexed().optional(), // null = active, date = archived
            studentCode: i.string().unique().indexed(),
            teacherCode: i.string().unique().indexed(),
            guardianCode: i.string().unique().indexed(),
        }),
        pendingMembers: i.entity({
            email: i.string().indexed(),
            firstName: i.string().optional(),
            lastName: i.string().optional(),
            role: i.string(), // "student" | "teacher" | "guardian"
            source: i.string(), // "google_classroom" | "manual" | "csv"
            createdAt: i.date(),
        }),
        groups: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            created: i.date(),
            updated: i.date(),
        }),
        teams: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            created: i.date(),
            updated: i.date(),
        }),
    },
    links: {
        userClasses: {
            forward: {
                on: "classes",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            }, // Each class has one owner who created it, which is a user id
            reverse: {
                on: "$users",
                has: "many",
                label: "classes",
            }, // Each user can have many classes
        },
        userOrganizations: {
            forward: {
                on: "organizations",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            }, // Each organization has one owner who created it, which is a user id
            reverse: {
                on: "$users",
                has: "many",
                label: "organizations",
            }, // Each user can have many organizations
        },
        classOrganization: {
            forward: {
                on: "classes",
                has: "one",
                label: "organization",
                onDelete: "cascade",
            }, // Each class has one organization
            reverse: {
                on: "organizations",
                has: "many",
                label: "classes",
            }, // Each organization can have many classes
        },
        userFiles: {
            forward: {
                on: "$files",
                has: "one",
                label: "owner",
                onDelete: "cascade",
            }, // Each file has one owner, which is a user id
            reverse: {
                on: "$users",
                has: "many",
                label: "files",
            }, // Each user can have many files
        },
        organizationFiles: {
            forward: {
                on: "$files",
                has: "one",
                label: "organization",
                onDelete: "cascade",
            }, // Each file has one organization
            reverse: {
                on: "organizations",
                has: "many",
                label: "files",
            }, // Each organization can have many files
        },
        classFiles: {
            forward: {
                on: "$files",
                has: "one",
                label: "class",
                onDelete: "cascade",
            }, // Each file has one class
            reverse: {
                on: "classes",
                has: "many",
                label: "files",
            }, // Each class can have many files
        },
        orgTeachers: {
            forward: {
                on: "organizations",
                has: "many",
                label: "orgTeachers",
            }, // Each organization can have many teachers
            reverse: {
                on: "$users",
                has: "many",
                label: "teacherOrganizations",
            }, // Each user can be a teacher in many organizations
        },
        orgAdmins: {
            forward: {
                on: "organizations",
                has: "many",
                label: "admins",
            }, // Each organization can have many admins
            reverse: {
                on: "$users",
                has: "many",
                label: "adminOrganizations",
            }, // Each user can be an admin of many organizations
        },
        classAdmins: {
            forward: {
                on: "classes",
                has: "many",
                label: "classAdmins",
            }, // Each class can have many admins
            reverse: {
                on: "$users",
                has: "many",
                label: "adminClasses",
            }, // Each user can be an admin of many classes
        },
        classTeachers: {
            forward: {
                on: "classes",
                has: "many",
                label: "classTeachers",
            }, // Each class can have many teachers
            reverse: {
                on: "$users",
                has: "many",
                label: "teacherClasses",
            }, // Each user can be a teacher of many classes
        },
        classAssistantTeachers: {
            forward: {
                on: "classes",
                has: "many",
                label: "classAssistantTeachers",
            }, // Each class can have many assistant teachers
            reverse: {
                on: "$users",
                has: "many",
                label: "assistantTeacherClasses",
            }, // Each user can be an assistant teacher of many classes
        },
        classStudents: {
            forward: {
                on: "classes",
                has: "many",
                label: "classStudents",
            }, // Each class can have many students
            reverse: {
                on: "$users",
                has: "many",
                label: "studentClasses",
            }, // Each user can be a student in many classes
        },
        classGuardians: {
            forward: {
                on: "classes",
                has: "many",
                label: "classGuardians",
            }, // Each class can have many guardians
            reverse: {
                on: "$users",
                has: "many",
                label: "guardianClasses",
            }, // Each user can be a guardian in many classes
        },
        guardianStudents: {
            forward: {
                on: "$users",
                has: "many",
                label: "children",
            }, // Each guardian can have many children (students)
            reverse: {
                on: "$users",
                has: "many",
                label: "guardians",
            }, // Each student can have many guardians
        },
        classPendingMembers: {
            forward: {
                on: "classes",
                has: "many",
                label: "pendingMembers",
            }, // Each class can have many pending members
            reverse: {
                on: "pendingMembers",
                has: "one",
                label: "class",
            }, // Each pending member belongs to one class
        },
        classGroups: {
            forward: {
                on: "classes",
                has: "many",
                label: "groups",
            }, // Each class can have many groups
            reverse: {
                on: "groups",
                has: "one",
                label: "class",
            }, // Each group belongs to one class
        },
        groupStudents: {
            forward: {
                on: "groups",
                has: "many",
                label: "groupStudents",
            }, // Each group can have many students
            reverse: {
                on: "$users",
                has: "many",
                label: "studentGroups",
            }, // Each user can be in many groups
        },
        groupTeams: {
            forward: {
                on: "groups",
                has: "many",
                label: "groupTeams",
            }, // Each group can have many teams
            reverse: {
                on: "teams",
                has: "one",
                label: "group",
                onDelete: "cascade",
            }, // Each team belongs to one group, cascade delete when group is deleted
        },
        teamStudents: {
            forward: {
                on: "teams",
                has: "many",
                label: "teamStudents",
            }, // Each team can have many students
            reverse: {
                on: "$users",
                has: "many",
                label: "studentTeams",
            }, // Each user can be on many teams
        },
    },
    rooms: {},
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
