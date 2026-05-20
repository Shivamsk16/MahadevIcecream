"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/actions/profile.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();
      setProfile(data);
      setLoading(false);
    }
    load();
  }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!profile) return;
    setSaving(true);
    try {
      await updateProfile({
        business_name: profile.business_name ?? undefined,
        address: profile.address ?? undefined,
        city: profile.city ?? undefined,
        pincode: profile.pincode ?? undefined,
      });
      toast.success("Profile updated");
      setEditing(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Update failed");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  if (loading || !profile) {
    return (
      <section className="flex justify-center py-16">
        <LoadingSpinner />
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <h1 className="text-xl font-semibold text-heading dark:text-zinc-100">
        Profile
      </h1>

      {editing ? (
        <form
          onSubmit={save}
          className="space-y-4 rounded-xl border border-neutral-200 bg-surface p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-dark-card"
        >
          <section>
            <Label>Business Name</Label>
            <Input
              value={profile.business_name ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, business_name: e.target.value })
              }
            />
          </section>
          <section>
            <Label>Address</Label>
            <Input
              value={profile.address ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, address: e.target.value })
              }
            />
          </section>
          <section>
            <Label>City</Label>
            <Input
              value={profile.city ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, city: e.target.value })
              }
            />
          </section>
          <section>
            <Label>Pincode</Label>
            <Input
              value={profile.pincode ?? ""}
              onChange={(e) =>
                setProfile({ ...profile, pincode: e.target.value })
              }
            />
          </section>
          <section className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </section>
        </form>
      ) : (
        <section className="space-y-3 rounded-xl border border-neutral-200 bg-surface p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-dark-card">
          <p className="text-body dark:text-zinc-300">
            <span className="text-muted dark:text-zinc-500">Name:</span>{" "}
            <span className="text-heading dark:text-zinc-100">
              {profile.full_name}
            </span>
          </p>
          <p className="text-body dark:text-zinc-300">
            <span className="text-muted dark:text-zinc-500">Phone:</span>{" "}
            <span className="text-heading dark:text-zinc-100">
              {profile.phone ?? "—"}
            </span>
          </p>
          <p className="text-body dark:text-zinc-300">
            <span className="text-muted dark:text-zinc-500">Email:</span>{" "}
            <span className="text-heading dark:text-zinc-100">
              {profile.email ?? "—"}
            </span>
          </p>
          <p className="text-body dark:text-zinc-300">
            <span className="text-muted dark:text-zinc-500">Business:</span>{" "}
            <span className="text-heading dark:text-zinc-100">
              {profile.business_name ?? "—"}
            </span>
          </p>
          <p className="text-body dark:text-zinc-300">
            <span className="text-muted dark:text-zinc-500">Address:</span>{" "}
            <span className="text-heading dark:text-zinc-100">
              {[profile.address, profile.city, profile.pincode]
                .filter(Boolean)
                .join(", ") || "—"}
            </span>
          </p>
          <Button variant="outline" onClick={() => setEditing(true)}>
            Edit Profile
          </Button>
        </section>
      )}

      <Button variant="destructive" className="w-full" onClick={logout}>
        Logout
      </Button>
    </section>
  );
}
