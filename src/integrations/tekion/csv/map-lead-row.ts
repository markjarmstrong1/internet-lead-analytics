import { cleanValue } from "./clean-value";
import type { TekionLeadRecord } from "./lead-record";

export function mapLeadRow(
  row: Record<string, unknown>,
): TekionLeadRecord {
  return {
    leadId: cleanValue(row["Lead ID"]),
    contactName: cleanValue(row["Contact Name"]),
    creationTime: cleanValue(row["Creation Time"]),
    source: cleanValue(row["Source"]),
    vehicleInterest: cleanValue(row["Vehicle Interest"]),
    sourceTypeDetailed: cleanValue(row["Source Type (Detailed)"]),
    leadSourceGroup: cleanValue(row["Lead Source Group"]),
    email: cleanValue(row["Contact Email Id"]),
    mobilePhone: cleanValue(row["Contact Mobile Phone"]),
    homePhone: cleanValue(row["Contact Home Phone"]),
    workPhone: cleanValue(row["Contact Work Phone"]),
    year: cleanValue(row["Year"]),
    make: cleanValue(row["Make"]),
    model: cleanValue(row["Model"]),
    status: cleanValue(row["Status"]),
    stage: cleanValue(row["Stage"]),
    department: cleanValue(row["Department"]),
    dealership: cleanValue(row["Dealership"]),
    dealStatus: cleanValue(row["Deal Status"]),
    soldDate: cleanValue(row["Sold Date"]),
    closedTime: cleanValue(row["Closed Time"]),
  };
}
