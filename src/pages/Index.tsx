import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) navigate("/auth", { replace: true });
      else if (role === "admin") navigate("/admin", { replace: true });
      else navigate("/cars", { replace: true });
    }
  }, [user, role, loading, navigate]);

  return null;
};

export default Index;
