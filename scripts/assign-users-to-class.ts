/** @format */

import { initDbAdmin } from "../src/lib/db/db-admin";
import readline from "readline";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

// Fallback config - set CLASS_ID here if you don't want to be prompted
const CONFIG = {
    CLASS_ID: "", // Set this to skip prompting
};

type Role = "student" | "teacher" | "assistant_teacher" | "guardian";

/**
 * Prompt user for input
 */
function prompt(question: string): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Prompt user for class ID
 */
function promptClassId(): Promise<string> {
    return prompt("Enter class ID: ");
}

/**
 * Prompt user for email address
 */
function promptEmail(): Promise<string> {
    return prompt("Enter user email address: ");
}

/**
 * Prompt user for role
 */
function promptRole(): Promise<Role> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question(
            "Enter role (student/teacher/assistant_teacher/guardian): ",
            (answer) => {
                rl.close();
                const role = answer.trim().toLowerCase() as Role;
                if (
                    role === "student" ||
                    role === "teacher" ||
                    role === "assistant_teacher" ||
                    role === "guardian"
                ) {
                    resolve(role);
                } else {
                    console.error(
                        "Invalid role. Please enter: student, teacher, assistant_teacher, or guardian"
                    );
                    resolve(promptRole());
                }
            }
        );
    });
}

/**
 * Prompt user if they want to assign another user
 */
function promptContinue(): Promise<boolean> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("Assign another user? (y/n): ", (answer) => {
            rl.close();
            const response = answer.trim().toLowerCase();
            resolve(response === "y" || response === "yes");
        });
    });
}

/**
 * Map role to class link label
 */
function roleToLinkLabel(role: Role): string {
    switch (role) {
        case "student":
            return "classStudents";
        case "teacher":
            return "classTeachers";
        case "assistant_teacher":
            return "classAssistantTeachers";
        case "guardian":
            return "classGuardians";
    }
}

/**
 * Assign a user to a class by email
 */
async function assignUserToClass(
    adminDb: ReturnType<typeof initDbAdmin>,
    classId: string,
    userEmail: string,
    role: Role
) {
    // Query user by email
    const userQuery = await adminDb.query({
        $users: {
            $: {
                where: { email: userEmail },
            },
        },
    });

    if (userQuery.$users.length === 0) {
        throw new Error(`User with email "${userEmail}" not found`);
    }

    if (userQuery.$users.length > 1) {
        throw new Error(
            `Multiple users found with email "${userEmail}" (this should not happen)`
        );
    }

    const user = userQuery.$users[0];
    const linkLabel = roleToLinkLabel(role);

    // Link user to class
    await adminDb.transact([
        adminDb.tx.classes[classId].link({ [linkLabel]: user.id }),
    ]);

    return user;
}

/**
 * Main function to assign users to class
 */
async function assignUsersToClass() {
    try {
        // Initialize admin DB
        const adminDb = initDbAdmin();

        // Get class ID
        let classId = CONFIG.CLASS_ID;
        if (!classId) {
            classId = await promptClassId();
        }

        if (!classId) {
            throw new Error("Class ID is required");
        }

        // Verify class exists
        const classQuery = await adminDb.query({
            classes: {
                $: {
                    where: { id: classId },
                },
            },
        });

        if (classQuery.classes.length === 0) {
            throw new Error(`Class with ID "${classId}" not found`);
        }

        const className = classQuery.classes[0].name || classId;
        console.log(`Assigning users to class: ${className} (${classId})\n`);

        let continueAssigning = true;
        const assignedUsers: Array<{ email: string; role: Role; name: string }> =
            [];

        while (continueAssigning) {
            try {
                // Get user email
                const userEmail = await promptEmail();
                if (!userEmail) {
                    console.log("Email is required. Skipping...\n");
                    continueAssigning = await promptContinue();
                    continue;
                }

                // Get role
                const role = await promptRole();

                // Assign user to class
                const user = await assignUserToClass(
                    adminDb,
                    classId,
                    userEmail,
                    role
                );

                const userName =
                    user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : user.email || user.id;

                assignedUsers.push({
                    email: userEmail,
                    role,
                    name: userName,
                });

                console.log(
                    `✅ Successfully assigned ${userName} (${userEmail}) as ${role} to class ${className}\n`
                );

                // Ask if user wants to continue
                continueAssigning = await promptContinue();
            } catch (error) {
                console.error("❌ Error assigning user:", error);
                if (error instanceof Error) {
                    console.error("   Message:", error.message);
                }
                console.log("");

                // Ask if user wants to continue
                continueAssigning = await promptContinue();
            }
        }

        // Summary
        if (assignedUsers.length > 0) {
            console.log("\n✅ Summary of assigned users:");
            assignedUsers.forEach(({ name, email, role }) => {
                console.log(`   - ${name} (${email}) as ${role}`);
            });
        } else {
            console.log("\nNo users were assigned.");
        }
    } catch (error) {
        console.error("❌ Error in assign users script:", error);
        if (error instanceof Error) {
            console.error("   Message:", error.message);
        }
        process.exit(1);
    }
}

// Run the script
assignUsersToClass();
