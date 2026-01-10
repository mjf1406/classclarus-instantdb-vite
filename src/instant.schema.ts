// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/core";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      avatarURL: i.string().optional(),
      created: i.date().optional(),
      email: i.string().unique().indexed().optional(),
      firstName: i.string().optional(),
      imageURL: i.string().optional(),
      lastLogon: i.date().optional(),
      lastName: i.string().optional(),
      plan: i.string().optional(),
      polarCustomerId: i.string().indexed().optional(),
      polarSubscriptionId: i.string().optional(),
      type: i.string().optional(),
      updated: i.date().optional(),
    }),
    classes: i.entity({
      archivedAt: i.date().indexed().optional(),
      created: i.date(),
      description: i.string().optional(),
      icon: i.string().optional(),
      name: i.string(),
      updated: i.date(),
    }),
    classJoinCodes: i.entity({
      parentCode: i.string().unique().indexed(),
      studentCode: i.string().unique().indexed(),
      teacherCode: i.string().unique().indexed(),
    }),
    joinTokens: i.entity({
      code: i.string().indexed(),
      created: i.date(),
      entityId: i.string().indexed(),
      expiresAt: i.date().indexed(),
      owner: i.string().indexed(),
      token: i.string().unique().indexed(),
      type: i.string().indexed(),
      used: i.boolean(),
    }),
    organizations: i.entity({
      created: i.date(),
      description: i.string().optional(),
      icon: i.string().optional(),
      name: i.string().indexed(),
      updated: i.date(),
    }),
    orgJoinCodes: i.entity({
      code: i.string().unique().indexed(),
    }),
  },
  links: {
    $filesClass: {
      forward: {
        on: "$files",
        has: "one",
        label: "class",
        onDelete: "cascade",
      },
      reverse: {
        on: "classes",
        has: "many",
        label: "files",
      },
    },
    $filesOrganization: {
      forward: {
        on: "$files",
        has: "one",
        label: "organization",
        onDelete: "cascade",
      },
      reverse: {
        on: "organizations",
        has: "many",
        label: "files",
      },
    },
    $filesOwner: {
      forward: {
        on: "$files",
        has: "one",
        label: "owner",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "files",
      },
    },
    $usersChildren: {
      forward: {
        on: "$users",
        has: "many",
        label: "children",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "parents",
      },
    },
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    classesClassAdmins: {
      forward: {
        on: "classes",
        has: "many",
        label: "classAdmins",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "adminClasses",
      },
    },
    classesClassParents: {
      forward: {
        on: "classes",
        has: "many",
        label: "classParents",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "parentClasses",
      },
    },
    classesClassStudents: {
      forward: {
        on: "classes",
        has: "many",
        label: "classStudents",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "studentClasses",
      },
    },
    classesClassTeachers: {
      forward: {
        on: "classes",
        has: "many",
        label: "classTeachers",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "teacherClasses",
      },
    },
    classesJoinCodeEntity: {
      forward: {
        on: "classes",
        has: "one",
        label: "joinCodeEntity",
      },
      reverse: {
        on: "classJoinCodes",
        has: "one",
        label: "class",
        onDelete: "cascade",
      },
    },
    classesOrganization: {
      forward: {
        on: "classes",
        has: "one",
        label: "organization",
        onDelete: "cascade",
      },
      reverse: {
        on: "organizations",
        has: "many",
        label: "classes",
      },
    },
    classesOwner: {
      forward: {
        on: "classes",
        has: "one",
        label: "owner",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "classes",
      },
    },
    organizationsAdmins: {
      forward: {
        on: "organizations",
        has: "many",
        label: "admins",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "adminOrganizations",
      },
    },
    organizationsJoinCodeEntity: {
      forward: {
        on: "organizations",
        has: "one",
        label: "joinCodeEntity",
      },
      reverse: {
        on: "orgJoinCodes",
        has: "one",
        label: "organization",
        onDelete: "cascade",
      },
    },
    organizationsOrgParents: {
      forward: {
        on: "organizations",
        has: "many",
        label: "orgParents",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "parentOrganizations",
      },
    },
    organizationsOrgStudents: {
      forward: {
        on: "organizations",
        has: "many",
        label: "orgStudents",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "studentOrganizations",
      },
    },
    organizationsOrgTeachers: {
      forward: {
        on: "organizations",
        has: "many",
        label: "orgTeachers",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "teacherOrganizations",
      },
    },
    organizationsOwner: {
      forward: {
        on: "organizations",
        has: "one",
        label: "owner",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "organizations",
      },
    },
  },
  rooms: {
    todos: {
      presence: i.entity({}),
    },
  },
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
