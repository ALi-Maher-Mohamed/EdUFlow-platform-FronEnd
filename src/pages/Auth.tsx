import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { useAuthStore } from "../store/authStore";
import api from "../lib/api";
import { toast } from "sonner";
import {
  Loader2,
  Mail,
  Lock,
  User as UserIcon,
  Camera,
  X,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth, isAuthenticated } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(
    searchParams.get("tab") || "login",
  );

  // ✅ Show/hide password states
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "", // ✅ Added confirm password
    role: "student" as "student" | "instructor",
  });

  // ✅ Password validation state
  const [passwordErrors, setPasswordErrors] = useState({
    length: false,
    match: false,
  });

  // Profile image state
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profilePreview, setProfilePreview] = useState<string>("");

  // ✅ Email verification state
  const [showVerificationMessage, setShowVerificationMessage] = useState(false);
  const [pendingUserEmail, setPendingUserEmail] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (profilePreview) {
        URL.revokeObjectURL(profilePreview);
      }
    };
  }, [profilePreview]);

  // ✅ Validate password on change
  useEffect(() => {
    setPasswordErrors({
      length: registerData.password.length >= 6,
      match: registerData.password === registerData.confirmPassword,
    });
  }, [registerData.password, registerData.confirmPassword]);

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be less than 2MB");
      return;
    }

    setProfileImage(file);
    setProfilePreview(URL.createObjectURL(file));
  };

  const removeProfileImage = () => {
    setProfileImage(null);
    if (profilePreview) {
      URL.revokeObjectURL(profilePreview);
      setProfilePreview("");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", loginData);
      setAuth(data.user, data.token);
      toast.success("Welcome back!");
      navigate(data.user.role === "instructor" ? "/instructor" : "/dashboard");
    } catch (error: any) {
      // ✅ Extract error details
      const statusCode = error.response?.status;
      const errorMessage =
        error.response?.data?.message || error.message || "Login failed";
      const errorDetails = error.response?.data?.details || "";

      // ✅ Log full error for debugging
      console.error("Login error:", {
        status: statusCode,
        message: errorMessage,
        details: errorDetails,
        fullResponse: error.response?.data,
      });

      // ✅ Handle different error cases
      if (statusCode === 401) {
        if (
          errorMessage.includes("verify") ||
          errorMessage.includes("verified")
        ) {
          setShowVerificationMessage(true);
          setPendingUserEmail(loginData.email);
          toast.error(
            "⚠️ Email not verified! Please check your inbox for the verification link.",
          );
        } else {
          toast.error("❌ Incorrect email or password. Please try again.");
        }
      } else if (statusCode === 404) {
        toast.error(
          "📧 No account found with this email. Please register first.",
        );
      } else if (statusCode === 500) {
        toast.error("🔧 Server error. Please try again later.");
      } else {
        toast.error(`❌ ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };
  // ✅ Resend verification email
  const handleResendVerification = async () => {
    if (!pendingUserEmail) return;

    setIsLoading(true);
    try {
      // First login to get token (even if not verified)
      const { data } = await api.post("/auth/login", {
        email: pendingUserEmail,
        password: loginData.password,
      });

      // Then request verification email
      await api.post(
        "/auth/send-verification-email",
        {},
        {
          headers: { Authorization: `Bearer ${data.token}` },
        },
      );

      toast.success("Verification email sent! Please check your inbox.");
      setShowVerificationMessage(false);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Failed to send verification email",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validate password length
    if (registerData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    // ✅ Validate password match
    if (registerData.password !== registerData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("name", registerData.name);
      formData.append("email", registerData.email);
      formData.append("password", registerData.password);
      formData.append("role", registerData.role);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const { data } = await api.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // ✅ Send verification email after registration
      try {
        await api.post(
          "/auth/send-verification-email",
          {},
          {
            headers: { Authorization: `Bearer ${data.token}` },
          },
        );
        toast.success(
          "Account created! Please check your email to verify your account.",
        );
      } catch (emailError) {
        toast.warning(
          "Account created but verification email could not be sent. Please contact support.",
        );
      }

      // ✅ Don't auto-login, show verification message instead
      setShowVerificationMessage(true);
      setPendingUserEmail(registerData.email);

      // Clear form
      setRegisterData({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "student",
      });
      removeProfileImage();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ If showing verification message
  if (showVerificationMessage) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Mail className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">
              Verify Your Email
            </CardTitle>
            <CardDescription>
              We've sent a verification link to
              <br />
              <span className="font-semibold text-primary">
                {pendingUserEmail}
              </span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Please check your inbox and click the verification link to
              activate your account. The link expires in 24 hours.
            </p>
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResendVerification}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Verification Email
              </Button>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  setShowVerificationMessage(false);
                  setActiveTab("login");
                  setPendingUserEmail("");
                }}
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-t-4 border-t-primary">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">EduFlow</CardTitle>
            <CardDescription>
              {activeTab === "login"
                ? "Welcome back to your learning journey"
                : "Start your learning journey today"}
            </CardDescription>
            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>
          </CardHeader>

          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      required
                      value={loginData.email}
                      onChange={(e) =>
                        setLoginData({ ...loginData, email: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showLoginPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      required
                      value={loginData.password}
                      onChange={(e) =>
                        setLoginData({ ...loginData, password: e.target.value })
                      }
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showLoginPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Sign In
                </Button>
              </CardFooter>
            </form>
          </TabsContent>

          <TabsContent value="register">
            <form onSubmit={handleRegister}>
              <CardContent className="space-y-4">
                {/* Profile Image Upload */}
                <div className="space-y-2">
                  <Label>Profile Picture (Optional)</Label>
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full bg-muted overflow-hidden flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                        {profilePreview ? (
                          <img
                            src={profilePreview}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Camera className="h-8 w-8 text-muted-foreground" />
                        )}
                      </div>
                      {profilePreview && (
                        <button
                          type="button"
                          onClick={removeProfileImage}
                          className="absolute -top-1 -right-1 p-1 bg-destructive text-white rounded-full hover:bg-destructive/90 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                    <label className="cursor-pointer">
                      <span className="text-sm text-primary hover:underline">
                        {profileImage ? "Change photo" : "Upload photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleProfileImageChange}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Max 2MB. JPG, PNG or WebP
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-name">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-name"
                      placeholder="John Doe"
                      className="pl-10"
                      required
                      value={registerData.name}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="name@example.com"
                      className="pl-10"
                      required
                      value={registerData.email}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type={showRegisterPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      required
                      value={registerData.password}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          password: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowRegisterPassword(!showRegisterPassword)
                      }
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showRegisterPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {registerData.password && !passwordErrors.length && (
                    <p className="text-xs text-red-500">
                      Password must be at least 6 characters
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type={showConfirmPassword ? "text" : "password"}
                      className="pl-10 pr-10"
                      required
                      value={registerData.confirmPassword}
                      onChange={(e) =>
                        setRegisterData({
                          ...registerData,
                          confirmPassword: e.target.value,
                        })
                      }
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {registerData.confirmPassword && !passwordErrors.match && (
                    <p className="text-xs text-red-500">
                      Passwords do not match
                    </p>
                  )}
                  {registerData.confirmPassword && passwordErrors.match && (
                    <p className="text-xs text-green-500">✓ Passwords match</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">I am a...</Label>
                  <Select
                    value={registerData.role}
                    onValueChange={(value: any) =>
                      setRegisterData({ ...registerData, role: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="instructor">Instructor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  type="submit"
                  disabled={
                    isLoading || !passwordErrors.length || !passwordErrors.match
                  }
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Create Account
                </Button>
              </CardFooter>
            </form>
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
