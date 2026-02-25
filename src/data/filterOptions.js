// src/data/filterOptions.js

export const times = [
  "08:40","09:40","10:40","11:40","12:40",
  "13:40","14:40","15:40","16:40","17:40","18:40","19:40"
];

export const days = [
  "Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"
];

const defaultFilterOptions = {
  allowedTimeSlots: Object.fromEntries(days.map((d) => [d, [...times]])),
};

export default defaultFilterOptions;
