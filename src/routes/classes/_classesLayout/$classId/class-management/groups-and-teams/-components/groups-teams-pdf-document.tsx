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

// Define styles for the PDF
const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontFamily: "Helvetica",
        fontSize: 10,
        backgroundColor: "#ffffff",
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
    },
    headerLeft: {
        flexDirection: "column",
    },
    logo: {
        width: 120,
        height: 37,
    },
    title: {
        fontSize: 20,
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
        marginBottom: 20,
    },
    groupCard: {
        marginBottom: 16,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        borderRadius: 6,
    },
    groupHeader: {
        backgroundColor: "#f9fafb",
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        borderTopLeftRadius: 6,
        borderTopRightRadius: 6,
    },
    groupName: {
        fontSize: 14,
        fontWeight: "bold",
        color: "#111827",
        marginBottom: 2,
    },
    groupDescription: {
        fontSize: 9,
        color: "#6b7280",
    },
    groupContent: {
        padding: 12,
    },
    studentsSection: {
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 10,
        fontWeight: "bold",
        color: "#374151",
        marginBottom: 8,
    },
    studentRow: {
        flexDirection: "row",
        paddingVertical: 4,
        borderBottomWidth: 1,
        borderBottomColor: "#f3f4f6",
    },
    studentName: {
        flex: 1,
        fontSize: 9,
        color: "#111827",
    },
    studentGender: {
        width: 60,
        fontSize: 9,
        color: "#6b7280",
        textAlign: "right",
    },
    teamCard: {
        marginTop: 8,
        marginLeft: 12,
        paddingLeft: 12,
        borderLeftWidth: 3,
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
        bottom: 30,
        left: 40,
        right: 40,
        textAlign: "center",
        fontSize: 8,
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
    logoUrl?: string;
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

    // If teams exist, filter out students who are on any team
    const studentsNotOnTeams = teams.length > 0
        ? allStudents.filter((student) => {
              // Check if student is on any team
              return !teams.some((team) =>
                  (team.teamStudents || []).some(
                      (teamStudent) => teamStudent.id === student.id
                  )
              );
          })
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
    logoUrl,
}: GroupsTeamsPDFDocumentProps) {

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <View style={styles.headerLeft}>
                        <Text style={styles.title}>Groups & Teams</Text>
                        <Text style={styles.subtitle}>{className}</Text>
                        <Text style={styles.date}>{generatedDate}</Text>
                    </View>
                    {logoUrl && <Image style={styles.logo} src={logoUrl} />}
                </View>

                <View style={styles.section}>
                    {selectedItems.map((item) => {
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

                <Text style={styles.footer}>
                    Generated by ClassClarus on {generatedDate}
                </Text>
            </Page>
        </Document>
    );
}

export type { SelectedItem, SelectedGroup, SelectedTeam, Group, Team };
