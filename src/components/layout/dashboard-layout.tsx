import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { useAuth } from "@/lib/context/auth-context";

export function DashboardLayout() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar className="w-64 hidden md:block" />
      <div className="flex-1 overflow-auto">
        <div className="container py-6 h-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}