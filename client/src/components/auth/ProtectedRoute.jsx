"use client";

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

/**
 * ProtectedRoute component ensures only logged-in users can access child routes.
 * It checks for a valid JWT token stored in localStorage.
 */
export default function ProtectedRoute({ children }) {
    const navigate = useNavigate();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
      const token = localStorage.getItem("token");

      // Simulate token validation or decode it (optional)
      if (!token) {
        navigate("/login");
      } else {
        setIsAuthorized(true);
      }

      setIsChecking(false);
    }, [navigate]);

    if (isChecking) {
      return (
        <div className="flex justify-center items-center h-screen">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <p>Checking authentication...</p>
        </div>
      );
    }

    // Render child component if authenticated
    return isAuthorized ? children : null;
  }
