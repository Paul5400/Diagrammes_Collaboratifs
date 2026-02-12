import React from 'react';
import Link from 'next/link';

interface UserMenuProps {
  name?: string;
  plan?: string;
  initials?: string;
  avatarUrl?: string | null;
}

export function UserMenu({
  name = 'John Doe',
  plan = 'Free Plan',
  initials = 'JD',
  avatarUrl,
}: UserMenuProps) {
  return (
    <Link
      href="/profile"
      className="flex gap-4 items-center hover:opacity-80 transition-opacity cursor-pointer group"
    >
      <div className="text-right">
        <div className="text-[13px] font-medium group-hover:text-[var(--accent-primary)] transition-colors">
          {name}
        </div>
        <div className="text-[11px] text-[var(--text-secondary)]">{plan}</div>
      </div>
      <div className="w-8 h-8 rounded-full border-2 border-[var(--bg-page)] bg-[var(--accent-primary)] flex items-center justify-center text-xs text-white overflow-hidden">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          initials
        )}
      </div>
    </Link>
  );
}
