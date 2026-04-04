export type Role = "student" | "instructor";

export interface User {
  _id: string;
  name: string;
  email: string;
  role: Role;
  avatar?: string;
}

export interface Course {
  [x: string]: any;
  totalEnrollments: any;
  _id: string;
  title: string;
  description: string;
  category: string;
  price: number;
  thumbnail: string;
  instructor: User;
  rating: number;
  numReviews: number;
  lessonsCount: number;
  createdAt: string;
}

export interface Lesson {
  _id: string;
  courseId: string;
  title: string;
  content: string;
  videoUrl?: string;
  order: number;
}

export interface Enrollment {
  _id: string;
  course: Course;
  student: string;
  progress: any[];
  completedLessons: string[];
  enrolledAt: string;
  status: "active" | "completed";
}

export interface Comment {
  _id: string;
  lessonId: string;
  user: User;
  text: string;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
