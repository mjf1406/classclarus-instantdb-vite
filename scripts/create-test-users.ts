/** @format */

import { id } from "@instantdb/admin";
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
    CLASS_ID: "de95bdf2-3404-4be1-8773-9a89c654557f", // Set this to skip prompting
};

/**
 * Prompt user for class ID
 */
function promptClassId(): Promise<string> {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("Enter class ID: ", (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

/**
 * Main function to create test users
 */
async function createTestUsers() {
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

        // Verify class exists (optional but recommended)
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

        console.log(`Creating test users for class: ${classId}`);

        const now = new Date();

        // Create 4 test students
        const studentIds: string[] = [];
        const studentTxs = [];
        for (let i = 1; i <= 4; i++) {
            const userId = id();
            studentIds.push(userId);
            studentTxs.push(
                adminDb.tx.$users[userId].create({
                    type: "test",
                    firstName: "TestStudent",
                    lastName: i.toString(),
                    created: now,
                    updated: now,
                })
            );
        }

        // Create 1 test teacher
        const teacherId = id();
        const teacherTx = adminDb.tx.$users[teacherId].create({
            type: "test",
            firstName: "TestTeacher",
            lastName: "1",
            created: now,
            updated: now,
        });

        // Create 1 test assistant teacher
        const assistantTeacherId = id();
        const assistantTeacherTx = adminDb.tx.$users[assistantTeacherId].create(
            {
                type: "test",
                firstName: "TestAssistantTeacher",
                lastName: "1",
                created: now,
                updated: now,
            }
        );

        // Create link transactions
        const linkTxs = [
            // Link students
            ...studentIds.map((userId) =>
                adminDb.tx.classes[classId].link({ classStudents: userId })
            ),
            // Link teacher
            adminDb.tx.classes[classId].link({ classTeachers: teacherId }),
            // Link assistant teacher
            adminDb.tx.classes[classId].link({
                classAssistantTeachers: assistantTeacherId,
            }),
        ];

        // Execute all transactions
        console.log("Executing transactions...");
        await adminDb.transact([
            ...studentTxs,
            teacherTx,
            assistantTeacherTx,
            ...linkTxs,
        ]);

        console.log("✅ Successfully created test users:");
        console.log(`   - 4 students (TestStudent 1-4)`);
        console.log(`   - 1 teacher (TestTeacher 1)`);
        console.log(`   - 1 assistant teacher (TestAssistantTeacher 1)`);
        console.log(`   All linked to class: ${classId}`);
    } catch (error) {
        console.error("❌ Error creating test users:", error);
        if (error instanceof Error) {
            console.error("   Message:", error.message);
        }
        process.exit(1);
    }
}

// Run the script
createTestUsers();
