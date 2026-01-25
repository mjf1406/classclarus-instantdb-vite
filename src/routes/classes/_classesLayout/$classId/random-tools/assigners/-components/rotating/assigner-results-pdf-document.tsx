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
import { naturalSort } from "@/lib/natural-sort";
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
    balanceGender?: boolean;
    rosterByStudentId?: Map<
        string,
        {
            id: string;
            firstName?: string;
            lastName?: string;
            gender?: string;
            number?: number;
        }
    >;
    allItems?: string[]; // Optional: all items from assigner (to show items with no assignments)
}

// Group results by group/team
function organizeResultsByGroupTeam(
    results: AssignmentResult[]
): Map<string, Map<string, AssignmentResult[]>> {
    const organized = new Map<string, Map<string, AssignmentResult[]>>();

    for (const result of results) {
        const key = `${result.groupOrTeamId}-${result.isTeam ? "team" : "group"}`;
        if (!organized.has(key)) {
            organized.set(key, new Map());
        }
        const groupMap = organized.get(key)!;
        if (!groupMap.has(result.item)) {
            groupMap.set(result.item, []);
        }
        groupMap.get(result.item)!.push(result);
    }

    return organized;
}

// Helper to determine if a gender string represents a boy/male
function isBoy(gender: string | null | undefined): boolean {
    if (!gender) return false;
    const g = gender.toLowerCase();
    return g === "m" || g === "male" || g === "boy";
}

// Helper to determine if a gender string represents a girl/female
function isGirl(gender: string | null | undefined): boolean {
    if (!gender) return false;
    const g = gender.toLowerCase();
    return g === "f" || g === "female" || g === "girl";
}

// Get student gender from roster
function getStudentGender(
    studentId: string,
    rosterByStudentId?: Map<
        string,
        {
            id: string;
            firstName?: string;
            lastName?: string;
            gender?: string;
            number?: number;
        }
    >
): string | null | undefined {
    if (!rosterByStudentId) return null;
    return rosterByStudentId.get(studentId)?.gender;
}

// Get all unique items from results, or use provided allItems if available
function getAllItems(results: AssignmentResult[], allItems?: string[]): string[] {
    if (allItems && allItems.length > 0) {
        // Use provided items list to ensure all items appear, even without assignments
        return naturalSort(allItems);
    }
    // Fallback: extract from results
    const itemsSet = new Set<string>();
    for (const result of results) {
        itemsSet.add(result.item);
    }
    return naturalSort(Array.from(itemsSet));
}

// Get items with gender rows when balanceGender is true
// Returns array of { item: string, genderLabel: string | null } where genderLabel is "Boy" or "Girl" or null
function getItemsWithGenderRows(
    results: AssignmentResult[],
    balanceGender: boolean,
    rosterByStudentId?: Map<
        string,
        {
            id: string;
            firstName?: string;
            lastName?: string;
            gender?: string;
            number?: number;
        }
    >,
    allItems?: string[]
): Array<{ item: string; genderLabel: string | null }> {
    const items = getAllItems(results, allItems);
    
    if (!balanceGender || !rosterByStudentId) {
        // Return one row per item without gender label
        return items.map(item => ({ item, genderLabel: null }));
    }
    
    // When balanceGender is true, create two rows per item (Boy and Girl)
    // Always show both rows for each item, even if there are no assignments
    const itemsWithGenders: Array<{ item: string; genderLabel: string | null }> = [];
    
    for (const item of items) {
        // Always add both Boy and Girl rows for each item when balanceGender is true
        // This ensures all items appear even if they have no assignments
        itemsWithGenders.push({ item, genderLabel: "Boy" });
        itemsWithGenders.push({ item, genderLabel: "Girl" });
    }
    
    return itemsWithGenders;
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
    balanceGender = false,
    rosterByStudentId,
    allItems: providedAllItems,
}: AssignerResultsPDFDocumentProps) {
    const allGroupsTeams = getAllGroupsTeams(results);
    const organizedResults = organizeResultsByGroupTeam(results);
    const itemsWithGenderRows = getItemsWithGenderRows(results, balanceGender, rosterByStudentId, providedAllItems);

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
                            <Text style={styles.title}>Rotating Assigner Results</Text>
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
                    {itemsWithGenderRows.map(({ item, genderLabel }, rowIndex) => {
                        // When balanceGender is true, filter assignments by gender
                        const getFilteredAssignments = (
                            assignments: AssignmentResult[]
                        ): AssignmentResult[] => {
                            if (!balanceGender || !genderLabel || !rosterByStudentId) {
                                return assignments;
                            }
                            
                            // Filter by gender
                            return assignments.filter(assignment => {
                                const gender = getStudentGender(assignment.studentId, rosterByStudentId);
                                if (genderLabel === "Boy") {
                                    return isBoy(gender);
                                } else if (genderLabel === "Girl") {
                                    return isGirl(gender);
                                }
                                return false;
                            });
                        };

                        return (
                            <View key={`${item}-${genderLabel || rowIndex}`} style={styles.tableRow}>
                                <View style={[styles.tableCell, styles.tableCellItem]}>
                                    <Text>
                                        {item}
                                        {genderLabel && ` (${genderLabel})`}
                                    </Text>
                                </View>
                                {allGroupsTeams.map((groupTeam) => {
                                    const allAssignments =
                                        organizedResults
                                            .get(groupTeam.key)
                                            ?.get(item) || [];
                                    
                                    const assignments = getFilteredAssignments(allAssignments);

                                    return (
                                        <View
                                            key={groupTeam.key}
                                            style={[
                                                styles.tableCell,
                                                styles.tableCellGroup,
                                                { width: groupColumnWidth },
                                            ]}
                                        >
                                            {assignments.length > 0 ? (
                                                // When balanceGender is true, show only one student per row
                                                balanceGender ? (
                                                    <View style={styles.cellContent}>
                                                        {assignments[0]?.studentNumber !== null && (
                                                            <Text style={styles.studentNumber}>
                                                                {assignments[0].studentNumber} -
                                                            </Text>
                                                        )}
                                                        <Text style={styles.studentName}>
                                                            {assignments[0]?.studentName}
                                                        </Text>
                                                    </View>
                                                ) : (
                                                    <View style={{ flexDirection: "column", gap: 2 }}>
                                                        {assignments.map((assignment, idx) => (
                                                            <View key={idx} style={styles.cellContent}>
                                                                {assignment.studentNumber !== null && (
                                                                    <Text style={styles.studentNumber}>
                                                                        {assignment.studentNumber} -
                                                                    </Text>
                                                                )}
                                                                <Text style={styles.studentName}>
                                                                    {assignment.studentName}
                                                                </Text>
                                                            </View>
                                                        ))}
                                                    </View>
                                                )
                                            ) : (
                                                <Text style={styles.emptyCell}>-</Text>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        );
                    })}
                </View>

                <Text style={styles.footer}>
                    Generated on www.classclarus.com on {generatedDate}
                </Text>
            </Page>
        </Document>
    );
}
