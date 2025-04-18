
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Verify() {
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Get the session to check if user is already verified
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user?.email_confirmed_at) {
          setIsVerifying(false);
          toast.success("Email verified successfully!");
          setTimeout(() => navigate("/"), 2000);
          return;
        }

        // If not verified yet, show appropriate message
        setIsVerifying(false);
        setIsError(true);
        toast.error("Please click the verification link in your email");
      } catch (error) {
        console.error("Verification error:", error);
        setIsError(true);
        setIsVerifying(false);
        toast.error("Failed to verify email");
      }
    };

    verifyEmail();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card>
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
          <CardDescription>
            {isVerifying
              ? "Verifying your email..."
              : isError
              ? "There was a problem verifying your email"
              : "Your email has been verified!"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : isError ? (
            <p className="text-destructive">Please check your email and click the verification link.</p>
          ) : (
            <p className="text-green-600">You can now sign in to your account.</p>
          )}
        </CardContent>
        <CardFooter>
          <Button
            onClick={() => navigate("/")}
            variant={isError ? "destructive" : "default"}
            className="w-full"
          >
            {isError ? "Try Again" : "Continue to Login"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
