import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader } from "lucide-react";

export default function EmailVerification() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState("Verifying your email...");
  const [adminEmail, setAdminEmail] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    if (!token) {
      setStatus("error");
      setMessage("Invalid verification link. Token is missing.");
      return;
    }

    try {
      console.log('Attempting to verify with token:', token);
      const res = await axios.get(`/api/admin/verify-email?token=${token}`);
      
      console.log('Verification successful:', res.data);
      setStatus("success");
      setMessage(res.data.message || "Email verified successfully!");
      setAdminEmail(res.data.adminEmail || "");
      
      // Auto redirect to login after 5 seconds to give user time to read
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Email verified successfully! You can now log in.',
            type: 'success'
          }
        });
      }, 5000);

    } catch (error) {
      console.error("Verification error:", error);
      // setStatus("error");
      // setMessage(
      //   error.response?.data?.message ||
      //   "Email verification failed. The link may be expired or invalid."
      // );
    }
  };

  const handleResendVerification = async () => {
    if (!adminEmail) {
      setMessage("Cannot resend verification. Email address not found.");
      return;
    }

    try {
      setStatus("verifying");
      setMessage("Resending verification email...");
      
      await axios.post('/api/admin/resend-verification', { email: adminEmail });
      
      setStatus("success");
      setMessage("Verification email resent successfully. Please check your inbox.");
    } catch (error) {
      console.error("Resend verification error:", error);
      setStatus("error");
      setMessage(
        error.response?.data?.message || 
        "Failed to resend verification email. Please try again."
      );
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "verifying":
        return <Loader className="w-16 h-16 text-blue-500 animate-spin" />;
      case "success":
        return <CheckCircle className="w-16 h-16 text-green-500" />;
      case "error":
        return <XCircle className="w-16 h-16 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case "verifying":
        return "text-blue-600";
      case "success":
        return "text-green-600";
      case "error":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="space-y-6 py-8 text-center">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
         
          <h2 className="text-2xl font-bold">Email Verification</h2>
         
          <p className={`text-lg ${getStatusColor()}`}>
            {message}
          </p>
         
          {status === "success" && (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-700 font-semibold">
                  ✅ Email verified successfully!
                </p>
                <p className="text-sm text-green-600 mt-1">
                  You can now log in to your account with your credentials.
                </p>
              </div>
              
              <Button
                onClick={() => navigate("/login", { 
                  state: { 
                    message: 'Email verified! You can now log in.',
                    type: 'success'
                  }
                })}
                className="w-full"
              >
                Go to Login
              </Button>
              
              <p className="text-xs text-gray-500">
                Auto-redirecting to login in 5 seconds...
              </p>
            </div>
          )}
         
          {status === "error" && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-sm text-red-700">
                  The verification link may be expired or invalid.
                </p>
              </div>
              
              <div className="space-y-2">
                {adminEmail && (
                  <Button
                    onClick={handleResendVerification}
                    className="w-full"
                    variant="outline"
                  >
                    Resend Verification Email
                  </Button>
                )}
                
                <Button
                  onClick={() => navigate("/register")}
                  className="w-full"
                >
                  Register Again
                </Button>
                
                <Button
                  onClick={() => navigate("/login")}
                  variant="outline"
                  className="w-full"
                >
                  Try Login Anyway
                </Button>
              </div>
              
              <div className="text-xs text-gray-500 text-left bg-gray-50 p-3 rounded">
                <p className="font-semibold mb-2">Troubleshooting:</p>
                <ul className="space-y-1">
                  <li>• Make sure you clicked the correct link from your email</li>
                  <li>• Check if the verification link has expired (24 hours)</li>
                  <li>• Try registering again with a valid email address</li>
                  <li>• Contact support if the problem persists</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}