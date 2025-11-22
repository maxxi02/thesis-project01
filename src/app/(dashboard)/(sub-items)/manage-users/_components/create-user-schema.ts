import z from "zod";

export const createUserSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "First name can only contain letters, spaces, hyphens, and apostrophes"
      ),
    middleName: z
      .string()
      .max(50, "Middle name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z\s'-]*$/,
        "Middle name can only contain letters, spaces, hyphens, and apostrophes"
      )
      .optional()
      .or(z.literal("")),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name cannot exceed 50 characters")
      .regex(
        /^[a-zA-Z\s'-]+$/,
        "Last name can only contain letters, spaces, hyphens, and apostrophes"
      ),
    email: z
      .string()
      .email("Please enter a valid email address")
      .max(100, "Email cannot exceed 100 characters")
      .toLowerCase()
      .refine(
        (email) => {
          // Check for valid email format with proper domain
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          return emailRegex.test(email);
        },
        { message: "Please enter a valid email address with a proper domain" }
      ),
    role: z.enum(["admin", "cashier", "delivery", "user"]),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .max(100, "Password cannot exceed 100 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number")
      .regex(
        /[^A-Za-z0-9]/,
        "Password must contain at least one special character"
      ),
    confirmPassword: z
      .string()
      .min(8, "Password must be at least 8 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  })
  .refine(
    (data) => {
      // Check that full name doesn't exceed reasonable length
      const fullName = [data.firstName, data.middleName, data.lastName]
        .filter(Boolean)
        .join(" ");
      return fullName.length <= 150;
    },
    {
      message: "Full name is too long (max 150 characters)",
      path: ["lastName"],
    }
  );
