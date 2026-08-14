// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate with `supabase gen types typescript` once a project is linked.

export type CategoryKind = 'pro' | 'collab' | 'both';
export type PriceUnit = 'hour' | 'day' | 'project' | 'photo' | 'video' | 'from' | 'negotiable';

export type Category = {
  id: string;
  slug: string;
  label: string;
  icon: string;
  kind: CategoryKind;
  created_at: string;
};

export type Profile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string | null;
  city: string | null;
  bio: string | null;
  is_pro_mode: boolean;
  is_collab_mode: boolean;
  is_admin: boolean;
  expo_push_token: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfessionalProfile = {
  id: string;
  profile_id: string;
  headline: string;
  primary_category_id: string | null;
  secondary_category_ids: string[];
  response_time_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  professional_profile_id: string;
  title: string;
  description: string | null;
  price_amount: number | null;
  price_unit: PriceUnit;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
};

export type CreatorProfile = {
  id: string;
  profile_id: string;
  interests: string[];
  preferred_content_types: string[];
  created_at: string;
  updated_at: string;
};

// Shapes returned by embedded `.select('*, relation(*)')` queries.
export type ProfessionalProfileWithJoins = ProfessionalProfile & {
  profiles: Profile | null;
  services: Service[];
};

export type CreatorProfileWithJoins = CreatorProfile & {
  profiles: Profile | null;
};

export type Conversation = {
  id: string;
  created_at: string;
};

export type ConversationMember = {
  conversation_id: string;
  profile_id: string;
  joined_at: string;
};

export type Message = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type BookingStatus = 'requested' | 'accepted' | 'declined' | 'cancelled' | 'completed';

export type Booking = {
  id: string;
  service_id: string;
  professional_profile_id: string;
  client_id: string;
  requested_date: string;
  requested_time: string | null;
  location: string | null;
  message: string | null;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

export type BookingWithJoins = Booking & {
  services: Service | null;
  professional_profiles: (ProfessionalProfile & { profiles: Profile | null }) | null;
  profiles: Profile | null; // the client
};

export type Review = {
  id: string;
  booking_id: string | null;
  collaboration_id: string | null;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

export type ProfileRating = {
  profile_id: string;
  avg_rating: number;
  review_count: number;
};

export type CollaborationType = 'collaboration' | 'exchange' | 'free' | 'paid' | 'group';
export type CollaborationStatus = 'open' | 'matched' | 'completed' | 'cancelled';
export type ApplicationStatus = 'pending' | 'accepted' | 'declined';

export type Collaboration = {
  id: string;
  creator_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  collaboration_type: CollaborationType;
  location: string | null;
  scheduled_date: string | null;
  budget_amount: number | null;
  status: CollaborationStatus;
  created_at: string;
  updated_at: string;
};

export type CollaborationWithJoins = Collaboration & {
  profiles: Profile | null;
  categories: Category | null;
};

export type Application = {
  id: string;
  collaboration_id: string;
  applicant_id: string;
  message: string | null;
  status: ApplicationStatus;
  created_at: string;
};

export type ApplicationWithJoins = Application & {
  profiles: Profile | null;
  collaborations: Collaboration | null;
};

export type WeeklyAvailability = {
  id: string;
  professional_profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
};

export type AvailabilityBlock = {
  id: string;
  professional_profile_id: string;
  blocked_date: string;
  reason: string | null;
};

export type MediaType = 'photo' | 'video';

export type PortfolioItem = {
  id: string;
  professional_profile_id: string;
  media_url: string;
  media_type: MediaType;
  title: string | null;
  created_at: string;
};

export type UserBlock = {
  id: string;
  blocker_id: string;
  blocked_id: string;
  created_at: string;
};

export type Notification = {
  id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string | null;
  related_id: string | null;
  read: boolean;
  created_at: string;
};

export type Report = {
  id: string;
  reporter_id: string;
  reported_profile_id: string;
  reason: string;
  details: string | null;
  created_at: string;
};

export type Favorite = {
  id: string;
  owner_id: string;
  favorited_profile_id: string | null;
  favorited_collaboration_id: string | null;
  created_at: string;
};

export type FavoriteWithJoins = Favorite & {
  profiles: Profile | null;
  collaborations: Collaboration | null;
};
