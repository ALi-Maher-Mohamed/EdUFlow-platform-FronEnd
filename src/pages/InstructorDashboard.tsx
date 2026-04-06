import { useState, useEffect, useMemo } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Edit,
  Trash2,
  BarChart3,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";
import api from "../lib/api";
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
} from "recharts";

// ─── Types ────────────────────────────────────────────────────────────────────
interface DashboardCourse {
  _id: string;
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  category: string;
  instructor: string;
  averageRating: number;
  totalEnrollments: number;
  ratings: unknown[];
  lessons: unknown[];
  createdAt: string;
  updatedAt: string;
  price?: number;
}

interface DashboardAnalytics {
  totalStudents: number;
  overallRating: number;
}

interface DashboardResponse {
  success: boolean;
  count: number;
  analytics: DashboardAnalytics;
  data: DashboardCourse[];
}

interface NewCourseState {
  title: string;
  description: string;
  category: string;
  thumbnail: File | null;
}

interface EditCourseState {
  title: string;
  description: string;
  category: string;
  thumbnail: File | null;
}

// ─── Reusable category select ─────────────────────────────────────────────────
function CategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="web-development">Web Development</SelectItem>
        <SelectItem value="mobile-development">Mobile Development</SelectItem>
        <SelectItem value="data-science">Data Science</SelectItem>
        <SelectItem value="devops">DevOps</SelectItem>
        <SelectItem value="design">Design</SelectItem>
        <SelectItem value="business">Business</SelectItem>
        <SelectItem value="marketing">Marketing</SelectItem>
      </SelectContent>
    </Select>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
function InstructorDashboard() {
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<DashboardCourse[]>([]);
  const [analytics, setAnalytics] = useState<DashboardAnalytics>({
    totalStudents: 0,
    overallRating: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("month");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── Edit dialog state ─────────────────────────────────────────────────────
  const [editingCourse, setEditingCourse] = useState<DashboardCourse | null>(
    null,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editForm, setEditForm] = useState<EditCourseState>({
    title: "",
    description: "",
    category: "",
    thumbnail: null,
  });
  const [editThumbnailPreview, setEditThumbnailPreview] = useState<string>("");

  // ── Create dialog state ───────────────────────────────────────────────────
  const [newCourse, setNewCourse] = useState<NewCourseState>({
    title: "",
    description: "",
    category: "web-development",
    thumbnail: null,
  });
  const [thumbnailPreview, setThumbnailPreview] = useState<string>("");

  // ─── Fetch dashboard ──────────────────────────────────────────────────────
  useEffect(() => {
    const fetchDashboard = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get<DashboardResponse>(
          "/courses/instructor/dashboard",
        );
        setCourses(data.data);
        setAnalytics(data.analytics);
      } catch (error) {
        console.error("Failed to fetch instructor dashboard", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  // ─── Mock analytics chart data ────────────────────────────────────────────
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

  // ─── Thumbnail handlers ───────────────────────────────────────────────────
  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewCourse((prev) => ({ ...prev, thumbnail: file }));
    setThumbnailPreview(URL.createObjectURL(file));
  };

  const handleEditThumbnailChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditForm((prev) => ({ ...prev, thumbnail: file }));
    setEditThumbnailPreview(URL.createObjectURL(file));
  };

  // ─── Open edit dialog pre-filled with course data ─────────────────────────
  const openEditDialog = (course: DashboardCourse) => {
    setEditingCourse(course);
    setEditForm({
      title: course.title,
      description: course.description,
      category: course.category,
      thumbnail: null,
    });
    setEditThumbnailPreview(course.thumbnail ?? "");
    setIsEditOpen(true);
  };

  // ─── Submit edit — PUT /courses/:id with multipart/form-data ─────────────
  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCourse) return;

    setIsUpdating(true);
    try {
      const formData = new FormData();
      formData.append("title", editForm.title);
      formData.append("description", editForm.description);
      formData.append("category", editForm.category);
      // Only append thumbnail if the user chose a new file
      if (editForm.thumbnail) {
        formData.append("thumbnail", editForm.thumbnail);
      }

      const { data } = await api.put(
        `/courses/${editingCourse._id}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );

      // Merge updated fields returned by the controller (data.data)
      const updated: DashboardCourse = { ...editingCourse, ...data.data };

      setCourses((prev) =>
        prev.map((c) => (c._id === updated._id ? updated : c)),
      );
      toast.success("Course updated successfully!");
      setIsEditOpen(false);
      setEditingCourse(null);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update course");
    } finally {
      setIsUpdating(false);
    }
  };

  // ─── Create course ────────────────────────────────────────────────────────
  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("title", newCourse.title);
      formData.append("description", newCourse.description);
      formData.append("category", newCourse.category);
      if (newCourse.thumbnail) {
        formData.append("thumbnail", newCourse.thumbnail);
      }

      const { data } = await api.post("/courses", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created: DashboardCourse = {
        ...data.data,
        averageRating: data.data.averageRating ?? 0,
        totalEnrollments: data.data.totalEnrollments ?? 0,
        lessons: data.data.lessons ?? [],
        ratings: data.data.ratings ?? [],
      };

      setCourses((prev) => [created, ...prev]);
      toast.success("Course created successfully!");
      setIsDialogOpen(false);
      setNewCourse({
        title: "",
        description: "",
        category: "web-development",
        thumbnail: null,
      });
      setThumbnailPreview("");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create course");
    } finally {
      setIsCreating(false);
    }
  };

  // ─── Delete course ────────────────────────────────────────────────────────
  const handleDeleteCourse = async (courseId: string) => {
    setDeletingId(courseId);
    try {
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));
      toast.success("Course deleted successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete course");
    } finally {
      setDeletingId(null);
    }
  };

  // ─── Loading skeleton ─────────────────────────────────────────────────────
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

  const totalCourses = courses.length;
  const totalStudents = analytics.totalStudents;
  const overallRating = analytics.overallRating;
  const totalRevenue = courses.reduce(
    (acc, c) => acc + (c.totalEnrollments ?? 0) * (c.price ?? 0),
    0,
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Instructor Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your courses and track your performance.
          </p>
        </div>

        {/* ── Create Course Dialog ── */}
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
                  <Label htmlFor="create-title">Course Title</Label>
                  <Input
                    id="create-title"
                    placeholder="e.g. Complete React Mastery"
                    required
                    value={newCourse.title}
                    onChange={(e) =>
                      setNewCourse((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-description">Description</Label>
                  <Textarea
                    id="create-description"
                    placeholder="What will students learn?"
                    className="h-24"
                    required
                    value={newCourse.description}
                    onChange={(e) =>
                      setNewCourse((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Category</Label>
                  <CategorySelect
                    value={newCourse.category}
                    onChange={(v) =>
                      setNewCourse((prev) => ({ ...prev, category: v }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="create-thumbnail">Course Thumbnail</Label>
                  <div className="flex items-center gap-3">
                    <label
                      htmlFor="create-thumbnail"
                      className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors flex-1"
                    >
                      <ImageIcon className="h-4 w-4 shrink-0" />
                      {newCourse.thumbnail
                        ? newCourse.thumbnail.name
                        : "Click to upload image"}
                      <input
                        id="create-thumbnail"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleThumbnailChange}
                      />
                    </label>
                    {thumbnailPreview && (
                      <img
                        src={thumbnailPreview}
                        alt="Preview"
                        className="h-14 w-20 object-cover rounded-lg border"
                      />
                    )}
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

      {/* ── Edit Course Dialog ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleUpdateCourse}>
            <DialogHeader>
              <DialogTitle>Edit Course</DialogTitle>
              <DialogDescription>
                Update the details for{" "}
                <span className="font-semibold">{editingCourse?.title}</span>.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Course Title</Label>
                <Input
                  id="edit-title"
                  placeholder="e.g. Complete React Mastery"
                  required
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  placeholder="What will students learn?"
                  className="h-24"
                  required
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <CategorySelect
                  value={editForm.category}
                  onChange={(v) =>
                    setEditForm((prev) => ({ ...prev, category: v }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-thumbnail">
                  Thumbnail{" "}
                  <span className="text-xs text-muted-foreground">
                    (leave empty to keep current)
                  </span>
                </Label>
                <div className="flex items-center gap-3">
                  <label
                    htmlFor="edit-thumbnail"
                    className="flex items-center gap-2 cursor-pointer border border-dashed rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-muted/50 transition-colors flex-1"
                  >
                    <ImageIcon className="h-4 w-4 shrink-0" />
                    {editForm.thumbnail
                      ? editForm.thumbnail.name
                      : "Click to replace image"}
                    <input
                      id="edit-thumbnail"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleEditThumbnailChange}
                    />
                  </label>
                  {editThumbnailPreview && (
                    <img
                      src={editThumbnailPreview}
                      alt="Preview"
                      className="h-14 w-20 object-cover rounded-lg border"
                      referrerPolicy="no-referrer"
                    />
                  )}
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
                disabled={isUpdating}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isUpdating}>
                {isUpdating && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              <p className="text-2xl font-bold">
                {overallRating > 0 ? overallRating.toFixed(1) : "—"}
              </p>
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
              <p className="text-2xl font-bold">{totalCourses}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="stats">Analytics</TabsTrigger>
        </TabsList>

        {/* ── Courses Tab ── */}
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
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {course.description}
                          </p>
                        </div>

                        {/* ── Action Buttons ── */}
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <Link to={`/courses/${course._id}`}>
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                          </Link>

                          {/* Edit — opens pre-filled dialog, no route needed */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => openEditDialog(course)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>

                          {/* Delete */}
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            disabled={deletingId === course._id}
                            onClick={() => handleDeleteCourse(course._id)}
                          >
                            {deletingId === course._id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Course stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {course.totalEnrollments ?? 0}
                          </span>
                          <span className="text-muted-foreground">
                            Students
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          <span className="font-semibold">
                            {course.averageRating > 0
                              ? course.averageRating.toFixed(1)
                              : "—"}
                          </span>
                          <span className="text-muted-foreground">Rating</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold">
                            {course.lessons?.length ?? 0}
                          </span>
                          <span className="text-muted-foreground">Lessons</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="h-4 w-4 text-green-500" />
                          <span className="font-semibold">
                            {course.price != null ? `$${course.price}` : "Free"}
                          </span>
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

        {/* ── Analytics Tab ── */}
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
