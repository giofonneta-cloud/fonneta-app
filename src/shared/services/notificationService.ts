import { supabase } from "@/shared/lib/supabase";

export type NotificationType =
  | "invoice_update"
  | "document_upload"
  | "system_alert"
  | "invoice_received";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  created_at: string;
}

export type CreateNotificationInput = Omit<
  Notification,
  "id" | "created_at" | "read"
>;

export const notificationService = {
  /**
   * Get recent notifications for a user
   */
  async getNotifications(userId: string, limit = 20) {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data as Notification[];
  },

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(id: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);

    if (error) throw error;
  },

  /**
   * Create a notification (Usually called from server/admin context, but useful for testing)
   */
  async createNotification(input: CreateNotificationInput) {
    const { data, error } = await supabase
      .from("notifications")
      .insert([{ ...input, read: false }])
      .select()
      .single();

    if (error) throw error;
    return data as Notification;
  },
};
