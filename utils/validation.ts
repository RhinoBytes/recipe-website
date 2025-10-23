/**
 * Email validation utility
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^\S+@\S+\.\S+$/;
  return emailRegex.test(email);
}

/**
 * Password validation utility
 * @param password - Password to validate
 * @param minLength - Minimum password length (default: 8)
 * @returns true if password is valid, false otherwise
 */
export function isValidPassword(password: string, minLength = 8): boolean {
  return password.length >= minLength;
}

/**
 * Validate email and password
 * @param email - Email address to validate
 * @param password - Password to validate
 * @returns Object with validation errors
 */
export function validateAuthForm(
  email: string,
  password: string
): Record<string, string> {
  const errors: Record<string, string> = {};

  // Email validation
  if (!email) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(email)) {
    errors.email = "Please enter a valid email address.";
  }

  // Password validation
  if (!password) {
    errors.password = "Password is required.";
  } else if (!isValidPassword(password)) {
    errors.password = "Password must be at least 8 characters.";
  }

  return errors;
}

/**
 * Sanitize user input by removing potentially harmful characters
 * @param input - User input to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, "");
}

/**
 * Utility to combine CSS class names
 * @param classes - Array of class names
 * @returns Combined class string
 */
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
