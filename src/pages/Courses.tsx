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
import { Search, Filter, Star, BookOpen, User as UserIcon } from "lucide-react";
import api from "../lib/api";
import { Course } from "../types";
import { Link } from "react-router-dom";

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("-createdAt");

  useEffect(() => {
    const fetchCourses = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (search) params.append("search", search);
        if (category !== "all") params.append("category", category);
        params.append("sort", sort);

        const { data } = await api.get(`/courses?${params.toString()}`);
        setCourses(data.courses);
      } catch (error) {
        console.error("Failed to fetch courses", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(fetchCourses, 500);
    return () => clearTimeout(timeout);
  }, [search, category, sort]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">Browse Courses</h1>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select
            value={category}
            onValueChange={(value) => value && setCategory(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="Web Development">Web Development</SelectItem>
              <SelectItem value="Design">Design</SelectItem>
              <SelectItem value="Business">Business</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) => value && setSort(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="-createdAt">Newest</SelectItem>
              <SelectItem value="price">Price: Low to High</SelectItem>
              <SelectItem value="-price">Price: High to Low</SelectItem>
              <SelectItem value="-rating">Highest Rated</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardHeader className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-6 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : courses?.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course) => (
            <Link key={course._id} to={`/courses/${course._id}`}>
              <Card className="h-full overflow-hidden hover:shadow-lg transition-shadow group">
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={
                      course.thumbnail ||
                      "https://picsum.photos/seed/course/800/450"
                    }
                    alt={course.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <Badge className="absolute top-2 right-2" variant="secondary">
                    {course.category}
                  </Badge>
                </div>
                <CardHeader className="p-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <UserIcon className="h-3 w-3" />
                    <span>{course.instructor.name}</span>
                  </div>
                  <CardTitle className="text-lg line-clamp-2 leading-tight">
                    {course.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                  <div className="flex items-center gap-1 text-yellow-500 mb-2">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-bold">
                      {course.rating.toFixed(1)}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({course.numReviews})
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      <span>{course.lessonsCount} lessons</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-4 pt-0 flex items-center justify-between">
                  <span className="text-xl font-bold">${course.price}</span>
                  <Button size="sm">View Details</Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
          <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">No courses found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filters
          </p>
          <Button
            variant="link"
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
