import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../../components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Star,
  BookOpen,
  User as UserIcon,
  Clock,
  Globe,
  CheckCircle2,
  PlayCircle,
  Lock,
  ArrowLeft,
  Users,
  Loader2,
  MessageSquare,
  Plus,
  GripVertical,
  BadgeCheck,
} from "lucide-react";
import api from "../lib/api";
import { Course, Enrollment, Lesson } from "../types";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const CATEGORY_LABELS: Record<string, string> = {
  "web-development": "Web Development",
  "mobile-development": "Mobile Development",
  "data-science": "Data Science",
  devops: "DevOps",
  design: "Design",
  business: "Business",
  marketing: "Marketing",
};

const CATEGORY_COLORS: Record<string, string> = {
  "web-development": "bg-blue-100 text-blue-800",
  "mobile-development": "bg-purple-100 text-purple-800",
  "data-science": "bg-green-100 text-green-800",
  devops: "bg-orange-100 text-orange-800",
  design: "bg-pink-100 text-pink-800",
  business: "bg-yellow-100 text-yellow-800",
  marketing: "bg-teal-100 text-teal-800",
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface NewLessonState {
  title: string;
  content: string;
  videoUrl: string;
  order: number;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RatingStars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  // ── Add-lesson state ──────────────────────────────────────────────────────
  const [isAddLessonOpen, setIsAddLessonOpen] = useState(false);
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [newLesson, setNewLesson] = useState<NewLessonState>({
    title: "",
    content: "",
    videoUrl: "",
    order: 1,
  });

  // ─── Fetch course + enrollment ────────────────────────────────────────────
  useEffect(() => {
    const fetchCourseData = async () => {
      setIsLoading(true);
      try {
        const courseRes = await api.get(`/courses/${id}`);
        const fetchedCourse: Course = courseRes.data?.data ?? null;
        setCourse(fetchedCourse);

        // Pre-fill default order
        const lessonCount = fetchedCourse?.lessons?.length ?? 0;
        setNewLesson((prev) => ({ ...prev, order: lessonCount + 1 }));

        if (isAuthenticated) {
          try {
            const enrollmentRes = await api.get(
              `/enrollments/my?page=1&limit=100`,
            );
            const enrollments: Enrollment[] = enrollmentRes.data?.data ?? [];
            const found = enrollments.find(
              (e: any) => (e.course?._id ?? e.course) === id,
            );
            setEnrollment(found ?? null);
          } catch {
            setEnrollment(null);
          }
        }
      } catch (error) {
        console.error("Failed to fetch course details", error);
        toast.error("Course not found");
        navigate("/courses");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourseData();
  }, [id, isAuthenticated, navigate]);

  // ─── Enroll ───────────────────────────────────────────────────────────────
  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }
    setIsEnrolling(true);
    try {
      const { data } = await api.post("/enrollments", { courseId: id });
      setEnrollment(data.enrollment ?? data.data ?? data);
      toast.success("Successfully enrolled!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Enrollment failed");
    } finally {
      setIsEnrolling(false);
    }
  };

  // ─── Add lesson ───────────────────────────────────────────────────────────
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course?._id) return;

    setIsAddingLesson(true);
    try {
      const { data } = await api.post(`/courses/${course._id}/lessons`, {
        title: newLesson.title,
        content: newLesson.content,
        videoUrl: newLesson.videoUrl,
        order: newLesson.order,
      });

      // Normalise — API may wrap in data.data or data.lesson
      const created: Lesson = data.data ?? data.lesson ?? data;

      // Append new lesson to the course lessons list locally
      setCourse((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          lessons: [...(prev.lessons ?? []), created],
        };
      });

      toast.success("Lesson added successfully!");
      setIsAddLessonOpen(false);
      setNewLesson({
        title: "",
        content: "",
        videoUrl: "",
        order: (course.lessons?.length ?? 0) + 2,
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add lesson");
    } finally {
      setIsAddingLesson(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-3/4" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-96 w-full rounded-xl" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!course) return null;

  // ─── Derived values ───────────────────────────────────────────────────────
  const lessons = [...(course.lessons ?? [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0),
  );
  const categoryLabel = CATEGORY_LABELS[course.category] ?? course.category;
  const categoryColor =
    CATEGORY_COLORS[course.category] ?? "bg-gray-100 text-gray-800";
  const reviewCount = course.ratings?.length ?? 0;
  const avgRating = course.averageRating ?? 0;

  // True only when the logged-in user is the instructor who published this course
  const isOwnerInstructor =
    user?.role === "instructor" &&
    (course.instructor?._id === user._id || course.instructor === user._id);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 pb-20">
      <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back to courses
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Main Content ── */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${categoryColor}`}
              >
                {categoryLabel}
              </span>
              {isOwnerInstructor && (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-primary/10 text-primary">
                  <BadgeCheck className="h-3.5 w-3.5" /> Your Course
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold leading-tight">{course.title}</h1>
            <p className="text-xl text-muted-foreground">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              {/* Rating */}
              <div className="flex items-center gap-2">
                <RatingStars rating={avgRating} />
                <span className="font-bold text-yellow-500">
                  {avgRating > 0 ? avgRating.toFixed(1) : "No rating"}
                </span>
                <span className="text-muted-foreground">
                  ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>

              {/* Enrollments */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span>
                  {course.totalEnrollments}{" "}
                  {course.totalEnrollments === 1 ? "student" : "students"}
                </span>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-1 text-muted-foreground">
                <UserIcon className="h-4 w-4" />
                <span>
                  By{" "}
                  <span className="font-semibold text-foreground">
                    {course.instructor?.name}
                  </span>
                </span>
              </div>

              <div className="flex items-center gap-1 text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>English</span>
              </div>
            </div>
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="content"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Course Content
              </TabsTrigger>
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Reviews
                {reviewCount > 0 && (
                  <span className="ml-1.5 text-xs bg-muted px-1.5 py-0.5 rounded-full">
                    {reviewCount}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="instructor"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Instructor
              </TabsTrigger>
            </TabsList>

            {/* Tab: Course Content */}
            <TabsContent value="content" className="pt-6">
              <div className="space-y-4">
                {/* Header row: title + count + Add Lesson button */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Curriculum</h3>
                    <p className="text-sm text-muted-foreground">
                      {lessons.length}{" "}
                      {lessons.length === 1 ? "lesson" : "lessons"}
                    </p>
                  </div>

                  {/* Add Lesson — only for the course owner instructor */}
                  {isOwnerInstructor && (
                    <Dialog
                      open={isAddLessonOpen}
                      onOpenChange={setIsAddLessonOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" className="gap-2">
                          <Plus className="h-4 w-4" /> Add Lesson
                        </Button>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-[520px]">
                        <form onSubmit={handleAddLesson}>
                          <DialogHeader>
                            <DialogTitle>Add New Lesson</DialogTitle>
                            <DialogDescription>
                              Fill in the lesson details. It will be added to{" "}
                              <span className="font-semibold">
                                {course.title}
                              </span>
                              .
                            </DialogDescription>
                          </DialogHeader>

                          <div className="grid gap-4 py-4">
                            {/* Title */}
                            <div className="grid gap-2">
                              <Label htmlFor="lesson-title">Lesson Title</Label>
                              <Input
                                id="lesson-title"
                                placeholder="e.g. Introduction to React"
                                required
                                value={newLesson.title}
                                onChange={(e) =>
                                  setNewLesson((prev) => ({
                                    ...prev,
                                    title: e.target.value,
                                  }))
                                }
                              />
                            </div>

                            {/* Content */}
                            <div className="grid gap-2">
                              <Label htmlFor="lesson-content">
                                Content{" "}
                                <span className="text-xs text-muted-foreground">
                                  (Markdown supported)
                                </span>
                              </Label>
                              <Textarea
                                id="lesson-content"
                                placeholder="This lesson covers..."
                                className="h-28 resize-none"
                                required
                                value={newLesson.content}
                                onChange={(e) =>
                                  setNewLesson((prev) => ({
                                    ...prev,
                                    content: e.target.value,
                                  }))
                                }
                              />
                            </div>

                            {/* Video URL */}
                            <div className="grid gap-2">
                              <Label htmlFor="lesson-video">
                                Video URL{" "}
                                <span className="text-xs text-muted-foreground">
                                  (optional)
                                </span>
                              </Label>
                              <Input
                                id="lesson-video"
                                placeholder="https://youtube.com/watch?v=..."
                                type="url"
                                value={newLesson.videoUrl}
                                onChange={(e) =>
                                  setNewLesson((prev) => ({
                                    ...prev,
                                    videoUrl: e.target.value,
                                  }))
                                }
                              />
                            </div>

                            {/* Order */}
                            <div className="grid gap-2">
                              <Label htmlFor="lesson-order">Order</Label>
                              <Input
                                id="lesson-order"
                                type="number"
                                min={1}
                                required
                                value={newLesson.order}
                                onChange={(e) =>
                                  setNewLesson((prev) => ({
                                    ...prev,
                                    order: Number(e.target.value),
                                  }))
                                }
                              />
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setIsAddLessonOpen(false)}
                              disabled={isAddingLesson}
                            >
                              Cancel
                            </Button>
                            <Button type="submit" disabled={isAddingLesson}>
                              {isAddingLesson && (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              )}
                              Add Lesson
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>

                {/* Lesson list */}
                {lessons.length > 0 ? (
                  <Accordion
                    defaultValue={["section-1"]}
                    className="w-full border rounded-xl overflow-hidden"
                  >
                    <AccordionItem value="section-1" className="border-none">
                      <AccordionTrigger className="px-6 bg-muted/30 hover:no-underline">
                        <span className="font-semibold">
                          Course Introduction
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="px-0 pb-0">
                        {lessons.map((lesson, index) => (
                          <div
                            key={lesson._id}
                            className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors border-t first:border-t-0"
                          >
                            <div className="flex items-center gap-3">
                              {/* Icon: instructor sees grip, enrolled student sees play, others see lock */}
                              {isOwnerInstructor ? (
                                <GripVertical className="h-5 w-5 text-muted-foreground shrink-0" />
                              ) : enrollment ? (
                                <PlayCircle className="h-5 w-5 text-primary shrink-0" />
                              ) : (
                                <Lock className="h-5 w-5 text-muted-foreground shrink-0" />
                              )}
                              <span className="text-sm font-medium">
                                {lesson.order ?? index + 1}. {lesson.title}
                              </span>
                            </div>

                            {/* Action: instructor goes to lesson page, enrolled student can start */}
                            {isOwnerInstructor ? null : enrollment ? (
                              <Link to={`/lessons/${lesson._id}`}>
                                <Button variant="ghost" size="sm">
                                  Start
                                </Button>
                              </Link>
                            ) : null}
                          </div>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <div className="text-center py-12 border rounded-xl text-muted-foreground">
                    <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>
                      {isOwnerInstructor
                        ? "No lessons yet. Add your first lesson above!"
                        : "No lessons added yet."}
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Description */}
            <TabsContent
              value="description"
              className="pt-6 prose dark:prose-invert max-w-none"
            >
              <p>{course.description}</p>
              <h4 className="text-lg font-bold mt-6 mb-4">What you'll learn</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span className="text-sm">
                      Master the core concepts of {categoryLabel} with hands-on
                      projects.
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* Tab: Reviews */}
            <TabsContent value="reviews" className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center gap-6 p-6 bg-muted/30 rounded-xl border">
                  <div className="text-center">
                    <p className="text-5xl font-bold">
                      {avgRating > 0 ? avgRating.toFixed(1) : "—"}
                    </p>
                    <div className="mt-1">
                      <RatingStars rating={avgRating} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Course Rating
                    </p>
                  </div>
                  <div className="flex-1 space-y-1 text-sm text-muted-foreground">
                    <p>
                      {reviewCount} {reviewCount === 1 ? "review" : "reviews"}{" "}
                      total
                    </p>
                    <p>
                      {course.totalEnrollments} enrolled student
                      {course.totalEnrollments !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                {course.ratings && course.ratings.length > 0 ? (
                  <div className="space-y-4">
                    {course.ratings.map((r: any) => (
                      <div
                        key={r._id}
                        className="flex items-start gap-4 p-4 border rounded-xl"
                      >
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                          <UserIcon className="h-5 w-5" />
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <RatingStars rating={r.rating} />
                            <span className="text-sm font-semibold">
                              {r.rating}/5
                            </span>
                          </div>
                          {r.review && (
                            <p className="text-sm text-muted-foreground">
                              {r.review}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border rounded-xl text-muted-foreground">
                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No reviews yet. Be the first to review!</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Instructor */}
            <TabsContent value="instructor" className="pt-6">
              <Card className="bg-muted/30 border-none">
                <CardContent className="p-6 flex items-start gap-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold shrink-0">
                    {course.instructor?.name?.charAt(0).toUpperCase() ?? "I"}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold">
                      {course.instructor?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Expert Instructor · {categoryLabel}
                    </p>
                    <div className="flex flex-wrap items-center gap-4 text-xs font-medium text-muted-foreground mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span>
                          {avgRating > 0 ? avgRating.toFixed(1) : "—"} Rating
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        <span>{course.totalEnrollments} Students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <BookOpen className="h-3.5 w-3.5" />
                        <span>{lessons.length} Lessons</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Sidebar ── */}
        <div className="space-y-6">
          <Card className="sticky top-24 overflow-hidden shadow-xl border-2 border-primary/20">
            {/* Thumbnail */}
            <div className="aspect-video relative bg-muted">
              <img
                src={
                  course.thumbnail ||
                  `https://picsum.photos/seed/${course._id}/800/450`
                }
                alt={course.title}
                className="object-cover w-full h-full"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <PlayCircle className="h-16 w-16 text-white" />
              </div>
            </div>

            <CardHeader className="pb-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{course.totalEnrollments} students</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  <span>{lessons.length} lessons</span>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* CTA button: varies by role */}
              {isOwnerInstructor ? (
                // Owner instructor → go directly to first lesson to manage
                <Link
                  to={lessons[0]?._id ? `/lessons/${lessons[0]._id}` : "#"}
                  className="block w-full"
                >
                  <Button
                    className="w-full h-12 text-lg font-bold"
                    variant="secondary"
                    disabled={lessons.length === 0}
                  >
                    {lessons.length === 0
                      ? "Add lessons to start"
                      : "Manage Course"}
                  </Button>
                </Link>
              ) : enrollment ? (
                <Link
                  to={`/lessons/${lessons[0]?._id}`}
                  className="block w-full"
                >
                  <Button
                    className="w-full h-12 text-lg font-bold"
                    variant="default"
                  >
                    Go to Course
                  </Button>
                </Link>
              ) : (
                <Button
                  className="w-full h-12 text-lg font-bold"
                  onClick={handleEnroll}
                  disabled={isEnrolling}
                >
                  {isEnrolling && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Enroll Now — Free
                </Button>
              )}

              {!isOwnerInstructor && (
                <p className="text-center text-xs text-muted-foreground">
                  30-Day Money-Back Guarantee
                </p>
              )}

              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-bold text-sm">This course includes:</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span>{lessons.length} on-demand lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{course.totalEnrollments} enrolled students</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Certificate of completion</span>
                  </div>
                  {avgRating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>
                        {avgRating.toFixed(1)} avg rating ({reviewCount}{" "}
                        {reviewCount === 1 ? "review" : "reviews"})
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
