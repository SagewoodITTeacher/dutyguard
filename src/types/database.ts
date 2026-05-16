/**
 * Database types generated from schema.
 * To keep this file up to date, run:
 * npx supabase gen types typescript --project-id pkuhjqafnvxvhcodobqr --schema public > src/types/database.ts
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
      duty_audit_log: {
        Row: {
          id: number
          created_at: string | null
          event_type: string
          duty_date: string | null
          staff_code: string | null
          related_staff_code: string | null
          exam_session_id: number | null
          details: string | null
          performed_by: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          event_type: string
          duty_date?: string | null
          staff_code?: string | null
          related_staff_code?: string | null
          exam_session_id?: number | null
          details?: string | null
          performed_by?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          event_type?: string
          duty_date?: string | null
          staff_code?: string | null
          related_staff_code?: string | null
          exam_session_id?: number | null
          details?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duty_audit_log_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          }
        ]
      }
      duty_swaps: {
        Row: {
          id: number
          created_at: string | null
          original_duty_id: number | null
          new_duty_id: number | null
          requester_staff_code: string | null
          acceptor_staff_code: string | null
          swap_date: string
          status: string | null
          notes: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          original_duty_id?: number | null
          new_duty_id?: number | null
          requester_staff_code?: string | null
          acceptor_staff_code?: string | null
          swap_date: string
          status?: string | null
          notes?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          original_duty_id?: number | null
          new_duty_id?: number | null
          requester_staff_code?: string | null
          acceptor_staff_code?: string | null
          swap_date?: string
          status?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duty_swaps_acceptor_staff_code_fkey"
            columns: ["acceptor_staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          },
          {
            foreignKeyName: "duty_swaps_new_duty_id_fkey"
            columns: ["new_duty_id"]
            isOneToOne: false
            referencedRelation: "exam_duties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duty_swaps_original_duty_id_fkey"
            columns: ["original_duty_id"]
            isOneToOne: false
            referencedRelation: "exam_duties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duty_swaps_requester_staff_code_fkey"
            columns: ["requester_staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          }
        ]
      }
      emergency_leave_requests: {
        Row: {
          id: number
          created_at: string | null
          duty_date: string
          exam_session_id: number | null
          exam_paper_id: number | null
          requester_staff_code: string | null
          reason: string
          status: string | null
          approver_staff_code: string | null
          approved_at: string | null
          notes: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          duty_date: string
          exam_session_id?: number | null
          exam_paper_id?: number | null
          requester_staff_code?: string | null
          reason: string
          status?: string | null
          approver_staff_code?: string | null
          approved_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          duty_date?: string
          exam_session_id?: number | null
          exam_paper_id?: number | null
          requester_staff_code?: string | null
          reason?: string
          status?: string | null
          approver_staff_code?: string | null
          approved_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "emergency_leave_requests_approver_staff_code_fkey"
            columns: ["approver_staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          },
          {
            foreignKeyName: "emergency_leave_requests_exam_paper_id_fkey"
            columns: ["exam_paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_leave_requests_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "emergency_leave_requests_requester_staff_code_fkey"
            columns: ["requester_staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          }
        ]
      }
      exam_duties: {
        Row: {
          id: number
          duty_date: string
          exam_session_id: number | null
          exam_paper_id: number | null
          staff_code: string | null
          duty_type: string
          venue_id: string | null
          notes: string | null
          period_id: number | null
          session_type: string | null
          paper_type: string | null
          role: string | null
          period_code: string | null
          period_start_time: string | null
          period_end_time: string | null
          assignment_role: string | null
        }
        Insert: {
          id?: number
          duty_date: string
          exam_session_id?: number | null
          exam_paper_id?: number | null
          staff_code?: string | null
          duty_type: string
          venue_id?: string | null
          notes?: string | null
          period_id?: number | null
          session_type?: string | null
          paper_type?: string | null
          role?: string | null
          period_code?: string | null
          period_start_time?: string | null
          period_end_time?: string | null
          assignment_role?: string | null
        }
        Update: {
          id?: number
          duty_date?: string
          exam_session_id?: number | null
          exam_paper_id?: number | null
          staff_code?: string | null
          duty_type?: string
          venue_id?: string | null
          notes?: string | null
          period_id?: number | null
          session_type?: string | null
          paper_type?: string | null
          role?: string | null
          period_code?: string | null
          period_start_time?: string | null
          period_end_time?: string | null
          assignment_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_duties_exam_paper_id_fkey"
            columns: ["exam_paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_duties_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_duties_period_id_fkey"
            columns: ["period_id"]
            isOneToOne: false
            referencedRelation: "periods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_duties_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          },
          {
            foreignKeyName: "exam_duties_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          }
        ]
      }
      exam_paper_venues: {
        Row: {
          id: number
          exam_paper_id: number | null
          venue_id: string | null
        }
        Insert: {
          id?: number
          exam_paper_id?: number | null
          venue_id?: string | null
        }
        Update: {
          id?: number
          exam_paper_id?: number | null
          venue_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_paper_venues_exam_paper_id_fkey"
            columns: ["exam_paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_paper_venues_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          }
        ]
      }
      exam_papers: {
        Row: {
          id: number
          exam_session_id: number | null
          subject_code: string | null
          paper_type: string
          duration_minutes: number
          boys: number | null
          girls: number | null
          total_learners: number | null
        }
        Insert: {
          id?: number
          exam_session_id?: number | null
          subject_code?: string | null
          paper_type: string
          duration_minutes: number
          boys?: number | null
          girls?: number | null
          total_learners?: number | null
        }
        Update: {
          id?: number
          exam_session_id?: number | null
          subject_code?: string | null
          paper_type?: string
          duration_minutes?: number
          boys?: number | null
          girls?: number | null
          total_learners?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_papers_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_papers_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_code"]
          }
        ]
      }
      exam_sessions: {
        Row: {
          id: number
          exam_date: string
          grade: number
          session_type: string
        }
        Insert: {
          id?: number
          exam_date: string
          grade: number
          session_type: string
        }
        Update: {
          id?: number
          exam_date?: string
          grade?: number
          session_type?: string
        }
        Relationships: []
      }
      help_requests: {
        Row: {
          id: number
          created_at: string | null
          duty_date: string
          exam_session_id: number | null
          exam_paper_id: number | null
          requester_staff_code: string | null
          venue_id: string | null
          subject_code: string | null
          help_type: string
          status: string | null
          stand_by_staff_code: string | null
          notes: string | null
          resolved_at: string | null
        }
        Insert: {
          id?: number
          created_at?: string | null
          duty_date: string
          exam_session_id?: number | null
          exam_paper_id?: number | null
          requester_staff_code?: string | null
          venue_id?: string | null
          subject_code?: string | null
          help_type: string
          status?: string | null
          stand_by_staff_code?: string | null
          notes?: string | null
          resolved_at?: string | null
        }
        Update: {
          id?: number
          created_at?: string | null
          duty_date?: string
          exam_session_id?: number | null
          exam_paper_id?: number | null
          requester_staff_code?: string | null
          venue_id?: string | null
          subject_code?: string | null
          help_type?: string
          status?: string | null
          stand_by_staff_code?: string | null
          notes?: string | null
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "help_requests_exam_paper_id_fkey"
            columns: ["exam_paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "help_requests_requester_staff_code_fkey"
            columns: ["requester_staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          },
          {
            foreignKeyName: "help_requests_stand_by_staff_code_fkey"
            columns: ["stand_by_staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          },
          {
            foreignKeyName: "help_requests_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_code"]
          },
          {
            foreignKeyName: "help_requests_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["venue_id"]
          }
        ]
      }
      periods: {
        Row: {
          id: number
          weekday_type: string
          period_code: string
          period_name: string
          start_time: string
          end_time: string
          session_type: string
          sort_order: number
          is_break: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: number
          weekday_type: string
          period_code: string
          period_name: string
          start_time: string
          end_time: string
          session_type: string
          sort_order: number
          is_break?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: number
          weekday_type?: string
          period_code?: string
          period_name?: string
          start_time?: string
          end_time?: string
          session_type?: string
          sort_order?: number
          is_break?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      staff: {
        Row: {
          staff_code: string
          first_name: string | null
          last_name: string | null
          load_percentage: number | null
          role: string | null
          hall_access: boolean | null
          homeroom_grade: number | null
          homeroom_class: string | null
          birthday: string | null
        }
        Insert: {
          staff_code: string
          first_name?: string | null
          last_name?: string | null
          load_percentage?: number | null
          role?: string | null
          hall_access?: boolean | null
          homeroom_grade?: number | null
          homeroom_class?: string | null
          birthday?: string | null
        }
        Update: {
          staff_code?: string
          first_name?: string | null
          last_name?: string | null
          load_percentage?: number | null
          role?: string | null
          hall_access?: boolean | null
          homeroom_grade?: number | null
          homeroom_class?: string | null
          birthday?: string | null
        }
        Relationships: []
      }
      staff_duties: {
        Row: {
          id: number
          staff_code: string | null
          duty_date: string
          duty_type: string
        }
        Insert: {
          id?: number
          staff_code?: string | null
          duty_date: string
          duty_type: string
        }
        Update: {
          id?: number
          staff_code?: string | null
          duty_date?: string
          duty_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_duties_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          }
        ]
      }
      staff_leaves: {
        Row: {
          id: number
          staff_code: string | null
          leave_date: string
          full_day: boolean | null
          begin_time: string | null
          end_time: string | null
          reason: string | null
        }
        Insert: {
          id?: number
          staff_code?: string | null
          leave_date: string
          full_day?: boolean | null
          begin_time?: string | null
          end_time?: string | null
          reason?: string | null
        }
        Update: {
          id?: number
          staff_code?: string | null
          leave_date?: string
          full_day?: boolean | null
          begin_time?: string | null
          end_time?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "staff_leaves_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          }
        ]
      }
      subjects: {
        Row: {
          subject_code: string
          subject_name: string
        }
        Insert: {
          subject_code: string
          subject_name: string
        }
        Update: {
          subject_code?: string
          subject_name?: string
        }
        Relationships: []
      }
      teacher_subjects: {
        Row: {
          staff_code: string
          subject_code: string
        }
        Insert: {
          staff_code: string
          subject_code: string
        }
        Update: {
          staff_code?: string
          subject_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_subjects_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          },
          {
            foreignKeyName: "teacher_subjects_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_code"]
          }
        ]
      }
      teaching_timetable: {
        Row: {
          id: number
          staff_code: string | null
          cycle: string
          day_of_cycle: number
          period: number
          class_code: string | null
        }
        Insert: {
          id?: number
          staff_code?: string | null
          cycle: string
          day_of_cycle: number
          period: number
          class_code?: string | null
        }
        Update: {
          id?: number
          staff_code?: string | null
          cycle?: string
          day_of_cycle?: number
          period?: number
          class_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teaching_timetable_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          }
        ]
      }
      tech_duty_assignment: {
        Row: {
          id: number
          duty_date: string
          staff_code: string | null
          subject_code: string | null
          exam_paper_id: number | null
        }
        Insert: {
          id?: number
          duty_date: string
          staff_code?: string | null
          subject_code?: string | null
          exam_paper_id?: number | null
        }
        Update: {
          id?: number
          duty_date?: string
          staff_code?: string | null
          subject_code?: string | null
          exam_paper_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "tech_duty_assignment_exam_paper_id_fkey"
            columns: ["exam_paper_id"]
            isOneToOne: false
            referencedRelation: "exam_papers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tech_duty_assignment_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          },
          {
            foreignKeyName: "tech_duty_assignment_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_code"]
          }
        ]
      }
      tech_duty_subjects: {
        Row: {
          subject_code: string
          staff_code: string
        }
        Insert: {
          subject_code: string
          staff_code: string
        }
        Update: {
          subject_code?: string
          staff_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "tech_duty_subjects_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          },
          {
            foreignKeyName: "tech_duty_subjects_subject_code_fkey"
            columns: ["subject_code"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["subject_code"]
          }
        ]
      }
      useraccountroles: {
        Row: {
          id: number
          staff_code: string
          accessToTeacherUI: boolean
          accessToAdminUI: boolean
          accessToManagerUI: boolean
          locked: boolean
          created_at: string | null
          email: string | null
        }
        Insert: {
          id?: number
          staff_code: string
          accessToTeacherUI?: boolean
          accessToAdminUI?: boolean
          accessToManagerUI?: boolean
          locked?: boolean
          created_at?: string | null
          email?: string | null
        }
        Update: {
          id?: number
          staff_code?: string
          accessToTeacherUI?: boolean
          accessToAdminUI?: boolean
          accessToManagerUI?: boolean
          locked?: boolean
          created_at?: string | null
          email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "useraccountroles_staff_code_fkey"
            columns: ["staff_code"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["staff_code"]
          }
        ]
      }
      venues: {
        Row: {
          venue_id: string
          display_name: string
          venue_type: string | null
          capacity: number
        }
        Insert: {
          venue_id: string
          display_name: string
          venue_type?: string | null
          capacity?: number
        }
        Update: {
          venue_id?: string
          display_name?: string
          venue_type?: string | null
          capacity?: number
        }
        Relationships: []
      }
    }
    Views: {
      vw_available_staff: {
        Row: {
          staff_code: string | null
          full_name: string | null
          role: string | null
          load_percentage: number | null
          homeroom_grade: number | null
          homeroom_class: string | null
        }
        Relationships: []
      }
      vw_available_staff_summary: {
        Row: {
          staff_code: string | null
          full_name: string | null
          teacher_type: string | null
          total_periods: number | null
          free_periods: number | null
          available_periods: number | null
          teaching_junior_periods: number | null
        }
        Relationships: []
      }
      vw_break_duty: {
        Row: {
          duty_date: string | null
          staff_code: string | null
          break_session: string | null
        }
        Relationships: []
      }
      vw_current_sessions: {
        Row: {
          exam_date: string | null
          grade: number | null
          session_type: string | null
          papers_today: number | null
          duties_assigned: number | null
        }
        Relationships: []
      }
      vw_duties_today: {
        Row: {
          duty_date: string | null
          staff_code: string | null
          teacher_name: string | null
          duty_type: string | null
          venue_id: string | null
          venue_name: string | null
          notes: string | null
          grade: number | null
          session_type: string | null
        }
        Relationships: []
      }
      vw_duty_balance: {
        Row: {
          staff_code: string | null
          total_duties: number | null
          standby_count: number | null
          invigilation_count: number | null
          tech_duty_count: number | null
          load_rank: number | null
        }
        Relationships: []
      }
      vw_duty_load_summary: {
        Row: {
          staff_code: string | null
          standby_count: number | null
          invigilation_count: number | null
          tech_duty_count: number | null
          total_duties: number | null
        }
        Relationships: []
      }
      vw_free_periods: {
        Row: {
          staff_code: string | null
          full_name: string | null
          teacher_type: string | null
          cycle: string | null
          day_of_cycle: number | null
          period: number | null
          class_code: string | null
          grade: number | null
          is_available_for_invigilation: boolean | null
        }
        Relationships: []
      }
      vw_full_schedule_grid: {
        Row: {
          duty_id: number | null
          duty_date: string | null
          weekday_type: string | null
          period_code: string | null
          start_time: string | null
          end_time: string | null
          grade: number | null
          venue_id: string | null
          venue_name: string | null
          venue_type: string | null
          capacity: number | null
          staff_code: string | null
          staff_name: string | null
          duty_type: string | null
          assignment_role: string | null
          subject_code: string | null
          paper_type: string | null
          total_learners: number | null
          duration_minutes: number | null
        }
        Relationships: []
      }
      vw_grade_summary: {
        Row: {
          grade: number | null
          total_sessions: number | null
          assigned_duties: number | null
          tech_duties: number | null
        }
        Relationships: []
      }
      vw_marking_schedule: {
        Row: {
          subject_code: string | null
          subject_name: string | null
          first_writing_date: string | null
          last_writing_date: string | null
          writing_days: number | null
          marking_start: string | null
          marking_end: string | null
          moderation_end: string | null
        }
        Relationships: []
      }
      vw_pending_requests: {
        Row: {
          request_type: string | null
          created_at: string | null
          duty_date: string | null
          requester_staff_code: string | null
          requester_name: string | null
          help_type: string | null
          venue_id: string | null
          venue: string | null
          status: string | null
        }
        Relationships: []
      }
      vw_scattered_consecutive_check: {
        Row: {
          staff_code: string | null
          duty_date: string | null
          consecutive_sessions: number | null
        }
        Relationships: []
      }
      vw_session_duties: {
        Row: {
          duty_date: string | null
          exam_session_id: number | null
          staff_code: string | null
          duty_type: string | null
          venue_id: string | null
          prev_session_id: number | null
          next_session_id: number | null
        }
        Relationships: []
      }
      vw_staff_on_leave: {
        Row: {
          staff_code: string | null
          leave_date: string | null
          full_day: boolean | null
          begin_time: string | null
          end_time: string | null
          reason: string | null
        }
        Relationships: []
      }
      vw_teacher_availability: {
        Row: {
          staff_code: string | null
          full_name: string | null
          teacher_type: string | null
          hall_access: boolean | null
          cycle: string | null
          day_of_cycle: number | null
          period: number | null
          class_code: string | null
          grade: number | null
          is_free_period: boolean | null
          is_available_for_invigilation: boolean | null
          is_teaching_junior_grades: boolean | null
        }
        Relationships: []
      }
      vw_teacher_availability_detailed: {
        Row: {
          staff_code: string | null
          full_name: string | null
          teacher_type: string | null
          hall_access: boolean | null
          cycle: string | null
          day_of_cycle: number | null
          period: number | null
          class_code: string | null
          weekday_type: string | null
          grade: number | null
          is_free_period: boolean | null
          is_available_for_invigilation: boolean | null
          is_teaching_junior_grades: boolean | null
          period_id: number | null
          period_code: string | null
          period_name: string | null
          start_time: string | null
          end_time: string | null
          session_type: string | null
          is_break: boolean | null
        }
        Relationships: []
      }
      vw_teacher_personal_schedule: {
        Row: {
          duty_date: string | null
          staff_code: string | null
          teacher_name: string | null
          duty_type: string | null
          venue_id: string | null
          venue: string | null
          grade: number | null
          session_type: string | null
          subject_code: string | null
          subject_name: string | null
          notes: string | null
        }
        Relationships: []
      }
      vw_teacher_workload: {
        Row: {
          staff_code: string | null
          teacher_name: string | null
          role: string | null
          invigilation_count: number | null
          standby_count: number | null
          break_count: number | null
          tech_count: number | null
          total_duties: number | null
        }
        Relationships: []
      }
      vw_tech_duty: {
        Row: {
          duty_date: string | null
          staff_code: string | null
          subject_code: string | null
          duty_type: string | null
        }
        Relationships: []
      }
      vw_today_duties: {
        Row: {
          duty_date: string | null
          staff_code: string | null
          teacher_name: string | null
          role: string | null
          duty_type: string | null
          venue_id: string | null
          venue_name: string | null
          grade: number | null
          session_type: string | null
          subject_code: string | null
          subject_name: string | null
          notes: string | null
          priority: string | null
        }
        Relationships: []
      }
      vw_user_roles: {
        Row: {
          staff_code: string | null
          full_name: string | null
          email: string | null
          invigilation_role: string | null
          accessToTeacherUI: boolean | null
          accessToAdminUI: boolean | null
          accessToManagerUI: boolean | null
          locked: boolean | null
          ui_role: string | null
        }
        Relationships: []
      }
      vw_wednesday_homeroom: {
        Row: {
          staff_code: string | null
          teacher_name: string | null
          homeroom_grade: number | null
          homeroom_class: string | null
        }
        Relationships: []
      }
      vw_workload_report: {
        Row: {
          staff_code: string | null
          teacher_name: string | null
          role: string | null
          homeroom_grade: number | null
          invigilation_count: number | null
          standby_count: number | null
          tech_count: number | null
          total_duties: number | null
          invigilation_pct: number | null
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

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
