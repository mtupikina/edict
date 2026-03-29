export interface AuthSessionStudentRef {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface AuthSession {
  userId: string | null;
  email: string;
  firstName: string | null;
  lastName: string | null;
  roleNames: string[];
  showTutorMode: boolean;
  showStudentMode: boolean;
  defaultMode: 'tutor' | 'student';
  students: AuthSessionStudentRef[];
}
