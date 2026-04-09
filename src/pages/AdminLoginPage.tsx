import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Lock } from "lucide-react";
import { toast } from "sonner";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === "gutorobles@outlook.com" && password === "m*t4PhTkSF4#kd!%99yOq") {
      localStorage.setItem("adminAuth", "true");
      toast.success("Welcome back, Admin!");
      navigate("/admin");
    } else {
      toast.error("Invalid credentials.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "var(--background)" }}>
      <Card className="w-full max-w-md" style={{ backgroundColor: "var(--card-background)", borderColor: "var(--card-border)" }}>
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--rating-yellow-dim)" }}>
            <Lock className="w-6 h-6" style={{ color: "var(--rating-yellow)" }} />
          </div>
          <CardTitle className="text-2xl" style={{ color: "var(--foreground)" }}>Admin Login</CardTitle>
          <CardDescription>Enter your credentials to access the admin area.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" style={{ color: "var(--foreground)" }}>Email</Label>
              <Input 
                id="email" 
                type="email" 
                required 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                style={{ backgroundColor: "var(--background)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: "var(--foreground)" }}>Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ backgroundColor: "var(--background)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
              />
            </div>
            <Button type="submit" className="w-full" style={{ backgroundColor: "var(--rating-yellow)", color: "var(--background)" }}>
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
