/** @format */

import {
    Document,
    Page,
    Text,
    View,
    StyleSheet,
    Image,
} from "@react-pdf/renderer";
import type { AssignmentResult } from "@/lib/assigners/run-random-assigner";
import pdfLogo from "@/routes/classes/_classesLayout/$classId/class-management/groups-and-teams/assets/pdf-logo.png";

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
    table: {
        width: "100%",
        marginTop: 10,
    },
    tableRow: {
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: "#e5e7eb",
        minHeight: 25,
    },
    tableHeader: {
        backgroundColor: "#f9fafb",
        fontWeight: "bold",
        borderBottomWidth: 2,
        borderBottomColor: "#111827",
    },
    tableCell: {
        padding: 6,
        fontSize: 8,
        color: "#111827",
        borderRightWidth: 0.5,
        borderRightColor: "#e5e7eb",
    },
    tableCellItem: {
        width: "20%",
        fontWeight: "bold",
    },
    tableCellGroup: {
        width: "auto",
        flex: 1,
    },
    cellContent: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    studentNumber: {
        fontWeight: "bold",
        color: "#374151",
    },
    studentName: {
        color: "#111827",
    },
    emptyCell: {
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

interface AssignerResultsPDFDocumentProps {
    assignerName: string;
    className: string;
    generatedDate: string;
    results: AssignmentResult[];
}

// Group results by group/team
function organizeResultsByGroupTeam(
    results: AssignmentResult[]
): Map<string, Map<string, AssignmentResult>> {
    const organized = new Map<string, Map<string, AssignmentResult>>();

    for (const result of results) {
        const key = `${result.groupOrTeamId}-${result.isTeam ? "team" : "group"}`;
        if (!organized.has(key)) {
            organized.set(key, new Map());
        }
        const groupMap = organized.get(key)!;
        groupMap.set(result.item, result);
    }

    return organized;
}

// Get all unique items from results
function getAllItems(results: AssignmentResult[]): string[] {
    const itemsSet = new Set<string>();
    for (const result of results) {
        itemsSet.add(result.item);
    }
    return Array.from(itemsSet).sort();
}

// Get all unique groups/teams from results
function getAllGroupsTeams(results: AssignmentResult[]): Array<{
    id: string;
    name: string;
    isTeam: boolean;
    key: string;
}> {
    const groupsSet = new Map<
        string,
        { id: string; name: string; isTeam: boolean }
    >();

    for (const result of results) {
        const key = `${result.groupOrTeamId}-${result.isTeam ? "team" : "group"}`;
        if (!groupsSet.has(key)) {
            groupsSet.set(key, {
                id: result.groupOrTeamId,
                name: result.groupOrTeamName,
                isTeam: result.isTeam,
            });
        }
    }

    return Array.from(groupsSet.entries()).map(([key, value]) => ({
        ...value,
        key,
    }));
}

export function AssignerResultsPDFDocument({
    assignerName,
    className,
    generatedDate,
    results,
}: AssignerResultsPDFDocumentProps) {
    const allItems = getAllItems(results);
    const allGroupsTeams = getAllGroupsTeams(results);
    const organizedResults = organizeResultsByGroupTeam(results);

    // Check if this is a team-only run (all results are teams, no groups)
    const isTeamOnlyRun = allGroupsTeams.length > 0 && allGroupsTeams.every(gt => gt.isTeam);
    
    // Get unique parent group names for team-only runs
    // Filter for teams that have a non-empty parentGroupName
    const parentGroupNames = isTeamOnlyRun
        ? Array.from(
              new Set(
                  results
                      .filter((r) => r.isTeam && r.parentGroupName && typeof r.parentGroupName === 'string' && r.parentGroupName.trim().length > 0)
                      .map((r) => r.parentGroupName!)
              )
          ).sort()
        : null;

    // Calculate column widths
    const groupColumnWidth = `${80 / allGroupsTeams.length}%`;

    return (
        <Document>
            <Page size="A4" orientation="landscape" style={styles.page}>
                <View style={styles.header}>
                    <Image style={styles.logo} src={pdfLogo} />
                    <View style={styles.headerInfo}>
                        <View style={styles.headerLeft}>
                            <Text style={styles.title}>Equitable Assigner Results</Text>
                            <Text style={styles.subtitle}>
                                {assignerName} - {className}
                                {parentGroupNames && parentGroupNames.length > 0 && ` - ${parentGroupNames.join(", ")}`}
                            </Text>
                        </View>
                        <Text style={styles.date}>{generatedDate}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    {/* Header Row */}
                    <View style={[styles.tableRow, styles.tableHeader]}>
                        <View style={[styles.tableCell, styles.tableCellItem]}>
                            <Text>Item</Text>
                        </View>
                        {allGroupsTeams.map((groupTeam) => (
                            <View
                                key={groupTeam.key}
                                style={[
                                    styles.tableCell,
                                    styles.tableCellGroup,
                                    { width: groupColumnWidth },
                                ]}
                            >
                                <Text>
                                    {groupTeam.isTeam ? "Team: " : "Group: "}
                                    {groupTeam.name}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Data Rows */}
                    {allItems.map((item) => (
                        <View key={item} style={styles.tableRow}>
                            <View style={[styles.tableCell, styles.tableCellItem]}>
                                <Text>{item}</Text>
                            </View>
                            {allGroupsTeams.map((groupTeam) => {
                                const assignment =
                                    organizedResults
                                        .get(groupTeam.key)
                                        ?.get(item) || null;

                                return (
                                    <View
                                        key={groupTeam.key}
                                        style={[
                                            styles.tableCell,
                                            styles.tableCellGroup,
                                            { width: groupColumnWidth },
                                        ]}
                                    >
                                        {assignment ? (
                                            <View style={styles.cellContent}>
                                                {assignment.studentNumber !== null && (
                                                    <Text style={styles.studentNumber}>
                                                        {assignment.studentNumber} -
                                                    </Text>
                                                )}
                                                <Text style={styles.studentName}>
                                                    {assignment.studentName}
                                                </Text>
                                            </View>
                                        ) : (
                                            <Text style={styles.emptyCell}>-</Text>
                                        )}
                                    </View>
                                );
                            })}
                        </View>
                    ))}
                </View>

                <Text style={styles.footer}>
                    Generated on www.classclarus.com on {generatedDate}
                </Text>
            </Page>
        </Document>
    );
}
