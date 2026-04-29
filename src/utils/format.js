export function formatDate(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function timeAgo(dateLike) {
  if (!dateLike) return '';
  const d = new Date(dateLike);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'לפני רגע';
  if (diff < 3600) return `לפני ${Math.floor(diff / 60)} דק׳`;
  if (diff < 86400) return `לפני ${Math.floor(diff / 3600)} שעות`;
  if (diff < 604800) return `לפני ${Math.floor(diff / 86400)} ימים`;
  return formatDate(d);
}

export const GENDER_LABELS = {
  male: 'זכר',
  female: 'נקבה',
  other: 'אחר',
};

export const MARITAL_LABELS = {
  single: 'רווק/ה',
  married: 'נשוי/אה',
  common_law: 'ידוע/ה בציבור',
  in_relationship: 'בזוגיות',
  divorced: 'גרוש/ה',
  other: 'אחר',
};

export const EMPLOYMENT_LABELS = {
  employee: 'שכיר/ה',
  self_employed: 'עצמאי/ת',
  combined: 'משולב',
  not_working: 'לא עובד/ת',
  student: 'סטודנט/ית',
};

export const STUDENT_LEVEL_LABELS = {
  bachelors: 'תואר ראשון',
  masters: 'תואר שני',
  doctorate: 'דוקטורט',
  other: 'אחר',
};

export const JOB_TYPE_LABELS = {
  full_time: 'משרה מלאה',
  part_time: 'משרה חלקית',
  freelance: 'פרילנס',
  internship: 'התמחות',
  temporary: 'זמנית',
};
