import { cleanValue } from "./clean-value";
import type { TekionTaskRecord } from "./task-record";

export function mapTaskRow(
  row: Record<string, unknown>,
): TekionTaskRecord {
  return {
    taskTitle: cleanValue(row["Task Title"]),
    dueDate: cleanValue(row["Due date"]),
    action: cleanValue(row["Action"]),
    associatedWith: cleanValue(row["Associated with"]),
    assignee: cleanValue(row["Assignee"]),
    vehicleOfInterest: cleanValue(row["Vehicle of Interest"]),
    status: cleanValue(row["Status"]),
    department: cleanValue(row["Department"]),
    createdBy: cleanValue(row["Created by"]),
    leadSource: cleanValue(row["Lead Source"]),
    createdDate: cleanValue(row["Created Date"]),
    year: cleanValue(row["Year"]),
    make: cleanValue(row["Make"]),
    model: cleanValue(row["Model"]),
    leadSourceName: cleanValue(row["Lead Source Name"]),
    manuallyClosedBy: cleanValue(row["Manually Closed By"]),
    manuallyClosedTime: cleanValue(row["Manually Closed Time"]),
    leadStatus: cleanValue(row["Lead Status"]),
    customStage: cleanValue(row["Custom Stage"]),
    taskSource: cleanValue(row["Task Source"]),
    campaignName: cleanValue(row["Campaign Name"]),
    campaignObjective: cleanValue(row["Campaign Objective"]),
    leadSourceGroup: cleanValue(row["Lead Source Group"]),
    completedBy: cleanValue(row["Completed By"]),
  };
}