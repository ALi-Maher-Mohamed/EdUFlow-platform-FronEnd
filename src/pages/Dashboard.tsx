import { useState, useEffect } from "react";
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
import { Progress } from "../../components/ui/progress";
import {
  BookOpen,
  Clock,
  PlayCircle,
  Trophy,
  ArrowRight,
  LayoutDashboard,
  GraduationCap,
} from "lucide-react";
import api from "../lib/api";
import { Enrollment, Course } from "../types";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";

const calculateProgress = (progressArray: any[]) => {
  if (!progressArray || progressArray.length === 0) return 0;
  const completedLessons = progressArray.filter((p) => p.completed).length;
  return (completedLessons / progressArray.length) * 100;
};
export default function Dashboard() {
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [recommended, setRecommended] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const [enrollmentsRes, coursesRes] = await Promise.all([
          api.get("/enrollments/my?page=1&limit=5"),
          api.get("/courses?limit=3&sort=-rating"),
        ]);
        console.log(enrollmentsRes.data.data);
        setEnrollments(enrollmentsRes.data.data);
        setRecommended(coursesRes.data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const activeEnrollments = enrollments.filter((e) => {
    const prog = calculateProgress(e.progress);
    return prog < 100;
  });

  const completedEnrollments = enrollments.filter((e) => {
    const prog = calculateProgress(e.progress);
    return prog === 100 && e.progress.length > 0;
  });

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}!</h1>
          <p className="text-muted-foreground">
            Continue your learning journey where you left off.
          </p>
        </div>
        <Link to="/courses">
          <Button className="gap-2">
            Explore More <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Enrolled
              </p>
              <p className="text-2xl font-bold">{enrollments?.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                In Progress
              </p>
              <p className="text-2xl font-bold">{activeEnrollments?.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10 text-green-500">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Completed
              </p>
              <p className="text-2xl font-bold">
                {completedEnrollments?.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Certificates
              </p>
              <p className="text-2xl font-bold">
                {completedEnrollments.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="active">Active Learning</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          {activeEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeEnrollments.map((enrollment) => {
                const currentProgress = calculateProgress(enrollment.progress); // حساب القيمة هنا

                return (
                  <Card
                    key={enrollment._id}
                    className="overflow-hidden group hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-video relative">
                      <img
                        src={
                          enrollment.course.thumbnail ||
                          "https://picsum.photos/seed/course/800/450"
                        }
                        alt={enrollment.course.title}
                        className="object-cover w-full h-full"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <PlayCircle className="h-12 w-12 text-white" />
                      </div>
                    </div>
                    <CardHeader className="p-4">
                      <CardTitle className="text-lg line-clamp-1">
                        {enrollment.course.title}
                      </CardTitle>
                      <CardDescription>
                        Category: {enrollment.course.category}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span>Progress</span>
                          <span>{Math.round(currentProgress)}%</span>
                        </div>
                        <Progress value={currentProgress} className="h-2" />
                      </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0">
                      <Link
                        to={`/courses/${enrollment.course._id}`}
                        className="w-full"
                      >
                        <Button variant="outline" className="w-full gap-2">
                          Continue Learning <ArrowRight className="h-4 w-4" />
                        </Button>
                      </Link>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No active courses</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                You haven't enrolled in any courses yet. Explore our catalog to
                find something that interests you!
              </p>
              <Link to="/courses">
                <Button size="lg" className="gap-2">
                  Browse Courses <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed">
          {completedEnrollments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedEnrollments.map((enrollment) => (
                <Card
                  key={enrollment._id}
                  className="overflow-hidden opacity-80 hover:opacity-100 transition-opacity"
                >
                  <div className="aspect-video relative">
                    <img
                      src={
                        enrollment.course.thumbnail ||
                        "https://picsum.photos/seed/course/800/450"
                      }
                      alt={enrollment.course.title}
                      className="object-cover w-full h-full grayscale"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500">Completed</Badge>
                    </div>
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg line-clamp-1">
                      {enrollment.course.title}
                    </CardTitle>
                    <CardDescription>
                      By {enrollment.course.instructor.name}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="p-4 pt-0">
                    <Button variant="outline" className="w-full">
                      View Certificate
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <div className="p-4 rounded-full bg-yellow-500/10 w-fit mx-auto mb-4">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No completed courses</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Finish your first course to earn a certificate and showcase your
                skills!
              </p>
              <Link to="/courses">
                <Button variant="outline">Start Learning</Button>
              </Link>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Recommended Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Recommended for You</h2>
          <Link
            to="/courses"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {recommended.map((course) => (
            <Link key={course._id} to={`/courses/${course._id}`}>
              <Card className="h-full overflow-hidden hover:shadow-md transition-shadow">
                <img
                  src={
                    course.thumbnail ||
                    "https://picsum.photos/seed/course/800/450"
                  }
                  alt={course.title}
                  className="aspect-video object-cover w-full"
                  referrerPolicy="no-referrer"
                />
                <CardHeader className="p-4">
                  <Badge variant="secondary" className="w-fit mb-2">
                    {course.category}
                  </Badge>
                  <CardTitle className="text-base line-clamp-2">
                    {course.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
