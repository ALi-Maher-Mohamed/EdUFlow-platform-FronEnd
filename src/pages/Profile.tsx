import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "../../components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import { toast } from "sonner";
import {
  Loader2,
  Camera,
  User as UserIcon,
  Mail,
  Shield,
  X,
  Upload,
  Trash2,
} from "lucide-react";

export default function Profile() {
  const { user, updateUser, token } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile edit states
  const [formData, setFormData] = useState({
    name: user?.name || "",
  });

  // Image states
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  // Get initials for avatar fallback
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setSelectedImage(file);
    setImagePreview(URL.createObjectURL(file));
  };

  // Upload new profile image
  const handleUploadImage = async () => {
    if (!selectedImage) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("profileImage", selectedImage);

      const { data } = await api.put("/auth/profile/image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      updateUser(data.user);
      toast.success("Profile picture updated!");
      setSelectedImage(null);
      setImagePreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to update profile picture",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Delete profile image
  const handleDeleteImage = async () => {
    setIsUploading(true);
    try {
      const { data } = await api.delete("/auth/profile/image");
      updateUser(data.user);
      toast.success("Profile picture removed");
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to remove profile picture",
      );
    } finally {
      setIsUploading(false);
    }
  };

  // Update profile (name only - email is fixed)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.put("/auth/profile", {
        name: formData.name,
      });
      updateUser(data.user);
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete account
  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await api.delete("/auth/profile");
      toast.success("Account deleted successfully");
      // Logout and redirect to home
      setTimeout(() => {
        window.location.href = "/";
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete account");
      setIsDeleteDialogOpen(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Format join date (from createdAt if available)
  const getJoinDate = () => {
    if (user) {
      return new Date().getFullYear();
    }
    return new Date().getFullYear();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <h1 className="text-3xl font-bold">Account Settings</h1>

      {/* Profile Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal details and profile picture.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="relative group">
                <Avatar className="h-24 w-24 border-4 border-muted">
                  <AvatarImage
                    src={imagePreview || user?.profileImage || undefined}
                  />
                  <AvatarFallback className="text-2xl font-bold">
                    {user?.name ? getInitials(user.name) : "U"}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <Camera className="h-8 w-8 text-white" />
                </button>
              </div>

              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-bold text-lg">{user?.name}</h3>
                <p className="text-sm text-muted-foreground capitalize">
                  {user?.role === "instructor" ? "Instructor" : "Student"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Member since {getJoinDate()}
                </p>
              </div>
            </div>

            {/* Image action buttons - show when image is selected or exists */}
            {(selectedImage || user?.profileImage) && (
              <div className="flex justify-center gap-3 sm:justify-start">
                {selectedImage && (
                  <>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleUploadImage}
                      disabled={isUploading}
                      className="gap-2"
                    >
                      {isUploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload New Photo
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview("");
                        if (fileInputRef.current) {
                          fileInputRef.current.value = "";
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </>
                )}
                {user?.profileImage && !selectedImage && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={handleDeleteImage}
                    disabled={isUploading}
                    className="gap-2"
                  >
                    {isUploading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                    Remove Photo
                  </Button>
                )}
              </div>
            )}

            {/* Form Fields */}
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ""}
                    disabled
                    className="pl-10 bg-muted/50"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed.
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role">Account Role</Label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="role"
                    value={
                      user?.role === "instructor" ? "Instructor" : "Student"
                    }
                    disabled
                    className="pl-10 bg-muted/50"
                  />
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="border-t pt-6">
            <Button type="submit" disabled={isLoading} className="ml-auto">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Danger Zone Card */}
      <Card className="border-destructive/20 bg-destructive/5">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions related to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Once you delete your account, all your data including courses,
            enrollments, and progress will be permanently deleted. This action
            cannot be undone.
          </p>
          <Dialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <DialogTrigger>
              <Button variant="destructive">Delete Account</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This action cannot be undone. This will permanently delete
                  your account and remove all your data from our servers.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <p className="text-sm font-medium text-destructive">
                  Warning: This will delete:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li>Your profile and personal information</li>
                  {user?.role === "instructor" && (
                    <li>All your courses and lessons</li>
                  )}
                  {user?.role === "student" && (
                    <li>All your enrollments and progress</li>
                  )}
                  <li>Your profile picture from Cloudinary</li>
                </ul>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={isLoading}
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Yes, Delete My Account
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}
