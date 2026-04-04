import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Skeleton } from "../../components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { Search, Star, BookOpen, User as UserIcon, Users } from "lucide-react";
import api from "../lib/api";
import { Course } from "../types";
import { Link } from "react-router-dom";

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

function CategoryBadge({ category }: { category: string }) {
  const label = CATEGORY_LABELS[category] ?? category;
  const color = CATEGORY_COLORS[category] ?? "bg-gray-100 text-gray-800";
  return (
    <span
      className={`absolute top-2 right-2 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}
    >
      {label}
    </span>
  );
}

function RatingStars({ rating, count }: { rating: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-3.5 w-3.5 ${
            star <= Math.round(rating)
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
      {count > 0 ? (
        <span className="text-xs text-muted-foreground ml-1">
          {rating.toFixed(1)} ({count})
        </span>
      ) : (
        <span className="text-xs text-muted-foreground ml-1">
          No ratings yet
        </span>
      )}
    </div>
  );
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("-createdAt");

  const filteredCourses = courses.filter((course) => {
    const matchesSearch =
      !search ||
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = category === "all" || course.category === category;

    return matchesSearch && matchesCategory;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    if (sort === "-createdAt") {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sort === "-rating") return b.averageRating - a.averageRating;
    if (sort === "-enrollments") return b.totalEnrollments - a.totalEnrollments;
    return 0;
  });

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const { data } = await api.get(`/courses?page=1&limit=10&sort=newest`);
        setCourses(data.data);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourses();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Browse Courses</h1>
          {!isLoading && (
            <p className="text-sm text-muted-foreground mt-1">
              {sortedCourses.length} course
              {sortedCourses.length !== 1 ? "s" : ""} available
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search courses or instructors..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={category} onValueChange={(v) => v && setCategory(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => v && setSort(v)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-createdAt">Newest</SelectItem>
              <SelectItem value="-rating">Highest Rated</SelectItem>
              <SelectItem value="-enrollments">Most Enrolled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedCourses.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCourses.map((course) => (
            <Link key={course._id} to={`/courses/${course._id}`}>
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow group cursor-pointer">
                {/* Thumbnail */}
                <div className="relative aspect-video overflow-hidden bg-muted">
                  <img
                    src={
                      course.thumbnail ||
                      `https://picsum.photos/seed/${course._id}/800/450`
                    }
                    alt={course.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <CategoryBadge category={course.category} />
                </div>

                {/* Header */}
                <CardHeader className="p-4 pb-2">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <UserIcon className="h-3 w-3 shrink-0" />
                    <span className="truncate">{course.instructor.name}</span>
                  </div>
                  <CardTitle className="text-base line-clamp-2 leading-snug">
                    {course.title}
                  </CardTitle>
                </CardHeader>

                {/* Description */}
                <CardContent className="p-4 pt-0 pb-2">
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                    {course.description}
                  </p>

                  {/* Rating */}
                  <RatingStars
                    rating={course.averageRating}
                    count={course.ratings.length}
                  />
                </CardContent>

                {/* Footer */}
                <CardFooter className="p-4 pt-2 flex items-center justify-between border-t border-border/40 mt-auto">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    <span>
                      {course.totalEnrollments}{" "}
                      {course.totalEnrollments === 1 ? "student" : "students"}
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7 px-3"
                  >
                    View Course
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No courses found</h3>
          <p className="text-muted-foreground mt-1">
            Try adjusting your search or filters
          </p>
          <Button
            variant="link"
            className="mt-2"
            onClick={() => {
              setSearch("");
              setCategory("all");
            }}
          >
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
