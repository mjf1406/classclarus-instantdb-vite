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
        "auth.id in data.ref('classStudents.id') || auth.id in data.ref('classTeachers.id') || auth.id in data.ref('classAssistantTeachers.id') || auth.id in data.ref('classGuardians.id')",
    isStillClassMember:
        "auth.id in newData.ref('classStudents.id') || auth.id in newData.ref('classTeachers.id') || auth.id in newData.ref('classAssistantTeachers.id') || auth.id in newData.ref('classGuardians.id')",
    isClassGuardian: "auth.id in data.ref('classGuardians.id')",
    isStillClassGuardian: "auth.id in newData.ref('classGuardians.id')",
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
        "auth.id in data.ref('classes.classStudents.id') || auth.id in data.ref('classes.classTeachers.id') || auth.id in data.ref('classes.classAssistantTeachers.id') || auth.id in data.ref('classes.classGuardians.id')",
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
    isMyChild: "auth.id in data.ref('guardians.id')",
    isMyGuardian: "auth.id in data.ref('children.id')",
};

// User Class Relationships - As Owner
const userClassOwnerRelationships = {
    isStudentInMyClassAsOwner: "auth.id in data.ref('studentClasses.owner.id')",
    isTeacherInMyClassAsOwner: "auth.id in data.ref('teacherClasses.owner.id')",
    isAssistantTeacherInMyClassAsOwner:
        "auth.id in data.ref('assistantTeacherClasses.owner.id')",
    isGuardianInMyClassAsOwner:
        "auth.id in data.ref('guardianClasses.owner.id')",
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
    isGuardianInMyClassAsAdmin:
        "auth.id in data.ref('guardianClasses.classAdmins.id')",
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
    isGuardianInMyClassAsTeacher:
        "auth.id in data.ref('guardianClasses.classTeachers.id')",
    isOwnerOfMyClass: "auth.id in data.ref('classes.classTeachers.id')",
    isAdminOfMyClass: "auth.id in data.ref('adminClasses.classTeachers.id')",
};

// User Class Relationships - As Assistant Teacher
const userClassAssistantTeacherRelationships = {
    isOwnerOfMyClassAsAssistant:
        "auth.id in data.ref('classes.classAssistantTeachers.id')",
    isAdminOfMyClassAsAssistant:
        "auth.id in data.ref('adminClasses.classAssistantTeachers.id')",
    isStudentInMyClassAsAssistant:
        "auth.id in data.ref('studentClasses.classAssistantTeachers.id')",
    isTeacherInMyClassAsAssistant:
        "auth.id in data.ref('teacherClasses.classAssistantTeachers.id')",
    isAssistantTeacherInMyClassAsAssistant:
        "auth.id in data.ref('assistantTeacherClasses.classAssistantTeachers.id')",
    isGuardianInMyClassAsAssistant:
        "auth.id in data.ref('guardianClasses.classAssistantTeachers.id')",
};

// User Class Relationships - As Guardian (teachers/assistant teachers only, NOT students)
const userClassGuardianRelationships = {
    // REMOVED: isStudentInMyClassAsGuardian - Guardians should only see their own children's full info
    isTeacherInMyClassAsGuardian:
        "auth.id in data.ref('teacherClasses.classGuardians.id')",
    isAssistantTeacherInMyClassAsGuardian:
        "auth.id in data.ref('assistantTeacherClasses.classGuardians.id')",
};

// User Class Relationships - As Student (teachers/assistant teachers only, NOT parents)
const userClassStudentRelationships = {
    isTeacherInMyClassAsStudent:
        "auth.id in data.ref('teacherClasses.classStudents.id')",
    isAssistantTeacherInMyClassAsStudent:
        "auth.id in data.ref('assistantTeacherClasses.classStudents.id')",
    isStudentInMyClass: "auth.id in data.ref('studentClasses.classStudents.id')",
};

// Guardian-Child Relationships in Shared Classes
const userClassGuardianChildRelationships = {
    isMyChildInSharedClass:
        "isMyChild && (auth.id in data.ref('guardianClasses.classStudents.id'))",
    isMyGuardianInSharedClass:
        "isMyGuardian && (auth.id in data.ref('studentClasses.classGuardians.id'))",
};

// User Organization Relationships
const userOrgRelationships = {
    isTeacherInMyOrgAsAdmin:
        "auth.id in data.ref('teacherOrganizations.admins.id')",
    isTeacherInMyOrgAsOwner:
        "auth.id in data.ref('teacherOrganizations.owner.id')",
};
// Add after organizationRoleBinds
const pendingMemberBinds = {
    isClassTeacher: "auth.id in data.ref('class.classTeachers.id')",
    isClassAdmin: "auth.id in data.ref('class.classAdmins.id')",
    isClassOwner: "auth.id in data.ref('class.owner.id')",
};

// Group and Team Binds
const groupTeamBinds = {
    isGroupClassOwner: "auth.id in data.ref('class.owner.id')",
    isGroupClassAdmin: "auth.id in data.ref('class.classAdmins.id')",
    isGroupClassTeacher: "auth.id in data.ref('class.classTeachers.id')",
    isGroupClassAssistantTeacher: "auth.id in data.ref('class.classAssistantTeachers.id')",
    isStudentInGroup: "auth.id in data.ref('groupStudents.id')",
    isGuardianChildInGroup: "auth.id in data.ref('groupStudents.guardians.id')",
    isGroupClassStudent: "auth.id in data.ref('class.classStudents.id')",
    isGroupClassGuardian: "auth.id in data.ref('class.classGuardians.id')",
    isTeamClassOwner: "auth.id in data.ref('group.class.owner.id')",
    isTeamClassAdmin: "auth.id in data.ref('group.class.classAdmins.id')",
    isTeamClassTeacher: "auth.id in data.ref('group.class.classTeachers.id')",
    isTeamClassAssistantTeacher: "auth.id in data.ref('group.class.classAssistantTeachers.id')",
    isStudentInTeam: "auth.id in data.ref('teamStudents.id')",
    isGuardianChildInTeam: "auth.id in data.ref('teamStudents.guardians.id')",
    isTeamClassStudent: "auth.id in data.ref('group.class.classStudents.id')",
    isTeamClassGuardian: "auth.id in data.ref('group.class.classGuardians.id')",
};

// Add to the existing bind objects, or create a new one:
// Add this new bind object
const dashboardSettingsBinds = {
    isClassOwner: "auth.id in data.ref('class.owner.id')",
    isClassAdmin: "auth.id in data.ref('class.classAdmins.id')",
    isClassTeacher: "auth.id in data.ref('class.classTeachers.id')",
    isClassAssistantTeacher: "auth.id in data.ref('class.classAssistantTeachers.id')",
    isClassMember: "auth.id in data.ref('class.classStudents.id') || auth.id in data.ref('class.classTeachers.id') || auth.id in data.ref('class.classAssistantTeachers.id') || auth.id in data.ref('class.classGuardians.id')",
    isClassGuardian: "auth.id in data.ref('class.classGuardians.id')",
};

// Behavior and reward log/redemption binds (for behavior_logs, reward_redemptions)
const behaviorRewardLogBinds = {
    isBehaviorLogForMyself: "auth.id in data.ref('student.id')",
    isGuardianOfBehaviorLogStudent: "auth.id in data.ref('student.guardians.id')",
    isRewardRedemptionForMyself: "auth.id in data.ref('student.id')",
    isGuardianOfRewardRedemptionStudent: "auth.id in data.ref('student.guardians.id')",
};

// Add after dashboardSettingsBinds
const studentDashboardPreferencesBinds = {
    isMyself: "auth.id in data.ref('user.id')",
    isMyChild: "auth.id in data.ref('user.guardians.id')",
    isClassOwner: "auth.id in data.ref('class.owner.id')",
    isClassAdmin: "auth.id in data.ref('class.classAdmins.id')",
    isClassTeacher: "auth.id in data.ref('class.classTeachers.id')",
    isClassAssistantTeacher: "auth.id in data.ref('class.classAssistantTeachers.id')",
    isClassMember: "auth.id in data.ref('class.classStudents.id') || auth.id in data.ref('class.classTeachers.id') || auth.id in data.ref('class.classAssistantTeachers.id')",
};

const classRosterBinds = {
    isClassRosterClassOwner: "auth.id in data.ref('class.owner.id')",
    isClassRosterClassAdmin: "auth.id in data.ref('class.classAdmins.id')",
    isClassRosterClassTeacher: "auth.id in data.ref('class.classTeachers.id')",
    isClassRosterClassAssistantTeacher: "auth.id in data.ref('class.classAssistantTeachers.id')",
    isClassRosterStudent: "auth.id in data.ref('student.id')",
    isGuardianOfClassRosterStudent: "auth.id in data.ref('student.guardians.id')",
};

const expectationBinds = {
    isExpectationClassOwner: "auth.id in data.ref('class.owner.id')",
    isExpectationClassAdmin: "auth.id in data.ref('class.classAdmins.id')",
    isExpectationClassTeacher: "auth.id in data.ref('class.classTeachers.id')",
    isExpectationClassAssistantTeacher: "auth.id in data.ref('class.classAssistantTeachers.id')",
    isExpectationClassStudent: "auth.id in data.ref('class.classStudents.id')",
    isExpectationClassGuardian: "auth.id in data.ref('class.classGuardians.id')",
};

const studentExpectationBinds = {
    isStudentExpectationClassOwner: "auth.id in data.ref('class.owner.id')",
    isStudentExpectationClassAdmin: "auth.id in data.ref('class.classAdmins.id')",
    isStudentExpectationClassTeacher: "auth.id in data.ref('class.classTeachers.id')",
    isStudentExpectationClassAssistantTeacher: "auth.id in data.ref('class.classAssistantTeachers.id')",
    isStudentExpectationForMyself: "auth.id in data.ref('student.id')",
    isGuardianOfStudentExpectationStudent: "auth.id in data.ref('student.guardians.id')",
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
    ...userClassGuardianRelationships,
    ...userClassStudentRelationships,
    ...userClassGuardianChildRelationships,
    ...userOrgRelationships,
};

const allDataBinds = {
    ...authenticationBinds,
    ...classRoleBinds,
    ...organizationRoleBinds,
    ...groupTeamBinds,
    ...expectationBinds,
    ...studentExpectationBinds,
};

const allBinds = {
    ...allDataBinds,
    ...allUserBinds,
};

// ============================================================
//                  PERMISSION CONSTANTS
// ============================================================

// User field visibility conditions
const USER_SELF_AND_FAMILY = "isMyself || isMyChild || isMyGuardian";

// Full profile access for class staff, admins, guardians viewing teachers, and students viewing teachers
// NOTE: isStudentInMyClassAsGuardian is excluded so guardians only see full info for their own children
// NOTE: isGuardianInMyClassAsStudent is excluded so students only see full info for their own guardians
// Full profile access for class staff, admins, guardians viewing teachers, students viewing teachers, AND students viewing other students
const USER_ALL_CLASS_RELATIONSHIPS = [
    "isMyChildInSharedClass",
    "isMyGuardianInSharedClass",
    "isStudentInMyClassAsOwner",
    "isTeacherInMyClassAsOwner",
    "isAssistantTeacherInMyClassAsOwner",
    "isGuardianInMyClassAsOwner",
    "isAdminInMyClassAsOwner",
    "isStudentInMyClassAsAdmin",
    "isTeacherInMyClassAsAdmin",
    "isAssistantTeacherInMyClassAsAdmin",
    "isGuardianInMyClassAsAdmin",
    "isAdminInMyClassAsAdmin",
    "isStudentInMyClassAsTeacher",
    "isTeacherInMyClassAsTeacher",
    "isAssistantTeacherInMyClassAsTeacher",
    "isGuardianInMyClassAsTeacher",
    "isTeacherInMyClassAsGuardian",
    "isAssistantTeacherInMyClassAsGuardian",
    "isTeacherInMyClassAsStudent",
    "isAssistantTeacherInMyClassAsStudent",
    "isStudentInMyClass",  // ADD THIS
    "isStudentInMyClassAsAssistant",
    "isTeacherInMyClassAsAssistant",
    "isAssistantTeacherInMyClassAsAssistant",
    "isGuardianInMyClassAsAssistant",
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
    "auth.id in data.ref('studentClasses.classAdmins.id') || auth.id in data.ref('studentClasses.classTeachers.id') || auth.id in data.ref('studentClasses.classAssistantTeachers.id') || auth.id in data.ref('guardianClasses.classAdmins.id') || auth.id in data.ref('teacherClasses.classAdmins.id') || auth.id in data.ref('assistantTeacherClasses.classAdmins.id') || auth.id in data.ref('teacherOrganizations.admins.id')";

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
            // Profile fields: visible to self, family, own children/guardians, class staff, and teachers in your class
            // Guardians can see teachers/assistants, but NOT other students (only their own children)
            // Students can see teachers/assistants, but NOT other guardians (only their own guardians)
            email: USER_CAN_VIEW_PROFILE,
            imageURL: USER_CAN_VIEW_PROFILE,
            avatarURL: USER_CAN_VIEW_PROFILE,
            firstName: USER_CAN_VIEW_PROFILE,
            lastName: USER_CAN_VIEW_PROFILE,
            gender: USER_CAN_VIEW_PROFILE,
            // Private fields: only self and family
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
        fields: {
            code: "isOwner || isAdmin",
        },
        bind: bindObjectToArray(allDataBinds),
    },

    classes: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (isOwner || isClassAdmin || isClassMember || isClassGuardian || isTeacher || isAssistantTeacher)",
            update: "isAuthenticated && ((isOwner && isStillOwner) || isClassAdmin || isTeacher || isAssistantTeacher)",
            delete: "isAuthenticated && isOwner",
        },
        fields: {
            guardianCode: "isOwner || isClassAdmin || isTeacher",
            studentCode: "isOwner || isClassAdmin || isTeacher",
            teacherCode: "isOwner || isClassAdmin || isTeacher",
            
        },
        bind: bindObjectToArray(allDataBinds),
    },

    pendingMembers: {
        allow: {
            create: "isAuthenticated && (isClassOwner || isClassAdmin || isClassTeacher)",
            view: "isAuthenticated && (isClassOwner || isClassAdmin || isClassTeacher)",
            update: "false",
            delete: "isAuthenticated && (isClassOwner || isClassAdmin || isClassTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...pendingMemberBinds,
        }),
    },

    groups: {
        allow: {
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isGroupClassStudent || isGroupClassGuardian || isStudentInGroup || isGuardianChildInGroup)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...classRoleBinds,
            ...userBasicRelationships,
            ...groupTeamBinds,
        }),
    },

    teams: {
        allow: {
            create: "isAuthenticated && (isTeamClassOwner || isTeamClassAdmin || isTeamClassTeacher || isTeamClassAssistantTeacher)",
            view: "isAuthenticated && (isTeamClassOwner || isTeamClassAdmin || isTeamClassTeacher || isTeamClassAssistantTeacher || isTeamClassStudent || isTeamClassGuardian || isStudentInTeam || isGuardianChildInTeam)",
            update: "isAuthenticated && (isTeamClassOwner || isTeamClassAdmin || isTeamClassTeacher || isTeamClassAssistantTeacher)",
            delete: "isAuthenticated && (isTeamClassOwner || isTeamClassAdmin || isTeamClassTeacher || isTeamClassAssistantTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...classRoleBinds,
            ...userBasicRelationships,
            ...groupTeamBinds,
        }),
    },

    classDashboardSettings: {
        allow: {
            create: "isAuthenticated && (isClassOwner || isClassAdmin || isClassTeacher || isClassAssistantTeacher)",
            view: "isAuthenticated && (isClassOwner || isClassAdmin || isClassTeacher || isClassAssistantTeacher || isClassMember || isClassGuardian)",
            update: "isAuthenticated && (isClassOwner || isClassAdmin || isClassTeacher || isClassAssistantTeacher)",
            delete: "isAuthenticated && (isClassOwner || isClassAdmin || isClassTeacher || isClassAssistantTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...dashboardSettingsBinds,
        }),
    },

    studentDashboardPreferences: {
        allow: {
            create: "isAuthenticated",
            view: "isAuthenticated && (isMyself || isMyChild || isClassOwner || isClassAdmin || isClassTeacher || isClassAssistantTeacher)",
            update: "isAuthenticated && isMyself",
            delete: "isAuthenticated && isMyself",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...studentDashboardPreferencesBinds,
        }),
    },

    class_roster: {
        allow: {
            create: "isAuthenticated && (isClassRosterClassOwner || isClassRosterClassAdmin || isClassRosterClassTeacher || isClassRosterClassAssistantTeacher)",
            view: "isAuthenticated && (isClassRosterClassOwner || isClassRosterClassAdmin || isClassRosterClassTeacher || isClassRosterClassAssistantTeacher || isClassRosterStudent || isGuardianOfClassRosterStudent)",
            update: "isAuthenticated && (isClassRosterClassOwner || isClassRosterClassAdmin || isClassRosterClassTeacher || isClassRosterClassAssistantTeacher)",
            delete: "isAuthenticated && (isClassRosterClassOwner || isClassRosterClassAdmin || isClassRosterClassTeacher || isClassRosterClassAssistantTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...classRosterBinds,
        }),
    },

    behaviors: {
        allow: {
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isGroupClassStudent || isGroupClassGuardian)",
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...groupTeamBinds,
        }),
    },

    reward_items: {
        allow: {
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isGroupClassStudent || isGroupClassGuardian)",
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...groupTeamBinds,
        }),
    },

    folders: {
        allow: {
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isGroupClassStudent || isGroupClassGuardian)",
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...groupTeamBinds,
        }),
    },

    random_assigners: {
        allow: {
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isGroupClassStudent || isGroupClassGuardian)",
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...groupTeamBinds,
        }),
    },

    rotating_assigners: {
        allow: {
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isGroupClassStudent || isGroupClassGuardian)",
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...groupTeamBinds,
        }),
    },

    equitable_assigners: {
        allow: {
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isGroupClassStudent || isGroupClassGuardian)",
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...groupTeamBinds,
        }),
    },

    behavior_logs: {
        allow: {
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isBehaviorLogForMyself || isGuardianOfBehaviorLogStudent)",
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...groupTeamBinds,
            ...behaviorRewardLogBinds,
        }),
    },

    reward_redemptions: {
        allow: {
            view: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher || isRewardRedemptionForMyself || isGuardianOfRewardRedemptionStudent)",
            create: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
            update: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
            delete: "isAuthenticated && (isGroupClassOwner || isGroupClassAdmin || isGroupClassTeacher || isGroupClassAssistantTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...groupTeamBinds,
            ...behaviorRewardLogBinds,
        }),
    },
    expectations: {
        allow: {
            view: "isAuthenticated && (isExpectationClassOwner || isExpectationClassAdmin || isExpectationClassTeacher || isExpectationClassAssistantTeacher || isExpectationClassStudent || isExpectationClassGuardian)",
            create: "isAuthenticated && (isExpectationClassOwner || isExpectationClassAdmin || isExpectationClassTeacher)",
            update: "isAuthenticated && (isExpectationClassOwner || isExpectationClassAdmin || isExpectationClassTeacher)",
            delete: "isAuthenticated && (isExpectationClassOwner || isExpectationClassAdmin || isExpectationClassTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...expectationBinds,
        }),
    },
    student_expectations: {
        allow: {
            view: "isAuthenticated && (isStudentExpectationClassOwner || isStudentExpectationClassAdmin || isStudentExpectationClassTeacher || isStudentExpectationClassAssistantTeacher || isStudentExpectationForMyself || isGuardianOfStudentExpectationStudent)",
            create: "isAuthenticated && (isStudentExpectationClassOwner || isStudentExpectationClassAdmin || isStudentExpectationClassTeacher || isStudentExpectationClassAssistantTeacher)",
            update: "isAuthenticated && (isStudentExpectationClassOwner || isStudentExpectationClassAdmin || isStudentExpectationClassTeacher || isStudentExpectationClassAssistantTeacher)",
            delete: "isAuthenticated && (isStudentExpectationClassOwner || isStudentExpectationClassAdmin || isStudentExpectationClassTeacher || isStudentExpectationClassAssistantTeacher)",
        },
        bind: bindObjectToArray({
            ...authenticationBinds,
            ...studentExpectationBinds,
        }),
    },
} satisfies InstantRules;

export default rules;
