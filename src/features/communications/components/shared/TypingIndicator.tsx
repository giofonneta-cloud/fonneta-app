'use client';

interface TypingIndicatorProps {
  users: { user_id: string; username: string }[];
}

export function TypingIndicator({ users }: TypingIndicatorProps) {
  if (users.length === 0) return null;

  const text =
    users.length === 1
      ? `${users[0].username} esta escribiendo...`
      : users.length === 2
        ? `${users[0].username} y ${users[1].username} estan escribiendo...`
        : `${users.length} personas estan escribiendo...`;

  return (
    <div className="h-6 flex items-center gap-2 text-xs text-gray-400 px-4">
      <span className="flex gap-0.5">
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '150ms' }}
        />
        <span
          className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: '300ms' }}
        />
      </span>
      <span>{text}</span>
    </div>
  );
}
