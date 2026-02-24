import { useContext } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GoogleLogin } from "@react-oauth/google";
import { authService } from "@/services/api";

export default function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);
  const { toast } = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id.apps.googleusercontent.com';

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await authService.googleLogin(credentialResponse.credential);
      setUser(response.user);
      toast({
        title: "Login Successful",
        description: `Welcome, ${response.user.name}!`,
      });
      navigate("/posts");
    } catch (error) {
      console.error('Google login error:', error);
      toast({
        title: "Login Failed",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleGoogleError = () => {
    toast({
      title: "Login Failed",
      description: "Google sign-in was cancelled or failed.",
      variant: "destructive"
    });
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-muted/20">
      <Card className="w-full max-w-md p-6 shadow-lg border border-border rounded-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Welcome to Swyp Blog
          </CardTitle>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Sign in to create and manage posts
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex justify-center">
            {googleClientId && googleClientId !== 'your-google-client-id.apps.googleusercontent.com' ? (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                clientId={googleClientId}
              />
            ) : (
              <p className="text-sm text-muted-foreground text-center p-4">
                Google OAuth is not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.
              </p>
            )}
          </div>
          
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Secure login with Google
              </span>
            </div>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
