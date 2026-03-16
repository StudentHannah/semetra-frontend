export interface CourseEvent {
  code: string;
  courseShort: string;
  courseName: string;
  lvType: 'IL' | 'UE' | 'VO' | '';
  start: string;
  end: string;
  location: string;
  eh: number;
  isCompleted: boolean;
}
