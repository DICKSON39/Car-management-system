import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LandingPage from "./LandingPage"; // Import your new Landing Page

const Index = () => {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is already logged in, send them to their dashboard automatically
    if (!loading && user) {
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/cars", { replace: true });
      }
    }
  }, [user, role, loading, navigate]);

  // While checking auth status, we show nothing (to prevent flicker)
  if (loading) return null;

  // If NO user is logged in, we render the Landing Page right here at the root "/"
  if (!user) {
    return <LandingPage />;
  }

  return null;
};

export default Index;