import path from "node:path";

const projectRoot = process.cwd();

export const tekionTaskFile = path.join(
  projectRoot,
  "data/tekion/tasks/_CRM_TASK_LIST_48e53783-3c35-4c92-b5c0-3c9d89daaeff15226785944713350597.csv",
);

export const tekionTimelineDirectory = path.join(
  projectRoot,
  "data/tekion/timelines",
);

export const tekionTimelineFiles = [
  "ana_yu.txt",
  "anthony_bacon.txt",
  "jeffery_becker.txt",
  "jim_wilson.txt",
] as const;

export function getTekionTimelinePath(file: string): string {
  return path.join(tekionTimelineDirectory, file);
}
