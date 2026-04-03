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
import { ScrollArea } from "../../components/ui/scroll-area";
import { Separator } from "../../components/ui/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import { Input } from "../../components/ui/input";
import {
  PlayCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Info,
  FileText,
  ArrowLeft,
  Loader2,
  Send,
} from "lucide-react";
import api from "../lib/api";
import { Lesson, Course, Comment, Enrollment } from "../types";
import { useAuthStore } from "../store/authStore";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { formatDistanceToNow } from "date-fns";

export default function LessonPlayer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchLessonData = async () => {
      setIsLoading(true);
      try {
        const { data: lessonData } = await api.get(`/lessons/${id}`);
        setLesson(lessonData.lesson);

        const [courseRes, lessonsRes, enrollmentRes, commentsRes] =
          await Promise.all([
            api.get(`/courses/${lessonData.lesson.courseId}`),
            api.get(`/lessons/course/${lessonData.lesson.courseId}`),
            api.get(`/enrollments/course/${lessonData.lesson.courseId}`),
            api.get(`/comments/lesson/${id}`),
          ]);

        setCourse(courseRes.data.course);
        setLessons(lessonsRes.data.lessons);
        setEnrollment(enrollmentRes.data.enrollment);
        setComments(commentsRes.data.comments);

        // Mark lesson as completed if not already
        if (
          enrollmentRes.data.enrollment &&
          !enrollmentRes.data.enrollment.completedLessons.includes(id!)
        ) {
          await api.patch(
            `/enrollments/${enrollmentRes.data.enrollment._id}/progress`,
            {
              lessonId: id,
            },
          );
          // Update local state
          setEnrollment({
            ...enrollmentRes.data.enrollment,
            completedLessons: [
              ...enrollmentRes.data.enrollment.completedLessons,
              id!,
            ],
          });
        }
      } catch (error) {
        console.error("Failed to fetch lesson data", error);
        toast.error("Access denied or lesson not found");
        navigate("/dashboard");
      } finally {
        setIsLoading(false);
      }
    };

    fetchLessonData();
  }, [id, navigate]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const { data } = await api.post("/comments", {
        lessonId: id,
        text: newComment,
      });
      setComments([data.comment, ...comments]);
      setNewComment("");
      toast.success("Comment posted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-1/2" />
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <Skeleton className="h-[500px] w-full rounded-xl" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-[600px] w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!lesson || !course) return null;

  const currentLessonIndex = lessons.findIndex((l) => l._id === id);
  const prevLesson = lessons[currentLessonIndex - 1];
  const nextLesson = lessons[currentLessonIndex + 1];

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {/* Video Player Placeholder */}
          <div className="aspect-video bg-black rounded-xl overflow-hidden relative shadow-2xl">
            {lesson.videoUrl ? (
              <iframe
                src={lesson.videoUrl}
                className="w-full h-full"
                allowFullScreen
                title={lesson.title}
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white space-y-4">
                <PlayCircle className="h-20 w-20 opacity-20" />
                <p className="text-xl font-medium opacity-50">
                  No video available for this lesson
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">{lesson.title}</h1>
              <p className="text-sm text-muted-foreground">
                From{" "}
                <Link
                  to={`/courses/${course._id}`}
                  className="text-primary hover:underline"
                >
                  {course.title}
                </Link>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={!prevLesson}
                onClick={() => navigate(`/lessons/${prevLesson._id}`)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={!nextLesson}
                onClick={() => navigate(`/lessons/${nextLesson._id}`)}
              >
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          <Tabs defaultValue="content" className="w-full">
            <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent">
              <TabsTrigger
                value="content"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <FileText className="h-4 w-4 mr-2" /> Lesson Content
              </TabsTrigger>
              <TabsTrigger
                value="comments"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <MessageSquare className="h-4 w-4 mr-2" /> Comments (
                {comments.length})
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-6 py-3"
              >
                <Info className="h-4 w-4 mr-2" /> About
              </TabsTrigger>
            </TabsList>

            <TabsContent value="content" className="pt-6">
              <Card className="border-none shadow-none bg-muted/20">
                <CardContent className="p-8 prose dark:prose-invert max-w-none">
                  <ReactMarkdown>{lesson.content}</ReactMarkdown>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments" className="pt-6 space-y-8">
              <div className="flex gap-4">
                <Avatar className="h-10 w-10 border">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <form
                  onSubmit={handleCommentSubmit}
                  className="flex-1 flex gap-2"
                >
                  <Input
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSubmitting || !newComment.trim()}
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
              </div>

              <div className="space-y-6">
                {comments.map((comment) => (
                  <div key={comment._id} className="flex gap-4">
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage src={comment.user.avatar} />
                      <AvatarFallback>
                        {comment.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">
                          {comment.user.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(comment.createdAt))} ago
                        </span>
                      </div>
                      <p className="text-sm">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="about" className="pt-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="font-bold">Course Overview</h3>
                  <p className="text-sm text-muted-foreground">
                    {course.description}
                  </p>
                </div>
                <Separator />
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                      {course.instructor.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold">{course.instructor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Course Instructor
                    </p>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar - Lesson List */}
        <div className="w-full lg:w-96 shrink-0">
          <Card className="h-[calc(100vh-12rem)] sticky top-24 flex flex-col">
            <CardHeader className="p-4 border-b">
              <CardTitle className="text-lg">Course Content</CardTitle>
              <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
                <span>
                  {enrollment?.completedLessons.length} / {lessons.length}{" "}
                  completed
                </span>
                <span>{Math.round(enrollment?.progress || 0)}%</span>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1">
              <div className="p-0">
                {lessons.map((l, index) => {
                  const isCompleted = enrollment?.completedLessons.includes(
                    l._id,
                  );
                  const isActive = l._id === id;

                  return (
                    <Link
                      key={l._id}
                      to={`/lessons/${l._id}`}
                      className={`flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors border-b last:border-b-0 ${isActive ? "bg-primary/5 border-l-4 border-l-primary" : ""}`}
                    >
                      <div className="mt-0.5">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <div className="h-5 w-5 rounded-full border-2 flex items-center justify-center text-[10px] font-bold">
                            {index + 1}
                          </div>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p
                          className={`text-sm font-medium leading-tight ${isActive ? "text-primary" : ""}`}
                        >
                          {l.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <PlayCircle className="h-3 w-3" />
                          <span>10:00</span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </ScrollArea>
          </Card>
        </div>
      </div>
    </div>
  );
}
