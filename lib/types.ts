/** Row shapes for every table in db/schema.sql. */

export type UserRole = 'CLIENT' | 'TRADESPERSON' | 'ADMIN'

export type JobStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'SHORTLISTING'
  | 'AWARDED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'EXPIRED'

export type JobSize = 'ODD_JOB' | 'HALF_DAY' | 'FULL_DAY' | 'MULTI_DAY' | 'LARGE_PROJECT'
export type JobUrgency = 'EMERGENCY' | 'THIS_WEEK' | 'NEXT_FORTNIGHT' | 'FLEXIBLE'
export type BidStatus = 'PENDING' | 'SHORTLISTED' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN' | 'EXPIRED'
export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'HELD_IN_ESCROW'
  | 'RELEASED'
  | 'REFUNDED'
  | 'FAILED'
  | 'CANCELLED'
export type PaymentType =
  | 'JOB_DEPOSIT'
  | 'JOB_BALANCE'
  | 'LEAD_CREDITS'
  | 'MEMBERSHIP'
  | 'FEATURED_LISTING'
export type MembershipTier = 'FREE' | 'SUBBIE' | 'GUVNOR' | 'MASTER'
export type ReviewDirection = 'CLIENT_TO_TRADIE' | 'TRADIE_TO_CLIENT'
export type ReviewStatus = 'PUBLISHED' | 'PENDING_MODERATION' | 'HIDDEN'
export type VerificationStatus = 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED'
export type CreditReason =
  | 'PURCHASE'
  | 'BID_UNLOCK'
  | 'REFUND'
  | 'ADMIN_ADJUSTMENT'
  | 'SIGNUP_BONUS'
  | 'MEMBERSHIP_ALLOWANCE'
export type HomegirlsStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'SUSPENDED'

/**
 * Payout leg of an escrowed job payment.
 *   pending_account — released by the customer, but the tradie has no payout
 *                     account yet; swept automatically once they onboard
 *   paid            — transferred to the connected account
 *   failed          — Stripe rejected the transfer; see transfer_error
 *   reversed        — transfer was reversed after the fact
 */
export type TransferStatus = 'pending_account' | 'paid' | 'failed' | 'reversed'

export interface UserRow {
  id: string
  email: string
  password: string
  name: string
  role: UserRole
  phone: string | null
  avatar_url: string | null
  suburb: string | null
  city: string | null
  state: string | null
  postcode: string | null
  is_suspended: boolean
  suspended_at: Date | null
  suspended_reason: string | null
  last_login_at: Date | null
  client_rating: number
  client_review_count: number
  stripe_customer_id: string | null
  created_at: Date
  updated_at: Date
}

export type PublicUser = Omit<UserRow, 'password'>

export interface TradespersonRow {
  id: string
  user_id: string
  slug: string
  business_name: string
  tagline: string | null
  bio: string | null
  logo_url: string | null
  cover_url: string | null
  gallery: string[]
  trades: string[]
  handyman_services: string[]
  accepts_small_jobs: boolean
  abn: string | null
  licence_number: string | null
  licence_expiry: Date | null
  insurer_name: string | null
  insurance_expiry: Date | null
  years_experience: number | null
  verification_status: VerificationStatus
  verified_at: Date | null
  verification_notes: string | null
  hourly_rate: number | null
  callout_fee: number | null
  minimum_charge: number | null
  free_quotes: boolean
  service_areas: string[]
  base_suburb: string | null
  city: string | null
  state: string | null
  postcode: string | null
  travel_radius_km: number
  available_now: boolean
  available_weekends: boolean
  emergency_callouts: boolean
  is_homegirl: boolean
  membership_tier: MembershipTier
  membership_started_at: Date | null
  membership_ends_at: Date | null
  stripe_account_id: string | null
  stripe_subscription_id: string | null
  stripe_onboarded: boolean
  stripe_charges_enabled: boolean
  stripe_payouts_enabled: boolean
  stripe_details_submitted: boolean
  stripe_requirements: string[]
  stripe_onboarded_at: Date | null
  stripe_account_synced_at: Date | null
  lead_credits: number
  average_rating: number
  total_reviews: number
  rating_quality: number
  rating_punctuality: number
  rating_value: number
  rating_communication: number
  rating_tidiness: number
  completed_jobs: number
  total_bids: number
  won_bids: number
  response_rate: number
  response_time_mins: number | null
  profile_views: number
  is_featured: boolean
  featured_until: Date | null
  created_at: Date
  updated_at: Date
}

/** A tradie row joined with the owning user account. */
export interface TradieProfile extends TradespersonRow {
  name: string
  email: string
  user_phone: string | null
  avatar_url: string | null
  is_suspended: boolean
}

export interface JobRow {
  id: string
  reference: string
  client_id: string
  title: string
  description: string
  category: string
  photos: string[]
  budget_min: number | null
  budget_max: number | null
  job_size: JobSize
  urgency: JobUrgency
  address: string | null
  suburb: string
  city: string
  state: string
  postcode: string
  status: JobStatus
  preferred_date: Date | null
  prefer_homegirl: boolean
  max_bids: number
  bid_count: number
  view_count: number
  bids_close_at: Date | null
  accepted_bid_id: string | null
  awarded_at: Date | null
  completed_at: Date | null
  cancelled_at: Date | null
  cancel_reason: string | null
  created_at: Date
  updated_at: Date
}

export interface JobWithClient extends JobRow {
  client_name: string
  client_email: string
  client_rating: number
  client_review_count: number
  client_suburb: string | null
}

export interface BidRow {
  id: string
  job_id: string
  tradesperson_id: string
  user_id: string
  amount: number
  message: string
  estimated_days: number | null
  estimated_hours: number | null
  includes_materials: boolean
  includes_gst: boolean
  available_from: Date | null
  warranty_months: number | null
  status: BidStatus
  is_shortlisted: boolean
  seen_by_client: boolean
  credits_spent: number
  shortlisted_at: Date | null
  accepted_at: Date | null
  declined_at: Date | null
  withdrawn_at: Date | null
  created_at: Date
  updated_at: Date
}

/** A bid joined with enough of the bidder's profile to compare offers. */
export interface BidWithTradie extends BidRow {
  slug: string
  business_name: string
  tradie_name: string
  logo_url: string | null
  average_rating: number
  total_reviews: number
  completed_jobs: number
  verification_status: VerificationStatus
  is_homegirl: boolean
  years_experience: number | null
  base_suburb: string | null
  membership_tier: MembershipTier
}

export interface BidWithJob extends BidRow {
  job_title: string
  job_reference: string
  job_status: JobStatus
  job_suburb: string
  job_category: string
  job_budget_min: number | null
  job_budget_max: number | null
}

export interface ReviewRow {
  id: string
  job_id: string
  direction: ReviewDirection
  reviewer_id: string
  reviewee_id: string
  tradesperson_id: string | null
  rating: number
  comment: string | null
  rating_quality: number | null
  rating_punctuality: number | null
  rating_value: number | null
  rating_communication: number | null
  rating_tidiness: number | null
  tags: string[]
  response: string | null
  responded_at: Date | null
  status: ReviewStatus
  is_flagged: boolean
  flag_reason: string | null
  moderated_at: Date | null
  moderator_note: string | null
  created_at: Date
  updated_at: Date
}

export interface ReviewWithPeople extends ReviewRow {
  reviewer_name: string
  reviewer_suburb: string | null
  reviewee_name: string
  job_title: string
  job_reference: string
  job_category: string
  business_name: string | null
  slug: string | null
}

export interface PaymentRow {
  id: string
  job_id: string | null
  user_id: string
  type: PaymentType
  description: string | null
  amount: number
  platform_fee: number
  tradesperson_amount: number
  currency: string
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  stripe_transfer_id: string | null
  stripe_invoice_id: string | null
  receipt_url: string | null
  transfer_group: string | null
  destination_account_id: string | null
  transfer_status: TransferStatus | null
  transferred_at: Date | null
  transfer_error: string | null
  status: PaymentStatus
  held_at: Date | null
  released_at: Date | null
  refunded_at: Date | null
  failure_message: string | null
  created_at: Date
  updated_at: Date
}

export interface PaymentWithContext extends PaymentRow {
  user_name: string
  user_email: string
  job_title: string | null
  job_reference: string | null
}

export interface CreditLedgerRow {
  id: string
  tradesperson_id: string
  delta: number
  balance_after: number
  reason: CreditReason
  note: string | null
  job_id: string | null
  payment_id: string | null
  created_at: Date
}

export interface MessageRow {
  id: string
  job_id: string
  sender_id: string
  recipient_id: string
  body: string
  is_read: boolean
  read_at: Date | null
  created_at: Date
}

export interface MessageWithSender extends MessageRow {
  sender_name: string
  sender_role: UserRole
}

export interface NotificationRow {
  id: string
  user_id: string
  title: string
  body: string | null
  link: string | null
  kind: string
  is_read: boolean
  created_at: Date
}

export interface HomegirlsMemberRow {
  id: string
  tradesperson_id: string
  status: HomegirlsStatus
  joined_at: Date | null
  approved_by: string | null
  intro: string | null
  mentor_available: boolean
  seeking_mentor: boolean
  created_at: Date
  updated_at: Date
}

export interface HomegirlsMemberWithTradie extends HomegirlsMemberRow {
  slug: string
  business_name: string
  tradie_name: string
  trades: string[]
  base_suburb: string | null
  state: string | null
  average_rating: number
  total_reviews: number
  completed_jobs: number
  years_experience: number | null
  logo_url: string | null
  verification_status: VerificationStatus
}

export interface HomegirlsPostRow {
  id: string
  author_id: string | null
  title: string
  body: string
  category: string
  is_pinned: boolean
  is_hidden: boolean
  created_at: Date
  updated_at: Date
}

export interface HomegirlsPostWithAuthor extends HomegirlsPostRow {
  author_name: string | null
  author_business: string | null
  author_slug: string | null
}

export interface SiteSettingRow {
  key: string
  value: string
  label: string | null
  group: string
  updated_at: Date
}

export interface AuditLogRow {
  id: string
  actor_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  detail: string | null
  ip_address: string | null
  created_at: Date
}

export interface AuditLogWithActor extends AuditLogRow {
  actor_name: string | null
  actor_email: string | null
}

export interface ContactEnquiryRow {
  id: string
  name: string
  email: string
  phone: string | null
  subject: string | null
  message: string
  suburb: string | null
  is_handled: boolean
  handled_at: Date | null
  notes: string | null
  created_at: Date
}
