/** @format */

// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react";

// ============================================================
//                      BIND DEFINITIONS
// ============================================================

// Authentication & Ownership
const authenticationBinds = {
    isAuthenticated: "auth.id != null",
    isGuest: "auth.isGuest == true",
    isNotGuest: "auth.isGuest == false",
    isOwner:
        "data.owner == auth.id || auth.id == data.user || auth.id == data.id",
    isStillOwner:
        "auth.id == newData.owner || auth.id == newData.user || auth.id == newData.id",
    isPremium:
        "auth.ref('$user.profile.plan').exists(p, p in ['basic', 'plus', 'pro'])",
};

// Class Role Binds
const classRoleBinds = {
    isTeacher: "auth.id in data.ref('classTeachers.id')",
    isStillTeacher: "auth.id in newData.ref('classTeachers.id')",
    isAssistantTeacher: "auth.id in data.ref('classAssistantTeachers.id')",
    isStillAssistantTeacher:
        "auth.id in newData.ref('classAssistantTeachers.id')",
    isClassMember:
        "auth.id in data.ref('classStudents.id') || auth.id in data.ref('classTeachers.id') || auth.id in data.ref('classAssistantTeachers.id') || auth.id in data.ref('classParents.id')",
    isStillClassMember:
        "auth.id in newData.ref('classStudents.id') || auth.id in newData.ref('classTeachers.id') || auth.id in newData.ref('classAssistantTeachers.id') || auth.id in newData.ref('classParents.id')",
    isClassParent: "auth.id in data.ref('classParents.id')",
    isStillClassParent: "auth.id in newData.ref('classParents.id')",
    isClassAdmin: "auth.id in data.ref('classAdmins.id')",
    isStillClassAdmin: "auth.id in newData.ref('classAdmins.id')",
    isClassTeacher: "auth.id in data.ref('classes.classTeachers.id')",
    isStillClassTeacher: "auth.id in newData.ref('classes.classTeachers.id')",
    isClassAssistantTeacher:
        "auth.id in data.ref('classes.classAssistantTeachers.id')",
    isStillClassAssistantTeacher:
        "auth.id in newData.ref('classes.classAssistantTeachers.id')",
};

// Organization Role Binds
const organizationRoleBinds = {
    isOrgTeacher: "auth.id in data.ref('orgTeachers.id')",
    isStillOrgTeacher: "auth.id in newData.ref('orgTeachers.id')",
    isInOrgClass:
        "auth.id in data.ref('classes.classStudents.id') || auth.id in data.ref('classes.classTeachers.id') || auth.id in data.ref('classes.classAssistantTeachers.id') || auth.id in data.ref('classes.classParents.id')",
    isAdmin: "auth.id in data.ref('admins.id')",
    isStillAdmin: "auth.id in newData.ref('admins.id')",
    isOrgOwner: "auth.id in data.ref('organization.owner.id')",
    isStillOrgOwner: "auth.id in newData.ref('organization.owner.id')",
    isOrgAdmin: "auth.id in data.ref('organization.admins.id')",
    isStillOrgAdmin: "auth.id in newData.ref('organization.admins.id')",
};

// User Basic Relationships
const userBasicRelationships = {
    isMyself: "auth.id == data.id",
    isMyChild: "auth.id in data.ref('parents.id')",
    isMyParent: "auth.id in data.ref('children.id')",
};

// User Class Relationships - As Owner
const userClassOwnerRelationships = {
    isStudentInMyClassAsOwner: "auth.id in data.ref('studentClasses.owner.id')",
    isTeacherInMyClassAsOwner: "auth.id in data.ref('teacherClasses.owner.id')",
    isAssistantTeacherInMyClassAsOwner:
        "auth.id in data.ref('assistantTeacherClasses.owner.id')",
    isParentInMyClassAsOwner: "auth.id in data.ref('parentClasses.owner.id')",
    isAdminInMyClassAsOwner: "auth.id in data.ref('adminClasses.owner.id')",
};

// User Class Relationships - As Admin
const userClassAdminRelationships = {
    isStudentInMyClassAsAdmin:
        "auth.id in data.ref('studentClasses.classAdmins.id')",
    isTeacherInMyClassAsAdmin:
        "auth.id in data.ref('teacherClasses.classAdmins.id')",
    isAssistantTeacherInMyClassAsAdmin:
        "auth.id in data.ref('assistantTeacherClasses.classAdmins.id')",
    isParentInMyClassAsAdmin:
        "auth.id in data.ref('parentClasses.classAdmins.id')",
    isAdminInMyClassAsAdmin:
        "auth.id in data.ref('adminClasses.classAdmins.id')",
};

// User Class Relationships - As Teacher
const userClassTeacherRelationships = {
    isStudentInMyClassAsTeacher:
        "auth.id in data.ref('studentClasses.classTeachers.id')",
    isTeacherInMyClassAsTeacher:
        "auth.id in data.ref('teacherClasses.classTeachers.id')",
    isAssistantTeacherInMyClassAsTeacher:
        "auth.id in data.ref('assistantTeacherClasses.classTeachers.id')",
    isParentInMyClassAsTeacher:
        "auth.id in data.ref('parentClasses.classTeachers.id')",
    // NEW: Teachers can see owners and admins of their classes
    isOwnerOfMyClass: "auth.id in data.ref('classes.classTeachers.id')",
    isAdminOfMyClass: "auth.id in data.ref('adminClasses.classTeachers.id')",
};

// User Class Relationships - As Assistant Teacher
const userClassAssistantTeacherRelationships = {
    // NEW: Assistant teachers can also see owners and admins
    isOwnerOfMyClassAsAssistant:
        "auth.id in data.ref('classes.classAssistantTeachers.id')",
    isAdminOfMyClassAsAssistant:
        "auth.id in data.ref('adminClasses.classAssistantTeachers.id')",
};

// User Class Relationships - As Parent
const userClassParentRelationships = {
    isStudentInMyClassAsParent:
        "auth.id in data.ref('studentClasses.classParents.id')",
    isTeacherInMyClassAsParent:
        "auth.id in data.ref('teacherClasses.classParents.id')",
    isAssistantTeacherInMyClassAsParent:
        "auth.id in data.ref('assistantTeacherClasses.classParents.id')",
};

// User Class Relationships - As Student
const userClassStudentRelationships = {
    isTeacherInMyClassAsStudent:
        "auth.id in data.ref('teacherClasses.classStudents.id')",
    isAssistantTeacherInMyClassAsStudent:
        "auth.id in data.ref('assistantTeacherClasses.classStudents.id')",
    isParentInMyClassAsStudent:
        "auth.id in data.ref('parentClasses.classStudents.id')",
};

// Parent-Child Relationships in Shared Classes
const userClassParentChildRelationships = {
    isMyChildInSharedClass:
        "isMyChild && (auth.id in data.ref('parentClasses.classStudents.id'))",
    isMyParentInSharedClass:
        "isMyParent && (auth.id in data.ref('studentClasses.classParents.id'))",
};

// User Organization Relationships
const userOrgRelationships = {
    isTeacherInMyOrgAsAdmin:
        "auth.id in data.ref('teacherOrganizations.admins.id')",
    isTeacherInMyOrgAsOwner:
        "auth.id in data.ref('teacherOrganizations.owner.id')",
};

// ============================================================
//                  COMBINED BIND OBJECTS
// ============================================================

const allUserBinds = {
    ...userBasicRelationships,
    ...userClassOwnerRelationships,
    ...userClassAdminRelationships,
    ...userClassTeacherRelationships,
    ...userClassAssistantTeacherRelationships,
    ...userClassParentRelationships,
    ...userClassStudentRelationships,
    ...userClassParentChildRelationships,
    ...userOrgRelationships,
};

const allDataBinds = {
    ...authenticationBinds,
    ...classRoleBinds,
    ...organizationRoleBinds,
};

const allBinds = {
    ...allDataBinds,
    ...allUserBinds,
};

// ============================================================
//                  PERMISSION CONSTANTS
// ============================================================

// User field visibility conditions
const USER_SELF_AND_FAMILY = "isMyself || isMyChild || isMyParent";

const USER_ALL_CLASS_RELATIONSHIPS = [
    "isMyChildInSharedClass",
    "isMyParentInSharedClass",
    "isStudentInMyClassAsOwner",
    "isTeacherInMyClassAsOwner",
    "isAssistantTeacherInMyClassAsOwner",
    "isParentInMyClassAsOwner",
    "isAdminInMyClassAsOwner",
    "isStudentInMyClassAsAdmin",
    "isTeacherInMyClassAsAdmin",
    "isAssistantTeacherInMyClassAsAdmin",
    "isParentInMyClassAsAdmin",
    "isAdminInMyClassAsAdmin",
    "isStudentInMyClassAsTeacher",
    "isTeacherInMyClassAsTeacher",
    "isAssistantTeacherInMyClassAsTeacher",
    "isParentInMyClassAsTeacher",
    "isStudentInMyClassAsParent",
    "isTeacherInMyClassAsParent",
    "isAssistantTeacherInMyClassAsParent",
    "isTeacherInMyClassAsStudent",
    "isAssistantTeacherInMyClassAsStudent",
    "isParentInMyClassAsStudent",
    "isTeacherInMyOrgAsAdmin",
    "isTeacherInMyOrgAsOwner",
    "isOwnerOfMyClass",
    "isAdminOfMyClass",
    "isOwnerOfMyClassAsAssistant",
    "isAdminOfMyClassAsAssistant",
].join(" || ");

const USER_CAN_VIEW_PROFILE = `isAuthenticated && ( ${USER_SELF_AND_FAMILY} || ${USER_ALL_CLASS_RELATIONSHIPS} )`;

const USER_CAN_VIEW_PRIVATE_INFO = `isAuthenticated && ( ${USER_SELF_AND_FAMILY} )`;

// User update permissions
const USER_CLASS_ADMIN_UPDATE =
    "auth.id in data.ref('studentClasses.classAdmins.id') || auth.id in data.ref('parentClasses.classAdmins.id') || auth.id in data.ref('teacherClasses.classAdmins.id') || auth.id in data.ref('assistantTeacherClasses.classAdmins.id') || auth.id in data.ref('teacherOrganizations.admins.id')";

const USER_CAN_UPDATE = `isAuthenticated && ((isOwner && isStillOwner) || (${USER_CLASS_ADMIN_UPDATE}))`;

// ============================================================
//                  HELPER TO CONVERT BINDS
// ============================================================

function bindObjectToArray(bindObj: Record<string, string>): string[] {
    return Object.entries(bindObj).flat();
}

// ============================================================
//                       RULES
// ============================================================

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
            update: "isAuthenticated && (data.ref('owner.id') == [] || (isOwner && isStillOwner))",
            delete: "isAuthenticated && isOwner",
        },
        bind: bindObjectToArray(allDataBinds),
    },

    $users: {
        allow: {
            view: "true",
            create: "false",
            update: USER_CAN_UPDATE,
            delete: "false",
        },
        fields: {
            email: USER_CAN_VIEW_PROFILE,
            imageURL: USER_CAN_VIEW_PROFILE,
            avatarURL: USER_CAN_VIEW_PROFILE,
            firstName: USER_CAN_VIEW_PROFILE,
            lastName: USER_CAN_VIEW_PROFILE,
            type: USER_CAN_VIEW_PRIVATE_INFO,
            plan: USER_CAN_VIEW_PRIVATE_INFO,
            created: USER_CAN_VIEW_PRIVATE_INFO,
            updated: USER_CAN_VIEW_PRIVATE_INFO,
            lastLogon: USER_CAN_VIEW_PRIVATE_INFO,
            polarCustomerId: USER_CAN_VIEW_PRIVATE_INFO,
            polarSubscriptionId: USER_CAN_VIEW_PRIVATE_INFO,
        },
        bind: bindObjectToArray(allBinds),
    },

    organizations: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (isOwner || isAdmin || isOrgTeacher || isInOrgClass)",
            update: "isAuthenticated && (isOwner || isAdmin) && (isStillOwner || isStillAdmin)",
            delete: "isAuthenticated && isOwner",
        },
        bind: bindObjectToArray(allDataBinds),
    },

    classes: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (isOwner || isClassAdmin || isClassMember || isClassParent || isTeacher || isAssistantTeacher)",
            update: "isAuthenticated && (isOwner || isClassAdmin || isTeacher || isAssistantTeacher) && (isStillOwner || isStillClassAdmin || isStillTeacher || isStillAssistantTeacher)",
            delete: "isAuthenticated && isOwner",
        },
        bind: bindObjectToArray(allDataBinds),
    },
} satisfies InstantRules;

export default rules;
