import { useState } from "react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function RegisterPage() {
  const [, navigate] = useLocation();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);

  const register = trpc.auth.register.useMutation({
    onSuccess: (data) => {
      setDone(true);
      // Store email for verify page
      sessionStorage.setItem("verify_email", data.email);
    },
    onError: (err) => toast.error(err.message || "Registration failed"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    register.mutate({ name: form.name, email: form.email, password: form.password });
  };

  if (done) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="container py-20 flex flex-col items-center text-center max-w-md mx-auto">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your email</h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            We sent a 6-digit verification code to <strong className="text-gray-800">{form.email}</strong>. Enter it to activate your account.
          </p>
          <Button
            className="w-full bg-gray-900 hover:bg-black text-white rounded-xl h-12"
            onClick={() => navigate(`/verify-email?email=${encodeURIComponent(form.email)}`)}
          >
            Enter Verification Code
          </Button>
          <p className="text-sm text-gray-400 mt-4">
            Didn't receive it?{" "}
            <button
              className="text-gray-700 underline"
              onClick={() => {
                sessionStorage.setItem("verify_email", form.email);
                navigate(`/verify-email?email=${encodeURIComponent(form.email)}`);
              }}
            >
              Resend code
            </button>
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-16 flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create account</h1>
            <p className="text-gray-500">Join CHRONIC for exclusive access and order tracking</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Full Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="John Doe"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="h-11 rounded-xl"
                required
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Password</Label>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                  className="h-11 rounded-xl pr-10"
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPass(!showPass)}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Confirm Password</Label>
              <Input
                type="password"
                value={form.confirm}
                onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
                placeholder="Repeat your password"
                className="h-11 rounded-xl"
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-medium text-base mt-2"
              disabled={register.isPending}
            >
              {register.isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</span>
              ) : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 font-medium hover:underline">Sign in</Link>
          </p>

          <p className="text-center text-xs text-gray-400 mt-4 leading-relaxed">
            By creating an account, you confirm you are 21+ and agree to our{" "}
            <a href="/terms" className="underline">Terms of Service</a> and{" "}
            <a href="/privacy" className="underline">Privacy Policy</a>.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
