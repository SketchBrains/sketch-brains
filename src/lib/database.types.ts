export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          phone: string | null
          college: string | null
          referral_code: string
          referred_by: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          phone?: string | null
          college?: string | null
          referral_code: string
          referred_by?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          phone?: string | null
          college?: string | null
          referral_code?: string
          referred_by?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          category: 'soft_skills' | 'technical'
          price: number
          start_date: string
          end_date: string
          status: 'upcoming' | 'active' | 'completed'
          max_participants: number | null
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category: 'soft_skills' | 'technical'
          price?: number
          start_date: string
          end_date: string
          status?: 'upcoming' | 'active' | 'completed'
          max_participants?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: 'soft_skills' | 'technical'
          price?: number
          start_date?: string
          end_date?: string
          status?: 'upcoming' | 'active' | 'completed'
          max_participants?: number | null
          image_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      registrations: {
        Row: {
          id: string
          user_id: string
          event_id: string
          payment_status: 'pending' | 'completed' | 'failed' | 'refunded' | 'free'
          payment_id: string | null
          amount_paid: number
          coupon_code: string | null
          registered_at: string
          payment_completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          event_id: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'free'
          payment_id?: string | null
          amount_paid?: number
          coupon_code?: string | null
          registered_at?: string
          payment_completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          event_id?: string
          payment_status?: 'pending' | 'completed' | 'failed' | 'refunded' | 'free'
          payment_id?: string | null
          amount_paid?: number
          coupon_code?: string | null
          registered_at?: string
          payment_completed_at?: string | null
        }
      }
      materials: {
        Row: {
          id: string
          event_id: string
          title: string
          description: string | null
          file_url: string
          file_type: 'notes' | 'slides' | 'recording' | 'other'
          uploaded_at: string
        }
        Insert: {
          id?: string
          event_id: string
          title: string
          description?: string | null
          file_url: string
          file_type: 'notes' | 'slides' | 'recording' | 'other'
          uploaded_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          title?: string
          description?: string | null
          file_url?: string
          file_type?: 'notes' | 'slides' | 'recording' | 'other'
          uploaded_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          event_id: string
          user_id: string
          rating: number
          comments: string | null
          submitted_at: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          rating: number
          comments?: string | null
          submitted_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          rating?: number
          comments?: string | null
          submitted_at?: string
        }
      }
      coupons: {
        Row: {
          id: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          valid_from: string
          valid_until: string
          applicable_events: string[] | null
          max_uses: number | null
          current_uses: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          valid_from: string
          valid_until: string
          applicable_events?: string[] | null
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          code?: string
          discount_type?: 'percentage' | 'fixed'
          discount_value?: number
          valid_from?: string
          valid_until?: string
          applicable_events?: string[] | null
          max_uses?: number | null
          current_uses?: number
          is_active?: boolean
          created_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string
          event_id: string
          registration_id: string
          status: 'pending' | 'completed' | 'rewarded'
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referee_id: string
          event_id: string
          registration_id: string
          status?: 'pending' | 'completed' | 'rewarded'
          created_at?: string
        }
        Update: {
          id?: string
          referrer_id?: string
          referee_id?: string
          event_id?: string
          registration_id?: string
          status?: 'pending' | 'completed' | 'rewarded'
          created_at?: string
        }
      }
      referral_rewards: {
        Row: {
          id: string
          referrer_id: string
          event_id: string
          referral_count: number
          reward_status: 'pending' | 'granted'
          granted_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          event_id: string
          referral_count?: number
          reward_status?: 'pending' | 'granted'
          granted_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          event_id?: string
          referral_count?: number
          reward_status?: 'pending' | 'granted'
          granted_at?: string | null
        }
      }
    }
  }
}
