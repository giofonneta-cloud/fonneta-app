import { useState } from 'react';
import type { ProjectComment } from '../types/task.types';

interface ProjectCommentsProps {
  comments: ProjectComment[];
  loading: boolean;
  onAddComment: (comment: string) => Promise<void>;
  onDeleteComment: (id: string) => Promise<void>;
}

/**
 * Project Comments Component
 * Displays comments thread for a project
 */
export function ProjectComments({
  comments,
  loading,
  onAddComment,
  onDeleteComment,
}: ProjectCommentsProps) {
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await onAddComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Error al agregar el comentario. Por favor intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comentario?')) {
      return;
    }

    try {
      await onDeleteComment(id);
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Error al eliminar el comentario. Por favor intenta de nuevo.');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-lg font-semibold text-gray-900">
        Comentarios ({comments.length})
      </h3>

      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={submitting}
          rows={3}
          placeholder="Escribe un comentario..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? 'Enviando...' : 'Comentar'}
          </button>
        </div>
      </form>

      {/* Comments List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-gray-600">No hay comentarios aún</p>
          <p className="text-sm text-gray-500 mt-1">Sé el primero en comentar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onDelete={() => handleDelete(comment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface CommentItemProps {
  comment: ProjectComment;
  onDelete: () => void;
}

function CommentItem({ comment, onDelete }: CommentItemProps) {
  const formattedDate = new Date(comment.created_at).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-medium text-sm">
              {comment.user_name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {comment.user_name || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500">{formattedDate}</p>
            </div>
          </div>

          {/* Comment Text */}
          <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
            {comment.comment}
          </p>
        </div>

        {/* Delete Button (visible on hover) */}
        <button
          onClick={onDelete}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 text-gray-400 hover:text-red-600 transition-all"
          title="Eliminar comentario"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
