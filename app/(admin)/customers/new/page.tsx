"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const schema = z.object({
  full_name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().optional(),
  business_name: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
});

export default function NewCustomerPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: "",
      email: "",
      password: "",
      phone: "",
      business_name: "",
      address: "",
      city: "",
      pincode: "",
    },
  });

  async function onSubmit(values: z.infer<typeof schema>) {
    const res = await fetch("/api/customers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Failed to create customer");
      return;
    }
    setCredentials({ email: values.email, password: values.password });
    toast.success("Customer created!");
  }

  if (credentials) {
    return (
      <section className="max-w-md space-y-4 rounded-xl border bg-white p-6">
        <h1 className="text-xl font-bold text-green-700">Customer Created</h1>
        <p className="text-sm text-gray-600">
          Share these credentials securely with the customer:
        </p>
        <p>
          <strong>Email:</strong> {credentials.email}
        </p>
        <p>
          <strong>Password:</strong> {credentials.password}
        </p>
        <Button
          onClick={() => {
            navigator.clipboard.writeText(
              `Email: ${credentials.email}\nPassword: ${credentials.password}`
            );
            toast.success("Copied to clipboard");
          }}
        >
          Copy Credentials
        </Button>
        <Button variant="outline" onClick={() => router.push("/customers")}>
          Back to Customers
        </Button>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <h1 className="text-xl font-bold sm:text-2xl">Add Customer</h1>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-lg space-y-4 rounded-xl border bg-white p-4 sm:p-6"
      >
        <section>
          <Label>Full Name *</Label>
          <Input {...form.register("full_name")} />
        </section>
        <section>
          <Label>Business Name</Label>
          <Input {...form.register("business_name")} />
        </section>
        <section>
          <Label>Email *</Label>
          <Input type="email" {...form.register("email")} />
        </section>
        <section>
          <Label>Phone (for OTP)</Label>
          <Input placeholder="9876543210" {...form.register("phone")} />
        </section>
        <section>
          <Label>Password *</Label>
          <Input type="password" {...form.register("password")} />
        </section>
        <section>
          <Label>Address</Label>
          <Input {...form.register("address")} />
        </section>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <section>
            <Label>City</Label>
            <Input {...form.register("city")} />
          </section>
          <section>
            <Label>Pincode</Label>
            <Input {...form.register("pincode")} />
          </section>
        </section>
        <Button type="submit">Create Customer</Button>
      </form>
    </section>
  );
}
