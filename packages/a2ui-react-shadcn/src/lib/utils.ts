import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn standard class-name combiner. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** First failing check message, or null when checks are absent/valid.
 *  Core resolves `checks` into `CheckResult[]`; Views surface the first
 *  non-empty failing message below the control. */
export function firstErrorMessage(
  checks: { valid: boolean; message: string }[] | undefined,
): string | null {
  return checks?.find((c) => !c.valid && c.message)?.message ?? null;
}
