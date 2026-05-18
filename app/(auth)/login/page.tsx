"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

const otpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
});

const passwordSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const otpForm = useForm({
    resolver: zodResolver(otpSchema),
    defaultValues: { phone: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onOtpSubmit(values: z.infer<typeof otpSchema>) {
    setLoading(true);
    const phone = `+91${values.phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("OTP sent!");
    router.push(`/verify-otp?phone=${encodeURIComponent(phone)}`);
  }

  async function onPasswordSubmit(values: z.infer<typeof passwordSchema>) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) {
      toast.error("Invalid credentials");
      return;
    }
    router.refresh();
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="font-display text-2xl text-brand-700">
          MAHADEV Enterprises
        </CardTitle>
        <p className="text-sm text-gray-500">Ice Cream Ordering Portal</p>
        {searchParams.get("error") === "inactive" && (
          <p className="mt-2 text-sm text-red-600">
            Your account is inactive. Contact admin.
          </p>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="otp">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="otp">OTP Login</TabsTrigger>
            <TabsTrigger value="password">Password Login</TabsTrigger>
          </TabsList>
          <TabsContent value="otp">
            <form
              onSubmit={otpForm.handleSubmit(onOtpSubmit)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="phone">Mobile Number</Label>
                <div className="mt-1 flex">
                  <span className="inline-flex items-center rounded-l-md border border-r-0 border-gray-300 bg-gray-50 px-3 text-sm">
                    +91
                  </span>
                  <Input
                    id="phone"
                    className="rounded-l-none"
                    placeholder="9876543210"
                    {...otpForm.register("phone")}
                  />
                </div>
                {otpForm.formState.errors.phone && (
                  <p className="mt-1 text-xs text-red-600">
                    {otpForm.formState.errors.phone.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="password">
            <form
              onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" {...passwordForm.register("email")} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...passwordForm.register("password")}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<p className="text-white">Loading...</p>}>
      <LoginForm />
    </Suspense>
  );
}
