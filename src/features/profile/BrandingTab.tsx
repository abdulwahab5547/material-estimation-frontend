import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import { z } from "zod";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/features/auth/useAuth";
import { api } from "@/lib/api";
import { extractApiError } from "@/features/auth/errors";
import type { User } from "@/features/auth/types";

const schema = z.object({
  displayName: z.string().min(2).max(80),
  companyName: z.string().max(120),
});
type Values = z.infer<typeof schema>;

export function BrandingTab() {
  const { user, setUser } = useAuth();
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      companyName: user?.companyName ?? "",
    },
  });

  async function onSubmit(values: Values) {
    setSavingProfile(true);
    try {
      const { data } = await api.patch<{ user: User }>("/api/me/profile", values);
      setUser(data.user);
      toast.success("Branding saved");
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Logo must be 2MB or smaller");
      return;
    }
    const fd = new FormData();
    fd.append("logo", file);
    setUploading(true);
    try {
      const { data } = await api.post<{ user: User }>("/api/me/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUser(data.user);
      toast.success("Logo uploaded");
    } catch (err) {
      toast.error(extractApiError(err));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const initials =
    (user?.displayName ?? "?")
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?";

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Company logo</CardTitle>
          <CardDescription>PNG, JPG, WEBP, or SVG — up to 2MB. Appears on every PDF quote.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 rounded-xl border border-border">
              {user?.logoUrl ? <AvatarImage src={user.logoUrl} alt="Company logo" className="object-contain bg-background" /> : null}
              <AvatarFallback className="rounded-xl bg-primary/20 text-primary text-lg">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFile}
              />
              <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} variant="outline">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? "Uploading…" : user?.logoUrl ? "Replace logo" : "Upload logo"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Display name & company</CardTitle>
          <CardDescription>These appear on your dashboard and the cover page of every quote.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" {...register("displayName")} />
              {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="companyName">Company name</Label>
              <Input id="companyName" {...register("companyName")} />
              {errors.companyName && <p className="text-xs text-destructive">{errors.companyName.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <Button type="submit" disabled={savingProfile || !isDirty}>
                {savingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {savingProfile ? "Saving…" : "Save changes"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
