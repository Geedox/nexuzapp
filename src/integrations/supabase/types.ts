export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          edited_at: string | null
          id: string
          message_type: string | null
          receiver_id: string | null
          reply_to_id: string | null
          room_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          receiver_id?: string | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          message_type?: string | null
          receiver_id?: string | null
          reply_to_id?: string | null
          room_id?: string | null
          sender_id?: string
        }
        Relationships: [
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
          },
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
        ]
      }
      chat_room_members: {
        Row: {
          id: string
          joined_at: string | null
          last_read_at: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
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
          },
        ]
      }
      chat_rooms: {
        Row: {
          avatar_color: string
          avatar_emoji: string
          created_at: string | null
          creator_id: string
          description: string | null
          game_id: string | null
          id: string
          is_private: boolean | null
          last_message_at: string | null
          name: string
          participant_count: number | null
          updated_at: string | null
        }
        Insert: {
          avatar_color: string
          avatar_emoji: string
          created_at?: string | null
          creator_id: string
          description?: string | null
          game_id?: string | null
          id?: string
          is_private?: boolean | null
          last_message_at?: string | null
          name: string
          participant_count?: number | null
          updated_at?: string | null
        }
        Update: {
          avatar_color?: string
          avatar_emoji?: string
          created_at?: string | null
          creator_id?: string
          description?: string | null
          game_id?: string | null
          id?: string
          is_private?: boolean | null
          last_message_at?: string | null
          name?: string
          participant_count?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_chat_rooms_creator_id"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_chat_rooms_game_id"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
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
      game_instances: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          instance_data: Json | null
          room_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          instance_data?: Json | null
          room_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          instance_data?: Json | null
          room_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_game_instance_room"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_instances_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      game_results: {
        Row: {
          created_at: string | null
          currency: string | null
          id: string
          player_id: string | null
          position: number | null
          prize_amount: number | null
          room_id: string | null
          score: number | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          id?: string
          player_id?: string | null
          position?: number | null
          prize_amount?: number | null
          room_id?: string | null
          score?: number | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          id?: string
          player_id?: string | null
          position?: number | null
          prize_amount?: number | null
          room_id?: string | null
          score?: number | null
        }
        Relationships: []
      }
      game_room_participants: {
        Row: {
          earnings: number | null
          entry_transaction_id: string | null
          final_position: number | null
          id: string
          is_active: boolean | null
          joined_at: string | null
          left_at: string | null
          payment_amount: number
          payment_currency: Database["public"]["Enums"]["currency_type"]
          payout_transaction_id: string | null
          room_id: string | null
          score: number | null
          user_id: string | null
          wallet_id: string | null
        }
        Insert: {
          earnings?: number | null
          entry_transaction_id?: string | null
          final_position?: number | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          payment_amount: number
          payment_currency: Database["public"]["Enums"]["currency_type"]
          payout_transaction_id?: string | null
          room_id?: string | null
          score?: number | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          earnings?: number | null
          entry_transaction_id?: string | null
          final_position?: number | null
          id?: string
          is_active?: boolean | null
          joined_at?: string | null
          left_at?: string | null
          payment_amount?: number
          payment_currency?: Database["public"]["Enums"]["currency_type"]
          payout_transaction_id?: string | null
          room_id?: string | null
          score?: number | null
          user_id?: string | null
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_room_participants_entry_transaction_id_fkey"
            columns: ["entry_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_room_participants_payout_transaction_id_fkey"
            columns: ["payout_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_room_participants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_room_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_room_participants_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      game_room_winners: {
        Row: {
          created_at: string | null
          id: string
          participant_id: string | null
          position: number
          prize_amount: number
          prize_percentage: number
          room_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          participant_id?: string | null
          position: number
          prize_amount: number
          prize_percentage: number
          room_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          participant_id?: string | null
          position?: number
          prize_amount?: number
          prize_percentage?: number
          room_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_room_winners_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "game_room_participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_room_winners_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "game_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      game_rooms: {
        Row: {
          actual_end_time: string | null
          actual_start_time: string | null
          admin_has_approved: boolean | null
          created_at: string | null
          creator_id: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          current_players: number | null
          end_time: string
          entry_fee: number
          game_id: string | null
          game_instance_id: string | null
          game_name: string | null
          id: string
          is_private: boolean | null
          is_special: boolean | null
          is_sponsored: boolean | null
          max_players: number
          min_players_to_start: number | null
          name: string
          on_chain_create_digest: string | null
          on_chain_room_id: string | null
          platform_fee_collected: number | null
          required_approvals: number | null
          room_code: string | null
          sponsor_amount: number | null
          start_time: string
          status: Database["public"]["Enums"]["room_status"] | null
          timezone: string | null
          total_prize_pool: number | null
          updated_at: string | null
          winner_split_rule: Database["public"]["Enums"]["winner_split_rule"]
        }
        Insert: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          admin_has_approved?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          current_players?: number | null
          end_time: string
          entry_fee: number
          game_id?: string | null
          game_instance_id?: string | null
          game_name?: string | null
          id?: string
          is_private?: boolean | null
          is_special?: boolean | null
          is_sponsored?: boolean | null
          max_players: number
          min_players_to_start?: number | null
          name: string
          on_chain_create_digest?: string | null
          on_chain_room_id?: string | null
          platform_fee_collected?: number | null
          required_approvals?: number | null
          room_code?: string | null
          sponsor_amount?: number | null
          start_time: string
          status?: Database["public"]["Enums"]["room_status"] | null
          timezone?: string | null
          total_prize_pool?: number | null
          updated_at?: string | null
          winner_split_rule?: Database["public"]["Enums"]["winner_split_rule"]
        }
        Update: {
          actual_end_time?: string | null
          actual_start_time?: string | null
          admin_has_approved?: boolean | null
          created_at?: string | null
          creator_id?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          current_players?: number | null
          end_time?: string
          entry_fee?: number
          game_id?: string | null
          game_instance_id?: string | null
          game_name?: string | null
          id?: string
          is_private?: boolean | null
          is_special?: boolean | null
          is_sponsored?: boolean | null
          max_players?: number
          min_players_to_start?: number | null
          name?: string
          on_chain_create_digest?: string | null
          on_chain_room_id?: string | null
          platform_fee_collected?: number | null
          required_approvals?: number | null
          room_code?: string | null
          sponsor_amount?: number | null
          start_time?: string
          status?: Database["public"]["Enums"]["room_status"] | null
          timezone?: string | null
          total_prize_pool?: number | null
          updated_at?: string | null
          winner_split_rule?: Database["public"]["Enums"]["winner_split_rule"]
        }
        Relationships: [
          {
            foreignKeyName: "game_rooms_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rooms_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_rooms_game_instance_id_fkey"
            columns: ["game_instance_id"]
            isOneToOne: false
            referencedRelation: "game_instances"
            referencedColumns: ["id"]
          },
        ]
      }
      game_scores: {
        Row: {
          created_at: string | null
          game_id: string | null
          id: string
          metadata: Json | null
          player_id: string | null
          score: number
        }
        Insert: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          player_id?: string | null
          score: number
        }
        Update: {
          created_at?: string | null
          game_id?: string | null
          id?: string
          metadata?: Json | null
          player_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "game_scores_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_scores_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          ended_at: string | null
          game_id: string | null
          id: string
          last_ping_at: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          game_id?: string | null
          id?: string
          last_ping_at?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          game_id?: string | null
          id?: string
          last_ping_at?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "game_sessions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_sessions_user_id_fkey"
            columns: ["user_id"]
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
          game_url: string | null
          id: string
          image_url: string | null
          instructions: string | null
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
          game_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
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
          game_url?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
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
          current_rank: string
          current_win_streak: number | null
          display_name: string | null
          email_verified: boolean | null
          experience_points: number | null
          id: string
          is_online: boolean | null
          last_seen: string | null
          level: number | null
          longest_win_streak: number | null
          sui_wallet_data: Json | null
          total_earnings: number | null
          total_games_played: number | null
          total_wins: number | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          current_rank?: string
          current_win_streak?: number | null
          display_name?: string | null
          email_verified?: boolean | null
          experience_points?: number | null
          id: string
          is_online?: boolean | null
          last_seen?: string | null
          level?: number | null
          longest_win_streak?: number | null
          sui_wallet_data?: Json | null
          total_earnings?: number | null
          total_games_played?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          current_rank?: string
          current_win_streak?: number | null
          display_name?: string | null
          email_verified?: boolean | null
          experience_points?: number | null
          id?: string
          is_online?: boolean | null
          last_seen?: string | null
          level?: number | null
          longest_win_streak?: number | null
          sui_wallet_data?: Json | null
          total_earnings?: number | null
          total_games_played?: number | null
          total_wins?: number | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      room_entries: {
        Row: {
          currency: string | null
          entry_fee_paid: number | null
          id: string
          joined_at: string | null
          player_id: string | null
          room_id: string | null
          selected_wallet_id: string | null
          transaction_id: string | null
          wallet_id: string | null
        }
        Insert: {
          currency?: string | null
          entry_fee_paid?: number | null
          id?: string
          joined_at?: string | null
          player_id?: string | null
          room_id?: string | null
          selected_wallet_id?: string | null
          transaction_id?: string | null
          wallet_id?: string | null
        }
        Update: {
          currency?: string | null
          entry_fee_paid?: number | null
          id?: string
          joined_at?: string | null
          player_id?: string | null
          room_id?: string | null
          selected_wallet_id?: string | null
          transaction_id?: string | null
          wallet_id?: string | null
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
          updated_at: string | null
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
          updated_at?: string | null
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
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
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
          game_tokens_balance: number | null
          id: string
          is_connected: boolean | null
          sui_balance: number | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          game_tokens_balance?: number | null
          id?: string
          is_connected?: boolean | null
          sui_balance?: number | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          game_tokens_balance?: number | null
          id?: string
          is_connected?: boolean | null
          sui_balance?: number | null
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
      auto_complete_expired_rooms: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      calculate_winner_splits: {
        Args: { rule: string }
        Returns: {
          prize_percentage: number
          winner_position: number
        }[]
      }
      can_room_start: {
        Args: { room_id: string }
        Returns: boolean
      }
      check_and_start_rooms: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cleanup_stale_sessions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      generate_room_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_active_users_count: {
        Args: { p_game_id: string }
        Returns: number
      }
      get_global_leaderboard: {
        Args: { limit_count?: number }
        Returns: {
          avatar_url: string
          display_name: string
          rank: number
          total_earnings: number
          total_games: number
          total_score: number
          total_wins: number
          user_id: string
          username: string
        }[]
      }
      get_player_rank: {
        Args: { p_game_id: string; p_player_id: string }
        Returns: {
          rank: number
          total_players: number
        }[]
      }
      get_room_messages: {
        Args: { room_uuid: string; user_uuid?: string }
        Returns: {
          content: string
          created_at: string
          edited_at: string
          id: string
          message_type: string
          receiver_id: string
          reply_to_id: string
          room_id: string
          sender_id: string
        }[]
      }
      get_user_rooms: {
        Args: { user_uuid?: string }
        Returns: {
          avatar_color: string
          avatar_emoji: string
          created_at: string
          creator_id: string
          description: string
          game_id: string
          id: string
          is_private: boolean
          last_message_at: string
          name: string
          participant_count: number
          updated_at: string
        }[]
      }
      increment_user_stats: {
        Args: {
          p_earnings: number
          p_games_played: number
          p_user_id: string
          p_wins: number
        }
        Returns: undefined
      }
      increment_wallet_balance: {
        Args: { p_amount: number; p_currency: string; p_user_id: string }
        Returns: boolean
      }
      is_room_member: {
        Args: { room_uuid: string; user_uuid: string }
        Returns: boolean
      }
      process_room_lifecycle: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sync_leaderboard_earnings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_leaderboard: {
        Args: {
          p_earnings?: number
          p_game_id: string
          p_user_id: string
          p_won: boolean
        }
        Returns: undefined
      }
      update_room_statuses: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      update_user_profile_stats: {
        Args: { p_user_id: string }
        Returns: undefined
      }
      validate_room_join: {
        Args: { p_room_code?: string; p_room_id: string; p_user_id: string }
        Returns: {
          message: string
          success: boolean
        }[]
      }
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
      room_status:
      | "waiting"
      | "starting"
      | "ongoing"
      | "completed"
      | "cancelled"
      transaction_type:
      | "win"
      | "loss"
      | "deposit"
      | "withdrawal"
      | "fee"
      | "conversion"
      winner_split_rule:
      | "winner_takes_all"
      | "top_2"
      | "top_3"
      | "top_4"
      | "top_5"
      | "top_6"
      | "top_7"
      | "top_8"
      | "top_9"
      | "top_10"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
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
      room_status: ["waiting", "starting", "ongoing", "completed", "cancelled"],
      transaction_type: [
        "win",
        "loss",
        "deposit",
        "withdrawal",
        "fee",
        "conversion",
      ],
      winner_split_rule: [
        "winner_takes_all",
        "top_2",
        "top_3",
        "top_4",
        "top_5",
        "top_6",
        "top_7",
        "top_8",
        "top_9",
        "top_10",
      ],
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