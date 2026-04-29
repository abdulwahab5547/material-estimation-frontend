import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export const registerFormSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters").max(80),
    companyName: z.string().max(120).optional(),
    email: z.string().email("Enter a valid email"),
    password: z.string().min(8, "At least 8 characters"),
    confirmPassword: z.string().min(8),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type LoginFormValues = z.infer<typeof loginFormSchema>;
export type RegisterFormValues = z.infer<typeof registerFormSchema>;

export const profileFormSchema = z.object({
  displayName: z.string().min(2).max(80),
  companyName: z.string().max(120),
  currency: z.string().min(1).max(8),
  defaultWastagePct: z.coerce.number().min(0).max(50),
  defaultMixRatio: z.enum(["1:3", "1:4", "1:5", "1:6"]),
  defaultBrickPreset: z.enum(["Standard", "Modular", "Engineering"]),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "At least 8 characters"),
    confirmNewPassword: z.string().min(8),
  })
  .refine((d) => d.newPassword === d.confirmNewPassword, {
    path: ["confirmNewPassword"],
    message: "Passwords do not match",
  });

export type PasswordFormValues = z.infer<typeof passwordFormSchema>;
