import type { SiteSettings } from "./types";

export function photo(id: string) {
  return `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&q=80`;
}

export const DEFAULT_SETTINGS: SiteSettings = {
  brandName: "Mara's Photography",
  tagline: "An art of remembering.",
  logoImage: null,
  heroImage: photo("1537633552985-df8429e8048b"),
  heroImage2: photo("1583939003579-730e3918a45a"),
  heroImage3: photo("1507525428034-b723cf961d3e"),
  heroEyebrow: "Sydney · Australia · Worldwide",
  heroTitle: "Every moment deserves to be remembered.",
  heroSubtitle:
    "An atelier of intimate, editorial photography — quiet direction, honest light, and images that still feel like you in twenty years.",
  aboutTitle: "A practice built on stillness, light and trust.",
  aboutBody:
    "MARA'S PHOTOGRAPHY is an on-location practice in Sydney, photographing people outdoors in the places they love.\n\nThere is no studio to visit — Mara comes to you, working with natural light and quiet direction to make images that still feel like you in twenty years.",
  aboutImage: photo("1494790108377-be9c29b29330"),
  aboutStats: [],
  founderName: "Mara",
  founderRole: "Photographer & founder",
  founderIntro:
    "I photograph people on location around Sydney — early on a beach, in a terraced street, somewhere that already means something to you.",
  founderBio:
    "Her love for photography began at home, inspired by her father, who was also a photographer. Growing up, she often watched him behind the camera, capturing moments and turning everyday memories into something special. Over time, that inspiration became her own little passion.\n\nWhat started as a hobby led her to pick up a camera and capture her family, everyday moments, and the beauty of nature. As her interest grew, so did her creativity. More recently, she began exploring portrait photography, discovering new ways to capture people's personalities, emotions, and individuality.\n\nToday, photography is more than simply taking pictures. It's her way of preserving moments, expressing creativity, and telling stories through her own perspective.",
  founderExperience: "",
  founderPortrait: null,
  founderVisible: true,
  announcement: "Now taking bookings for the 2026 wedding season — only 8 dates remain.",
  announcementActive: true,
  email: "studio@marasphotography.com",
  phone: "+61 412 400 877",
  whatsapp: "61412400877",
  address: "On location across Sydney, NSW — we travel to you. No fixed studio address.",
  instagram: "https://instagram.com/marasphotography",
  facebook: "https://facebook.com/marasphotography",
  pinterest: "https://pinterest.com/marasphotography",
  featuredCategories: [],
  instagramImages: [
    photo("1494790108377-be9c29b29330"),
    photo("1529626455594-4ff0802cfb7e"),
    photo("1537633552985-df8429e8048b"),
    photo("1583939003579-730e3918a45a"),
    photo("1507525428034-b723cf961d3e"),
    photo("1471922694854-ff1b63b20054"),
  ],
  faqs: [
    {
      question: "How far in advance should I book?",
      answer:
        "Weddings and editorial commissions are usually booked three to nine months ahead. Portraits, couples and family sessions can often be arranged within two to three weeks.",
    },
    {
      question: "What is included in the session fee?",
      answer:
        "Your package includes Mara's time on location, direction on the day, professional retouching and a private online gallery. Travel is quoted upfront; prints and albums are available separately.",
    },
    {
      question: "How long until I receive my photographs?",
      answer:
        "A sneak peek arrives within 72 hours. Full galleries are delivered in 10–14 working days, and premium commissions receive priority delivery within 5 working days.",
    },
    {
      question: "Can we shoot outdoors or at a location we love?",
      answer:
        "Absolutely. We travel across Sydney, the Blue Mountains and beyond. Travel within greater Sydney is included; other locations are quoted at cost.",
    },
    {
      question: "What happens if it rains?",
      answer:
        "We watch the forecast together. If the weather turns, we move indoors or reschedule at no extra cost — your booking carries over to the next available date.",
    },
    {
      question: "Do you offer payment plans?",
      answer:
        "A 30% deposit reserves your date. The balance is due seven days before the session, and instalments can be arranged for premium commissions. All prices are in Australian dollars.",
    },
  ],
  depositPercent: 30,
  cardEnabled: true,
  walletEnabled: true,
  bankEnabled: true,
  bankDetails: "",
  bankAccountName: "",
  bankBsb: "",
  bankAccountNumber: "",
  payId: "",
  paymentReferenceNote: "Use your booking reference as the transfer description so it can be matched.",
  currency: "AUD",
  travelPolicy:
    "Travel within 15 km of the Sydney CBD is included in every session. Beyond that, a travel fee is added to your quote and shown before you submit. Locations outside greater Sydney — the Blue Mountains, the Central Coast, the Southern Highlands — carry a minimum booking value and are quoted individually.",
  emailSenderName: "Mara's Photography",
  emailFrom: "bookings@marasphotography.com",
  notifyEmail: "",
  emailBookingNotifications: true,
  emailCustomerConfirmation: true,
  emailPaymentConfirmation: true,
  emailGalleryDelivery: true,
  emailSignature: "Mara's Photography · Sydney, NSW · On location",
  templateBookingConfirmation: "Thank you for your booking request. We will confirm within one business day.",
  templateBookingNotification: "A new booking request has been received.",
  templatePaymentConfirmation: "Your payment has been received. Thank you.",
  templateGalleryDelivery: "Your private gallery is ready.",
  templateReschedule: "Your session has been rescheduled.",
  cancellationPolicy:
    "Cancel or move a session at no cost up to 72 hours before the start time. Inside 72 hours the deposit is retained or held as a credit for twelve months. Cancellations by Mara — including unsafe weather — are always refunded or rebooked at no cost.",
  privacyPolicy:
    "Your details are used only to manage your booking, deliver your gallery and send the notifications you asked for. Photographs are delivered through a private gallery link and are never published without your permission. Ask us at any time to delete your data.",
  termsPolicy:
    "A booking is a request until Mara confirms it. Prices are in Australian dollars and include GST where applicable. Travel fees and extras are shown before you submit. Galleries remain online for twelve months unless agreed otherwise.",
  rainPolicy:
    "Shoots are outdoors, so weather matters. If rain, high wind or extreme heat makes your session unsafe or unflattering, we reschedule once at no cost — you can request a new date from your booking page at any time, and Mara confirms it. If a reschedule is impossible, the deposit is held on a credit for twelve months.",
};

export function mergeSettings(stored: string | null): SiteSettings {
  if (!stored) return DEFAULT_SETTINGS;
  try {
    const parsed = JSON.parse(stored) as Partial<SiteSettings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}
