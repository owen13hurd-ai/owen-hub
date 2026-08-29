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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      career_applications: {
        Row: {
          applied_date: string | null
          attachment_paths: Json
          company: string
          created_at: string
          follow_up_date: string | null
          id: string
          interview_notes: string
          job_url: string
          notes: string
          priority: string
          profile_key: string
          rating: number
          recruiter_contact: string
          resume_version: string
          role: string
          salary: string
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          applied_date?: string | null
          attachment_paths?: Json
          company: string
          created_at?: string
          follow_up_date?: string | null
          id: string
          interview_notes?: string
          job_url?: string
          notes?: string
          priority?: string
          profile_key: string
          rating?: number
          recruiter_contact?: string
          resume_version?: string
          role: string
          salary?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          applied_date?: string | null
          attachment_paths?: Json
          company?: string
          created_at?: string
          follow_up_date?: string | null
          id?: string
          interview_notes?: string
          job_url?: string
          notes?: string
          priority?: string
          profile_key?: string
          rating?: number
          recruiter_contact?: string
          resume_version?: string
          role?: string
          salary?: string
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_applications_profile_key_fkey"
            columns: ["profile_key"]
            isOneToOne: false
            referencedRelation: "career_profiles"
            referencedColumns: ["profile_key"]
          },
        ]
      }
      career_profiles: {
        Row: {
          preferences: Json
          profile_key: string
          updated_at: string
        }
        Insert: {
          preferences?: Json
          profile_key: string
          updated_at?: string
        }
        Update: {
          preferences?: Json
          profile_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      career_saved_searches: {
        Row: {
          created_at: string
          id: number
          name: string
          preferences: Json
          profile_key: string
        }
        Insert: {
          created_at?: string
          id?: never
          name: string
          preferences: Json
          profile_key: string
        }
        Update: {
          created_at?: string
          id?: never
          name?: string
          preferences?: Json
          profile_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_saved_searches_profile_key_fkey"
            columns: ["profile_key"]
            isOneToOne: false
            referencedRelation: "career_profiles"
            referencedColumns: ["profile_key"]
          },
        ]
      }
      career_seen_jobs: {
        Row: {
          closed_at: string | null
          first_seen_at: string
          job_key: string
          last_seen_at: string
          payload: Json
          profile_key: string
        }
        Insert: {
          closed_at?: string | null
          first_seen_at?: string
          job_key: string
          last_seen_at?: string
          payload: Json
          profile_key: string
        }
        Update: {
          closed_at?: string | null
          first_seen_at?: string
          job_key?: string
          last_seen_at?: string
          payload?: Json
          profile_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "career_seen_jobs_profile_key_fkey"
            columns: ["profile_key"]
            isOneToOne: false
            referencedRelation: "career_profiles"
            referencedColumns: ["profile_key"]
          },
        ]
      }
      dynasty_boards: {
        Row: {
          board_key: string
          created_at: string
          label: string
          rows_by_scope: Json
          updated_at: string
        }
        Insert: {
          board_key: string
          created_at?: string
          label?: string
          rows_by_scope: Json
          updated_at?: string
        }
        Update: {
          board_key?: string
          created_at?: string
          label?: string
          rows_by_scope?: Json
          updated_at?: string
        }
        Relationships: []
      }
      dynasty_rankings: {
        Row: {
          created_at: string
          id: string
          overall_rank: number
          pick_value: number | null
          player_key: string
          player_name: string
          position: string
          tier_label: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          overall_rank: number
          pick_value?: number | null
          player_key: string
          player_name: string
          position: string
          tier_label?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          overall_rank?: number
          pick_value?: number | null
          player_key?: string
          player_name?: string
          position?: string
          tier_label?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jarvis_artifacts: {
        Row: {
          artifact_type: string
          created_at: string
          file_path: string | null
          id: string
          notes: string | null
          profile_key: string
          title: string
          url: string | null
        }
        Insert: {
          artifact_type: string
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          profile_key?: string
          title: string
          url?: string | null
        }
        Update: {
          artifact_type?: string
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          profile_key?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      jarvis_conversations: {
        Row: {
          created_at: string
          id: string
          note_path: string | null
          profile_key: string
          source_label: string | null
          summary: string
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          note_path?: string | null
          profile_key?: string
          source_label?: string | null
          summary: string
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          note_path?: string | null
          profile_key?: string
          source_label?: string | null
          summary?: string
          title?: string
        }
        Relationships: []
      }
      jarvis_decisions: {
        Row: {
          created_at: string
          decision: string
          decision_date: string
          id: string
          note_path: string | null
          profile_key: string
          rationale: string | null
          source_ids: string[]
          status: string
        }
        Insert: {
          created_at?: string
          decision: string
          decision_date?: string
          id?: string
          note_path?: string | null
          profile_key?: string
          rationale?: string | null
          source_ids?: string[]
          status?: string
        }
        Update: {
          created_at?: string
          decision?: string
          decision_date?: string
          id?: string
          note_path?: string | null
          profile_key?: string
          rationale?: string | null
          source_ids?: string[]
          status?: string
        }
        Relationships: []
      }
      jarvis_memories: {
        Row: {
          category: string | null
          confidence: string
          confirmed_at: string | null
          created_at: string
          id: string
          memory: string
          profile_key: string
          source_ids: string[]
        }
        Insert: {
          category?: string | null
          confidence?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          memory: string
          profile_key?: string
          source_ids?: string[]
        }
        Update: {
          category?: string | null
          confidence?: string
          confirmed_at?: string | null
          created_at?: string
          id?: string
          memory?: string
          profile_key?: string
          source_ids?: string[]
        }
        Relationships: []
      }
      jarvis_notes: {
        Row: {
          confidence: string
          created_at: string
          id: string
          last_reviewed: string | null
          note_type: string
          path: string
          profile_key: string
          source_type: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          id?: string
          last_reviewed?: string | null
          note_type?: string
          path: string
          profile_key?: string
          source_type?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          confidence?: string
          created_at?: string
          id?: string
          last_reviewed?: string | null
          note_type?: string
          path?: string
          profile_key?: string
          source_type?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      jarvis_projects: {
        Row: {
          area: string | null
          created_at: string
          id: string
          name: string
          note_path: string | null
          priority: number
          profile_key: string
          status: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          id?: string
          name: string
          note_path?: string | null
          priority?: number
          profile_key?: string
          status?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          id?: string
          name?: string
          note_path?: string | null
          priority?: number
          profile_key?: string
          status?: string
        }
        Relationships: []
      }
      jarvis_sources: {
        Row: {
          citation_label: string | null
          created_at: string
          file_path: string | null
          id: string
          notes: string | null
          profile_key: string
          reliability: string
          source_date: string | null
          source_type: string
          title: string
          url: string | null
        }
        Insert: {
          citation_label?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          profile_key?: string
          reliability?: string
          source_date?: string | null
          source_type?: string
          title: string
          url?: string | null
        }
        Update: {
          citation_label?: string | null
          created_at?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          profile_key?: string
          reliability?: string
          source_date?: string | null
          source_type?: string
          title?: string
          url?: string | null
        }
        Relationships: []
      }
      jarvis_tasks: {
        Row: {
          created_at: string
          due_date: string | null
          id: string
          note_path: string | null
          profile_key: string
          project_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          due_date?: string | null
          id?: string
          note_path?: string | null
          profile_key?: string
          project_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          due_date?: string | null
          id?: string
          note_path?: string | null
          profile_key?: string
          project_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jarvis_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "jarvis_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      jarvis_topics: {
        Row: {
          area: string | null
          created_at: string
          id: string
          name: string
          profile_key: string
        }
        Insert: {
          area?: string | null
          created_at?: string
          id?: string
          name: string
          profile_key?: string
        }
        Update: {
          area?: string | null
          created_at?: string
          id?: string
          name?: string
          profile_key?: string
        }
        Relationships: []
      }
      pokemon_battle_journals: {
        Row: {
          created_at: string
          payload: Json
          profile_key: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          payload?: Json
          profile_key: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          payload?: Json
          profile_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      pokemon_intelligence_cards: {
        Row: {
          created_at: string
          external_id: string | null
          id: string
          image_url: string | null
          name: string
          notes: string | null
          number: string | null
          profile_key: string
          rarity: string | null
          set_name: string | null
          source_url: string | null
          subtypes: string[]
          supertype: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          name: string
          notes?: string | null
          number?: string | null
          profile_key?: string
          rarity?: string | null
          set_name?: string | null
          source_url?: string | null
          subtypes?: string[]
          supertype?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          external_id?: string | null
          id?: string
          image_url?: string | null
          name?: string
          notes?: string | null
          number?: string | null
          profile_key?: string
          rarity?: string | null
          set_name?: string | null
          source_url?: string | null
          subtypes?: string[]
          supertype?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pokemon_intelligence_collection_items: {
        Row: {
          acquired_at: string | null
          condition: string
          created_at: string
          estimated_value: number | null
          id: string
          item_kind: string
          item_name: string
          notes: string | null
          product_id: string | null
          profile_key: string
          quantity: number
          storage_location: string | null
          updated_at: string
        }
        Insert: {
          acquired_at?: string | null
          condition?: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          item_kind?: string
          item_name: string
          notes?: string | null
          product_id?: string | null
          profile_key?: string
          quantity?: number
          storage_location?: string | null
          updated_at?: string
        }
        Update: {
          acquired_at?: string | null
          condition?: string
          created_at?: string
          estimated_value?: number | null
          id?: string
          item_kind?: string
          item_name?: string
          notes?: string | null
          product_id?: string | null
          profile_key?: string
          quantity?: number
          storage_location?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_intelligence_collection_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pokemon_intelligence_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pokemon_intelligence_price_observations: {
        Row: {
          confidence: string
          created_at: string
          id: string
          notes: string | null
          observed_at: string
          price: number
          product_id: string | null
          product_name: string
          profile_key: string
          shipping: number
          source: string
          source_url: string | null
        }
        Insert: {
          confidence?: string
          created_at?: string
          id?: string
          notes?: string | null
          observed_at?: string
          price: number
          product_id?: string | null
          product_name: string
          profile_key?: string
          shipping?: number
          source: string
          source_url?: string | null
        }
        Update: {
          confidence?: string
          created_at?: string
          id?: string
          notes?: string | null
          observed_at?: string
          price?: number
          product_id?: string | null
          product_name?: string
          profile_key?: string
          shipping?: number
          source?: string
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_intelligence_price_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pokemon_intelligence_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pokemon_intelligence_products: {
        Row: {
          created_at: string
          id: string
          image_url: string | null
          msrp: number | null
          name: string
          notes: string | null
          pack_count: number | null
          product_type: string
          profile_key: string
          release_date: string | null
          set_name: string | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url?: string | null
          msrp?: number | null
          name: string
          notes?: string | null
          pack_count?: number | null
          product_type?: string
          profile_key?: string
          release_date?: string | null
          set_name?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string | null
          msrp?: number | null
          name?: string
          notes?: string | null
          pack_count?: number | null
          product_type?: string
          profile_key?: string
          release_date?: string | null
          set_name?: string | null
          source_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pokemon_intelligence_purchases: {
        Row: {
          created_at: string
          fees: number
          id: string
          item_price: number
          jarvis_note_path: string | null
          notes: string | null
          product_id: string | null
          product_name: string
          profile_key: string
          purchase_date: string
          purpose: string
          quantity: number
          retailer: string | null
          shipping: number
          source_url: string | null
          tax: number
          total_cost: number | null
        }
        Insert: {
          created_at?: string
          fees?: number
          id?: string
          item_price?: number
          jarvis_note_path?: string | null
          notes?: string | null
          product_id?: string | null
          product_name: string
          profile_key?: string
          purchase_date?: string
          purpose?: string
          quantity?: number
          retailer?: string | null
          shipping?: number
          source_url?: string | null
          tax?: number
          total_cost?: number | null
        }
        Update: {
          created_at?: string
          fees?: number
          id?: string
          item_price?: number
          jarvis_note_path?: string | null
          notes?: string | null
          product_id?: string | null
          product_name?: string
          profile_key?: string
          purchase_date?: string
          purpose?: string
          quantity?: number
          retailer?: string | null
          shipping?: number
          source_url?: string | null
          tax?: number
          total_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_intelligence_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pokemon_intelligence_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pokemon_intelligence_restock_observations: {
        Row: {
          confidence: string
          created_at: string
          current_price: number | null
          id: string
          msrp: number | null
          notes: string | null
          observed_at: string
          product_id: string | null
          product_name: string
          profile_key: string
          retailer: string
          source_url: string | null
          stock_status: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          current_price?: number | null
          id?: string
          msrp?: number | null
          notes?: string | null
          observed_at?: string
          product_id?: string | null
          product_name: string
          profile_key?: string
          retailer: string
          source_url?: string | null
          stock_status?: string
        }
        Update: {
          confidence?: string
          created_at?: string
          current_price?: number | null
          id?: string
          msrp?: number | null
          notes?: string | null
          observed_at?: string
          product_id?: string | null
          product_name?: string
          profile_key?: string
          retailer?: string
          source_url?: string | null
          stock_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pokemon_intelligence_restock_observations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "pokemon_intelligence_products"
            referencedColumns: ["id"]
          },
        ]
      }
      pokemon_intelligence_sets: {
        Row: {
          created_at: string
          era: string | null
          id: string
          name: string
          notes: string | null
          profile_key: string
          release_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          era?: string | null
          id?: string
          name: string
          notes?: string | null
          profile_key?: string
          release_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          era?: string | null
          id?: string
          name?: string
          notes?: string | null
          profile_key?: string
          release_date?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      pokemon_intelligence_watchlist: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          max_price: number | null
          name: string
          notes: string | null
          priority: string
          profile_key: string
          target_type: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          max_price?: number | null
          name: string
          notes?: string | null
          priority?: string
          profile_key?: string
          target_type?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          max_price?: number | null
          name?: string
          notes?: string | null
          priority?: string
          profile_key?: string
          target_type?: string
        }
        Relationships: []
      }
      pokemon_restock_events: {
        Row: {
          confidence: string
          created_at: string
          current_price: number | null
          detected_at: string
          id: string
          image_url: string | null
          last_seen_at: string
          msrp: number | null
          price_status: string
          product_name: string
          product_url: string
          retailer_id: string
          retailer_name: string
          source_label: string
          source_support: string
          stock_status: string
        }
        Insert: {
          confidence: string
          created_at?: string
          current_price?: number | null
          detected_at: string
          id: string
          image_url?: string | null
          last_seen_at?: string
          msrp?: number | null
          price_status: string
          product_name: string
          product_url: string
          retailer_id: string
          retailer_name: string
          source_label: string
          source_support: string
          stock_status: string
        }
        Update: {
          confidence?: string
          created_at?: string
          current_price?: number | null
          detected_at?: string
          id?: string
          image_url?: string | null
          last_seen_at?: string
          msrp?: number | null
          price_status?: string
          product_name?: string
          product_url?: string
          retailer_id?: string
          retailer_name?: string
          source_label?: string
          source_support?: string
          stock_status?: string
        }
        Relationships: []
      }
      pokemon_restock_locations: {
        Row: {
          address: string | null
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          notes: string | null
          profile_key: string
          retailer_id: string
          typical_restock_day: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          notes?: string | null
          profile_key?: string
          retailer_id: string
          typical_restock_day?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          notes?: string | null
          profile_key?: string
          retailer_id?: string
          typical_restock_day?: string | null
        }
        Relationships: []
      }
      pokemon_restock_watchlist: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          kind: string
          max_price_percent: number
          name: string
          profile_key: string
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          kind: string
          max_price_percent?: number
          name: string
          profile_key?: string
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          max_price_percent?: number
          name?: string
          profile_key?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
        }
        Relationships: []
      }
      rookie_athletic_tests: {
        Row: {
          bench_reps: number | null
          broad_inches: number | null
          burst_score: number | null
          created_at: string
          event_date: string | null
          event_type: string
          forty_seconds: number | null
          id: string
          player_id: string
          ras: number | null
          shuttle_seconds: number | null
          source_id: string | null
          speed_score: number | null
          three_cone_seconds: number | null
          user_id: string
          vertical_inches: number | null
        }
        Insert: {
          bench_reps?: number | null
          broad_inches?: number | null
          burst_score?: number | null
          created_at?: string
          event_date?: string | null
          event_type: string
          forty_seconds?: number | null
          id?: string
          player_id: string
          ras?: number | null
          shuttle_seconds?: number | null
          source_id?: string | null
          speed_score?: number | null
          three_cone_seconds?: number | null
          user_id: string
          vertical_inches?: number | null
        }
        Update: {
          bench_reps?: number | null
          broad_inches?: number | null
          burst_score?: number | null
          created_at?: string
          event_date?: string | null
          event_type?: string
          forty_seconds?: number | null
          id?: string
          player_id?: string
          ras?: number | null
          shuttle_seconds?: number | null
          source_id?: string | null
          speed_score?: number | null
          three_cone_seconds?: number | null
          user_id?: string
          vertical_inches?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rookie_athletic_tests_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_athletic_tests_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_benchmark_snapshots: {
        Row: {
          consensus_rank: number
          created_at: string
          format: string
          id: string
          observed_at: string
          player_id: string
          provider: string
          source_id: string
          user_id: string
        }
        Insert: {
          consensus_rank: number
          created_at?: string
          format?: string
          id?: string
          observed_at: string
          player_id: string
          provider: string
          source_id: string
          user_id: string
        }
        Update: {
          consensus_rank?: number
          created_at?: string
          format?: string
          id?: string
          observed_at?: string
          player_id?: string
          provider?: string
          source_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_benchmark_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_benchmark_snapshots_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_context_snapshots: {
        Row: {
          coaching_score: number | null
          created_at: string
          depth_chart_score: number | null
          id: string
          landing_spot_score: number | null
          nfl_team: string | null
          observed_at: string
          offensive_line_score: number | null
          overall_pick: number | null
          player_id: string
          quarterback_score: number | null
          source_id: string | null
          user_id: string
        }
        Insert: {
          coaching_score?: number | null
          created_at?: string
          depth_chart_score?: number | null
          id?: string
          landing_spot_score?: number | null
          nfl_team?: string | null
          observed_at: string
          offensive_line_score?: number | null
          overall_pick?: number | null
          player_id: string
          quarterback_score?: number | null
          source_id?: string | null
          user_id: string
        }
        Update: {
          coaching_score?: number | null
          created_at?: string
          depth_chart_score?: number | null
          id?: string
          landing_spot_score?: number | null
          nfl_team?: string | null
          observed_at?: string
          offensive_line_score?: number | null
          overall_pick?: number | null
          player_id?: string
          quarterback_score?: number | null
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_context_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_context_snapshots_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_import_batches: {
        Row: {
          committed_at: string | null
          created_at: string
          filename: string
          id: string
          invalid_row_count: number
          mapping: Json
          row_count: number
          source_id: string | null
          status: string
          user_id: string
          valid_row_count: number
        }
        Insert: {
          committed_at?: string | null
          created_at?: string
          filename: string
          id?: string
          invalid_row_count?: number
          mapping?: Json
          row_count?: number
          source_id?: string | null
          status: string
          user_id: string
          valid_row_count?: number
        }
        Update: {
          committed_at?: string | null
          created_at?: string
          filename?: string
          id?: string
          invalid_row_count?: number
          mapping?: Json
          row_count?: number
          source_id?: string | null
          status?: string
          user_id?: string
          valid_row_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "rookie_import_batches_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_import_rows: {
        Row: {
          batch_id: string
          created_at: string
          duplicate_candidates: Json
          id: string
          matched_player_id: string | null
          normalized_data: Json | null
          raw_data: Json
          resolution_status: string
          source_row: number
          user_id: string
          validation_errors: Json
        }
        Insert: {
          batch_id: string
          created_at?: string
          duplicate_candidates?: Json
          id?: string
          matched_player_id?: string | null
          normalized_data?: Json | null
          raw_data: Json
          resolution_status?: string
          source_row: number
          user_id: string
          validation_errors?: Json
        }
        Update: {
          batch_id?: string
          created_at?: string
          duplicate_candidates?: Json
          id?: string
          matched_player_id?: string | null
          normalized_data?: Json | null
          raw_data?: Json
          resolution_status?: string
          source_row?: number
          user_id?: string
          validation_errors?: Json
        }
        Relationships: [
          {
            foreignKeyName: "rookie_import_rows_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "rookie_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_import_rows_matched_player_id_fkey"
            columns: ["matched_player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_manual_rankings: {
        Row: {
          format: string
          id: string
          manual_rank: number | null
          manual_tier: string | null
          player_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          format?: string
          id?: string
          manual_rank?: number | null
          manual_tier?: string | null
          player_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          format?: string
          id?: string
          manual_rank?: number | null
          manual_tier?: string | null
          player_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_manual_rankings_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_market_snapshots: {
        Row: {
          created_at: string
          dynasty_adp: number | null
          format: string
          id: string
          market_value: number | null
          observed_at: string
          player_id: string
          provider: string
          rookie_adp: number | null
          source_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          dynasty_adp?: number | null
          format: string
          id?: string
          market_value?: number | null
          observed_at: string
          player_id: string
          provider: string
          rookie_adp?: number | null
          source_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          dynasty_adp?: number | null
          format?: string
          id?: string
          market_value?: number | null
          observed_at?: string
          player_id?: string
          provider?: string
          rookie_adp?: number | null
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_market_snapshots_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_market_snapshots_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_model_versions: {
        Row: {
          code_version: string | null
          configuration: Json
          created_at: string
          id: string
          label: string
          position: Database["public"]["Enums"]["rookie_position"]
          published_at: string | null
          reference_cohort: Json
          semantic_version: string
          status: Database["public"]["Enums"]["rookie_model_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          code_version?: string | null
          configuration: Json
          created_at?: string
          id?: string
          label: string
          position: Database["public"]["Enums"]["rookie_position"]
          published_at?: string | null
          reference_cohort?: Json
          semantic_version: string
          status?: Database["public"]["Enums"]["rookie_model_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          code_version?: string | null
          configuration?: Json
          created_at?: string
          id?: string
          label?: string
          position?: Database["public"]["Enums"]["rookie_position"]
          published_at?: string | null
          reference_cohort?: Json
          semantic_version?: string
          status?: Database["public"]["Enums"]["rookie_model_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rookie_notes: {
        Row: {
          body: string
          created_at: string
          id: string
          player_id: string
          source_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          player_id: string
          source_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          player_id?: string
          source_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_notes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_notes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_outcomes: {
        Row: {
          created_at: string
          end_of_season_dynasty_value: number | null
          fantasy_points: number | null
          fantasy_ppg: number | null
          games: number | null
          id: string
          nfl_season: number
          peak_dynasty_value: number | null
          player_id: string
          position_finish: number | null
          source_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          end_of_season_dynasty_value?: number | null
          fantasy_points?: number | null
          fantasy_ppg?: number | null
          games?: number | null
          id?: string
          nfl_season: number
          peak_dynasty_value?: number | null
          player_id: string
          position_finish?: number | null
          source_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          end_of_season_dynasty_value?: number | null
          fantasy_points?: number | null
          fantasy_ppg?: number | null
          games?: number | null
          id?: string
          nfl_season?: number
          peak_dynasty_value?: number | null
          player_id?: string
          position_finish?: number | null
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_outcomes_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_outcomes_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_player_aliases: {
        Row: {
          alias: string
          id: string
          player_id: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          alias: string
          id?: string
          player_id: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          alias?: string
          id?: string
          player_id?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_player_aliases_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_player_aliases_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_player_metrics: {
        Row: {
          as_of_date: string
          confidence: string
          created_at: string
          id: string
          import_batch_id: string | null
          metric_key: string
          player_id: string
          source_id: string | null
          user_id: string
          value: number | null
        }
        Insert: {
          as_of_date: string
          confidence?: string
          created_at?: string
          id?: string
          import_batch_id?: string | null
          metric_key: string
          player_id: string
          source_id?: string | null
          user_id: string
          value?: number | null
        }
        Update: {
          as_of_date?: string
          confidence?: string
          created_at?: string
          id?: string
          import_batch_id?: string | null
          metric_key?: string
          player_id?: string
          source_id?: string | null
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rookie_player_metrics_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "rookie_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_player_metrics_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_player_metrics_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_players: {
        Row: {
          age_at_draft: number | null
          birthdate: string | null
          bmi: number | null
          class_year: number
          conference: string | null
          confidence: string
          created_at: string
          draft_round: number | null
          early_declare: boolean | null
          external_id: string | null
          height_inches: number | null
          id: string
          import_batch_id: string | null
          name: string
          nfl_team: string | null
          overall_pick: number | null
          position: Database["public"]["Enums"]["rookie_position"]
          recruiting_rating: number | null
          school: string | null
          source_id: string | null
          updated_at: string
          user_id: string
          weight_pounds: number | null
        }
        Insert: {
          age_at_draft?: number | null
          birthdate?: string | null
          bmi?: number | null
          class_year: number
          conference?: string | null
          confidence?: string
          created_at?: string
          draft_round?: number | null
          early_declare?: boolean | null
          external_id?: string | null
          height_inches?: number | null
          id?: string
          import_batch_id?: string | null
          name: string
          nfl_team?: string | null
          overall_pick?: number | null
          position: Database["public"]["Enums"]["rookie_position"]
          recruiting_rating?: number | null
          school?: string | null
          source_id?: string | null
          updated_at?: string
          user_id: string
          weight_pounds?: number | null
        }
        Update: {
          age_at_draft?: number | null
          birthdate?: string | null
          bmi?: number | null
          class_year?: number
          conference?: string | null
          confidence?: string
          created_at?: string
          draft_round?: number | null
          early_declare?: boolean | null
          external_id?: string | null
          height_inches?: number | null
          id?: string
          import_batch_id?: string | null
          name?: string
          nfl_team?: string | null
          overall_pick?: number | null
          position?: Database["public"]["Enums"]["rookie_position"]
          recruiting_rating?: number | null
          school?: string | null
          source_id?: string | null
          updated_at?: string
          user_id?: string
          weight_pounds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rookie_players_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "rookie_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_players_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_score_components: {
        Row: {
          contribution: number | null
          effective_weight: number
          explanation: string
          family_key: string
          id: string
          metric_key: string
          metric_label: string
          missing: boolean
          normalized_value: number | null
          raw_value: number | null
          score_run_id: string
          source_id: string | null
          user_id: string
        }
        Insert: {
          contribution?: number | null
          effective_weight: number
          explanation: string
          family_key: string
          id?: string
          metric_key: string
          metric_label: string
          missing: boolean
          normalized_value?: number | null
          raw_value?: number | null
          score_run_id: string
          source_id?: string | null
          user_id: string
        }
        Update: {
          contribution?: number | null
          effective_weight?: number
          explanation?: string
          family_key?: string
          id?: string
          metric_key?: string
          metric_label?: string
          missing?: boolean
          normalized_value?: number | null
          raw_value?: number | null
          score_run_id?: string
          source_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_score_components_score_run_id_fkey"
            columns: ["score_run_id"]
            isOneToOne: false
            referencedRelation: "rookie_score_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_score_components_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_score_runs: {
        Row: {
          as_of_date: string
          created_at: string
          data_coverage: number
          draft_capital_score: number | null
          id: string
          market_score: number | null
          model_version_id: string
          normalization: string
          overall_rank: number | null
          overall_score: number | null
          player_id: string
          position_rank: number | null
          prospect_score: number | null
          situation_score: number | null
          tier: string | null
          user_id: string
        }
        Insert: {
          as_of_date: string
          created_at?: string
          data_coverage: number
          draft_capital_score?: number | null
          id?: string
          market_score?: number | null
          model_version_id: string
          normalization: string
          overall_rank?: number | null
          overall_score?: number | null
          player_id: string
          position_rank?: number | null
          prospect_score?: number | null
          situation_score?: number | null
          tier?: string | null
          user_id: string
        }
        Update: {
          as_of_date?: string
          created_at?: string
          data_coverage?: number
          draft_capital_score?: number | null
          id?: string
          market_score?: number | null
          model_version_id?: string
          normalization?: string
          overall_rank?: number | null
          overall_score?: number | null
          player_id?: string
          position_rank?: number | null
          prospect_score?: number | null
          situation_score?: number | null
          tier?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rookie_score_runs_model_version_id_fkey"
            columns: ["model_version_id"]
            isOneToOne: false
            referencedRelation: "rookie_model_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_score_runs_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_seasons: {
        Row: {
          attempts: number | null
          carries: number | null
          created_at: string
          games: number | null
          id: string
          import_batch_id: string | null
          missed_tackles_per_attempt: number | null
          passing_yards: number | null
          player_id: string
          receiving_yard_share: number | null
          receiving_yards: number | null
          receptions: number | null
          routes: number | null
          rushing_yard_share: number | null
          rushing_yards: number | null
          season: number
          source_id: string | null
          target_share: number | null
          targets: number | null
          team_pass_attempts: number | null
          team_receiving_yards: number | null
          team_rushing_yards: number | null
          team_targets: number | null
          touchdowns: number | null
          user_id: string
          yards_after_contact_per_attempt: number | null
          yards_per_route_run: number | null
        }
        Insert: {
          attempts?: number | null
          carries?: number | null
          created_at?: string
          games?: number | null
          id?: string
          import_batch_id?: string | null
          missed_tackles_per_attempt?: number | null
          passing_yards?: number | null
          player_id: string
          receiving_yard_share?: number | null
          receiving_yards?: number | null
          receptions?: number | null
          routes?: number | null
          rushing_yard_share?: number | null
          rushing_yards?: number | null
          season: number
          source_id?: string | null
          target_share?: number | null
          targets?: number | null
          team_pass_attempts?: number | null
          team_receiving_yards?: number | null
          team_rushing_yards?: number | null
          team_targets?: number | null
          touchdowns?: number | null
          user_id: string
          yards_after_contact_per_attempt?: number | null
          yards_per_route_run?: number | null
        }
        Update: {
          attempts?: number | null
          carries?: number | null
          created_at?: string
          games?: number | null
          id?: string
          import_batch_id?: string | null
          missed_tackles_per_attempt?: number | null
          passing_yards?: number | null
          player_id?: string
          receiving_yard_share?: number | null
          receiving_yards?: number | null
          receptions?: number | null
          routes?: number | null
          rushing_yard_share?: number | null
          rushing_yards?: number | null
          season?: number
          source_id?: string | null
          target_share?: number | null
          targets?: number | null
          team_pass_attempts?: number | null
          team_receiving_yards?: number | null
          team_rushing_yards?: number | null
          team_targets?: number | null
          touchdowns?: number | null
          user_id?: string
          yards_after_contact_per_attempt?: number | null
          yards_per_route_run?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rookie_seasons_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "rookie_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_seasons_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "rookie_players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rookie_seasons_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "rookie_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      rookie_sources: {
        Row: {
          accessed_at: string
          author: string | null
          created_at: string
          id: string
          label: string
          license: string | null
          methodology_class: Database["public"]["Enums"]["rookie_methodology_class"]
          publication: string | null
          published_on: string | null
          reliability: string
          summary: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          author?: string | null
          created_at?: string
          id?: string
          label: string
          license?: string | null
          methodology_class: Database["public"]["Enums"]["rookie_methodology_class"]
          publication?: string | null
          published_on?: string | null
          reliability: string
          summary?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          author?: string | null
          created_at?: string
          id?: string
          label?: string
          license?: string | null
          methodology_class?: Database["public"]["Enums"]["rookie_methodology_class"]
          publication?: string | null
          published_on?: string | null
          reliability?: string
          summary?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      rookie_methodology_class:
        | "documented"
        | "partial"
        | "inference"
        | "opinion"
      rookie_model_status: "draft" | "published" | "retired"
      rookie_position: "QB" | "RB" | "WR" | "TE"
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
  public: {
    Enums: {
      rookie_methodology_class: [
        "documented",
        "partial",
        "inference",
        "opinion",
      ],
      rookie_model_status: ["draft", "published", "retired"],
      rookie_position: ["QB", "RB", "WR", "TE"],
    },
  },
} as const
