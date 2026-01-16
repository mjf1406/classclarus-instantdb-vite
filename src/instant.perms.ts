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
    // User is an assistant teacher in a class
    "isAssistantTeacher",
    "auth.id in data.ref('classAssistantTeachers.id')",
    // User is still an assistant teacher in a class
    "isStillAssistantTeacher",
    "auth.id in newData.ref('classAssistantTeachers.id')",
    // User is a teacher in an org
    "isOrgTeacher",
    "auth.id in data.ref('orgTeachers.id')",
    // User is still a teacher in an org
    "isStillOrgTeacher",
    "auth.id in newData.ref('orgTeachers.id')",
    // User is in a class that belongs to this org (for viewing org)
    "isInOrgClass",
    "auth.id in data.ref('classes.classStudents.id') || auth.id in data.ref('classes.classTeachers.id') || auth.id in data.ref('classes.classAssistantTeachers.id') || auth.id in data.ref('classes.classParents.id')",
    // User is a teacher in tthe class
    "isClassTeacher",
    "auth.id in data.ref('classes.classTeachers.id')",
    // User is still a teacher in the class
    "isStillClassTeacher",
    "auth.id in newData.ref('classes.classTeachers.id')",
    // User is an assistant teacher in the class
    "isClassAssistantTeacher",
    "auth.id in data.ref('classes.classAssistantTeachers.id')",
    // User is still an assistant teacher in the class
    "isStillClassAssistantTeacher",
    "auth.id in newData.ref('classes.classAssistantTeachers.id')",
    // User is a class member
    "isClassMember",
    "auth.id in data.ref('classStudents.id') || auth.id in data.ref('classTeachers.id') || auth.id in data.ref('classAssistantTeachers.id') || auth.id in data.ref('classParents.id')",
    // User is still a class member
    "isStillClassMember",
    "auth.id in newData.ref('classStudents.id') || auth.id in newData.ref('classTeachers.id') || auth.id in newData.ref('classAssistantTeachers.id') || auth.id in newData.ref('classParents.id')",
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
    // User is a class admin (works for classes and classJoinCodes)
    "isClassAdmin",
    "auth.id in data.ref('classAdmins.id') || auth.id in data.ref('class.classAdmins.id')",
    // User is still a class admin (works for classes and classJoinCodes)
    "isStillClassAdmin",
    "auth.id in newData.ref('classAdmins.id') || auth.id in newData.ref('class.classAdmins.id')",
    // User is the owner of an organization (works for orgJoinCodes and classJoinCodes)
    "isOrgOwner",
    "auth.id in data.ref('organization.owner.id') || auth.id in data.ref('class.organization.owner.id')",
    // User is still the owner of an organization (works for orgJoinCodes and classJoinCodes)
    "isStillOrgOwner",
    "auth.id in newData.ref('organization.owner.id') || auth.id in newData.ref('class.organization.owner.id')",
    // User is an admin of an organization (works for orgJoinCodes and classJoinCodes)
    "isOrgAdmin",
    "auth.id in data.ref('organization.admins.id') || auth.id in data.ref('class.organization.admins.id')",
    // User is still an admin of an organization (works for orgJoinCodes and classJoinCodes)
    "isStillOrgAdmin",
    "auth.id in newData.ref('organization.admins.id') || auth.id in newData.ref('class.organization.admins.id')",
    // User is the owner of a class (for classJoinCodes)
    "isClassOwner",
    "auth.id in data.ref('class.owner.id')",
    // User is still the owner of a class (for classJoinCodes)
    "isStillClassOwner",
    "auth.id in newData.ref('class.owner.id')",
];

// ============================================================
//                  BASIC USER RELATIONSHIPS
// ============================================================
const userBasicRelationshipBind = [
    "isMyself",
    "auth.id == data.id",
    "isMyChild",
    "auth.id in data.ref('parents.id')",
    "isMyParent",
    "auth.id in data.ref('children.id')",
];
// ============================================================
//                  CLASS USER RELATIONSHIPS
// ============================================================
const userClassOwnerBind = [
    "isStudentInMyClassAsOwner",
    "auth.id in data.ref('studentClasses.owner.id')",
    "isTeacherInMyClassAsOwner",
    "auth.id in data.ref('teacherClasses.owner.id')",
    "isAssistantTeacherInMyClassAsOwner",
    "auth.id in data.ref('assistantTeacherClasses.owner.id')",
    "isParentInMyClassAsOwner",
    "auth.id in data.ref('parentClasses.owner.id')",
    "isAdminInMyClassAsOwner",
    "auth.id in data.ref('adminClasses.owner.id')",
];
const userClassAdminBind = [
    "isStudentInMyClassAsAdmin",
    "auth.id in data.ref('studentClasses.classAdmins.id')",
    "isTeacherInMyClassAsAdmin",
    "auth.id in data.ref('teacherClasses.classAdmins.id')",
    "isAssistantTeacherInMyClassAsAdmin",
    "auth.id in data.ref('assistantTeacherClasses.classAdmins.id')",
    "isParentInMyClassAsAdmin",
    "auth.id in data.ref('parentClasses.classAdmins.id')",
    "isAdminInMyClassAsAdmin",
    "auth.id in data.ref('adminClasses.classAdmins.id')",
];
const userClassTeacherBind = [
    "isStudentInMyClassAsTeacher",
    "auth.id in data.ref('studentClasses.classTeachers.id')",
    "isTeacherInMyClassAsTeacher",
    "auth.id in data.ref('teacherClasses.classTeachers.id')",
    "isAssistantTeacherInMyClassAsTeacher",
    "auth.id in data.ref('assistantTeacherClasses.classTeachers.id')",
    "isParentInMyClassAsTeacher",
    "auth.id in data.ref('parentClasses.classTeachers.id')",
];
const userClassParentBind = [
    "isStudentInMyClassAsParent",
    "auth.id in data.ref('studentClasses.classParents.id')",
    "isTeacherInMyClassAsParent",
    "auth.id in data.ref('teacherClasses.classParents.id')",
    "isAssistantTeacherInMyClassAsParent",
    "auth.id in data.ref('assistantTeacherClasses.classParents.id')",
];
const userClassStudentBind = [
    "isTeacherInMyClassAsStudent",
    "auth.id in data.ref('teacherClasses.classStudents.id')",
    "isAssistantTeacherInMyClassAsStudent",
    "auth.id in data.ref('assistantTeacherClasses.classStudents.id')",
    "isParentInMyClassAsStudent",
    "auth.id in data.ref('parentClasses.classStudents.id')",
];
// ============================================================
//          PARENT-CHILD RELATIONSHIPS IN SHARED CLASSES
// ============================================================
const userClassParentChildBind = [
    "isMyChildInSharedClass",
    "isMyChild && (auth.id in data.ref('parentClasses.classStudents.id'))",
    "isMyParentInSharedClass",
    "isMyParent && (auth.id in data.ref('studentClasses.classParents.id'))",
];
// ============================================================
//                ORGANIZATION USER RELATIONSHIPS
// ============================================================
const userOrgRelationshipBind = [
    "isTeacherInMyOrgAsAdmin",
    "auth.id in data.ref('teacherOrganizations.admins.id')",
    "isTeacherInMyOrgAsOwner",
    "auth.id in data.ref('teacherOrganizations.owner.id')",
];
const userBinds = [
    ...userBasicRelationshipBind,
    ...userClassOwnerBind,
    ...userClassAdminBind,
    ...userClassTeacherBind,
    ...userClassParentBind,
    ...userClassStudentBind,
    ...userClassParentChildBind,
    ...userOrgRelationshipBind,
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
            view: "true",
            create: "false",
            // Allow users to update their own records, OR allow class/org admins to update users
            // who are members of classes/organizations where the admin has permissions
            update: "isAuthenticated && ((isOwner && isStillOwner) || (auth.id in data.ref('studentClasses.classAdmins.id') || auth.id in data.ref('parentClasses.classAdmins.id') || auth.id in data.ref('teacherClasses.classAdmins.id') || auth.id in data.ref('assistantTeacherClasses.classAdmins.id') || auth.id in data.ref('teacherOrganizations.admins.id')))",
            delete: "false",
        },
        fields: {
            email: "isAuthenticated && ( isMyself || isMyChild || isMyParent || isMyChildInSharedClass || isMyParentInSharedClass || isStudentInMyClassAsOwner || isTeacherInMyClassAsOwner || isAssistantTeacherInMyClassAsOwner || isParentInMyClassAsOwner || isAdminInMyClassAsOwner || isStudentInMyClassAsAdmin || isTeacherInMyClassAsAdmin || isAssistantTeacherInMyClassAsAdmin || isParentInMyClassAsAdmin || isAdminInMyClassAsAdmin || isStudentInMyClassAsTeacher || isTeacherInMyClassAsTeacher || isAssistantTeacherInMyClassAsTeacher || isParentInMyClassAsTeacher || isStudentInMyClassAsParent || isTeacherInMyClassAsParent || isAssistantTeacherInMyClassAsParent || isTeacherInMyClassAsStudent || isAssistantTeacherInMyClassAsStudent || isParentInMyClassAsStudent || isTeacherInMyOrgAsAdmin || isTeacherInMyOrgAsOwner )",
            imageURL:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent || isMyChildInSharedClass || isMyParentInSharedClass || isStudentInMyClassAsOwner || isTeacherInMyClassAsOwner || isAssistantTeacherInMyClassAsOwner || isParentInMyClassAsOwner || isAdminInMyClassAsOwner || isStudentInMyClassAsAdmin || isTeacherInMyClassAsAdmin || isAssistantTeacherInMyClassAsAdmin || isParentInMyClassAsAdmin || isAdminInMyClassAsAdmin || isStudentInMyClassAsTeacher || isTeacherInMyClassAsTeacher || isAssistantTeacherInMyClassAsTeacher || isParentInMyClassAsTeacher || isStudentInMyClassAsParent || isTeacherInMyClassAsParent || isAssistantTeacherInMyClassAsParent || isTeacherInMyClassAsStudent || isAssistantTeacherInMyClassAsStudent || isParentInMyClassAsStudent || isTeacherInMyOrgAsAdmin || isTeacherInMyOrgAsOwner )",
            type: "isAuthenticated && ( isMyself || isMyChild || isMyParent )",
            avatarURL:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent || isMyChildInSharedClass || isMyParentInSharedClass || isStudentInMyClassAsOwner || isTeacherInMyClassAsOwner || isAssistantTeacherInMyClassAsOwner || isParentInMyClassAsOwner || isAdminInMyClassAsOwner || isStudentInMyClassAsAdmin || isTeacherInMyClassAsAdmin || isAssistantTeacherInMyClassAsAdmin || isParentInMyClassAsAdmin || isAdminInMyClassAsAdmin || isStudentInMyClassAsTeacher || isTeacherInMyClassAsTeacher || isAssistantTeacherInMyClassAsTeacher || isParentInMyClassAsTeacher || isStudentInMyClassAsParent || isTeacherInMyClassAsParent || isAssistantTeacherInMyClassAsParent || isTeacherInMyClassAsStudent || isAssistantTeacherInMyClassAsStudent || isParentInMyClassAsStudent || isTeacherInMyOrgAsAdmin || isTeacherInMyOrgAsOwner )",
            plan: "isAuthenticated && ( isMyself || isMyChild || isMyParent )",
            firstName:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent || isMyChildInSharedClass || isMyParentInSharedClass || isStudentInMyClassAsOwner || isTeacherInMyClassAsOwner || isAssistantTeacherInMyClassAsOwner || isParentInMyClassAsOwner || isAdminInMyClassAsOwner || isStudentInMyClassAsAdmin || isTeacherInMyClassAsAdmin || isAssistantTeacherInMyClassAsAdmin || isParentInMyClassAsAdmin || isAdminInMyClassAsAdmin || isStudentInMyClassAsTeacher || isTeacherInMyClassAsTeacher || isAssistantTeacherInMyClassAsTeacher || isParentInMyClassAsTeacher || isStudentInMyClassAsParent || isTeacherInMyClassAsParent || isAssistantTeacherInMyClassAsParent || isTeacherInMyClassAsStudent || isAssistantTeacherInMyClassAsStudent || isParentInMyClassAsStudent || isTeacherInMyOrgAsAdmin || isTeacherInMyOrgAsOwner )",
            lastName:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent || isMyChildInSharedClass || isMyParentInSharedClass || isStudentInMyClassAsOwner || isTeacherInMyClassAsOwner || isAssistantTeacherInMyClassAsOwner || isParentInMyClassAsOwner || isAdminInMyClassAsOwner || isStudentInMyClassAsAdmin || isTeacherInMyClassAsAdmin || isAssistantTeacherInMyClassAsAdmin || isParentInMyClassAsAdmin || isAdminInMyClassAsAdmin || isStudentInMyClassAsTeacher || isTeacherInMyClassAsTeacher || isAssistantTeacherInMyClassAsTeacher || isParentInMyClassAsTeacher || isStudentInMyClassAsParent || isTeacherInMyClassAsParent || isAssistantTeacherInMyClassAsParent || isTeacherInMyClassAsStudent || isAssistantTeacherInMyClassAsStudent || isParentInMyClassAsStudent || isTeacherInMyOrgAsAdmin || isTeacherInMyOrgAsOwner )",
            created:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent )",
            updated:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent )",
            lastLogon:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent )",
            polarCustomerId:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent )",
            polarSubscriptionId:
                "isAuthenticated && ( isMyself || isMyChild || isMyParent )",
        },
        bind: [...dataBind, ...userBinds],
    },
    // $users: {
    //     allow: {
    //         view: "isAuthenticated && ( isMyself || isMyChild || isMyParent || isStudentInMyClassAsOwner || isTeacherInMyClassAsOwner || isAssistantTeacherInMyClassAsOwner || isParentInMyClassAsOwner || isAdminInMyClassAsOwner || isStudentInMyClassAsAdmin || isTeacherInMyClassAsAdmin || isAssistantTeacherInMyClassAsAdmin || isParentInMyClassAsAdmin || isAdminInMyClassAsAdmin || isStudentInMyClassAsTeacher || isTeacherInMyClassAsTeacher || isAssistantTeacherInMyClassAsTeacher || isParentInMyClassAsTeacher || isStudentInMyClassAsParent || isTeacherInMyClassAsParent || isAssistantTeacherInMyClassAsParent || isTeacherInMyClassAsStudent || isAssistantTeacherInMyClassAsStudent || isParentInMyClassAsStudent || isStudentInMyOrgAsAdmin || isStudentInMyOrgAsOwner )",
    //         create: "false",
    //         // Allow users to update their own records, OR allow class/org admins to update users
    //         // who are members of classes/organizations where the admin has permissions
    //         update: "isAuthenticated && ((isOwner && isStillOwner) || (auth.id in data.ref('studentClasses.classAdmins.id') || auth.id in data.ref('parentClasses.classAdmins.id') || auth.id in data.ref('teacherClasses.classAdmins.id') || auth.id in data.ref('assistantTeacherClasses.classAdmins.id') || auth.id in data.ref('studentOrganizations.admins.id') || auth.id in data.ref('parentOrganizations.admins.id') || auth.id in data.ref('teacherOrganizations.admins.id') || auth.id in data.ref('assistantTeacherOrganizations.admins.id')))",
    //         delete: "false",
    //     },
    //     fields: {
    //         countHelper: "isAuthenticated",
    //     },
    //     bind: [...dataBind, ...userBinds],
    // },
    organizations: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (isOwner || isAdmin || isOrgTeacher || isInOrgClass)",
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
} satisfies InstantRules;

export default rules;
