
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

// Define a proper type for the user data returned from Supabase
interface SupabaseUserData {
  id: string;
  email?: string;
  user_metadata?: {
    email?: string;
    verification_token?: string;
    [key: string]: any;
  };
}

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
        // Get user by email - using the correct API parameters
        // The admin.listUsers method doesn't support direct filtering by email
        // We'll get the first page of users and then filter manually
        const { data, error: getUserError } = await supabase.auth.admin.listUsers({
          page: 1,
          perPage: 100
        });

        // Find the user with the matching email
        // We need to cast the users array to the correct type
        const users = data?.users as SupabaseUserData[] || [];
        const user = users.find(u => 
          u.email?.toLowerCase() === decodeURIComponent(email).toLowerCase()
        );
        
        if (getUserError || !user) {
          console.error("User fetch error:", getUserError);
          throw new Error("User not found");
        }

        // Verify the token matches
        if (user.user_metadata?.verification_token !== token) {
          console.error("Token mismatch");
          throw new Error("Invalid verification token");
        }

        // Update user metadata to mark email as confirmed
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            email_confirmed: true,
            verification_token: null // Clear the token after successful verification
          }
        });

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }

        toast.success("Email verified successfully!");
        setIsVerifying(false);
        
        // Redirect to login after a short delay
        setTimeout(() => navigate("/"), 2000);
      } catch (error) {
        console.error("Verification error:", error);
        setIsError(true);
        setIsVerifying(false);
        toast.error(error instanceof Error ? error.message : "Failed to verify email");
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
