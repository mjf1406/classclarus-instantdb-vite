/** @format */

import { initDbAdmin } from "../src/lib/db/db-admin";
import { ensureStudentHasGuardianCode } from "../src/lib/guardian-utils";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

/**
 * Main function to generate guardian codes for all students
 */
async function generateStudentGuardianCodes() {
    try {
        console.log("Starting migration: Generating student guardian codes...");
        const adminDb = initDbAdmin();

        // Query all users who are students (have studentClasses links)
        const studentsQuery = {
            $users: {
                studentClasses: {},
            },
        };

        const result = await adminDb.query(studentsQuery);
        const students = result.$users || [];

        console.log(`Found ${students.length} student(s) to process`);

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const student of students) {
            try {
                // Check if student already has a code
                if (student.studentGuardianCode) {
                    console.log(
                        `  ✓ Student ${student.id} (${student.firstName || ""} ${student.lastName || ""}) already has code: ${student.studentGuardianCode}`
                    );
                    skippedCount++;
                    continue;
                }

                // Generate and assign code
                const code = await ensureStudentHasGuardianCode(
                    adminDb,
                    student.id
                );
                console.log(
                    `  ✓ Generated code for student ${student.id} (${student.firstName || ""} ${student.lastName || ""}): ${code}`
                );
                successCount++;
            } catch (error) {
                console.error(
                    `  ✗ Error processing student ${student.id}:`,
                    error instanceof Error ? error.message : error
                );
                errorCount++;
            }
        }

        console.log("\n✅ Migration complete!");
        console.log(`   - Successfully generated: ${successCount}`);
        console.log(`   - Already had codes: ${skippedCount}`);
        console.log(`   - Errors: ${errorCount}`);
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run the migration
generateStudentGuardianCodes()
    .then(() => {
        console.log("Migration script finished");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Migration script error:", error);
        process.exit(1);
    });
