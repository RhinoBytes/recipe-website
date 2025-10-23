/**
 * Email validation utility
 * Uses a simple but safe validation approach that avoids ReDoS vulnerabilities
 * @param email - Email address to validate
 * @returns true if email is valid, false otherwise
 */
export function isValidEmail(email: string): boolean {
  // Safe email validation without regex to avoid ReDoS
  if (!email || typeof email !== 'string') return false;
  
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf('@');
  
  // Must have exactly one @ symbol
  if (atIndex === -1 || atIndex !== trimmed.lastIndexOf('@')) {
    return false;
  }
  
  // Check basic structure: something@something.something
  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);
  
  if (localPart.length === 0 || domainPart.length < 3) {
    return false;
  }
  
  const dotIndex = domainPart.indexOf('.');
  if (dotIndex === -1 || dotIndex === 0 || dotIndex === domainPart.length - 1) {
    return false;
  }
  
  // No spaces allowed
  if (trimmed.includes(' ')) {
    return false;
  }
  
  return true;
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
