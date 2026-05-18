"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { toast } from "sonner";
import { FadeIn } from "@/components/motion/FadeIn";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

function VerifyOtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const supabase = createClient();

  const masked = phone.replace(/(\+\d{2})(\d{2})(\d{4})(\d{4})/, "$1 $2****$4");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  async function verify() {
    if (otp.length !== 6) {
      toast.error("Enter 6-digit OTP");
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data.user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single();

      if (!profile) {
        await supabase.from("profiles").insert({
          id: data.user.id,
          role: "customer",
          full_name: data.user.phone ?? "Customer",
          phone: data.user.phone,
        });
      }
    }
    toast.success("Verified!");
    router.push("/home");
    router.refresh();
  }

  async function resend() {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) toast.error(error.message);
    else {
      toast.success("OTP resent");
      setCountdown(30);
    }
  }

  return (
    <FadeIn className="w-full max-w-md">
      <Card className="glass-panel border-neutral-200/80 shadow-lift">
        <CardHeader className="text-center">
          <CardTitle>Verify OTP</CardTitle>
          <CardDescription>Code sent to {masked}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <Input
            placeholder="000000"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
            className="h-14 text-center text-2xl tracking-[0.5em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="One-time password"
          />
          <Button className="w-full" onClick={verify} disabled={loading}>
            {loading ? "Verifying…" : "Verify & continue"}
          </Button>
          <Button
            variant="ghost"
            className="w-full"
            disabled={countdown > 0}
            onClick={resend}
          >
            {countdown > 0 ? `Resend in ${countdown}s` : "Resend OTP"}
          </Button>
        </CardContent>
      </Card>
    </FadeIn>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      <VerifyOtpForm />
    </Suspense>
  );
}
