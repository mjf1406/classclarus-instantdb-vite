/** @format */

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";
import QRCode from "qrcode";
import { ensureRosterHasGuardianCode } from "./guardian-utils";
import { db } from "./db/db";

// Import logo statically - same logo used in groups-teams PDF
import pdfLogo from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/assets/pdf-logo.png";

// A4 size in points (72 DPI): 595 x 842
// 4 cards per page: 2 columns x 2 rows
// Card size: ~270 x 380 points with margins

const styles = StyleSheet.create({
    page: {
        padding: 20,
        fontFamily: "Helvetica",
        backgroundColor: "#ffffff",
    },
    cardContainer: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 15,
    },
    card: {
        width: "48%",
        height: "380",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 4,
        padding: 15,
        marginBottom: 15,
    },
    logoContainer: {
        alignItems: "center",
        marginBottom: 8,
    },
    logo: {
        width: 100,
        height: 31,
        objectFit: "contain",
    },
    studentName: {
        fontSize: 14,
        fontWeight: "bold",
        marginBottom: 10,
        textAlign: "center",
        color: "#111827",
    },
    qrCodeContainer: {
        alignItems: "center",
        marginBottom: 10,
        marginTop: 5,
    },
    qrCode: {
        width: 170,
        height: 170,
    },
    codeText: {
        fontSize: 16,
        fontWeight: "bold",
        textAlign: "center",
        marginBottom: 8,
        color: "#111827",
        fontFamily: "Courier",
    },
    instructions: {
        fontSize: 9,
        textAlign: "center",
        color: "#6b7280",
        lineHeight: 1.4,
    },
    instructionsLine: {
        marginBottom: 3,
    },
});

type StudentWithCode = {
    studentId: string;
    studentName: string;
    code: string | null;
};

/**
 * Generates QR code as PNG data URL using qrcode library
 */
async function generateQRCodeDataUrl(url: string): Promise<string> {
    try {
        const dataUrl = await QRCode.toDataURL(url, {
            width: 200,
            margin: 1,
            color: {
                dark: "#000000",
                light: "#ffffff",
            },
        });
        return dataUrl;
    } catch (error) {
        console.error("Failed to generate QR code:", error);
        return "";
    }
}

/**
 * Student card component for PDF
 */
function StudentCard({
    studentName,
    code,
    qrCodeDataUrl,
}: {
    studentName: string;
    code: string;
    qrCodeDataUrl: string;
}) {
    const domain = typeof window !== "undefined" ? window.location.origin : "";

    return (
        <View style={styles.card}>
            <View style={styles.logoContainer}>
                <Image style={styles.logo} src={pdfLogo} />
            </View>
            <Text style={styles.studentName}>{studentName}</Text>
            {qrCodeDataUrl && (
                <View style={styles.qrCodeContainer}>
                    <Image style={styles.qrCode} src={qrCodeDataUrl} />
                </View>
            )}
            <Text style={styles.codeText}>Code: {code}</Text>
            <View style={styles.instructions}>
                <Text style={styles.instructionsLine}>
                    Scan the QR code or visit:
                </Text>
                <Text style={styles.instructionsLine}>
                    {domain}/join/class
                </Text>
                <Text style={styles.instructionsLine}>
                    and enter code: {code}
                </Text>
            </View>
        </View>
    );
}

/**
 * PDF Document component
 */
function GuardianCodesPDFDocument({
    students,
    className,
    qrCodeDataUrls,
}: {
    students: StudentWithCode[];
    className: string;
    qrCodeDataUrls: Map<string, string>;
}) {
    // Group students into pages (4 per page)
    const studentsPerPage = 4;
    const pages: StudentWithCode[][] = [];

    for (let i = 0; i < students.length; i += studentsPerPage) {
        pages.push(students.slice(i, i + studentsPerPage));
    }

    return (
        <Document>
            {pages.map((pageStudents, pageIndex) => (
                <Page
                    key={pageIndex}
                    size="A4"
                    style={styles.page}
                    wrap={false}
                >
                    {pageIndex === 0 && (
                        <View style={{ marginBottom: 10 }}>
                            <Text
                                style={{
                                    fontSize: 18,
                                    fontWeight: "bold",
                                    textAlign: "center",
                                    marginBottom: 5,
                                }}
                            >
                                Guardian Join Codes
                            </Text>
                            <Text
                                style={{
                                    fontSize: 12,
                                    textAlign: "center",
                                    color: "#6b7280",
                                }}
                            >
                                {className}
                            </Text>
                        </View>
                    )}
                    <View style={styles.cardContainer}>
                        {pageStudents.map((student) => {
                            if (!student.code) return null;
                            const qrCodeDataUrl =
                                qrCodeDataUrls.get(student.studentId) || "";
                            return (
                                <StudentCard
                                    key={student.studentId}
                                    studentName={student.studentName}
                                    code={student.code}
                                    qrCodeDataUrl={qrCodeDataUrl}
                                />
                            );
                        })}
                    </View>
                </Page>
            ))}
        </Document>
    );
}

/**
 * Main function to generate and download PDF
 */
export async function generateGuardianCodePDF(
    students: Array<{
        studentId: string;
        studentName: string;
        code: string | null;
    }>,
    classId: string,
    className: string
): Promise<void> {
    try {
        // Ensure all students have guardian codes
        const studentsWithCodes: StudentWithCode[] = [];

        for (const student of students) {
            let code = student.code;

            // If student doesn't have a code, generate one
            if (!code) {
                try {
                    code = await ensureRosterHasGuardianCode(
                        db,
                        classId,
                        student.studentId
                    );
                } catch (error) {
                    console.error(
                        `Failed to generate code for student ${student.studentId}:`,
                        error
                    );
                    // Skip students where code generation fails
                    continue;
                }
            }

            studentsWithCodes.push({
                studentId: student.studentId,
                studentName: student.studentName,
                code,
            });
        }

        if (studentsWithCodes.length === 0) {
            alert("No students with guardian codes to export.");
            return;
        }

        // Generate QR code data URLs for all students
        const qrCodeDataUrls = new Map<string, string>();
        const domain =
            typeof window !== "undefined" ? window.location.origin : "";

        for (const student of studentsWithCodes) {
            if (student.code) {
                const joinUrl = `${domain}/join/class?code=${student.code}`;
                try {
                    const dataUrl = await generateQRCodeDataUrl(joinUrl);
                    qrCodeDataUrls.set(student.studentId, dataUrl);
                } catch (error) {
                    console.error(
                        `Failed to generate QR code for student ${student.studentId}:`,
                        error
                    );
                }
            }
        }

        // Lazy-load react-pdf
        const { pdf } = await import("@react-pdf/renderer");

        const doc = (
            <GuardianCodesPDFDocument
                students={studentsWithCodes}
                className={className}
                qrCodeDataUrls={qrCodeDataUrls}
            />
        );

        const blob = await pdf(doc).toBlob();
        const url = URL.createObjectURL(blob);

        // Create filename
        const dateStr = new Date().toISOString().split("T")[0];
        const safeClassName = className.replace(/[^a-zA-Z0-9]/g, "_");
        const filename = `${safeClassName}_guardian_codes_${dateStr}.pdf`;

        // Download the PDF
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error("Failed to generate PDF:", error);
        alert("Failed to generate PDF. Please try again.");
    }
}
