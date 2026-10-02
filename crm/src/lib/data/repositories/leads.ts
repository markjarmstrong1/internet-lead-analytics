import "server-only";

import { getSupabaseClient } from "@/lib/supabase";

export type LeadSummary = {
  lead_id: string;
  customer_name: string | null;
  phone: string | null;
  email: string | null;
  vehicle_interest: string | null;
  year: number | null;
  make: string | null;
  model: string | null;
  source: string | null;
  source_group: string | null;
  stage: string | null;
  custom_stage: string | null;
  status: string | null;
  last_activity_time: string | null;
  next_task_title: string | null;
  next_task_due_at: string | null;
  next_appointment_at: string | null;
};

type LeadRow = Omit<
  LeadSummary,
  | "last_activity_time"
  | "next_task_title"
  | "next_task_due_at"
  | "next_appointment_at"
>;

type TaskRow = {
  lead_id: string;
  title: string | null;
  due_at: string | null;
  status: string | null;
};

type ActivityRow = {
  lead_id: string;
  activity_time: string | null;
};

type AppointmentRow = {
  lead_id: string;
  scheduled_for: string | null;
  status: string | null;
};

function timestampValue(value: string | null): number {
  if (!value) return Number.POSITIVE_INFINITY;

  const timestamp = new Date(value).getTime();

  return Number.isNaN(timestamp)
    ? Number.POSITIVE_INFINITY
    : timestamp;
}

function isOpenTask(task: TaskRow): boolean {
  return task.status?.trim().toLowerCase() === "open";
}

function isCurrentAppointment(
  appointment: AppointmentRow
): boolean {
  const status = appointment.status?.trim().toLowerCase();

  return !["cancelled", "completed"].includes(status ?? "");
}

function buildLeadSummaries(
  leads: LeadRow[],
  tasks: TaskRow[],
  activities: ActivityRow[],
  appointments: AppointmentRow[]
): LeadSummary[] {
  const nextTaskByLead = new Map<string, TaskRow>();
  const lastActivityByLead = new Map<string, string>();
  const nextAppointmentByLead = new Map<string, string>();

  for (const task of tasks) {
    if (!isOpenTask(task) || !task.due_at) continue;

    const current = nextTaskByLead.get(task.lead_id);

    if (
      !current ||
      timestampValue(task.due_at) <
        timestampValue(current.due_at)
    ) {
      nextTaskByLead.set(task.lead_id, task);
    }
  }

  for (const activity of activities) {
    if (!activity.activity_time) continue;

    const current = lastActivityByLead.get(activity.lead_id);

    if (
      !current ||
      timestampValue(activity.activity_time) >
        timestampValue(current)
    ) {
      lastActivityByLead.set(
        activity.lead_id,
        activity.activity_time
      );
    }
  }

  for (const appointment of appointments) {
    if (
      !isCurrentAppointment(appointment) ||
      !appointment.scheduled_for
    ) {
      continue;
    }

    const current = nextAppointmentByLead.get(
      appointment.lead_id
    );

    if (
      !current ||
      timestampValue(appointment.scheduled_for) <
        timestampValue(current)
    ) {
      nextAppointmentByLead.set(
        appointment.lead_id,
        appointment.scheduled_for
      );
    }
  }

  return leads.map((lead) => {
    const nextTask = nextTaskByLead.get(lead.lead_id);

    return {
      ...lead,
      last_activity_time:
        lastActivityByLead.get(lead.lead_id) ?? null,
      next_task_title: nextTask?.title ?? null,
      next_task_due_at: nextTask?.due_at ?? null,
      next_appointment_at:
        nextAppointmentByLead.get(lead.lead_id) ?? null,
    };
  });
}

export async function getLeadSummaries(): Promise<LeadSummary[]> {
  const client = getSupabaseClient();

  const [
    leadsResult,
    tasksResult,
    activitiesResult,
    appointmentsResult,
  ] = await Promise.all([
    client
      .from("leads")
      .select(
        [
          "lead_id",
          "customer_name",
          "phone",
          "email",
          "vehicle_interest",
          "year",
          "make",
          "model",
          "source",
          "source_group",
          "stage",
          "custom_stage",
          "status",
        ].join(",")
      )
      .order("creation_time", { ascending: false }),

    client
      .from("tasks")
      .select("lead_id,title,due_at,status")
      .order("due_at", { ascending: true }),

    client
      .from("activities")
      .select("lead_id,activity_time")
      .order("activity_time", { ascending: false }),

    client
      .from("appointments")
      .select("lead_id,scheduled_for,status")
      .order("scheduled_for", { ascending: true }),
  ]);

  const error =
    leadsResult.error ??
    tasksResult.error ??
    activitiesResult.error ??
    appointmentsResult.error;

  if (error) {
    throw new Error(
      `Failed to load canonical lead data: ${error.message}`
    );
  }

  return buildLeadSummaries(
    (leadsResult.data ?? []) as LeadRow[],
    (tasksResult.data ?? []) as TaskRow[],
    (activitiesResult.data ?? []) as ActivityRow[],
    (appointmentsResult.data ?? []) as AppointmentRow[]
  );
}
