/** Валидация телефона и пароля для форм */

export function isValidRuPhone(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return true;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length !== 11) return false;
  const normalized = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  return /^7[489]\d{9}$/.test(normalized);
}

export function normalizeRuPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const n = digits.startsWith("8") ? `7${digits.slice(1)}` : digits;
  if (n.length !== 11) return input.trim();
  return `+7 ${n.slice(1, 4)} ${n.slice(4, 7)}-${n.slice(7, 9)}-${n.slice(9, 11)}`;
}

export type PasswordStrength = {
  score: number;
  label: string;
  checks: {
    length: boolean;
    letter: boolean;
    digit: boolean;
    special: boolean;
  };
};

export function getPasswordStrength(password: string): PasswordStrength {
  const checks = {
    length: password.length >= 8,
    letter: /[a-zA-Zа-яА-Я]/.test(password),
    digit: /\d/.test(password),
    special: /[^a-zA-Zа-яА-Я0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const labels = ["Слабый", "Средний", "Хороший", "Надёжный"];
  return {
    score,
    label: labels[Math.max(0, score - 1)] ?? "Слабый",
    checks,
  };
}

export function isPasswordStrongEnough(password: string): boolean {
  const s = getPasswordStrength(password);
  return s.checks.length && s.checks.letter && s.checks.digit;
}
