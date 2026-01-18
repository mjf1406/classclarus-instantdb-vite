/** @format */

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";
import type { InstaQLEntity } from "@instantdb/react";
import type { AppSchema } from "@/instant.schema";
import pdfLogo from "../assets/pdf-logo.png";

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        padding: 25,
        fontFamily: "Helvetica",
        fontSize: 9,
        backgroundColor: "#ffffff",
    },
    header: {
        alignItems: "center",
        marginBottom: 12,
        paddingBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    logo: {
        width: 125,
        height: 39,
        marginBottom: 8,
    },
    headerInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        width: "100%",
        alignItems: "flex-end",
    },
    headerLeft: {
        flexDirection: "column",
    },
    title: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 12,
        color: "#6b7280",
    },
    date: {
        fontSize: 10,
        color: "#9ca3af",
    },
    section: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 20,
    },
    groupCard: {
        width: "48%",
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 4,
        marginBottom: 10,
        minHeight: 100,
    },
    groupHeader: {
        backgroundColor: "#f9fafb",
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        borderTopLeftRadius: 4,
        borderTopRightRadius: 4,
    },
    groupName: {
        fontSize: 12,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 2,
    },
    groupDescription: {
        fontSize: 9,
        color: "#6b7280",
    },
    groupContent: {
        padding: 8,
    },
    studentsSection: {
        marginBottom: 8,
    },
    sectionLabel: {
        fontSize: 9,
        fontWeight: "bold",
        color: "#374151",
        marginBottom: 6,
    },
    studentRow: {
        flexDirection: "row",
        paddingVertical: 2,
        borderBottomWidth: 0.5,
        borderBottomColor: "#f3f4f6",
    },
    studentName: {
        flex: 1,
        fontSize: 8,
        color: "#111827",
    },
    studentGender: {
        width: 50,
        fontSize: 8,
        color: "#6b7280",
        textAlign: "right",
    },
    teamCard: {
        marginTop: 6,
        marginLeft: 8,
        paddingLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: "#3b82f6",
    },
    teamHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 6,
    },
    teamName: {
        fontSize: 11,
        fontWeight: "bold",
        color: "#1f2937",
    },
    teamDescription: {
        fontSize: 8,
        color: "#6b7280",
        marginBottom: 6,
    },
    parentGroupNote: {
        fontSize: 8,
        color: "#9ca3af",
        fontStyle: "italic",
        marginBottom: 6,
    },
    noStudents: {
        fontSize: 9,
        color: "#9ca3af",
        fontStyle: "italic",
    },
    footer: {
        position: "absolute",
        bottom: 15,
        left: 25,
        right: 25,
        textAlign: "center",
        fontSize: 7,
        color: "#9ca3af",
    },
});

type Student = InstaQLEntity<AppSchema, "$users">;

type Team = InstaQLEntity<
    AppSchema,
    "teams",
    {
        teamStudents: {};
    }
>;

type Group = InstaQLEntity<
    AppSchema,
    "groups",
    {
        groupStudents: {};
        groupTeams: {
            teamStudents: {};
        };
    }
>;

interface SelectedGroup {
    type: "group";
    group: Group;
}

interface SelectedTeam {
    type: "team";
    team: Team;
    parentGroupName: string;
}

type SelectedItem = SelectedGroup | SelectedTeam;

interface GroupsTeamsPDFDocumentProps {
    className: string;
    selectedItems: SelectedItem[];
    generatedDate: string;
}

function getStudentDisplayName(student: Student): string {
    const name = `${student.firstName || ""} ${student.lastName || ""}`.trim();
    return name || student.email || "Unknown Student";
}

function formatGender(gender: string | undefined): string {
    if (!gender) return "-";
    const g = gender.toLowerCase();
    if (g === "m" || g === "male") return "M";
    if (g === "f" || g === "female") return "F";
    return gender.charAt(0).toUpperCase();
}

function StudentList({ students }: { students: Student[] }) {
    if (students.length === 0) {
        return <Text style={styles.noStudents}>No students assigned</Text>;
    }

    return (
        <View>
            {students.map((student) => (
                <View key={student.id} style={styles.studentRow}>
                    <Text style={styles.studentName}>
                        {getStudentDisplayName(student)}
                    </Text>
                    <Text style={styles.studentGender}>
                        {formatGender(student.gender)}
                    </Text>
                </View>
            ))}
        </View>
    );
}

function GroupSection({ group }: { group: Group }) {
    const allStudents = group.groupStudents || [];
    const teams = group.groupTeams || [];

    const studentsNotOnTeams =
        teams.length > 0
            ? allStudents.filter(
                  (student) =>
                      !teams.some((team) =>
                          (team.teamStudents || []).some(
                              (teamStudent) => teamStudent.id === student.id
                          )
                      )
              )
            : allStudents;

    return (
        <View style={styles.groupCard}>
            <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{group.name}</Text>
                {group.description && (
                    <Text style={styles.groupDescription}>
                        {group.description}
                    </Text>
                )}
            </View>
            <View style={styles.groupContent}>
                {studentsNotOnTeams.length > 0 && (
                    <View style={styles.studentsSection}>
                        <Text style={styles.sectionLabel}>
                            Students ({studentsNotOnTeams.length})
                        </Text>
                        <StudentList students={studentsNotOnTeams} />
                    </View>
                )}

                {teams.length > 0 && (
                    <View>
                        <Text style={styles.sectionLabel}>
                            Teams ({teams.length})
                        </Text>
                        {teams.map((team) => (
                            <View key={team.id} style={styles.teamCard}>
                                <View style={styles.teamHeader}>
                                    <Text style={styles.teamName}>
                                        {team.name}
                                    </Text>
                                </View>
                                {team.description && (
                                    <Text style={styles.teamDescription}>
                                        {team.description}
                                    </Text>
                                )}
                                <StudentList
                                    students={team.teamStudents || []}
                                />
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </View>
    );
}

function TeamSection({
    team,
    parentGroupName,
}: {
    team: Team;
    parentGroupName: string;
}) {
    const students = team.teamStudents || [];

    return (
        <View style={styles.groupCard}>
            <View style={styles.groupHeader}>
                <Text style={styles.groupName}>{team.name}</Text>
                {team.description && (
                    <Text style={styles.groupDescription}>
                        {team.description}
                    </Text>
                )}
            </View>
            <View style={styles.groupContent}>
                <Text style={styles.parentGroupNote}>
                    Part of group: {parentGroupName}
                </Text>
                <View style={styles.studentsSection}>
                    <Text style={styles.sectionLabel}>
                        Students ({students.length})
                    </Text>
                    <StudentList students={students} />
                </View>
            </View>
        </View>
    );
}

export function GroupsTeamsPDFDocument({
    className,
    selectedItems,
    generatedDate,
}: GroupsTeamsPDFDocumentProps) {
    const itemsPerPage = 4;
    const pages: SelectedItem[][] = [];

    for (let i = 0; i < selectedItems.length; i += itemsPerPage) {
        pages.push(selectedItems.slice(i, i + itemsPerPage));
    }

    return (
        <Document>
            {pages.map((pageItems, pageIndex) => (
                <Page
                    key={pageIndex}
                    size="A4"
                    orientation="landscape"
                    style={styles.page}
                    wrap={false}
                >
                    {pageIndex === 0 && (
                        <View style={styles.header}>
                            <Image style={styles.logo} src={pdfLogo} />
                            <View style={styles.headerInfo}>
                                <View style={styles.headerLeft}>
                                    <Text style={styles.title}>
                                        Groups & Teams
                                    </Text>
                                    <Text style={styles.subtitle}>
                                        {className}
                                    </Text>
                                </View>
                                <Text style={styles.date}>{generatedDate}</Text>
                            </View>
                        </View>
                    )}

                    <View style={styles.section}>
                        {pageItems.map((item) => {
                            if (item.type === "group") {
                                return (
                                    <GroupSection
                                        key={`group-${item.group.id}`}
                                        group={item.group}
                                    />
                                );
                            } else {
                                return (
                                    <TeamSection
                                        key={`team-${item.team.id}`}
                                        team={item.team}
                                        parentGroupName={item.parentGroupName}
                                    />
                                );
                            }
                        })}
                    </View>

                    {pageIndex === pages.length - 1 && (
                        <Text style={styles.footer}>
                            Generated by ClassClarus on {generatedDate}
                        </Text>
                    )}
                </Page>
            ))}
        </Document>
    );
}

export type { SelectedItem, SelectedGroup, SelectedTeam, Group, Team };