
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isVerifying, setIsVerifying] = useState(true);
  const [isError, setIsError] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams.get("token");
      const email = searchParams.get("email");

      if (!token || !email) {
        setIsError(true);
        setIsVerifying(false);
        toast.error("Invalid verification link");
        return;
      }

      try {
        // Get the user data by email
        const { data: { users }, error: getUserError } = await supabase.auth.admin.listUsers();
        
        // Filter users on the client side since we can't use the filter parameter
        // Type assertion to handle the users array properly
        const user = users && users.length > 0 
          ? users.find(u => 
              (u.user_metadata && u.user_metadata.email === decodeURIComponent(email)) || 
              (u.email === decodeURIComponent(email))
            ) 
          : null;
        
        if (getUserError || !user) {
          throw new Error("User not found");
        }

        if (user.user_metadata.verification_token !== token) {
          throw new Error("Invalid verification token");
        }

        // Update user metadata to mark email as confirmed
        await supabase.auth.updateUser({
          data: {
            email_confirmed: true,
            verification_token: null // Clear the token
          }
        });

        toast.success("Email verified successfully!");
        setIsVerifying(false);
        // Redirect to home after a short delay
        setTimeout(() => navigate("/home"), 2000);
      } catch (error) {
        console.error("Verification error:", error);
        setIsError(true);
        setIsVerifying(false);
        toast.error("Failed to verify email");
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

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
            <p className="text-destructive">The verification link is invalid or has expired.</p>
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
