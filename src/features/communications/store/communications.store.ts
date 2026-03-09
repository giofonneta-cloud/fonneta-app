'use client';

import { create } from 'zustand';
import type { Server, Channel, Message, ServerMember, UserProfile } from '../types';

interface CommunicationsState {
  // User
  currentUser: UserProfile | null;

  // Servers
  servers: Server[];
  currentServerId: string | null;

  // Channels
  channels: Channel[];
  currentChannelId: string | null;

  // Messages
  messages: Message[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;
  messageCursor: string | null;

  // Members
  members: ServerMember[];

  // UI State
  isSidebarOpen: boolean;
  isMemberListOpen: boolean;

  // Actions - User
  setCurrentUser: (user: UserProfile | null) => void;

  // Actions - Servers
  setServers: (servers: Server[]) => void;
  setCurrentServer: (serverId: string | null) => void;
  addServer: (server: Server) => void;
  updateServer: (serverId: string, updates: Partial<Server>) => void;
  removeServer: (serverId: string) => void;

  // Actions - Channels
  setChannels: (channels: Channel[]) => void;
  setCurrentChannel: (channelId: string | null) => void;
  addChannel: (channel: Channel) => void;
  updateChannel: (channelId: string, updates: Partial<Channel>) => void;
  removeChannel: (channelId: string) => void;

  // Actions - Messages
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  removeMessage: (messageId: string) => void;
  prependMessages: (messages: Message[]) => void;
  setLoadingMessages: (loading: boolean) => void;
  setMessageCursor: (cursor: string | null) => void;

  // Actions - Members
  setMembers: (members: ServerMember[]) => void;
  updateMemberStatus: (userId: string, status: string) => void;

  // Actions - UI
  toggleSidebar: () => void;
  toggleMemberList: () => void;

  // Reset
  reset: () => void;
}

const initialState = {
  currentUser: null,
  servers: [],
  currentServerId: null,
  channels: [],
  currentChannelId: null,
  messages: [],
  isLoadingMessages: false,
  hasMoreMessages: true,
  messageCursor: null,
  members: [],
  isSidebarOpen: true,
  isMemberListOpen: true,
};

export const useCommunicationsStore = create<CommunicationsState>((set) => ({
  ...initialState,

  // User
  setCurrentUser: (user) => set({ currentUser: user }),

  // Servers
  setServers: (servers) => set({ servers }),
  setCurrentServer: (serverId) => set({
    currentServerId: serverId,
    currentChannelId: null,
    channels: [],
    messages: [],
    members: [],
    messageCursor: null
  }),
  addServer: (server) => set((state) => ({
    servers: [...state.servers, server]
  })),
  updateServer: (serverId, updates) => set((state) => ({
    servers: state.servers.map((s) =>
      s.id === serverId ? { ...s, ...updates } : s
    )
  })),
  removeServer: (serverId) => set((state) => ({
    servers: state.servers.filter((s) => s.id !== serverId),
    currentServerId: state.currentServerId === serverId ? null : state.currentServerId
  })),

  // Channels
  setChannels: (channels) => set({ channels }),
  setCurrentChannel: (channelId) => set({
    currentChannelId: channelId,
    messages: [],
    messageCursor: null,
    hasMoreMessages: true
  }),
  addChannel: (channel) => set((state) => ({
    channels: [...state.channels, channel]
  })),
  updateChannel: (channelId, updates) => set((state) => ({
    channels: state.channels.map((c) =>
      c.id === channelId ? { ...c, ...updates } : c
    )
  })),
  removeChannel: (channelId) => set((state) => ({
    channels: state.channels.filter((c) => c.id !== channelId),
    currentChannelId: state.currentChannelId === channelId ? null : state.currentChannelId
  })),

  // Messages
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  updateMessage: (messageId, updates) => set((state) => ({
    messages: state.messages.map((m) =>
      m.id === messageId ? { ...m, ...updates } : m
    )
  })),
  removeMessage: (messageId) => set((state) => ({
    messages: state.messages.filter((m) => m.id !== messageId)
  })),
  prependMessages: (messages) => set((state) => ({
    messages: [...messages, ...state.messages]
  })),
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  setMessageCursor: (cursor) => set({
    messageCursor: cursor,
    hasMoreMessages: cursor !== null
  }),

  // Members
  setMembers: (members) => set({ members }),
  updateMemberStatus: (userId, status) => set((state) => ({
    members: state.members.map((m) =>
      m.user_id === userId
        ? { ...m, user_profile: m.user_profile ? { ...m.user_profile, status: status as 'online' | 'offline' | 'idle' | 'dnd' } : m.user_profile }
        : m
    )
  })),

  // UI
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMemberList: () => set((state) => ({ isMemberListOpen: !state.isMemberListOpen })),

  // Reset
  reset: () => set(initialState),
}));
