import { useAgeGate } from "@/contexts/AgeGateContext";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";

export default function AgeGate() {
  const { verified, verify, deny } = useAgeGate();

  if (verified) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full mx-4 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-2">Age Verification Required</h1>
        <p className="text-gray-500 text-sm mb-1 leading-relaxed">
          This website contains products intended for adults only.
        </p>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          You must be <span className="font-semibold text-gray-700">21 years of age or older</span> to enter.
        </p>

        <div className="space-y-3">
          <Button
            onClick={verify}
            className="w-full h-12 text-base font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-xl"
          >
            I am 21 or older — Enter Site
          </Button>
          <Button
            onClick={deny}
            variant="outline"
            className="w-full h-12 text-base font-medium rounded-xl text-gray-600 border-gray-200"
          >
            I am under 21 — Exit
          </Button>
        </div>

        <p className="text-xs text-gray-400 mt-6 leading-relaxed">
          By entering, you confirm you are of legal age and agree to our Terms of Service and Privacy Policy.
          Products on this site contain ≤0.3% Δ9THC.
        </p>
      </div>
    </div>
  );
}
