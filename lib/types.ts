export type Role = "admin" | "customer";

export interface User {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  phone: string | null;
  role: Role;
  notes: string | null;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string;
  cover_image: string;
  sort_order: number;
  published: number;
  watermark: number;
  downloads: number;
  created_at: string;
}

export interface GalleryImage {
  id: string;
  category_id: string;
  url: string;
  storage_key: string | null;
  title: string;
  description: string;
  sort_order: number;
  is_cover: number;
  downloadable: number | null;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  price: number;
  deposit_percent: number;
  description: string;
  features: string;
  duration_hours: number;
  edited_photos: number;
  discount_percent: number;
  badge: string | null;
  active: number;
  sort_order: number;
  extra_photo_price: number;
  extra_hour_price: number;
  addons: string;
  quote_only: number;
}

export type BookingStatus =
  | "pending"
  | "approved"
  | "awaiting_payment"
  | "paid"
  | "completed"
  | "rejected"
  | "cancelled"
  | "awaiting_confirmation"
  | "reschedule_requested";

export type PaymentStatus = "unpaid" | "deposit_paid" | "paid" | "refunded";

export interface Location {
  id: string;
  slug: string;
  name: string;
  area: string;
  description: string;
  styles: string;
  cover_image: string;
  images: string;
  maps_url: string;
  travel_info: string;
  requirements: string;
  permit_status: "unchecked" | "required" | "approved" | "not_required";
  venue_approved: number;
  travel_fee: number;
  min_spend: number;
  available: number;
  suggested: number;
  sort_order: number;
  created_at: string;
}

export interface ServiceArea {
  id: string;
  name: string;
  postcodes: string;
  base_fee: number;
  per_km: number;
  min_spend: number;
  free_within_km: number;
  notes: string;
  active: number;
}

export interface RescheduleRequest {
  id: string;
  booking_id: string;
  requested_by: string;
  preferred_date: string;
  preferred_time: string;
  reason: string;
  weather: number;
  status: "pending" | "approved" | "declined";
  admin_note: string;
  created_at: string;
}

export interface Booking {
  id: string;
  code: string;
  user_id: string | null;
  category_id: string;
  package_id: string;
  customer_name: string;
  email: string;
  phone: string;
  location: string;
  location_id: string | null;
  maps_url: string;
  location_status: "pending" | "approved" | "custom_pending" | "rejected" | "suggested";
  wants_recommendations: number;
  permit_status: string;
  location_note: string;
  travel_fee: number;
  base_amount: number;
  addon_total: number;
  extras: string;
  discount_code: string;
  discount_amount: number;
  people: number;
  date: string;
  time_slot: string;
  notes: string;
  reference_images: string;
  admin_notes: string;
  amount: number;
  deposit_amount: number;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  created_at: string;
  updated_at: string;
  // joined
  category_name?: string;
  package_name?: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  order_id: string;
  provider: string;
  method: string | null;
  kind: "deposit" | "full";
  gross_amount: number;
  status: string;
  raw: string | null;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  weekday: number;
  is_working: number;
  start_time: string;
  end_time: string;
  slot_minutes: number;
  capacity: number;
}

export interface BlockedDate {
  date: string;
  reason: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  image: string | null;
  rating: number;
  published: number;
  sort_order: number;
}

export interface Inquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string | null;
  read: number;
  created_at: string;
}

export interface Faq {
  question: string;
  answer: string;
}

export interface SiteSettings {
  brandName: string;
  tagline: string;
  logoImage: string | null;
  heroImage: string;
  heroEyebrow: string;
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutBody: string;
  aboutImage: string;
  aboutStats: { value: string; label: string }[];
  announcement: string;
  announcementActive: boolean;
  email: string;
  phone: string;
  whatsapp: string;
  address: string;
  instagram: string;
  facebook: string;
  pinterest: string;
  featuredCategories: string[];
  instagramImages: string[];
  faqs: Faq[];
  depositPercent: number;
  heroImage2: string;
  heroImage3: string;
  cardEnabled: boolean;
  walletEnabled: boolean;
  bankEnabled: boolean;
  bankDetails: string;
  bankAccountName: string;
  bankBsb: string;
  bankAccountNumber: string;
  payId: string;
  paymentReferenceNote: string;
  currency: string;
  travelPolicy: string;
  rainPolicy: string;
  founderName: string;
  founderRole: string;
  founderIntro: string;
  founderBio: string;
  founderExperience: string;
  founderPortrait: string | null;
  founderVisible: boolean;
  emailSenderName: string;
  emailFrom: string;
  notifyEmail: string;
  emailBookingNotifications: boolean;
  emailCustomerConfirmation: boolean;
  emailPaymentConfirmation: boolean;
  emailGalleryDelivery: boolean;
  emailSignature: string;
  templateBookingConfirmation: string;
  templateBookingNotification: string;
  templatePaymentConfirmation: string;
  templateGalleryDelivery: string;
  templateReschedule: string;
  cancellationPolicy: string;
  privacyPolicy: string;
  termsPolicy: string;
}

export interface PackageAddon {
  id: string;
  name: string;
  price: number;
  note?: string;
}

export interface Promotion {
  id: string;
  code: string;
  label: string;
  kind: "percent" | "fixed";
  value: number;
  min_spend: number;
  starts_at: string;
  ends_at: string;
  usage_limit: number;
  used_count: number;
  active: number;
  note: string;
  created_at: string;
}

export interface PrivateGallery {
  id: string;
  booking_id: string | null;
  customer_name: string;
  customer_email: string;
  title: string;
  token: string;
  images: string;
  cover_image: string;
  note: string;
  expires_at: string;
  downloads: number;
  published: number;
  created_at: string;
}

export interface BookingExtras {
  photos: number;
  hours: number;
  addonIds: string[];
}
