export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; display_name: string | null; email: string; phone: string | null; locale: string; created_at: string; updated_at: string }
        Insert: { id: string; display_name?: string | null; email: string; phone?: string | null; locale?: string }
        Update: { display_name?: string | null; email?: string; phone?: string | null; locale?: string }
        Relationships: []
      }
      events: {
        Row: { id: string; organizer_id: string; title: string; description: string | null; slug: string; event_date: string; start_time: string; travel_time_minutes: number; center_lat: number; center_lng: number; center_address: string; radius_km: number; type: 'open' | 'closed'; status: 'draft' | 'registration_open' | 'confirmed' | 'closed' | 'active' | 'completed' | 'cancelled'; invite_code: string; invitation_policy: 'organizer_only' | 'participants_allowed'; afterparty_address: string | null; afterparty_lat: number | null; afterparty_lng: number | null; welcome_card_enabled: boolean; registration_deadline: string; created_at: string; updated_at: string }
        Insert: { id?: string; organizer_id: string; title: string; description?: string | null; slug: string; event_date: string; start_time: string; travel_time_minutes: number; center_lat: number; center_lng: number; center_address: string; radius_km?: number; type?: 'open' | 'closed'; status?: 'draft' | 'registration_open' | 'confirmed' | 'closed' | 'active' | 'completed' | 'cancelled'; invite_code: string; invitation_policy?: 'organizer_only' | 'participants_allowed'; afterparty_address?: string | null; afterparty_lat?: number | null; afterparty_lng?: number | null; welcome_card_enabled?: boolean; registration_deadline: string }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
        Relationships: [{ foreignKeyName: 'events_organizer_id_fkey'; columns: ['organizer_id']; isOneToOne: false; referencedRelation: 'profiles'; referencedColumns: ['id'] }]
      }
      duos: {
        Row: { id: string; event_id: string; person1_id: string; person2_id: string | null; address_line: string; city: string; postal_code: string; country: string; lat: number; lng: number; status: 'pending_payment' | 'registered' | 'waitlisted' | 'confirmed' | 'cancelled'; payment_intent_id: string | null; is_organizer_duo: boolean; created_at: string }
        Insert: { id?: string; event_id: string; person1_id: string; person2_id?: string | null; address_line: string; city: string; postal_code: string; country?: string; lat: number; lng: number; status?: 'pending_payment' | 'registered' | 'waitlisted' | 'confirmed' | 'cancelled'; payment_intent_id?: string | null; is_organizer_duo?: boolean }
        Update: Partial<Database['public']['Tables']['duos']['Insert']>
        Relationships: [{ foreignKeyName: 'duos_event_id_fkey'; columns: ['event_id']; isOneToOne: false; referencedRelation: 'events'; referencedColumns: ['id'] }]
      }
      invitations: {
        Row: { id: string; event_id: string; invited_by_duo_id: string; invitee_name: string; invitee_email: string; personal_message: string | null; ref_code: string; status: 'sent' | 'opened' | 'registered'; created_at: string }
        Insert: { id?: string; event_id: string; invited_by_duo_id: string; invitee_name: string; invitee_email: string; personal_message?: string | null; ref_code: string; status?: 'sent' | 'opened' | 'registered' }
        Update: Partial<Database['public']['Tables']['invitations']['Insert']>
        Relationships: [{ foreignKeyName: 'invitations_event_id_fkey'; columns: ['event_id']; isOneToOne: false; referencedRelation: 'events'; referencedColumns: ['id'] }]
      }
    }
    Views: Record<string, never>
    Functions: {
      process_duo_registration: {
        Args: { p_duo_id: string }
        Returns: { action: string; total_paid: number; duos_needed: number }
      }
    }
    Enums: {
      event_type: 'open' | 'closed'
      event_status: 'draft' | 'registration_open' | 'confirmed' | 'closed' | 'active' | 'completed' | 'cancelled'
      duo_status: 'pending_payment' | 'registered' | 'waitlisted' | 'confirmed' | 'cancelled'
      invitation_policy: 'organizer_only' | 'participants_allowed'
      invitation_status: 'sent' | 'opened' | 'registered'
    }
  }
}
