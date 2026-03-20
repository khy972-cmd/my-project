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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      admin_user_directory: {
        Row: {
          affiliation: string | null
          created_at: string
          daily: number | null
          id: string
          is_active: boolean
          linked_user_id: string | null
          name: string
          notes: string | null
          phone: string | null
          role: Database["public"]["Enums"]["app_role"]
          source: string | null
          source_worker_id: string | null
          updated_at: string
        }
        Insert: {
          affiliation?: string | null
          created_at?: string
          daily?: number | null
          id?: string
          is_active?: boolean
          linked_user_id?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          source?: string | null
          source_worker_id?: string | null
          updated_at?: string
        }
        Update: {
          affiliation?: string | null
          created_at?: string
          daily?: number | null
          id?: string
          is_active?: boolean
          linked_user_id?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          source?: string | null
          source_worker_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          badge: string | null
          created_at: string
          doc_type: string
          file_ext: string | null
          file_path: string | null
          file_size: string | null
          file_url: string | null
          id: string
          search_vector: unknown
          site_id: string | null
          site_name: string | null
          title: string
          updated_at: string
          uploaded_by: string
          work_date: string | null
          worklog_id: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string
          doc_type: string
          file_ext?: string | null
          file_path?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          search_vector?: unknown
          site_id?: string | null
          site_name?: string | null
          title?: string
          updated_at?: string
          uploaded_by: string
          work_date?: string | null
          worklog_id?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string
          doc_type?: string
          file_ext?: string | null
          file_path?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          search_vector?: unknown
          site_id?: string | null
          site_name?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          work_date?: string | null
          worklog_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_worklog_id_fkey"
            columns: ["worklog_id"]
            isOneToOne: false
            referencedRelation: "worklogs"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_orphans: {
        Row: {
          badge: string | null
          created_at: string
          doc_type: string
          file_ext: string | null
          file_path: string | null
          file_size: string | null
          file_url: string | null
          id: string
          search_vector: unknown
          site_id: string | null
          site_name: string | null
          title: string
          updated_at: string
          uploaded_by: string
          work_date: string | null
          worklog_id: string | null
        }
        Insert: {
          badge?: string | null
          created_at?: string
          doc_type: string
          file_ext?: string | null
          file_path?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          search_vector?: unknown
          site_id?: string | null
          site_name?: string | null
          title?: string
          updated_at?: string
          uploaded_by: string
          work_date?: string | null
          worklog_id?: string | null
        }
        Update: {
          badge?: string | null
          created_at?: string
          doc_type?: string
          file_ext?: string | null
          file_path?: string | null
          file_size?: string | null
          file_url?: string | null
          id?: string
          search_vector?: unknown
          site_id?: string | null
          site_name?: string | null
          title?: string
          updated_at?: string
          uploaded_by?: string
          work_date?: string | null
          worklog_id?: string | null
        }
        Relationships: []
      }
      org_members: {
        Row: {
          created_at: string
          id: string
          org_id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          org_id: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          org_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pending_role_assignments: {
        Row: {
          created_at: string
          id: string
          linked_user_id: string | null
          note: string | null
          reserved_email: string | null
          reserved_name: string
          reserved_role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          linked_user_id?: string | null
          note?: string | null
          reserved_email?: string | null
          reserved_name: string
          reserved_role: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          linked_user_id?: string | null
          note?: string | null
          reserved_email?: string | null
          reserved_name?: string
          reserved_role?: Database["public"]["Enums"]["app_role"]
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      signup_requests: {
        Row: {
          admin_note: string | null
          assigned_org_id: string | null
          created_at: string
          email: string
          id: string
          job_title: string | null
          name: string
          phone: string | null
          request_type: string
          requested_company_name: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          assigned_org_id?: string | null
          created_at?: string
          email: string
          id?: string
          job_title?: string | null
          name: string
          phone?: string | null
          request_type: string
          requested_company_name?: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          assigned_org_id?: string | null
          created_at?: string
          email?: string
          id?: string
          job_title?: string | null
          name?: string
          phone?: string | null
          request_type?: string
          requested_company_name?: string | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "signup_requests_assigned_org_id_fkey"
            columns: ["assigned_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_deployments: {
        Row: {
          affiliation: string | null
          contractor: string | null
          created_at: string
          deploy_date: string
          id: string
          note: string | null
          partner_user_id: string
          people_count: number
          site_id: string | null
          site_name: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliation?: string | null
          contractor?: string | null
          created_at?: string
          deploy_date?: string
          id?: string
          note?: string | null
          partner_user_id: string
          people_count?: number
          site_id?: string | null
          site_name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliation?: string | null
          contractor?: string | null
          created_at?: string
          deploy_date?: string
          id?: string
          note?: string | null
          partner_user_id?: string
          people_count?: number
          site_id?: string | null
          site_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_deployments_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_deployments_orphans: {
        Row: {
          affiliation: string | null
          contractor: string | null
          created_at: string
          deploy_date: string
          id: string
          note: string | null
          partner_user_id: string
          people_count: number
          site_id: string | null
          site_name: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliation?: string | null
          contractor?: string | null
          created_at?: string
          deploy_date?: string
          id?: string
          note?: string | null
          partner_user_id: string
          people_count?: number
          site_id?: string | null
          site_name?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliation?: string | null
          contractor?: string | null
          created_at?: string
          deploy_date?: string
          id?: string
          note?: string | null
          partner_user_id?: string
          people_count?: number
          site_id?: string | null
          site_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          affiliation: string | null
          created_at: string
          id: string
          job_title: string | null
          name: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliation?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliation?: string | null
          created_at?: string
          id?: string
          job_title?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      punch_groups: {
        Row: {
          affiliation: string | null
          author: string | null
          contractor: string | null
          created_at: string
          created_by: string
          id: string
          punch_date: string
          punch_time: string | null
          search_vector: unknown
          site_id: string | null
          site_name: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliation?: string | null
          author?: string | null
          contractor?: string | null
          created_at?: string
          created_by: string
          id?: string
          punch_date?: string
          punch_time?: string | null
          search_vector?: unknown
          site_id?: string | null
          site_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliation?: string | null
          author?: string | null
          contractor?: string | null
          created_at?: string
          created_by?: string
          id?: string
          punch_date?: string
          punch_time?: string | null
          search_vector?: unknown
          site_id?: string | null
          site_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "punch_groups_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      punch_groups_orphans: {
        Row: {
          affiliation: string | null
          author: string | null
          contractor: string | null
          created_at: string
          created_by: string
          id: string
          punch_date: string
          punch_time: string | null
          search_vector: unknown
          site_id: string | null
          site_name: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliation?: string | null
          author?: string | null
          contractor?: string | null
          created_at?: string
          created_by: string
          id?: string
          punch_date?: string
          punch_time?: string | null
          search_vector?: unknown
          site_id?: string | null
          site_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliation?: string | null
          author?: string | null
          contractor?: string | null
          created_at?: string
          created_by?: string
          id?: string
          punch_date?: string
          punch_time?: string | null
          search_vector?: unknown
          site_id?: string | null
          site_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      punch_items: {
        Row: {
          after_photo: string | null
          assignee: string | null
          before_photo: string | null
          created_at: string
          due_date: string | null
          group_id: string
          id: string
          issue: string | null
          location: string | null
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          after_photo?: string | null
          assignee?: string | null
          before_photo?: string | null
          created_at?: string
          due_date?: string | null
          group_id: string
          id?: string
          issue?: string | null
          location?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          after_photo?: string | null
          assignee?: string | null
          before_photo?: string | null
          created_at?: string
          due_date?: string | null
          group_id?: string
          id?: string
          issue?: string | null
          location?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "punch_items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "punch_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      punch_items_orphans: {
        Row: {
          after_photo: string | null
          assignee: string | null
          before_photo: string | null
          created_at: string
          due_date: string | null
          group_id: string
          id: string
          issue: string | null
          location: string | null
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          after_photo?: string | null
          assignee?: string | null
          before_photo?: string | null
          created_at?: string
          due_date?: string | null
          group_id: string
          id?: string
          issue?: string | null
          location?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          after_photo?: string | null
          assignee?: string | null
          before_photo?: string | null
          created_at?: string
          due_date?: string | null
          group_id?: string
          id?: string
          issue?: string | null
          location?: string | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_lodgings: {
        Row: {
          created_at: string
          id: string
          lodge_address: string | null
          site_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lodge_address?: string | null
          site_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lodge_address?: string | null
          site_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_lodgings_orphans: {
        Row: {
          created_at: string
          id: string
          lodge_address: string | null
          site_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          lodge_address?: string | null
          site_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          lodge_address?: string | null
          site_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      site_members: {
        Row: {
          created_at: string
          id: string
          role: string
          site_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: string
          site_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          site_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_members_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          address: string | null
          builder: string | null
          company_name: string | null
          created_at: string
          created_by: string | null
          end_date: string | null
          id: string
          manager_name: string | null
          manager_phone: string | null
          name: string
          org_id: string | null
          search_vector: unknown
          source_dataset: string | null
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          builder?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          name: string
          org_id?: string | null
          search_vector?: unknown
          source_dataset?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          builder?: string | null
          company_name?: string | null
          created_at?: string
          created_by?: string | null
          end_date?: string | null
          id?: string
          manager_name?: string | null
          manager_phone?: string | null
          name?: string
          org_id?: string | null
          search_vector?: unknown
          source_dataset?: string | null
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sites_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      worklog_manpower: {
        Row: {
          id: string
          is_custom: boolean | null
          locked: boolean | null
          work_hours: number
          worker_name: string
          worklog_id: string
        }
        Insert: {
          id?: string
          is_custom?: boolean | null
          locked?: boolean | null
          work_hours?: number
          worker_name: string
          worklog_id: string
        }
        Update: {
          id?: string
          is_custom?: boolean | null
          locked?: boolean | null
          work_hours?: number
          worker_name?: string
          worklog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worklog_manpower_worklog_id_fkey"
            columns: ["worklog_id"]
            isOneToOne: false
            referencedRelation: "worklogs"
            referencedColumns: ["id"]
          },
        ]
      }
      worklog_manpower_orphans: {
        Row: {
          id: string
          is_custom: boolean | null
          locked: boolean | null
          work_hours: number
          worker_name: string
          worklog_id: string
        }
        Insert: {
          id?: string
          is_custom?: boolean | null
          locked?: boolean | null
          work_hours?: number
          worker_name: string
          worklog_id: string
        }
        Update: {
          id?: string
          is_custom?: boolean | null
          locked?: boolean | null
          work_hours?: number
          worker_name?: string
          worklog_id?: string
        }
        Relationships: []
      }
      worklog_materials: {
        Row: {
          id: string
          name: string
          qty: number
          worklog_id: string
        }
        Insert: {
          id?: string
          name: string
          qty?: number
          worklog_id: string
        }
        Update: {
          id?: string
          name?: string
          qty?: number
          worklog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worklog_materials_worklog_id_fkey"
            columns: ["worklog_id"]
            isOneToOne: false
            referencedRelation: "worklogs"
            referencedColumns: ["id"]
          },
        ]
      }
      worklog_materials_orphans: {
        Row: {
          id: string
          name: string
          qty: number
          worklog_id: string
        }
        Insert: {
          id?: string
          name: string
          qty?: number
          worklog_id: string
        }
        Update: {
          id?: string
          name?: string
          qty?: number
          worklog_id?: string
        }
        Relationships: []
      }
      worklog_worksets: {
        Row: {
          block: string | null
          dong: string | null
          floor: string | null
          id: string
          member: string | null
          process: string | null
          work_type: string | null
          worklog_id: string
        }
        Insert: {
          block?: string | null
          dong?: string | null
          floor?: string | null
          id?: string
          member?: string | null
          process?: string | null
          work_type?: string | null
          worklog_id: string
        }
        Update: {
          block?: string | null
          dong?: string | null
          floor?: string | null
          id?: string
          member?: string | null
          process?: string | null
          work_type?: string | null
          worklog_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worklog_worksets_worklog_id_fkey"
            columns: ["worklog_id"]
            isOneToOne: false
            referencedRelation: "worklogs"
            referencedColumns: ["id"]
          },
        ]
      }
      worklog_worksets_orphans: {
        Row: {
          block: string | null
          dong: string | null
          floor: string | null
          id: string
          member: string | null
          process: string | null
          work_type: string | null
          worklog_id: string
        }
        Insert: {
          block?: string | null
          dong?: string | null
          floor?: string | null
          id?: string
          member?: string | null
          process?: string | null
          work_type?: string | null
          worklog_id: string
        }
        Update: {
          block?: string | null
          dong?: string | null
          floor?: string | null
          id?: string
          member?: string | null
          process?: string | null
          work_type?: string | null
          worklog_id?: string
        }
        Relationships: []
      }
      worklogs: {
        Row: {
          created_at: string
          created_by: string
          dept: string | null
          id: string
          search_vector: unknown
          site_id: string
          site_name: string
          status: string
          updated_at: string
          version: number
          weather: string | null
          work_date: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dept?: string | null
          id?: string
          search_vector?: unknown
          site_id: string
          site_name: string
          status?: string
          updated_at?: string
          version?: number
          weather?: string | null
          work_date: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dept?: string | null
          id?: string
          search_vector?: unknown
          site_id?: string
          site_name?: string
          status?: string
          updated_at?: string
          version?: number
          weather?: string | null
          work_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "worklogs_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      worklogs_orphans: {
        Row: {
          created_at: string
          created_by: string
          dept: string | null
          id: string
          search_vector: unknown
          site_id: string
          site_name: string
          status: string
          updated_at: string
          version: number
          weather: string | null
          work_date: string
        }
        Insert: {
          created_at?: string
          created_by: string
          dept?: string | null
          id?: string
          search_vector?: unknown
          site_id: string
          site_name: string
          status?: string
          updated_at?: string
          version?: number
          weather?: string | null
          work_date: string
        }
        Update: {
          created_at?: string
          created_by?: string
          dept?: string | null
          id?: string
          search_vector?: unknown
          site_id?: string
          site_name?: string
          status?: string
          updated_at?: string
          version?: number
          weather?: string | null
          work_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      auto_link_pending_role_assignment: {
        Args: { _assignment_id: string }
        Returns: {
          created_at: string
          id: string
          linked_user_id: string | null
          note: string | null
          reserved_email: string | null
          reserved_name: string
          reserved_role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
      }
      can_manage_site: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
      can_access_site: {
        Args: { _site_id: string; _user_id?: string }
        Returns: boolean
      }
      get_punch_group_site_id: { Args: { _group_id: string }; Returns: string }
      get_worklog_site_id: { Args: { _worklog_id: string }; Returns: string }
      admin_approve_signup_request: {
        Args: {
          _request_id: string
          _assigned_role?: Database["public"]["Enums"]["app_role"] | null
          _assigned_org_id?: string | null
          _admin_note?: string | null
        }
        Returns: {
          admin_note: string | null
          assigned_org_id: string | null
          created_at: string
          email: string
          id: string
          job_title: string | null
          name: string
          phone: string | null
          request_type: string
          requested_company_name: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
      }
      admin_reject_signup_request: {
        Args: {
          _request_id: string
          _admin_note?: string | null
        }
        Returns: {
          admin_note: string | null
          assigned_org_id: string | null
          created_at: string
          email: string
          id: string
          job_title: string | null
          name: string
          phone: string | null
          request_type: string
          requested_company_name: string | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_pending_role_assignment: {
        Args: { _assignment_id: string; _target_user_id: string }
        Returns: {
          created_at: string
          id: string
          linked_user_id: string | null
          note: string | null
          reserved_email: string | null
          reserved_name: string
          reserved_role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
      }
      list_admin_auth_accounts: {
        Args: Record<PropertyKey, never>
        Returns: {
          current_role: Database["public"]["Enums"]["app_role"]
          email: string | null
          profile_name: string | null
          user_id: string
        }[]
      }
      list_signup_partner_companies: {
        Args: Record<PropertyKey, never>
        Returns: {
          company_name: string
        }[]
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_site_member: {
        Args: { _site_id: string; _user_id: string }
        Returns: boolean
      }
      search_header_unified: {
        Args: { query_text: string; result_limit?: number }
        Returns: {
          entity_type: string
          id: string
          route: string
          score: number
          site_id: string
          site_name: string
          status: string
          subtitle: string
          title: string
          work_date: string
        }[]
      }
      unlink_pending_role_assignment: {
        Args: { _assignment_id: string }
        Returns: {
          created_at: string
          id: string
          linked_user_id: string | null
          note: string | null
          reserved_email: string | null
          reserved_name: string
          reserved_role: Database["public"]["Enums"]["app_role"]
          status: string
          updated_at: string
        }
      }
    }
    Enums: {
      app_role: "admin" | "worker" | "partner" | "manager"
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
      app_role: ["admin", "worker", "partner", "manager"],
    },
  },
} as const
