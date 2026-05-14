/**
 * Database Types for DutyGuard
 */

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
      staff: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'teacher' | 'admin' | 'manager'
          department: string | null
          is_homeroom: boolean
          grade_level: number | null
          created_at: string
          staff_code: string
          load_percentage: number
        }
      }
      subjects: { Row: { id: string; name: string; code: string; is_practical: boolean } }
      venues: { Row: { id: string; name: string; capacity: number; type: 'hall' | 'lab' | 'classroom'; hall_access: boolean } }
      exam_sessions: {
        Row: {
          id: string
          date: string
          start_time: string
          end_time: string
          session_type: 'morning' | 'afternoon'
          grade_level: number
        }
      }
      exam_duties: {
        Row: {
          id: string
          session_id: string
          staff_id: string
          venue_id: string
          paper_id: string
          role: 'invigilator' | 'standby' | 'chief' | 'tech'
          status: 'assigned' | 'completed' | 'swapped' | 'cancelled'
        }
      }
      help_requests: {
        Row: {
          id: string
          duty_id: string
          request_type: 'bathroom' | 'paper' | 'toilet_paper' | 'noise' | 'sos'
          status: 'pending' | 'resolved'
          created_at: string
          resolved_at: string | null
          resolved_by: string | null
        }
      }
      emergency_leave_requests: {
        Row: {
          id: string
          staff_id: string
          session_id: string
          reason: string
          status: 'pending' | 'approved' | 'rejected'
          created_at: string
        }
      }
      duty_audit_log: {
        Row: {
          id: string
          action_type: string
          user_id: string
          details: Json
          created_at: string
        }
      }
      duty_swaps: {
        Row: {
          id: string
          requesting_staff_id: string
          accepting_staff_id: string | null
          duty_id: string
          status: 'offered' | 'accepted' | 'completed'
          created_at: string
        }
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
      }
    }
  }
}
