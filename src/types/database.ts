/**
 * Auto-generate real types later using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_REF > src/types/database.ts
 */

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
      staff: {
        Row: {
          id: string
          email: string
          full_name: string
          role: string
          staff_code: string
          department: string | null
          created_at: string
          load_percentage: number
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role: string
          staff_code: string
          department?: string | null
          created_at?: string
          load_percentage?: number
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: string
          staff_code?: string
          department?: string | null
          created_at?: string
          load_percentage?: number
        }
        Relationships: []
      }
      exam_duties: {
        Row: {
          id: string
          session_id: string
          staff_id: string
          venue_id: string
          role: string
          status: string
        }
        Insert: {
          id?: string
          session_id: string
          staff_id: string
          venue_id: string
          role: string
          status: string
        }
        Update: {
          id?: string
          session_id?: string
          staff_id?: string
          venue_id?: string
          role?: string
          status?: string
        }
        Relationships: []
      }
      exam_sessions: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          session_type: string
          grade_level: number
        }
        Insert: {
          id?: string
          date: string
          start_time: string
          end_time: string
          session_type: string
          grade_level: number
        }
        Update: {
          id?: string
          date?: string
          start_time?: string
          end_time?: string
          session_type?: string
          grade_level?: number
        }
        Relationships: []
      }
      help_requests: {
        Row: {
          id: string
          duty_id: string
          status: string
          request_type: string
          created_at: string
        }
        Insert: {
          id?: string
          duty_id: string
          status: string
          request_type: string
          created_at?: string
        }
        Update: {
          id?: string
          duty_id?: string
          status?: string
          request_type?: string
          created_at?: string
        }
        Relationships: []
      }
      emergency_leave_requests: {
        Row: {
          id: string
          staff_id: string
          session_id: string
          status: string
          reason: string
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          session_id: string
          status: string
          reason: string
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          session_id?: string
          status?: string
          reason?: string
          created_at?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          id: string
          name: string
          capacity: number
          type: string
        }
        Insert: {
          id?: string
          name: string
          capacity: number
          type: string
        }
        Update: {
          id?: string
          name?: string
          capacity?: number
          type?: string
        }
        Relationships: []
      }
      staff_leaves: {
        Row: {
          id: string
          staff_id: string
          session_id: string
          date: string
        }
        Insert: {
          id?: string
          staff_id: string
          session_id: string
          date: string
        }
        Update: {
          id?: string
          staff_id?: string
          session_id?: string
          date?: string
        }
        Relationships: []
      }
      useraccountroles: {
        Row: {
          id: string
          staff_code: string
          role: string
        }
        Insert: {
          id?: string
          staff_code: string
          role: string
        }
        Update: {
          id?: string
          staff_code?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      vw_teacher_workload: {
        Row: {
          staff_id: string
          full_name: string
          invigilation_count: number
          standby_count: number
          tech_duty_count: number
          total_duties: number
        }
        Relationships: []
      }
      vw_marking_schedule: {
        Row: {
          subject_id: string
          subject_name: string
          writing_date: string
          marking_deadline: string
          moderation_deadline: string
          status: string
        }
        Relationships: []
      }
      vw_today_duties: {
        Row: {
          id: string
          session_id: string
          staff_id: string
          full_name: string
          venue_name: string
          subject_name: string
          start_time: string
          end_time: string
          role: string
        }
        Relationships: []
      }
      vw_user_roles: {
        Row: {
          user_id: string
          staff_code: string
          full_name: string
          ui_role: string
          email: string
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
