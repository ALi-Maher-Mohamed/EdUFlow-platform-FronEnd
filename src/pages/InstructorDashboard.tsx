import { useState, useEffect, useMemo } from "react";
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
import { Input } from "../../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Plus,
  Users,
  DollarSign,
  Star,
  BookOpen,
  MoreVertical,
  Edit,
  Trash2,
  BarChart3,
  TrendingUp,
  Loader2,
  ArrowRight,
  PieChart as PieChartIcon,
  Calendar,
} from "lucide-react";
import api from "../lib/api";
import { Course } from "../types";
import { useAuthStore } from "../store/authStore";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  Legend,
} from "recharts";

function InstructorDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("month");

  const [newCourse, setNewCourse] = useState({
    title: "",
    description: "",
    category: "Web Development",
    price: 0,
    thumbnail: "",
  });

  useEffect(() => {
    const fetchInstructorData = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get("/courses/instructor/my-courses");
        setCourses(data.courses);
      } catch (error) {
        console.error("Failed to fetch instructor courses", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructorData();
  }, []);

  // Mock analytics data based on timeRange
  const analyticsData = useMemo(() => {
    const points = timeRange === "day" ? 24 : timeRange === "week" ? 7 : 30;
    const label =
      timeRange === "day" ? "Hour" : timeRange === "week" ? "Day" : "Date";

    return Array.from({ length: points }).map((_, i) => ({
      name: `${label} ${i + 1}`,
      students: Math.floor(Math.random() * 50) + 10,
      revenue: Math.floor(Math.random() * 1000) + 200,
      rating: (Math.random() * 1.5 + 3.5).toFixed(1),
    }));
  }, [timeRange]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const { data } = await api.post("/courses", newCourse);
      setCourses([data.course, ...courses]);
      toast.success("Course created successfully!");
      setIsDialogOpen(false);
      setNewCourse({
        title: "",
        description: "",
        category: "Web Development",
        price: 0,
        thumbnail: "",
      });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create course");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this course?")) return;

    try {
      await api.delete(`/courses/${id}`);
      setCourses(courses.filter((c) => c._id !== id));
      toast.success("Course deleted");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete course");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-8 space-y-8">
        <Skeleton className="h-12 w-1/4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const totalStudents = courses.reduce(
    (acc, c) => acc + (c as any).studentsCount || 0,
    0,
  );
  const totalRevenue = courses.reduce(
    (acc, c) => acc + ((c as any).studentsCount || 0) * c.price,
    0,
  );
  const avgRating =
    courses.length > 0
      ? courses.reduce((acc, c) => acc + c.rating, 0) / courses.length
      : 0;

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your courses and track your performance.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Create New Course
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateCourse}>
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Fill in the details below to create your new course.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Course Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g. Complete React Mastery"
                    required
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse({ ...newCourse, title: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What will students learn?"
                    className="h-24"
                    required
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse({
                        ...newCourse,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={newCourse.category}
                      onValueChange={(v) =>
                        setNewCourse({
                          ...newCourse,
                          category: v || "Alternate Category",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Web Development">
                          Web Development
                        </SelectItem>
                        <SelectItem value="Design">Design</SelectItem>
                        <SelectItem value="Business">Business</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Price ($)</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      required
                      value={newCourse.price}
                      onChange={(e) =>
                        setNewCourse({
                          ...newCourse,
                          price: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isCreating} className="w-full">
                  {isCreating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Course
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-blue-500/10 text-blue-500">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Students
              </p>
              <p className="text-2xl font-bold">{totalStudents}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-green-500/10 text-green-500">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Revenue
              </p>
              <p className="text-2xl font-bold">${totalRevenue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-yellow-500/10 text-yellow-500">
              <Star className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Avg. Rating
              </p>
              <p className="text-2xl font-bold">{avgRating.toFixed(1)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Total Courses
              </p>
              <p className="text-2xl font-bold">{courses.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="stats">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="courses">
          {courses.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {courses.map((course) => (
                <Card key={course._id} className="overflow-hidden group">
                  <div className="flex flex-col md:flex-row">
                    <div className="w-full md:w-48 aspect-video md:aspect-square shrink-0 overflow-hidden">
                      <img
                        src={
                          course.thumbnail ||
                          "https://picsum.photos/seed/course/800/450"
                        }
                        alt={course.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{course.category}</Badge>
                            <span className="text-xs text-muted-foreground">
                              Created on{" "}
                              {new Date(course.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <h3 className="text-xl font-bold">{course.title}</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <Link to={`/courses/${course._id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDeleteCourse(course._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {(course as any).studentsCount || 0}
                          </span>
                          <span className="text-muted-foreground">
                            Students
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">
                            {course.rating.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">Rating</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {course.lessonsCount}
                          </span>
                          <span className="text-muted-foreground">Lessons</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">${course.price}</span>
                          <span className="text-muted-foreground">Price</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto mb-4">
                <BookOpen className="h-12 w-12 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No courses yet</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                You haven't created any courses yet. Start sharing your
                knowledge with the world today!
              </p>
              <Button
                size="lg"
                onClick={() => setIsDialogOpen(true)}
                className="gap-2"
              >
                <Plus className="h-5 w-5" /> Create Your First Course
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="stats" className="space-y-6">
          {courses.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Performance Overview</h2>
                <div className="flex items-center gap-2 bg-muted p-1 rounded-lg">
                  {(["day", "week", "month"] as const).map((range) => (
                    <Button
                      key={range}
                      variant={timeRange === range ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => setTimeRange(range)}
                      className="capitalize"
                    >
                      {range}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" /> Student Growth
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={analyticsData}>
                        <defs>
                          <linearGradient
                            id="colorStudents"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#3b82f6"
                              stopOpacity={0.3}
                            />
                            <stop
                              offset="95%"
                              stopColor="#3b82f6"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#88888822"
                        />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          itemStyle={{ color: "#3b82f6" }}
                        />
                        <Area
                          type="monotone"
                          dataKey="students"
                          stroke="#3b82f6"
                          fillOpacity={1}
                          fill="url(#colorStudents)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-500" /> Revenue
                      Trend
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#88888822"
                        />
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          itemStyle={{ color: "#22c55e" }}
                        />
                        <Bar
                          dataKey="revenue"
                          fill="#22c55e"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" /> Average
                      Rating
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#88888822"
                        />
                        <XAxis dataKey="name" hide />
                        <YAxis domain={[0, 5]} hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            borderColor: "hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          itemStyle={{ color: "#eab308" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="rating"
                          stroke="#eab308"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <div className="p-4 rounded-full bg-muted w-fit mx-auto mb-4">
                <BarChart3 className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No analytics data</h3>
              <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                Once you create courses and students start enrolling, you'll see
                detailed performance insights here.
              </p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                Create Your First Course
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default InstructorDashboard;
