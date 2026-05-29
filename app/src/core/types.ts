// src/core/types.ts


export type DayName =
  | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday"
  | "Saturday" | "Sunday";


export interface DaySlot {
  day: DayName;
  startTime: string;
  endTime: string;
  classroom?: string;
}

export interface Section {
  sectionNo: number;
  courseCode: string;
  days: DaySlot[];
  isRetake?: boolean;
}

export interface Course {
  courseCode: string;
  courseName: string;
  year: number;
  semester: string;
  sections: Section[];
}


export interface SectionSelection {
  courseCode: string;
  sectionNo: number;
  isRetake?: boolean;
}

