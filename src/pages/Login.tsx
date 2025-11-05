import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [captchaRequired, setCaptchaRequired] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleCaptchaChange = (token: string | null) => {
    setCaptchaToken(token);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    if (captchaRequired && !captchaToken) {
      toast.error("Please complete the CAPTCHA");
      return;
    }

    setIsLoading(true);
    
    try {
      const result = await login(username, password, captchaToken);
      if (result.success) {
        toast.success("Login successful!");
        navigate("/");
      } else {
        const errorMsg = result.error || "Invalid credentials. Please try again.";
        toast.error(errorMsg);
        if (result.captchaRequired) {
          setCaptchaRequired(true);
        }
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Login failed. Please try again.";
      toast.error(errorMsg);
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
      // Reset captcha after submission
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
      }
      setCaptchaToken(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-md animate-fade-in">
        <Card className="border border-border shadow-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex flex-col items-center space-y-3">
              <img 
                src="/favicon.ico" 
                alt="Espandar Logo" 
                className="h-28 w-28 object-contain"
              />
              <div className="text-center space-y-1">
                <CardTitle className="text-2xl font-semibold">
                  Welcome to GMRi
                </CardTitle>
                <CardDescription className="text-sm">
                  Sign in to continue
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-sm font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setFocusedField("username")}
                  onBlur={() => setFocusedField(null)}
                  className={cn(
                    "h-11 transition-colors",
                    focusedField === "username" && "border-[hsl(var(--header-background))]"
                  )}
                  disabled={isLoading}
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className={cn(
                      "h-11 pr-10 transition-colors",
                      focusedField === "password" && "border-[hsl(var(--header-background))]"
                    )}
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {captchaRequired && (
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey="6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI" // Replace with your site key
                    onChange={handleCaptchaChange}
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="flex flex-col space-y-4 pt-4">
              <Button
                type="submit"
                className={cn(
                  "w-full h-11 font-medium",
                  "bg-red-700 hover:bg-red-800 text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
                disabled={isLoading || !username || !password || (captchaRequired && !captchaToken)}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} Espandar. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;

