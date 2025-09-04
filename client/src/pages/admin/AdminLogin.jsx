import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { decryptPrivateKeyWithPassword } from "@/utils/simpleCrypto";
import { useNavigate, useLocation } from "react-router-dom";
import { CheckCircle, AlertCircle } from "lucide-react";

export default function AdminLogin() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success', 'error', 'info'
  const navigate = useNavigate();
  const location = useLocation();

  // Check for success message from email verification
  useEffect(() => {
    if (location.state?.message) {
      setMessage(location.state.message);
      setMessageType(location.state.type || 'info');
      
      // Clear the message after 5 seconds
      setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 5000);
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setMessageType("");

    try {
      // 1️⃣ Login and get encrypted private key + token from backend
      const res = await axios.post("/api/admin/login", {
        email: formData.email,
        password: formData.password,
      });

      const { token, encryptedPrivateKey, publicKey } = res.data;

      // 2️⃣ Decrypt private key using entered password
      console.log("Decrypting private key with password...");
      const privateKey = await decryptPrivateKeyWithPassword(
        encryptedPrivateKey,
        formData.password
      );
      console.log("Private key decrypted successfully");

      // 3️⃣ Save token, privateKey & publicKey in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("privateKey", privateKey);
      localStorage.setItem("publicKey", publicKey);
      localStorage.setItem("adminData", JSON.stringify(res.data.admin));

      setMessage("Login successful! Redirecting to dashboard...");
      setMessageType("success");

      // Redirect to dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error) {
      console.error("Login error:", error);
      const errorMessage = error.response?.data?.message || "Login failed. Please try again.";
      setMessage(errorMessage);
      setMessageType("error");
      
      // If email not verified, provide helpful info
      if (errorMessage.includes("verify your email")) {
        setMessageType("info");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!formData.email) {
      setMessage("Please enter your email address first.");
      setMessageType("error");
      return;
    }

    try {
      await axios.post("/api/admin/resend-verification", { email: formData.email });
      setMessage("Verification email sent! Please check your inbox.");
      setMessageType("success");
    } catch (error) {
      console.error("Resend verification error:", error);
      setMessage(error.response?.data?.message || "Failed to resend verification email.");
      setMessageType("error");
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case "success":
        return <CheckCircle className="w-4 h-4" />;
      case "error":
        return <AlertCircle className="w-4 h-4" />;
      case "info":
        return <AlertCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="space-y-6 py-8">
          <h2 className="text-2xl font-bold text-center">Admin Login</h2>
          
          {/* Success/Error Messages */}
          {message && (
            <div className={`p-3 rounded-md text-sm flex items-center space-x-2 ${
              messageType === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : messageType === 'info'
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {getMessageIcon()}
              <span>{message}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Logging in...</span>
                </div>
              ) : (
                "Login"
              )}
            </Button>
          </form>

          {/* Email not verified helper */}
          {message.includes("verify your email") && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
              <p className="text-sm text-yellow-700 mb-2">
                Email verification required to login.
              </p>
              <Button 
                onClick={handleResendVerification}
                variant="outline" 
                size="sm"
                className="w-full text-yellow-700 border-yellow-300 hover:bg-yellow-100"
              >
                Resend Verification Email
              </Button>
            </div>
          )}
          
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button 
              type="button"
              onClick={() => navigate("/register")}
              className="text-blue-600 hover:underline font-medium"
            >
              Register here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}