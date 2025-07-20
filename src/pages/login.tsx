import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/lib/context/auth-context";

export default function LoginPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-white to-green-50">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-primary">
          iRevive Gadget Repair
        </h1>
        <p className="text-muted-foreground">Repair Tracking System</p>
      </div>
      <LoginForm />
    </div>
  );
}