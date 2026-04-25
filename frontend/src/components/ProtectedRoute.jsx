import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SubscriptionBanner from "@/components/SubscriptionBanner";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0A0F1E]">
        <div className="text-center">
          <img src="/logo.png" alt="poketbook" className="w-16 h-16 mx-auto mb-3 animate-pulse" />
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return (
    <>
      <SubscriptionBanner subscription={user.subscription} />
      {children}
    </>
  );
};

export default ProtectedRoute;
