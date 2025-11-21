// Password validation utility

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface PasswordRequirement {
  label: string;
  isSatisfied: boolean;
}

export function validatePassword(
  password: string,
  username?: string,
  email?: string
): PasswordValidationResult {
  const errors: string[] = [];

  // Check minimum length (6 characters)
  if (password.length < 6) {
    errors.push("Password must be at least 6 characters long");
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check for at least one number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for at least one special character
  if (!/[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?!~`]/.test(password)) {
    errors.push("Password must contain at least one special character (@, #, $, etc.)");
  }

  // Check if password is different from username
  if (username && password.toLowerCase() === username.toLowerCase()) {
    errors.push("Password cannot be the same as username");
  }

  // Check if password is different from email
  if (email && password.toLowerCase() === email.toLowerCase()) {
    errors.push("Password cannot be the same as email");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function getPasswordRequirements(): string[] {
  return [
    "At least 6 characters long",
    "At least one uppercase letter",
    "At least one number",
    "At least one special character (@, #, $, etc.)",
    "Different from username and email",
  ];
}

export function checkPasswordRequirements(
  password: string,
  username?: string,
  email?: string
): PasswordRequirement[] {
  return [
    {
      label: "At least 6 characters",
      isSatisfied: password.length >= 6,
    },
    {
      label: "One uppercase letter",
      isSatisfied: /[A-Z]/.test(password),
    },
    {
      label: "One number",
      isSatisfied: /\d/.test(password),
    },
    {
      label: "One special character (@, #, $, etc.)",
      isSatisfied: /[@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?!~`]/.test(password),
    },
    {
      label: "Different from username/email",
      isSatisfied: 
        (!username || password.toLowerCase() !== username.toLowerCase()) &&
        (!email || password.toLowerCase() !== email.toLowerCase()),
    },
  ];
}
