'use client';

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { MessageWithAuthor } from '../../types';
import { Avatar } from '../shared';

interface MessageItemProps {
  message: MessageWithAuthor;
  isGrouped?: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  isOwn?: boolean;
}

export function MessageItem({
  message,
  isGrouped = false,
  onEdit,
  onDelete,
  isOwn = false
}: MessageItemProps) {
  const profile = message.user_profile;

  if (message.is_deleted) {
    return (
      <div className={`px-4 py-1 ${isGrouped ? '' : 'mt-4'}`}>
        <div className={`${isGrouped ? 'pl-14' : 'flex items-start gap-4'}`}>
          {!isGrouped && <div className="w-10 h-10" />}
          <p className="text-gray-500 italic text-sm">Mensaje eliminado</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`group hover:bg-white/5 px-4 py-0.5 ${isGrouped ? '' : 'mt-4'}`}>
      {!isGrouped ? (
        <div className="flex items-start gap-4">
          <Avatar
            src={profile?.avatar_url}
            fallback={profile?.username?.[0] || '?'}
            status={profile?.status}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-white hover:underline cursor-pointer">
                {profile?.display_name || profile?.username}
              </span>
              <span className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(message.created_at), {
                  addSuffix: true,
                  locale: es
                })}
              </span>
              {message.is_edited && (
                <span className="text-xs text-gray-600">(editado)</span>
              )}
            </div>
            <MessageContent content={message.content} />
          </div>
          <MessageActions
            isOwn={isOwn}
            onEdit={onEdit ? () => onEdit(message.id) : undefined}
            onDelete={onDelete ? () => onDelete(message.id) : undefined}
          />
        </div>
      ) : (
        <div className="pl-14 flex items-center gap-2">
          <span className="opacity-0 group-hover:opacity-100 text-xs text-gray-500 w-10 text-right flex-shrink-0">
            {new Date(message.created_at).toLocaleTimeString('es', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <div className="flex-1">
            <MessageContent content={message.content} />
          </div>
          <MessageActions
            isOwn={isOwn}
            onEdit={onEdit ? () => onEdit(message.id) : undefined}
            onDelete={onDelete ? () => onDelete(message.id) : undefined}
          />
        </div>
      )}
    </div>
  );
}

function MessageContent({ content }: { content: string }) {
  return <p className="text-gray-300 break-words whitespace-pre-wrap">{content}</p>;
}

function MessageActions({
  isOwn,
  onEdit,
  onDelete
}: {
  isOwn: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  if (!isOwn) return null;

  return (
    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-gray-800 rounded border border-gray-700 shadow-lg">
      {onEdit && (
        <button
          onClick={onEdit}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="Editar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
      )}
      {onDelete && (
        <button
          onClick={onDelete}
          className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
          title="Eliminar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}
