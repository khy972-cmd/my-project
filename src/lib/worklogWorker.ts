import type { WorklogEntry } from "@/lib/worklogStore";

export function normalizeWorkerIdentity(value: unknown) {
  return String(value || "").toLowerCase().replace(/\s+/g, "").trim();
}

export function dedupeWorkerNames(values: Array<unknown>) {
  return [...new Set(values.map((value) => String(value || "").trim()).filter(Boolean))];
}

export function getMatchedWorkerRows(worklog: WorklogEntry, normalizedWorkerNames: Set<string>) {
  const manpowerRows = Array.isArray(worklog.manpower) ? worklog.manpower : [];
  return manpowerRows.filter((row) => normalizedWorkerNames.has(normalizeWorkerIdentity(row.worker)));
}

export function describeWorkerRelevance(
  worklog: WorklogEntry,
  options: {
    userId?: string;
    normalizedWorkerNames: Set<string>;
  },
) {
  const manpowerRows = Array.isArray(worklog.manpower) ? worklog.manpower : [];
  const totalHours = manpowerRows.reduce((sum, row) => sum + Number(row.workHours || 0), 0);
  const matchedRows = getMatchedWorkerRows(worklog, options.normalizedWorkerNames);
  const matchedHours = matchedRows.reduce((sum, row) => sum + Number(row.workHours || 0), 0);
  const isOwner = !!options.userId && worklog.createdBy === options.userId;
  const isRelevant = isOwner || matchedRows.length > 0;
  const effectiveHours = matchedRows.length > 0 ? matchedHours : isOwner ? totalHours : 0;

  return {
    isOwner,
    isRelevant,
    totalHours,
    matchedRows,
    matchedHours,
    effectiveHours,
    matchedWorkerName: matchedRows[0]?.worker?.trim() || "",
  };
}
