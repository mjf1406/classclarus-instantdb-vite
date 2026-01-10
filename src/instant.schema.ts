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
            // Billing fields (updated via Polar webhook)
            polarCustomerId: i.string().indexed().optional(),
            polarSubscriptionId: i.string().optional(),
        }),
        organizations: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            icon: i.string().optional(),
            created: i.date(),
            updated: i.date(),
        }),
        classes: i.entity({
            name: i.string(),
            description: i.string().optional(),
            icon: i.string().optional(),
            created: i.date(),
            updated: i.date(),
            archivedAt: i.date().indexed().optional(), // null = active, date = archived
        }),
        orgJoinCodes: i.entity({
            code: i.string().unique().indexed(),
        }),
        classJoinCodes: i.entity({
            studentCode: i.string().unique().indexed(),
            teacherCode: i.string().unique().indexed(),
            parentCode: i.string().unique().indexed(),
        }),
        joinTokens: i.entity({
            token: i.string().unique().indexed(),
            code: i.string().indexed(),
            type: i.string().indexed(),
            entityId: i.string().indexed(),
            owner: i.string().indexed(),
            expiresAt: i.date().indexed(),
            used: i.boolean(),
            created: i.date(),
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
        orgStudents: {
            forward: {
                on: "organizations",
                has: "many",
                label: "orgStudents",
            }, // Each organization can have many students
            reverse: {
                on: "$users",
                has: "many",
                label: "studentOrganizations",
            }, // Each user can be a student in many organizations
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
        orgParents: {
            forward: {
                on: "organizations",
                has: "many",
                label: "orgParents",
            }, // Each organization can have many parents
            reverse: {
                on: "$users",
                has: "many",
                label: "parentOrganizations",
            }, // Each user can be a parent in many organizations
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
        classParents: {
            forward: {
                on: "classes",
                has: "many",
                label: "classParents",
            }, // Each class can have many parents
            reverse: {
                on: "$users",
                has: "many",
                label: "parentClasses",
            }, // Each user can be a parent in many classes
        },
        parentStudents: {
            forward: {
                on: "$users",
                has: "many",
                label: "children",
            }, // Each parent can have many children (students)
            reverse: {
                on: "$users",
                has: "many",
                label: "parents",
            }, // Each student can have many parents
        },
        orgJoinCodeLink: {
            forward: {
                on: "organizations",
                has: "one",
                label: "joinCodeEntity",
            }, // Each organization has one join code entity
            reverse: {
                on: "orgJoinCodes",
                has: "one",
                label: "organization",
                onDelete: "cascade",
            }, // Each join code entity belongs to one organization
        },
        classJoinCodeLink: {
            forward: {
                on: "classes",
                has: "one",
                label: "joinCodeEntity",
            }, // Each class has one join code entity
            reverse: {
                on: "classJoinCodes",
                has: "one",
                label: "class",
                onDelete: "cascade",
            }, // Each join code entity belongs to one class
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
