import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
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
} from "lucide-react";
import api from "../lib/api";
import { Course, Lesson, Enrollment } from "../types";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourseData = async () => {
      setIsLoading(true);
      try {
        const [courseRes, lessonsRes] = await Promise.all([
          api.get(`/courses/${id}`),
          api.get(`/courses/${id}/lessons`),
        ]);

        // ✅ standardized response
        setCourse(courseRes.data?.data ?? null);
        setLessons(lessonsRes.data?.data ?? []);

        if (isAuthenticated) {
          const enrollmentRes = await api.get(`/enrollments/my?page=1&limit=5`);
          //              /enrollments/my?page=1&limit=5
          setEnrollment(enrollmentRes.data?.data ?? null);
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

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    setIsEnrolling(true);
    try {
      const { data } = await api.post("/enrollments", { courseId: id });
      setEnrollment(data.enrollment);
      toast.success("Successfully enrolled!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Enrollment failed");
    } finally {
      setIsEnrolling(false);
    }
  };

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

  return (
    <div className="space-y-8 pb-20">
      <Button variant="ghost" className="gap-2" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4" /> Back to courses
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <div className="space-y-4">
            <Badge className="px-3 py-1 text-sm">{course.category}</Badge>
            <h1 className="text-4xl font-bold leading-tight">{course.title}</h1>
            <p className="text-xl text-muted-foreground">
              {course.description}
            </p>

            <div className="flex flex-wrap items-center gap-6 text-sm">
              <div className="flex items-center gap-1 text-yellow-500 font-bold">
                <Star className="h-4 w-4 fill-current" />
                <span>{course.rating?.toFixed(1)}</span>
                <span className="text-muted-foreground font-normal">
                  ({course.numReviews} reviews)
                </span>
              </div>
              <div className="flex items-center gap-1">
                <UserIcon className="h-4 w-4" />
                <span>
                  Created by{" "}
                  <span className="font-semibold text-primary">
                    {course.instructor.name}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Globe className="h-4 w-4" />
                <span>English</span>
              </div>
            </div>
          </div>

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
                value="instructor"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                Instructor
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="pt-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">Curriculum</h3>
                  <span className="text-sm text-muted-foreground">
                    {lessons.length} lessons
                  </span>
                </div>

                <Accordion className="w-full border rounded-xl overflow-hidden">
                  <AccordionItem value="section-1" className="border-none">
                    <AccordionTrigger className="px-6 bg-muted/30 hover:no-underline">
                      <span className="font-semibold">Course Introduction</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-0">
                      {lessons.map((lesson, index) => (
                        <div
                          key={lesson._id}
                          className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors border-t first:border-t-0"
                        >
                          <div className="flex items-center gap-3">
                            {enrollment ? (
                              <PlayCircle className="h-5 w-5 text-primary" />
                            ) : (
                              <Lock className="h-5 w-5 text-muted-foreground" />
                            )}
                            <span className="text-sm font-medium">
                              {index + 1}. {lesson.title}
                            </span>
                          </div>
                          {enrollment && (
                            <Link to={`/lessons/${lesson._id}`}>
                              <Button variant="ghost" size="sm">
                                Start
                              </Button>
                            </Link>
                          )}
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>

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
                      Master the core concepts of {course.category} with
                      hands-on projects.
                    </span>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="instructor" className="pt-6">
              <Card className="bg-muted/30 border-none">
                <CardContent className="p-6 flex items-start gap-6">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-3xl font-bold">
                    {course.instructor.name.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold">
                      {course.instructor.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Expert Instructor in {course.category}
                    </p>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-current text-yellow-500" />
                        <span>4.8 Instructor Rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        <span>12,450 Students</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <PlayCircle className="h-3 w-3" />
                        <span>12 Courses</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card className="sticky top-24 overflow-hidden shadow-xl border-2 border-primary/20">
            <div className="aspect-video relative">
              <img
                src={
                  course.thumbnail ||
                  "https://picsum.photos/seed/course/800/450"
                }
                alt={course.title}
                className="object-cover w-full h-full"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity cursor-pointer">
                <PlayCircle className="h-16 w-16 text-white" />
              </div>
            </div>
            <CardHeader>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold">${course.price}</span>
                <span className="text-muted-foreground line-through text-sm">
                  $99.99
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {enrollment ? (
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
                  Enroll Now
                </Button>
              )}
              <p className="text-center text-xs text-muted-foreground">
                30-Day Money-Back Guarantee
              </p>

              <div className="space-y-3 pt-4 border-t">
                <h4 className="font-bold text-sm">This course includes:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                    <span>12 hours on-demand video</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-muted-foreground" />
                    <span>{lessons.length} lessons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Full lifetime access</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    <span>Certificate of completion</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
