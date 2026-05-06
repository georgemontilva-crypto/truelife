import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const params = new URLSearchParams(window.location.search);
  const emailFromUrl = params.get("email") || sessionStorage.getItem("verify_email") || "";
  const [email] = useState(emailFromUrl);
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const utils = trpc.useUtils();

  const verify = trpc.auth.verifyEmail.useMutation({
    onSuccess: () => {
      toast.success("Email verified! Welcome to CHRONIC.");
      utils.auth.me.invalidate();
      navigate("/account");
    },
    onError: (err) => toast.error(err.message || "Verification failed"),
  });

  const resend = trpc.auth.resendVerification.useMutation({
    onSuccess: () => toast.success("New code sent to your email"),
    onError: (err) => toast.error(err.message || "Failed to resend"),
  });

  const handleInput = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const fullCode = code.join("");

  useEffect(() => {
    if (fullCode.length === 6) {
      verify.mutate({ email, code: fullCode });
    }
  }, [fullCode]);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="container py-20 flex flex-col items-center text-center max-w-md mx-auto">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify your email</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          We sent a 6-digit code to <strong className="text-gray-800">{email}</strong>
        </p>

        <div className="flex gap-3 mb-8" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-200 rounded-xl focus:border-gray-900 focus:outline-none transition-colors"
            />
          ))}
        </div>

        {verify.isPending && (
          <div className="flex items-center gap-2 text-gray-500 mb-4">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Verifying...</span>
          </div>
        )}

        <Button
          variant="outline"
          className="rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
          onClick={() => resend.mutate({ email })}
          disabled={resend.isPending}
        >
          {resend.isPending ? (
            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Sending...</span>
          ) : "Resend code"}
        </Button>

        <p className="text-xs text-gray-400 mt-4">Code expires in 15 minutes</p>
      </div>
      <Footer />
    </div>
  );
}
