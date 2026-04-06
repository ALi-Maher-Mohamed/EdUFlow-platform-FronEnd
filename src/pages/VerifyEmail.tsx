import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import api from "../lib/api";
import { toast } from "sonner";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [isLoading, setIsLoading] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setError("No verification token provided");
      setIsLoading(false);
      return;
    }

    const verifyEmail = async () => {
      try {
        const response = await api.get(`/auth/verify-email/${token}`);
        setIsSuccess(true);
        toast.success("Email verified successfully! You can now login.");

        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate("/auth?tab=login");
        }, 3000);
      } catch (error: any) {
        const errorMessage =
          error.response?.data?.message || "Verification failed";
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    verifyEmail();
  }, [token, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-12 pb-8">
            <Loader2 className="h-16 w-16 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">
              Verifying your email...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-2xl">Email Verified! ✅</CardTitle>
            <CardDescription>
              Your email has been successfully verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              You will be redirected to login page in a few seconds...
            </p>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link to="/auth?tab=login">
              <Button>Go to Login</Button>
            </Link>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-8 w-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Verification Failed ❌</CardTitle>
          <CardDescription>
            {error || "Unable to verify your email"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            The verification link may have expired or is invalid.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center gap-3">
          <Link to="/auth?tab=register">
            <Button variant="outline">Register Again</Button>
          </Link>
          <Link to="/auth?tab=login">
            <Button>Go to Login</Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
