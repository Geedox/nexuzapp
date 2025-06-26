export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chat_rooms: {
        Row: {
          id: string
          name: string
          description: string | null
          avatar_emoji: string
          avatar_color: string
          is_private: boolean | null
          game_id: string | null
          creator_id: string
          participant_count: number | null
          last_message_at: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          avatar_emoji: string
          avatar_color: string
          is_private?: boolean | null
          game_id?: string | null
          creator_id: string
          participant_count?: number | null
          last_message_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          avatar_emoji?: string
          avatar_color?: string
          is_private?: boolean | null
          game_id?: string | null
          creator_id?: string
          participant_count?: number | null
          last_message_at?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_rooms_game_id"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_rooms_creator_id"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          room_id: string
          user_id: string
          role: string | null
          joined_at: string | null
          last_read_at: string | null
        }
        Insert: {
          id?: string
          room_id: string
          user_id: string
          role?: string | null
          joined_at?: string | null
          last_read_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string
          user_id?: string
          role?: string | null
          joined_at?: string | null
          last_read_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_room_members_room_id"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_room_members_user_id"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      chat_messages: {
        Row: {
          id: string
          room_id: string | null
          sender_id: string
          receiver_id: string | null
          content: string
          message_type: string | null
          reply_to_id: string | null
          edited_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          room_id?: string | null
          sender_id: string
          receiver_id?: string | null
          content: string
          message_type?: string | null
          reply_to_id?: string | null
          edited_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          room_id?: string | null
          sender_id?: string
          receiver_id?: string | null
          content?: string
          message_type?: string | null
          reply_to_id?: string | null
          edited_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_messages_room_id"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_sender_id"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_receiver_id"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_messages_reply_to_id"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          }
        ]
      }
      email_queue: {
        Row: {
          created_at: string | null
          email_type: string
          error_message: string | null
          id: string
          recipient_email: string
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          subject: string
          template_data: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email_type: string
          error_message?: string | null
          id?: string
          recipient_email: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject: string
          template_data?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email_type?: string
          error_message?: string | null
          id?: string
          recipient_email?: string
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          subject?: string
          template_data?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      friends: {
        Row: {
          addressee_id: string | null
          created_at: string | null
          id: string
          requester_id: string | null
          status: Database["public"]["Enums"]["friend_status"] | null
          updated_at: string | null
        }
        Insert: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: Database["public"]["Enums"]["friend_status"] | null
          updated_at?: string | null
        }
        Update: {
          addressee_id?: string | null
          created_at?: string | null
          id?: string
          requester_id?: string | null
          status?: Database["public"]["Enums"]["friend_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "friends_addressee_id_fkey"
            columns: ["addressee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friends_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"] | null
          current_players: number | null
          entry_fee: number
          finished_at: string | null
          game_id: string | null
          host_id: string | null
          id: string
          is_private: boolean | null
          max_players: number
          name: string
          room_code: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["game_status"] | null
        }
        Insert: {
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          current_players?: number | null
          entry_fee: number
          finished_at?: string | null
          game_id?: string | null
          host_id?: string | null
          id?: string
          is_private?: boolean | null
          max_players: number
          name: string
          room_code?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
        }
        Update: {
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"] | null
          current_players?: number | null
          entry_fee?: number
          finished_at?: string | null
          game_id?: string | null
          host_id?: string | null
          id?: string
          is_private?: boolean | null
          max_players?: number
          name?: string
          room_code?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["game_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rooms_host_id_fkey"
            columns: ["host_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          created_at: string | null
          description: string | null
          entry_fee_max: number | null
          entry_fee_min: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          max_players: number | null
          min_players: number | null
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          entry_fee_max?: number | null
          entry_fee_min?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_players?: number | null
          min_players?: number | null
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          entry_fee_max?: number | null
          entry_fee_min?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          max_players?: number | null
          min_players?: number | null
          name?: string
        }
        Relationships: []
      }
      leaderboards: {
        Row: {
          created_at: string | null
          game_id: string | null
          games_played: number | null
          id: string
          period: string | null
          rank: number | null
          total_earnings: number | null
          total_score: number | null
          updated_at: string | null
          user_id: string | null
          wins: number | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          games_played?: number | null
          id?: string
          period?: string | null
          rank?: number | null
          total_earnings?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          wins?: number | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          games_played?: number | null
          id?: string
          period?: string | null
          rank?: number | null
          total_earnings?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          wins?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "leaderboards_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leaderboards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          current_win_streak: number | null
          display_name: string | null
          email_verified: boolean | null
          experience_points: number | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          level: number | null
          longest_win_streak: number | null
          total_earnings: number | null
          total_games_played: number | null
          total_wins: number | null
          updated_at: string | null
          username: string
          current_rank: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          current_win_streak?: number | null
          display_name?: string | null
          email_verified?: boolean | null
          experience_points?: number | null
          id: string
          is_online?: boolean | null
          last_seen?: string | null
          level?: number | null
          longest_win_streak?: number | null
          total_earnings?: number | null
          total_games_played?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username: string
          current_rank?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          current_win_streak?: number | null
          display_name?: string | null
          email_verified?: boolean | null
          experience_points?: number | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          level?: number | null
          longest_win_streak?: number | null
          total_earnings?: number | null
          total_games_played?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username?: string
          current_rank?: string | null
        }
        Relationships: []
      }
      room_participants: {
        Row: {
          earnings: number | null
          id: string
          joined_at: string | null
          player_id: string | null
          position: number | null
          room_id: string | null
          score: number | null
        }
        Insert: {
          earnings?: number | null
          id?: string
          joined_at?: string | null
          player_id?: string | null
          position?: number | null
          room_id?: string | null
          score?: number | null
        }
        Update: {
          earnings?: number | null
          id?: string
          joined_at?: string | null
          player_id?: string | null
          position?: number | null
          room_id?: string | null
          score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "room_participants_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          description: string | null
          id: string
          room_id: string | null
          status: string | null
          transaction_hash: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          id?: string
          room_id?: string | null
          status?: string | null
          transaction_hash?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          description?: string | null
          id?: string
          room_id?: string | null
          status?: string | null
          transaction_hash?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          created_at: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          id: string
          is_connected: boolean | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          id?: string
          is_connected?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          id?: string
          is_connected?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      currency_type: "USDC" | "USDT" | "NGN" | "ETH" | "BTC"
      friend_status: "pending" | "accepted" | "declined" | "blocked"
      game_status: "active" | "waiting" | "full" | "starting" | "finished"
      notification_type:
        | "friend_request"
        | "game_invite"
        | "room_start"
        | "payment"
        | "wallet_connect"
        | "achievement"
      transaction_type: "win" | "loss" | "deposit" | "withdrawal" | "fee"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Additional type definitions for chat functionality
export type ChatRoom = Tables<'chat_rooms'> & {
  creator?: Tables<'profiles'>
  game?: Tables<'games'>
  members?: Array<Tables<'chat_room_members'> & { user: Tables<'profiles'> }>
  last_message?: Tables<'chat_messages'>
}

export type ChatMessage = Tables<'chat_messages'> & {
  sender: Tables<'profiles'>
  receiver?: Tables<'profiles'>
  reply_to?: Tables<'chat_messages'> & { sender: Tables<'profiles'> }
}

export type Friend = Tables<'friends'> & {
  requester: Tables<'profiles'>
  addressee: Tables<'profiles'>
}

export const Constants = {
  public: {
    Enums: {
      currency_type: ["USDC", "USDT", "NGN", "ETH", "BTC"],
      friend_status: ["pending", "accepted", "declined", "blocked"],
      game_status: ["active", "waiting", "full", "starting", "finished"],
      notification_type: [
        "friend_request",
        "game_invite",
        "room_start",
        "payment",
        "wallet_connect",
        "achievement",
      ],
      transaction_type: ["win", "loss", "deposit", "withdrawal", "fee"],
    },
  },
} as const

// Gaming avatars for chat rooms
export const GAMING_AVATARS = [
  { id: 1, name: 'Cyber Warrior', emoji: '🤖', color: 'from-purple-500 to-pink-500' },
  { id: 2, name: 'Space Pilot', emoji: '🚀', color: 'from-blue-500 to-cyan-500' },
  { id: 3, name: 'Dragon Master', emoji: '🐉', color: 'from-red-500 to-orange-500' },
  { id: 4, name: 'Neon Ninja', emoji: '🥷', color: 'from-green-500 to-emerald-500' },
  { id: 5, name: 'Crypto King', emoji: '👑', color: 'from-yellow-500 to-amber-500' },
  { id: 6, name: 'Alien Hunter', emoji: '👽', color: 'from-indigo-500 to-purple-500' },
  { id: 7, name: 'Mech Pilot', emoji: '🎮', color: 'from-gray-600 to-gray-800' },
  { id: 8, name: 'Phoenix Rider', emoji: '🔥', color: 'from-orange-500 to-red-500' },
  { id: 9, name: 'Ice Mage', emoji: '❄️', color: 'from-cyan-500 to-blue-500' },
  { id: 10, name: 'Thunder God', emoji: '⚡', color: 'from-yellow-400 to-orange-500' },
] as const