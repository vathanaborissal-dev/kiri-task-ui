'use client';

import { Check, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

const RULES = [
  { label: 'At least 10 characters', test: (v: string) => v.length >= 10 },
  { label: 'Contains a letter', test: (v: string) => /[A-Za-z]/.test(v) },
  { label: 'Contains a number', test: (v: string) => /\d/.test(v) },
];

export function PasswordRules({ value }: { value: string }) {
  return (
    <ul className="mt-1 space-y-1">
      {RULES.map((rule) => {
        const passed = rule.test(value);
        return (
          <li
            key={rule.label}
            className={cn(
              'flex items-center gap-1.5 text-xs',
              passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground',
            )}
          >
            {passed ? (
              <Check className="size-3.5" aria-hidden />
            ) : (
              <Circle className="size-3.5" aria-hidden />
            )}
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
