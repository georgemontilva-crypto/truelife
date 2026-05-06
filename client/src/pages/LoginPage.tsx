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

export default function LoginPage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const returnTo = params.get("returnTo"); // null if not explicitly set
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const utils = trpc.useUtils();

  const login = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      utils.auth.me.invalidate();
      toast.success("Welcome back!");
      if (data.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate(returnTo || "/");
      }
    },
    onError: (err) => {
      if (err.message.includes("verify your email")) {
        toast.error("Please verify your email first", {
          action: {
            label: "Resend code",
            onClick: () => navigate(`/verify-email?email=${encodeURIComponent(form.email)}`),
          },
        });
      } else {
        toast.error(err.message || "Login failed");
      }
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(form);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-16 flex justify-center">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-500">Sign in to your CHRONIC account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label className="text-sm font-medium text-gray-700 mb-1.5 block">Email Address</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="you@example.com"
                className="h-11 rounded-xl"
                required
                autoFocus
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <Label className="text-sm font-medium text-gray-700">Password</Label>
                <Link href="/forgot-password" className="text-xs text-gray-500 hover:text-gray-700">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder="Your password"
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

            <Button
              type="submit"
              className="w-full h-12 bg-gray-900 hover:bg-black text-white rounded-xl font-medium text-base mt-2"
              disabled={login.isPending}
            >
              {login.isPending ? (
                <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</span>
              ) : "Sign In"}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{" "}
            <Link href="/register" className="text-gray-900 font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
