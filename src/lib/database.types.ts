/**
 * Types de la base, écrits à la main d'après
 * supabase/migrations/20261115120000_v1_schema.sql.
 * Une fois la migration appliquée, tu peux les régénérer avec :
 *   npx supabase gen types typescript --project-id <id> > src/lib/database.types.ts
 */

export type Gender = 'homme' | 'femme';
export type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';
export type MemberStatus = 'pending' | 'accepted' | 'declined' | 'left' | 'removed';
export type MemberRole = 'organizer' | 'co_organizer' | 'member';
export type GroupStatus = 'open' | 'full' | 'cancelled' | 'done';
export type ModerationStatus = 'pending' | 'approved' | 'rejected';
export type PartnerStatus = 'pending' | 'approved' | 'suspended';
export type Universe = 'sport' | 'resto' | 'cine' | 'soiree' | 'jeux' | 'nature' | 'bienetre';
export type Level = 'C' | 'C+' | 'B' | 'B+' | 'A' | 'A+';

type Table<Row, Required extends keyof Row, Optional extends keyof Row = never> = {
  Row: Row;
  Insert: Pick<Row, Required> & Partial<Pick<Row, Optional>>;
  Update: Partial<Row>;
  Relationships: [];
};

export type Profile = {
  id: string;
  first_name: string;
  birth_date: string;
  show_age: boolean;
  gender: Gender;
  city: string;
  bio: string | null;
  studies: string | null;
  job: string | null;
  lifestyle: string[];
  interests: string[];
  app_language: 'dar' | 'fr' | 'en';
  verification_status: VerificationStatus;
  selfie_path: string | null;
  selfie_consent_at: string | null;
  is_premium: boolean;
  rating_avg: number;
  rating_count: number;
  outings_count: number;
  attendance_rate: number;
  created_at: string;
  updated_at: string;
};

export type ProfilePrivate = {
  user_id: string;
  residence: string | null;
  height_cm: number | null;
  relationship_status: 'celibataire' | 'en_couple' | 'marie' | 'non_precise' | null;
  updated_at: string;
};

export type ProfilePhoto = {
  id: string;
  user_id: string;
  path: string;
  position: number;
  created_at: string;
};

export type Partner = {
  id: string;
  owner_id: string;
  name: string;
  universe: Universe;
  address: string | null;
  lat: number | null;
  lng: number | null;
  logo_path: string | null;
  discount_pct: number;
  status: PartnerStatus;
  created_at: string;
};

export type PartnerOffer = {
  id: string;
  partner_id: string;
  title: string;
  subcategory: string | null;
  starts_at: string;
  duration_min: number;
  capacity: number;
  price_mad: number | null;
  boosted: boolean;
  booked: boolean;
  created_at: string;
};

export type Group = {
  id: string;
  organizer_id: string;
  universe: Universe;
  subcategory: string | null;
  title: string;
  description: string | null;
  starts_at: string;
  duration_min: number;
  place_name: string;
  partner_id: string | null;
  offer_id: string | null;
  lat: number | null;
  lng: number | null;
  capacity: number;
  level: Level | null;
  women_only: boolean;
  budget: string | null;
  status: GroupStatus;
  created_at: string;
};

export type GroupMember = {
  group_id: string;
  user_id: string;
  status: MemberStatus;
  role: MemberRole;
  note: string | null;
  confirmed_at: string | null;
  checked_in: boolean;
  no_show: boolean;
  requested_at: string;
  decided_at: string | null;
};

export type Message = {
  id: string;
  group_id: string;
  sender_id: string;
  body: string;
  kind: 'text' | 'image' | 'video' | 'audio';
  media_path: string | null;
  duration_ms: number | null;
  created_at: string;
};

export type Rating = {
  id: string;
  group_id: string;
  rater_id: string;
  rated_id: string;
  stars: number;
  comment: string | null;
  reason: string | null;
  moderation_status: ModerationStatus;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  reported_user_id: string | null;
  group_id: string | null;
  message_id: string | null;
  reason: 'comportement' | 'faux_profil' | 'harcelement' | 'absence' | 'contenu' | 'autre';
  details: string | null;
  status: ModerationStatus;
  created_at: string;
};

export type AttendanceDispute = {
  id: string;
  group_id: string;
  user_id: string;
  message: string;
  status: ModerationStatus;
  created_at: string;
};

export type Block = { blocker_id: string; blocked_id: string; created_at: string };

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  pushed_at: string | null;
  created_at: string;
};

export type PushToken = { token: string; user_id: string; platform: 'ios' | 'android' | null; updated_at: string };

export type Database = {
  public: {
    Tables: {
      profiles: Table<
        Profile,
        'id' | 'first_name' | 'birth_date' | 'gender',
        'show_age' | 'city' | 'bio' | 'studies' | 'job' | 'lifestyle' | 'interests' | 'app_language' | 'selfie_path' | 'selfie_consent_at'
      >;
      profile_private: Table<ProfilePrivate, 'user_id', 'residence' | 'height_cm' | 'relationship_status'>;
      profile_photos: Table<ProfilePhoto, 'user_id' | 'path', 'position'>;
      partners: Table<Partner, 'owner_id' | 'name' | 'universe', 'address' | 'lat' | 'lng' | 'logo_path' | 'discount_pct'>;
      partner_offers: Table<
        PartnerOffer,
        'partner_id' | 'title' | 'starts_at',
        'subcategory' | 'duration_min' | 'capacity' | 'price_mad' | 'boosted' | 'booked'
      >;
      groups: Table<
        Group,
        'organizer_id' | 'universe' | 'title' | 'starts_at' | 'place_name' | 'capacity',
        'subcategory' | 'description' | 'duration_min' | 'partner_id' | 'offer_id' | 'lat' | 'lng' | 'level' | 'women_only' | 'budget'
      >;
      group_members: Table<GroupMember, 'group_id' | 'user_id'>;
      group_messages: Table<Message, 'group_id' | 'sender_id', 'body' | 'kind' | 'media_path' | 'duration_ms'>;
      ratings: Table<Rating, 'group_id' | 'rater_id' | 'rated_id' | 'stars', 'comment' | 'reason'>;
      reports: Table<Report, 'reporter_id' | 'reason', 'reported_user_id' | 'group_id' | 'message_id' | 'details'>;
      blocks: Table<Block, 'blocker_id' | 'blocked_id'>;
      notifications: Table<AppNotification, 'user_id' | 'type', 'payload' | 'read_at'>;
      push_tokens: Table<PushToken, 'token' | 'user_id', 'platform'>;
      admins: Table<{ user_id: string; created_at: string }, 'user_id'>;
      group_secrets: Table<{ group_id: string; check_in_code: string }, 'group_id'>;
      attendance_disputes: Table<AttendanceDispute, 'group_id' | 'user_id' | 'message'>;
      saved_groups: Table<{ user_id: string; group_id: string; created_at: string }, 'user_id' | 'group_id'>;
    };
    Views: { [_ in never]: never };
    Functions: {
      request_join: { Args: { p_group: string; p_note?: string | null }; Returns: MemberStatus };
      respond_join: { Args: { p_group: string; p_user: string; p_accept: boolean }; Returns: MemberStatus };
      leave_group: { Args: { p_group: string }; Returns: undefined };
      confirm_presence: { Args: { p_group: string }; Returns: undefined };
      delete_my_account: { Args: Record<string, never>; Returns: undefined };
      register_push_token: { Args: { p_token: string; p_platform: 'ios' | 'android' }; Returns: undefined };
      mark_attendance: { Args: { p_group: string; p_user: string; p_present: boolean }; Returns: undefined };
      contest_no_show: { Args: { p_group: string; p_message: string }; Returns: undefined };
      admin_pending_selfies: { Args: Record<string, never>; Returns: { id: string; first_name: string; selfie_path: string; updated_at: string }[] };
      admin_review_selfie: { Args: { p_user: string; p_approve: boolean }; Returns: string | null };
      admin_review_rating: { Args: { p_rating: string; p_approve: boolean }; Returns: undefined };
      admin_resolve_report: { Args: { p_report: string; p_valid: boolean }; Returns: undefined };
      admin_resolve_dispute: { Args: { p_dispute: string; p_accept: boolean }; Returns: undefined };
      admin_review_partner: { Args: { p_partner: string; p_approve: boolean }; Returns: undefined };
      get_my_profile: { Args: Record<string, never>; Returns: Profile[] };
      public_age: { Args: { p_user: string }; Returns: number | null };
      my_conversations: { Args: Record<string, never>; Returns: { group_id: string; body: string; created_at: string }[] };
      partner_check_in: {
        Args: { p_group: string; p_code: string };
        Returns: { title: string; starts_at: string; members: number; discount_pct: number };
      };
    };
    Enums: {
      gender: Gender;
      verification_status: VerificationStatus;
      member_status: MemberStatus;
      member_role: MemberRole;
      group_status: GroupStatus;
      moderation_status: ModerationStatus;
      partner_status: PartnerStatus;
    };
    CompositeTypes: { [_ in never]: never };
  };
};
