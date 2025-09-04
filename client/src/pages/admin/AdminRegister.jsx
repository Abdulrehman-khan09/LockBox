import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { generateKeyPair, encryptPrivateKeyWithPassword } from "@/utils/simpleCrypto";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle } from "lucide-react";

export default function AdminRegister() {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    organizationName: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(""); // 'success' or 'error'
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();

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
    setEmailSent(false);

    try {
      // 1️⃣ Generate public/private key pair
      console.log("Generating key pair...");
      const { publicKey, privateKey } = await generateKeyPair();
      console.log("Key pair generated successfully");

      // 2️⃣ Encrypt private key with password
      console.log("Encrypting private key...");
      const encryptedPrivateKey = await encryptPrivateKeyWithPassword(privateKey, formData.password);
      console.log("Private key encrypted successfully");

      // 3️⃣ Send to backend
      const res = await axios.post("/api/admin/register", {
        fullname: {
          firstname: formData.firstname,
          lastname: formData.lastname,
        },
        email: formData.email,
        password: formData.password,
        organizationName: formData.organizationName,
        publicKey,
        encryptedPrivateKey, // JSON object from cryptoUtils
      });

      console.log("Registration response:", res.data);
      setMessage(res.data.message || "Registration successful! Please check your email for verification.");
      setMessageType("success");
      setEmailSent(true);

      // Reset form on success
      setFormData({
        firstname: "",
        lastname: "",
        email: "",
        password: "",
        organizationName: "",
      });

    

    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.[0]?.msg || 
                          "Registration failed. Please try again.";
      setMessage(errorMessage);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigate('/login');
  };

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="space-y-6 py-8 text-center">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Check Your Email</h2>
              <div className="space-y-2">
                <p className="text-green-600 font-semibold">{message}</p>
                <p className="text-sm text-gray-600">
                  We've sent a verification link to <strong>{formData.email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Click the link in your email to verify your account. The link will expire in 24 hours.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleGoToLogin}
                className="w-full"
              >
                Go to Login
              </Button>
              <p className="text-xs text-gray-500">
                Already verified? You can now log in with your credentials.
              </p>
              <p className="text-xs text-gray-400">
                Check your email and click the verification link to complete registration.
              </p>
            </div>

            <div className="text-sm text-gray-500 border-t pt-4">
              <p>Didn't receive the email?</p>
              <ul className="text-xs text-left mt-2 space-y-1">
                <li>• Check your spam/junk folder</li>
                <li>• Make sure you entered the correct email</li>
                <li>• Wait a few minutes for delivery</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardContent className="space-y-6 py-8">
          <h2 className="text-2xl font-bold text-center">Admin Registration</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  name="firstname"
                  placeholder="John"
                  value={formData.firstname}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  name="lastname"
                  placeholder="Doe"
                  value={formData.lastname}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
            </div>

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
              />
              <p className="text-xs text-gray-500 mt-1">
                This password will encrypt your private key. Keep it secure!
              </p>
            </div>

            <div>
              <Label htmlFor="organizationName">Organization Name</Label>
              <Input
                id="organizationName"
                name="organizationName"
                placeholder="Your Organization"
                value={formData.organizationName}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>

            <Button type="submit" className="w-full cursor-pointer" disabled={loading}>
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Creating Account...</span>
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
          
          {message && !emailSent && (
            <div className={`p-3 rounded-md text-center text-sm ${
              messageType === 'success' 
                ? 'bg-green-100 text-green-700 border border-green-300' 
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {message}
            </div>
          )}
          
          <div className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button 
              type="button"
              onClick={handleGoToLogin}
              className="text-blue-600 hover:underline font-medium"
            >
              Sign in here
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}