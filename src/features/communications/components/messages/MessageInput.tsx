'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { useMessages, useTypingIndicator, useChannels } from '../../hooks';
import { TypingIndicator } from '../shared';

export function MessageInput() {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { currentChannel, currentChannelId } = useChannels();
  const { sendMessage } = useMessages(currentChannelId);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(currentChannelId);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await sendMessage(content.trim());
      setContent('');
      await stopTyping();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [content, isSubmitting, sendMessage, stopTyping]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    startTyping();
  };

  return (
    <div className="px-4 pb-6 flex-shrink-0">
      <TypingIndicator users={typingUsers} />

      <div className="relative bg-gray-700/50 backdrop-blur-xl rounded-lg border border-white/10">
        {/* Attachment button */}
        <button className="absolute left-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>

        {/* Input */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={`Enviar mensaje a #${currentChannel?.name || 'canal'}`}
          className="w-full bg-transparent text-white placeholder-gray-500 pl-12 pr-12 py-3 resize-none focus:outline-none max-h-48"
          rows={1}
          disabled={isSubmitting}
        />

        {/* Send button */}
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
          </svg>
        </button>
      </div>

      {/* Helper text */}
      <p className="text-xs text-gray-500 mt-1 px-1">
        Presiona <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">Enter</kbd> para enviar,{' '}
        <kbd className="px-1 py-0.5 bg-gray-800 rounded text-gray-400">Shift + Enter</kbd> para nueva linea
      </p>
    </div>
  );
}
