import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate async — backend reset endpoint to be implemented
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-16 flex justify-center">
        <div className="w-full max-w-md">
          {submitted ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Mail className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h1>
              <p className="text-gray-500 leading-relaxed mb-6">
                If an account exists for <strong className="text-gray-800">{email}</strong>, you will receive
                password reset instructions shortly.
              </p>
              <Link href="/login">
                <Button variant="outline" className="rounded-xl border-gray-200">
                  Back to Sign In
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot password?</h1>
                <p className="text-gray-500">
                  Enter your email and we'll send you instructions to reset your password.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    Email Address
                  </Label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-xl"
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-medium text-base"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                    </span>
                  ) : (
                    "Send Reset Instructions"
                  )}
                </Button>
              </form>

              <p className="text-center text-sm text-gray-500 mt-6">
                Remember your password?{" "}
                <Link href="/login" className="text-gray-900 font-medium hover:underline">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
