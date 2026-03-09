export interface Permission {
  manage_channels?: boolean;
  manage_roles?: boolean;
  manage_members?: boolean;
  send_messages?: boolean;
  manage_messages?: boolean;
  mention_everyone?: boolean;
}

export interface Role {
  id: string;
  server_id: string;
  name: string;
  color: string;
  permissions: Permission;
  position: number;
  created_at: string;
}
