/** @format */

// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

const dataBind = [
    // Authenticated user
    "isAuthenticated",
    "auth.id != null",
    // User is a guest
    "isGuest",
    "auth.isGuest == true",
    // User is not a guest
    "isNotGuest",
    "auth.isGuest == false",
    // User is the owner of the data
    "isOwner",
    "data.owner == auth.id || auth.id == data.user || auth.id == data.id ",
    // User is still the owner of the data
    "isStillOwner",
    "auth.id == newData.owner || auth.id == newData.user || auth.id == newData.id ",
    // User is a premium user
    "isPremium",
    "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
    // User is a teacher in a class
    "isTeacher",
    "auth.id in data.ref('classTeachers.id')",
    // User is still a teacher in a class
    "isStillTeacher",
    "auth.id in newData.ref('classTeachers.id')",
    // User is a member of the org
    "isOrgMember",
    "auth.id in data.ref('orgStudents.id') || auth.id in data.ref('orgTeachers.id') || auth.id in data.ref('orgParents.id')",
    // User is still a member of the org
    "isStillOrgMember",
    "auth.id in newData.ref('orgStudents.id') || auth.id in newData.ref('orgTeachers.id') || auth.id in newData.ref('orgParents.id')",
    // User is a class member
    "isClassMember",
    "auth.id in data.ref('classStudents.id') || auth.id in data.ref('classTeachers.id') || auth.id in data.ref('classParents.id')",
    // User is still a class member
    "isStillClassMember",
    "auth.id in newData.ref('classStudents.id') || auth.id in newData.ref('classTeachers.id') || auth.id in newData.ref('classParents.id')",
    // User is a class parent
    "isClassParent",
    "auth.id in data.ref('classParents.id')",
    // User is still a class parent
    "isStillClassParent",
    "auth.id in newData.ref('classParents.id')",
    // User is an admin of the data (organization admins)
    "isAdmin",
    "auth.id in data.ref('admins.id')",
    // User is still an admin of the data
    "isStillAdmin",
    "auth.id in newData.ref('admins.id')",
    // User is a class admin
    "isClassAdmin",
    "auth.id in data.ref('classAdmins.id')",
    // User is still a class admin
    "isStillClassAdmin",
    "auth.id in newData.ref('classAdmins.id')",
];

const rules = {
    attrs: {
        allow: {
            $default: "false",
        },
    },
    $files: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && isOwner",
            update: "isAuthenticated && (data.ref('owner.id') == [] || (isOwner && isStillOwner))", // Allow update if: no owner yet (new file) OR you are the owner
            delete: "isAuthenticated && isOwner",
        },
        bind: dataBind,
    },
    $users: {
        allow: {
            view: "isAuthenticated",
            create: "false",
            // Allow users to update their own records, OR allow class/org admins to update users
            // who are members of classes/organizations where the admin has permissions
            update: "isAuthenticated && ((isOwner && isStillOwner) || (auth.id in data.ref('studentClasses.classAdmins.id') || auth.id in data.ref('parentClasses.classAdmins.id') || auth.id in data.ref('teacherClasses.classAdmins.id') || auth.id in data.ref('studentOrganizations.admins.id') || auth.id in data.ref('parentOrganizations.admins.id') || auth.id in data.ref('teacherOrganizations.admins.id')))",
            delete: "false",
        },
        bind: dataBind,
    },
    organizations: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (isOwner || isAdmin || isOrgMember)",
            update: "isAuthenticated && (isOwner || isAdmin) && (isStillOwner || isStillAdmin)",
            delete: "isAuthenticated && isOwner",
        },
        bind: dataBind,
    },
    classes: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (isOwner || isClassAdmin || isClassMember || isClassParent)",
            update: "isAuthenticated && (isOwner || isClassAdmin) && (isStillOwner || isStillClassAdmin)",
            delete: "isAuthenticated && isOwner",
        },
        bind: dataBind,
    },
    orgJoinCodes: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (auth.id in data.ref('organization.owner.id') || auth.id in data.ref('organization.admins.id'))",
            update: "isAuthenticated && (auth.id in data.ref('organization.owner.id') || auth.id in data.ref('organization.admins.id'))",
            delete: "isAuthenticated && (auth.id in data.ref('organization.owner.id') || auth.id in data.ref('organization.admins.id'))",
        },
        bind: dataBind,
    },
    classJoinCodes: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (auth.id in data.ref('class.owner.id') || auth.id in data.ref('class.classAdmins.id') || auth.id in data.ref('class.organization.owner.id') || auth.id in data.ref('class.organization.admins.id') || auth.id in data.ref('class.classTeachers.id'))",
            update: "isAuthenticated && (auth.id in data.ref('class.owner.id') || auth.id in data.ref('class.classAdmins.id') || auth.id in data.ref('class.organization.owner.id') || auth.id in data.ref('class.organization.admins.id'))",
            delete: "isAuthenticated && (auth.id in data.ref('class.owner.id') || auth.id in data.ref('class.classAdmins.id') || auth.id in data.ref('class.organization.owner.id') || auth.id in data.ref('class.organization.admins.id'))",
        },
        bind: dataBind,
    },
    joinTokens: {
        allow: {
            create: "false",
            view: "isAuthenticated && isOwner",
            update: "false",
            delete: "false",
        },
        bind: dataBind,
    },
} satisfies InstantRules;

export default rules;
