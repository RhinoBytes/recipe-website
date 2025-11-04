import { z } from "zod";

// --- SCHEMAS ---

export const usernameSchema = z
  .string()
  .min(3, { message: "Username must be at least 3 characters." })
  .max(30, { message: "Username must be 30 characters or less." })
  .regex(/^[a-zA-Z0-9_-]+$/, {
    message: "Can only contain letters, numbers, underscores, and hyphens.",
  })
  .regex(/^[a-zA-Z0-9]/, { message: "Must start with a letter or number." })
  .regex(/[a-zA-Z0-9]$/, { message: "Must end with a letter or number." });

export const emailSchema = z
  .string()
  .email({ message: "Please enter a valid email address." });

export const passwordSchema = z
  .string()
  .min(8, "be at least 8 characters long")
  .refine((val) => /[A-Z]/.test(val), "contain at least one uppercase letter")
  .refine((val) => /[a-z]/.test(val), "contain at least one lowercase letter")
  .refine((val) => /\d/.test(val), "contain at least one number")
  .refine((val) => /[\W_]/.test(val), "contain at least one special character");

// --- UI HELPERS FOR PASSWORD REQUIREMENTS ---

const passwordRequirements = {
  "be at least 8 characters long": (p: string) => p.length >= 8,
  "contain at least one uppercase letter": (p: string) => /[A-Z]/.test(p),
  "contain at least one lowercase letter": (p: string) => /[a-z]/.test(p),
  "contain at least one number": (p: string) => /\d/.test(p),
  "contain at least one special character": (p: string) => /[\W_]/.test(p),
};

/**
 * Generates a list of password requirement strings for the UI.
 * This is used to display the list of rules to the user.
 * @param _password - The current password input (not used, but keeps signature consistent).
 * @returns An array of all password requirement rule descriptions.
 */
export function getPasswordErrors(_password: string): string[] {
  return Object.keys(passwordRequirements).map(
    (rule) => rule.charAt(0).toUpperCase() + rule.slice(1)
  );
}

/**
 * Checks if a specific password requirement is met.
 * This is used for dynamically styling the requirements list (e.g., line-through).
 * @param requirement The validation rule text.
 * @param password The current password string.
 * @returns boolean indicating if the requirement is met.
 */
export const isRequirementMet = (
  requirement: string,
  password: string
): boolean => {
  if (password.length === 0) return false;
  const cleanRequirement = requirement.toLowerCase();

  const checkFunction = (
    passwordRequirements as Record<string, (p: string) => boolean>
  )[cleanRequirement];
  return checkFunction ? checkFunction(password) : false;
};

// --- FORM VALIDATION ---

/**
 * Validates the entire authentication form using Zod schemas.
 * @param email - Email address to validate.
 * @param password - Password to validate.
 * @param username - Username to validate (optional, for registration).
 * @param isRegistration - Determines which validation schema to apply.
 * @returns An object containing field-specific error messages.
 */
export function validateAuthForm(
  email: string,
  password: string,
  username?: string,
  isRegistration?: boolean
): Record<string, string> {
  const errors: Record<string, string> = {};

  const loginSchema = z.object({
    email: emailSchema,
    password: z.string().min(1, { message: "Password is required." }),
  });

  const registrationSchema = z.object({
    email: emailSchema,
    password: passwordSchema,
    username: usernameSchema,
  });

  const result = isRegistration
    ? registrationSchema.safeParse({ email, password, username })
    : loginSchema.safeParse({ email, password });

  if (!result.success) {
    for (const issue of result.error.issues) {
      const field = issue.path[0] as string;
      if (!errors[field]) {
        errors[field] = issue.message;
      }
    }
  }

  return errors;
}

// --- GENERAL UTILITIES ---

/**
 * Sanitize user input by removing potentially harmful characters like angle brackets.
 * @param input - User input to sanitize.
 * @returns Sanitized string.
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== "string") return "";
  return input.trim().replace(/[<>]/g, "");
}

/**
 * A simple utility to conditionally combine CSS class names.
 * Filters out any falsy values.
 * @param classes - An array of class names.
 * @returns A single string of combined class names.
 */
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
