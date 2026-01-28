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
            displayNameForStudents: i.string().optional(),
            displayNameForParents: i.string().optional(),
            gender: i.string().optional(),
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
        classDashboardSettings: i.entity({
            groupsTeamsDisplay: i.string().indexed(),
            showPointsWidget: i.boolean().optional(),
            showExpectationsWidget: i.boolean().optional(),
            showRandomAssignersWidget: i.boolean().optional(),
            selectedRandomAssignerIds: i.string().optional(), // JSON array of assigner IDs, empty/null = all
            showRotatingAssignersWidget: i.boolean().optional(),
            selectedRotatingAssignerIds: i.string().optional(), // JSON array of assigner IDs, empty/null = all
            showGroupsTeamsWidget: i.boolean().optional(),
            showShufflerHistoryWidget: i.boolean().optional(),
            showPickerHistoryWidget: i.boolean().optional(),
            showAttendanceWidget: i.boolean().optional(),
            showRazAssessmentsWidget: i.boolean().optional(),
            showMascotCard: i.boolean().optional(),
            showGreetingCard: i.boolean().optional(),
            showCustomizeCard: i.boolean().optional(),
            created: i.date(),
            updated: i.date(),
        }),
        studentDashboardPreferences: i.entity({
            icon: i.string().optional(),
            color: i.string().optional(),
            background: i.string().optional(),
            buttonColor: i.string().optional(),
            cardBackgroundColor: i.string().optional(),
            created: i.date(),
            updated: i.date(),
        }),
        behaviors: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            icon: i.string().optional(),
            points: i.number().indexed(),
            created: i.date(),
            updated: i.date(),
        }),
        reward_items: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            icon: i.string().optional(),
            cost: i.number().indexed(),
            created: i.date(),
            updated: i.date(),
            // Purchase limit fields
            purchaseLimitEnabled: i.boolean().optional(),
            purchaseLimitCount: i.number().optional(),
            purchaseLimitType: i.string().optional(), // "recurring" | "dateRange"
            purchaseLimitPeriod: i.string().optional(), // "day" | "week" | "month" (for recurring)
            purchaseLimitPeriodMultiplier: i.number().optional(), // Multiplier for period (e.g., 2 = "every 2 weeks")
            purchaseLimitStartDate: i.date().indexed().optional(), // Start date for date range mode
            purchaseLimitEndDate: i.date().indexed().optional(), // End date for date range mode
        }),
        behavior_logs: i.entity({
            createdAt: i.date().indexed(),
            quantity: i.number().optional(),
        }),
        reward_redemptions: i.entity({
            createdAt: i.date().indexed(),
            quantity: i.number().optional(),
        }),
        attendance_records: i.entity({
            date: i.string().indexed(), // ISO date string (YYYY-MM-DD)
            status: i.string().indexed(), // "present" | "late" | "absent"
            createdAt: i.date().indexed(),
            updatedAt: i.date(),
        }),
        folders: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            icon: i.string().optional(),
            created: i.date(),
            updated: i.date(),
            // Purchase limit fields
            purchaseLimitEnabled: i.boolean().optional(),
            purchaseLimitCount: i.number().optional(),
            purchaseLimitType: i.string().optional(), // "recurring" | "dateRange"
            purchaseLimitPeriod: i.string().optional(), // "day" | "week" | "month" (for recurring)
            purchaseLimitPeriodMultiplier: i.number().optional(), // Multiplier for period (e.g., 2 = "every 2 weeks")
            purchaseLimitStartDate: i.date().indexed().optional(), // Start date for date range mode
            purchaseLimitEndDate: i.date().indexed().optional(), // End date for date range mode
        }),
        class_roster: i.entity({
            number: i.number().optional(),
            firstName: i.string().optional(),
            lastName: i.string().optional(),
            gender: i.string().optional(),
            // Guardian code for parent join (unique per student-class)
            guardianCode: i.string().unique().indexed().optional(),
        }),
        expectations: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            inputType: i.string().indexed(), // 'number' | 'numberRange'
            unit: i.string().indexed(),
            created: i.date(),
            updated: i.date(),
        }),
        student_expectations: i.entity({
            value: i.number().optional(), // for 'number' input type
            minValue: i.number().optional(), // for 'numberRange' input type
            maxValue: i.number().optional(), // for 'numberRange' input type
            created: i.date(),
            updated: i.date(),
        }),
        random_assigners: i.entity({
            name: i.string().indexed(),
            items: i.string(), // JSON array of strings
            created: i.date(),
            updated: i.date(),
        }),
        random_assigner_runs: i.entity({
            runDate: i.date().indexed(),
            results: i.string(), // JSON: Array<{ item: string, studentId: string, studentNumber: number | null, studentName: string, groupOrTeamId: string, groupOrTeamName: string, isTeam: boolean }>
        }),
        rotating_assigners: i.entity({
            name: i.string().indexed(),
            items: i.string(), // JSON array of strings
            balanceGender: i.boolean().optional(),
            direction: i.string().optional(), // "front-to-back" | "back-to-front" - defaults to "front-to-back"
            currentRotation: i.number().optional(), // Tracks rotation position (defaults to 0)
            created: i.date(),
            updated: i.date(),
        }),
        equitable_assigners: i.entity({
            name: i.string().indexed(),
            items: i.string(), // JSON array of strings
            balanceGender: i.boolean().optional(),
            created: i.date(),
            updated: i.date(),
        }),
        rotating_assigner_runs: i.entity({
            runDate: i.date().indexed(),
            results: i.string(), // JSON placeholder for future implementation
            totalRuns: i.number().optional(),
            
        }),
        equitable_assigner_runs: i.entity({
            runDate: i.date().indexed(),
            results: i.string(), // JSON placeholder for future implementation
        }),
        random_events: i.entity({
            name: i.string().indexed(),
            description: i.string().optional(),
            imageUrl: i.string().optional(),
            audioUrl: i.string().optional(),
            created: i.date().indexed(),
            updated: i.date(),
        }),
        random_event_rolls: i.entity({
            rolledAt: i.date().indexed(),
        }),
        shuffler_runs: i.entity({
            name: i.string().optional(), // User-defined name
            runDate: i.date().indexed(),
            scopeType: i.string().indexed(), // 'class' | 'group' | 'team'
            scopeId: i.string().indexed(), // ID of the scope
            scopeName: i.string(), // Name for display (e.g., "All Students", "Group A")
            results: i.string(), // JSON: Array of { studentId, studentName, position }
            firstStudentId: i.string().indexed(),
            lastStudentId: i.string().indexed(),
            completedStudentIds: i.string().optional(), // JSON array of completed student IDs
        }),
        picker_instances: i.entity({
            name: i.string().indexed(),
            scopeType: i.string().indexed(), // 'class' | 'group' | 'team'
            scopeId: i.string().indexed(), // ID of the scope
            scopeName: i.string(), // Display name (e.g., "All Students", "Group A")
            created: i.date().indexed(),
            updated: i.date(),
        }),
        picker_rounds: i.entity({
            startedAt: i.date().indexed(),
            completedAt: i.date().indexed().optional(), // Set when all students picked
            scopeType: i.string().indexed(), // 'class' | 'group' | 'team'
            scopeId: i.string().indexed(), // ID of the scope
            scopeName: i.string(), // Name for display
            isActive: i.boolean().indexed(), // true = current round, false = completed
        }),
        picker_picks: i.entity({
            pickedAt: i.date().indexed(),
            position: i.number().indexed(), // 1st pick, 2nd pick, etc.
            studentId: i.string().indexed(),
            studentName: i.string(), // Denormalized for history display
        }),
        group_membership_history: i.entity({
            addedAt: i.date().indexed(),
            action: i.string().indexed(), // "added" | "removed"
        }),
        team_membership_history: i.entity({
            addedAt: i.date().indexed(),
            action: i.string().indexed(), // "added" | "removed"
        }),
        terms_acceptances: i.entity({
            acceptedAt: i.date().indexed(),
        }),
        assignments: i.entity({
            name: i.string().indexed(),
            subject: i.string().indexed().optional(),
            unit: i.string().indexed().optional(),
            totalPoints: i.number().optional(),
            sections: i.string().optional(), // JSON array: [{name: string, points: number}]
            created: i.date(),
            updated: i.date(),
        }),
        raz_assessments: i.entity({
            date: i.date().indexed(),
            level: i.string().indexed(), // A-Z reading level (e.g., "A", "B", "C", ... "Z")
            result: i.string().indexed(), // "level up" | "stay" | "level down"
            accuracy: i.number().optional(), // percentage (0-100)
            quizScore: i.number().optional(), // percentage (0-100)
            retellingScore: i.number().optional(), // percentage (0-100)
            note: i.string().optional(),
            createdAt: i.date().indexed(),
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
        classDashboardSettings: {
            forward: {
                on: "classes",
                has: "one",
                label: "dashboardSettings",
                onDelete: "cascade",
            }, // Each class has one dashboard settings record
            reverse: {
                on: "classDashboardSettings",
                has: "one",
                label: "class",
            }, // Each dashboard settings belongs to one class
        },
        userDashboardPreferences: {
            forward: {
                on: "studentDashboardPreferences",
                has: "one",
                label: "user",
                onDelete: "cascade",
            }, // Each preference belongs to one user
            reverse: {
                on: "$users",
                has: "many",
                label: "dashboardPreferences",
            }, // Each user can have many dashboard preferences (one per class)
        },
        classDashboardPreferences: {
            forward: {
                on: "studentDashboardPreferences",
                has: "one",
                label: "class",
                onDelete: "cascade",
            }, // Each preference belongs to one class
            reverse: {
                on: "classes",
                has: "many",
                label: "studentDashboardPreferences",
            }, // Each class can have many student preferences (one per student)
        },
        classBehaviors: {
            forward: {
                on: "classes",
                has: "many",
                label: "behaviors",
            },
            reverse: {
                on: "behaviors",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classRewardItems: {
            forward: {
                on: "classes",
                has: "many",
                label: "rewardItems",
            },
            reverse: {
                on: "reward_items",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classBehaviorLogs: {
            forward: {
                on: "classes",
                has: "many",
                label: "behaviorLogs",
            },
            reverse: {
                on: "behavior_logs",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        behaviorLogBehavior: {
            forward: {
                on: "behavior_logs",
                has: "one",
                label: "behavior",
                onDelete: "cascade",
            },
            reverse: {
                on: "behaviors",
                has: "many",
                label: "behaviorLogs",
            },
        },
        behaviorLogStudent: {
            forward: {
                on: "behavior_logs",
                has: "one",
                label: "student",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "behaviorLogsAsStudent",
            },
        },
        behaviorLogCreatedBy: {
            forward: {
                on: "behavior_logs",
                has: "one",
                label: "createdBy",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "behaviorLogsAsCreatedBy",
            },
        },
        classRewardRedemptions: {
            forward: {
                on: "classes",
                has: "many",
                label: "rewardRedemptions",
            },
            reverse: {
                on: "reward_redemptions",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        rewardRedemptionRewardItem: {
            forward: {
                on: "reward_redemptions",
                has: "one",
                label: "rewardItem",
                onDelete: "cascade",
            },
            reverse: {
                on: "reward_items",
                has: "many",
                label: "rewardRedemptions",
            },
        },
        rewardRedemptionStudent: {
            forward: {
                on: "reward_redemptions",
                has: "one",
                label: "student",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "rewardRedemptionsAsStudent",
            },
        },
        rewardRedemptionCreatedBy: {
            forward: {
                on: "reward_redemptions",
                has: "one",
                label: "createdBy",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "rewardRedemptionsAsCreatedBy",
            },
        },
        classFolders: {
            forward: {
                on: "classes",
                has: "many",
                label: "folders",
            },
            reverse: {
                on: "folders",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        behaviorFolder: {
            forward: {
                on: "behaviors",
                has: "one",
                label: "folder",
            },
            reverse: {
                on: "folders",
                has: "many",
                label: "behaviors",
            },
        },
        rewardItemFolder: {
            forward: {
                on: "reward_items",
                has: "one",
                label: "folder",
            },
            reverse: {
                on: "folders",
                has: "many",
                label: "rewardItems",
            },
        },
        classClassRoster: {
            forward: {
                on: "classes",
                has: "many",
                label: "classRoster",
            },
            reverse: {
                on: "class_roster",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classRosterStudent: {
            forward: {
                on: "class_roster",
                has: "one",
                label: "student",
                onDelete: "cascade",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "studentClassRoster",
            },
        },
        classExpectations: {
            forward: {
                on: "classes",
                has: "many",
                label: "expectations",
            },
            reverse: {
                on: "expectations",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        expectationStudentExpectations: {
            forward: {
                on: "student_expectations",
                has: "one",
                label: "expectation",
                onDelete: "cascade",
            },
            reverse: {
                on: "expectations",
                has: "many",
                label: "studentExpectations",
            },
        },
        studentExpectationStudent: {
            forward: {
                on: "student_expectations",
                has: "one",
                label: "student",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "studentExpectationsAsStudent",
            },
        },
        classStudentExpectations: {
            forward: {
                on: "classes",
                has: "many",
                label: "studentExpectations",
            },
            reverse: {
                on: "student_expectations",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classRandomAssigners: {
            forward: {
                on: "classes",
                has: "many",
                label: "randomAssigners",
            },
            reverse: {
                on: "random_assigners",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        randomAssignerRuns: {
            forward: {
                on: "random_assigner_runs",
                has: "one",
                label: "randomAssigner",
                onDelete: "cascade",
            },
            reverse: {
                on: "random_assigners",
                has: "many",
                label: "runs",
            },
        },
        classRandomAssignerRuns: {
            forward: {
                on: "classes",
                has: "many",
                label: "randomAssignerRuns",
            },
            reverse: {
                on: "random_assigner_runs",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classRotatingAssigners: {
            forward: {
                on: "classes",
                has: "many",
                label: "rotatingAssigners",
            },
            reverse: {
                on: "rotating_assigners",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classEquitableAssigners: {
            forward: {
                on: "classes",
                has: "many",
                label: "equitableAssigners",
            },
            reverse: {
                on: "equitable_assigners",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        rotatingAssignerRuns: {
            forward: {
                on: "rotating_assigner_runs",
                has: "one",
                label: "rotatingAssigner",
                onDelete: "cascade",
            },
            reverse: {
                on: "rotating_assigners",
                has: "many",
                label: "runs",
            },
        },
        classRotatingAssignerRuns: {
            forward: {
                on: "classes",
                has: "many",
                label: "rotatingAssignerRuns",
            },
            reverse: {
                on: "rotating_assigner_runs",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        rotatingAssignerRunGroup: {
            forward: {
                on: "rotating_assigner_runs",
                has: "one",
                label: "group",
            },
            reverse: {
                on: "groups",
                has: "many",
                label: "rotatingAssignerRuns",
            },
        },
        rotatingAssignerRunTeam: {
            forward: {
                on: "rotating_assigner_runs",
                has: "one",
                label: "team",
            },
            reverse: {
                on: "teams",
                has: "many",
                label: "rotatingAssignerRuns",
            },
        },
        equitableAssignerRuns: {
            forward: {
                on: "equitable_assigner_runs",
                has: "one",
                label: "equitableAssigner",
                onDelete: "cascade",
            },
            reverse: {
                on: "equitable_assigners",
                has: "many",
                label: "runs",
            },
        },
        classEquitableAssignerRuns: {
            forward: {
                on: "classes",
                has: "many",
                label: "equitableAssignerRuns",
            },
            reverse: {
                on: "equitable_assigner_runs",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classShufflerRuns: {
            forward: {
                on: "classes",
                has: "many",
                label: "shufflerRuns",
            },
            reverse: {
                on: "shuffler_runs",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classPickerInstances: {
            forward: {
                on: "classes",
                has: "many",
                label: "pickerInstances",
            },
            reverse: {
                on: "picker_instances",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classPickerRounds: {
            forward: {
                on: "classes",
                has: "many",
                label: "pickerRounds",
            },
            reverse: {
                on: "picker_rounds",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        instancePickerRounds: {
            forward: {
                on: "picker_instances",
                has: "many",
                label: "rounds",
            },
            reverse: {
                on: "picker_rounds",
                has: "one",
                label: "instance",
                onDelete: "cascade",
            },
        },
        roundPickerPicks: {
            forward: {
                on: "picker_rounds",
                has: "many",
                label: "picks",
            },
            reverse: {
                on: "picker_picks",
                has: "one",
                label: "round",
                onDelete: "cascade",
            },
        },
        studentPickerPicks: {
            forward: {
                on: "$users",
                has: "many",
                label: "pickerPicks",
            },
            reverse: {
                on: "picker_picks",
                has: "one",
                label: "student",
            },
        },
        userTermsAcceptances: {
            forward: {
                on: "terms_acceptances",
                has: "one",
                label: "user",
                onDelete: "cascade",
            }, // Each terms acceptance belongs to one user
            reverse: {
                on: "$users",
                has: "many",
                label: "termsAcceptances",
            }, // Each user can have many terms acceptances
        },
        groupMembershipHistoryStudent: {
            forward: {
                on: "group_membership_history",
                has: "one",
                label: "student",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "groupMembershipHistory",
            },
        },
        groupMembershipHistoryGroup: {
            forward: {
                on: "group_membership_history",
                has: "one",
                label: "group",
                onDelete: "cascade",
            },
            reverse: {
                on: "groups",
                has: "many",
                label: "membershipHistory",
            },
        },
        groupMembershipHistoryClass: {
            forward: {
                on: "group_membership_history",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
            reverse: {
                on: "classes",
                has: "many",
                label: "groupMembershipHistory",
            },
        },
        teamMembershipHistoryStudent: {
            forward: {
                on: "team_membership_history",
                has: "one",
                label: "student",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "teamMembershipHistory",
            },
        },
        teamMembershipHistoryTeam: {
            forward: {
                on: "team_membership_history",
                has: "one",
                label: "team",
                onDelete: "cascade",
            },
            reverse: {
                on: "teams",
                has: "many",
                label: "membershipHistory",
            },
        },
        teamMembershipHistoryClass: {
            forward: {
                on: "team_membership_history",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
            reverse: {
                on: "classes",
                has: "many",
                label: "teamMembershipHistory",
            },
        },
        classRandomEvents: {
            forward: {
                on: "classes",
                has: "many",
                label: "randomEvents",
            },
            reverse: {
                on: "random_events",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        eventRolls: {
            forward: {
                on: "random_event_rolls",
                has: "one",
                label: "event",
                onDelete: "cascade",
            },
            reverse: {
                on: "random_events",
                has: "many",
                label: "rolls",
            },
        },
        classRandomEventRolls: {
            forward: {
                on: "classes",
                has: "many",
                label: "randomEventRolls",
            },
            reverse: {
                on: "random_event_rolls",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classAssignments: {
            forward: {
                on: "classes",
                has: "many",
                label: "assignments",
            },
            reverse: {
                on: "assignments",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        classRazAssessments: {
            forward: {
                on: "classes",
                has: "many",
                label: "razAssessments",
            },
            reverse: {
                on: "raz_assessments",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        razAssessmentStudent: {
            forward: {
                on: "raz_assessments",
                has: "one",
                label: "student",
            },
            reverse: {
                on: "class_roster",
                has: "many",
                label: "razAssessments",
            },
        },
        razAssessmentCreatedBy: {
            forward: {
                on: "raz_assessments",
                has: "one",
                label: "createdBy",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "razAssessmentsAsCreatedBy",
            },
        },
        classAttendanceRecords: {
            forward: {
                on: "classes",
                has: "many",
                label: "attendanceRecords",
            },
            reverse: {
                on: "attendance_records",
                has: "one",
                label: "class",
                onDelete: "cascade",
            },
        },
        attendanceRecordStudent: {
            forward: {
                on: "attendance_records",
                has: "one",
                label: "student",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "attendanceRecordsAsStudent",
            },
        },
        attendanceRecordCreatedBy: {
            forward: {
                on: "attendance_records",
                has: "one",
                label: "createdBy",
            },
            reverse: {
                on: "$users",
                has: "many",
                label: "attendanceRecordsAsCreatedBy",
            },
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
