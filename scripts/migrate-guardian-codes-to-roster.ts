/** @format */

import { initDbAdmin } from "../src/lib/db/db-admin";
import { ensureRosterHasGuardianCode } from "../src/lib/guardian-utils";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables from .env file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: resolve(__dirname, "../.env") });

/**
 * Main function to migrate guardian codes from $users to class_roster
 */
async function migrateGuardianCodesToRoster() {
    try {
        console.log("Starting migration: Moving guardian codes from $users to class_roster...");
        const adminDb = initDbAdmin();

        // Query all users with studentGuardianCode
        const studentsQuery = {
            $users: {
                $: {
                    where: {
                        studentGuardianCode: { $isNull: false },
                    },
                },
                studentClasses: {},
            },
        };

        const result = await adminDb.query(studentsQuery);
        const students = result.$users || [];

        console.log(`Found ${students.length} student(s) with guardian codes to migrate`);

        let successCount = 0;
        let errorCount = 0;
        let skippedCount = 0;

        for (const student of students) {
            try {
                if (!student.studentGuardianCode) {
                    console.log(`  ⚠ Student ${student.id} has no studentGuardianCode, skipping`);
                    skippedCount++;
                    continue;
                }

                const studentClasses = student.studentClasses || [];
                if (studentClasses.length === 0) {
                    console.log(
                        `  ⚠ Student ${student.id} (${student.firstName || ""} ${student.lastName || ""}) has no classes, skipping`
                    );
                    skippedCount++;
                    continue;
                }

                // For each class, ensure roster entry exists and has the code
                for (const classEntity of studentClasses) {
                    try {
                        // Check if roster entry already exists
                        const rosterQuery = {
                            class_roster: {
                                $: {
                                    where: {
                                        and: [
                                            { "class.id": classEntity.id },
                                            { "student.id": student.id },
                                        ],
                                    },
                                },
                            },
                        };

                        const rosterResult = await adminDb.query(rosterQuery);
                        const existingRoster = rosterResult.class_roster?.[0];

                        if (existingRoster?.guardianCode) {
                            console.log(
                                `  ✓ Roster entry for student ${student.id} in class ${classEntity.id} already has code: ${existingRoster.guardianCode}`
                            );
                            continue;
                        }

                        // Try to use the existing studentGuardianCode if it's unique
                        let codeToUse = student.studentGuardianCode;
                        let codeIsUnique = false;
                        let attempts = 0;
                        const maxAttempts = 10;

                        // Check if the code is unique in class_roster
                        while (!codeIsUnique && attempts < maxAttempts) {
                            const codeCheckQuery = {
                                class_roster: {
                                    $: {
                                        where: {
                                            guardianCode: codeToUse,
                                        },
                                    },
                                },
                            };

                            const codeCheckResult = await adminDb.query(codeCheckQuery);
                            const existingRosterWithCode = codeCheckResult.class_roster?.[0];

                            if (!existingRosterWithCode) {
                                codeIsUnique = true;
                                break;
                            }

                            // Code exists, but check if it's for this same student-class combination
                            if (
                                existingRosterWithCode.id === existingRoster?.id ||
                                (existingRosterWithCode.class?.id === classEntity.id &&
                                    existingRosterWithCode.student?.id === student.id)
                            ) {
                                codeIsUnique = true;
                                break;
                            }

                            // Code is taken by another roster, generate new one
                            const { generateRosterGuardianCode } = await import(
                                "../src/lib/guardian-utils"
                            );
                            codeToUse = generateRosterGuardianCode();
                            attempts++;
                        }

                        if (!codeIsUnique) {
                            console.error(
                                `  ✗ Failed to generate unique code for student ${student.id} in class ${classEntity.id} after ${maxAttempts} attempts`
                            );
                            errorCount++;
                            continue;
                        }

                        // Update or create roster entry with the code
                        if (existingRoster) {
                            await adminDb.transact([
                                adminDb.tx.class_roster[existingRoster.id].update({
                                    guardianCode: codeToUse,
                                }),
                            ]);
                            console.log(
                                `  ✓ Updated roster entry for student ${student.id} (${student.firstName || ""} ${student.lastName || ""}) in class ${classEntity.id} with code: ${codeToUse}`
                            );
                        } else {
                            // Create new roster entry
                            const { id } = await import("@instantdb/admin");
                            const rosterId = id();
                            await adminDb.transact([
                                adminDb.tx.class_roster[rosterId]
                                    .create({
                                        guardianCode: codeToUse,
                                    })
                                    .link({ class: classEntity.id })
                                    .link({ student: student.id }),
                            ]);
                            console.log(
                                `  ✓ Created roster entry for student ${student.id} (${student.firstName || ""} ${student.lastName || ""}) in class ${classEntity.id} with code: ${codeToUse}`
                            );
                        }

                        successCount++;
                    } catch (classError) {
                        console.error(
                            `  ✗ Error processing student ${student.id} for class ${classEntity.id}:`,
                            classError instanceof Error ? classError.message : classError
                        );
                        errorCount++;
                    }
                }
            } catch (error) {
                console.error(
                    `  ✗ Error processing student ${student.id}:`,
                    error instanceof Error ? error.message : error
                );
                errorCount++;
            }
        }

        console.log("\n✅ Migration complete!");
        console.log(`   - Successfully migrated: ${successCount} roster entries`);
        console.log(`   - Skipped: ${skippedCount}`);
        console.log(`   - Errors: ${errorCount}`);
        console.log("\n⚠️  Note: Old studentGuardianCode values are still in $users.");
        console.log("   You can clean them up manually or in a separate step after verifying the migration.");
    } catch (error) {
        console.error("❌ Migration failed:", error);
        process.exit(1);
    }
}

// Run the migration
migrateGuardianCodesToRoster()
    .then(() => {
        console.log("Migration script finished");
        process.exit(0);
    })
    .catch((error) => {
        console.error("Migration script error:", error);
        process.exit(1);
    });
