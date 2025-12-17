
import React from 'react';

interface UserMenuProps {
  name?: string;
  plan?: string;
  initials?: string;
}

export function UserMenu({ name = 'John Doe', plan = 'Free Plan', initials = 'JD' }: UserMenuProps) {
  return (
    <div className="flex gap-4 items-center">
      <div className="text-right">
        <div className="text-[13px] font-medium">{name}</div>
        <div className="text-[11px] text-[var(--text-secondary)]">{plan}</div>
      </div>
      <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-page)] bg-[var(--accent-primary)] flex items-center justify-center text-xs text-white">
        {initials}
      </div>
    </div>
  );
}
