export const SPORTS = [
  "Cricket", "Football", "Kabaddi", "Hockey", "Wrestling", "Boxing", "Athletics", "Badminton",
  "Basketball", "Volleyball", "Chess", "Kho-kho", "Ultimate Frisbee", "Esports", "Tennis", "Table Tennis", "Other",
] as const;

export const STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat", "Haryana", "Himachal Pradesh",
  "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya",
  "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Pan-India",
] as const;

export const KINDS = ["athlete", "team", "tournament", "league", "event"] as const;
export type Kind = (typeof KINDS)[number];
export const KIND_LABEL: Record<Kind, string> = {
  athlete: "Athlete",
  team: "Team / club",
  tournament: "Tournament",
  league: "League",
  event: "Event",
};

export const LEVELS = ["grassroots", "district", "state", "national"] as const;
export type Level = (typeof LEVELS)[number];

export const OBJECTIVES = ["Brand awareness", "Local footfall", "Product sampling", "Community / CSR", "Content & social", "Hiring & employer brand"] as const;
export type Objective = (typeof OBJECTIVES)[number];

export const FORMATS = ["Jersey / kit logo", "Banners & boundary boards", "Title sponsorship", "Social media posts", "Product sampling stall", "Live-stream mentions", "Athlete appearances", "Prize money / trophies"] as const;
export type Format = (typeof FORMATS)[number];

export interface Package {
  id: string;
  name: string;
  price: number; // ₹
  deliverables: string[];
}

export interface Listing {
  id: string;
  ownerId: string;
  kind: Kind;
  title: string;
  sport: string;
  level: Level;
  city: string;
  state: string;
  dates: string; // free text e.g. "12–14 Dec 2026" or "Season: Nov–Mar"
  headline: string; // one-liner
  story: string;
  audience: {
    attendance: number; // in-person per event/season
    instagram: number;
    youtube: number;
    whatsapp: number; // community/broadcast size
    demographic: string;
  };
  formats: Format[];
  packages: Package[];
  goal: number; // ₹ total sought
  acceptsInKind: boolean;
  contactName: string;
  pastSponsors: string;
  createdAt: string;
}

export interface Brief {
  id: string;
  ownerId: string;
  brand: string;
  industry: string;
  about: string;
  sports: string[]; // empty = any
  states: string[]; // empty = any, "Pan-India" = any
  levels: Level[];
  budgetMin: number;
  budgetMax: number;
  objectives: Objective[];
  formats: Format[];
  deadline: string; // ISO date
  createdAt: string;
}

export type DealStatus = "proposed" | "negotiating" | "accepted" | "declined" | "completed";
export const STATUS_LABEL: Record<DealStatus, string> = {
  proposed: "Offer sent",
  negotiating: "Negotiating",
  accepted: "Accepted",
  declined: "Declined",
  completed: "Completed",
};

export interface Message {
  id: string;
  from: "sponsor" | "seeker";
  text: string;
  at: string;
}

export interface Deliverable {
  id: string;
  text: string;
  done: boolean;
  proof: string;
}

export interface Deal {
  id: string;
  listingId: string;
  briefId: string | null;
  sponsorId: string;
  seekerId: string;
  initiatedBy: "sponsor" | "seeker";
  packageId: string | null;
  amount: number;
  inKind: string;
  status: DealStatus;
  messages: Message[];
  deliverables: Deliverable[];
  payment: Payment;
  createdAt: string;
  updatedAt: string;
}

/** Escrow: sponsor pays on acceptance → held → released to seeker on completion. */
export type PaymentStatus = "unpaid" | "held" | "released";
export interface Payment {
  status: PaymentStatus;
  orderId: string | null;
  paymentId: string | null;
  paidAt: string | null;
  releasedAt: string | null;
  fee: number; // platform fee kept on release (₹)
  payout: number; // amount released to the seeker (₹)
}
export const PLATFORM_FEE = 0.05;
export const UNPAID: Payment = { status: "unpaid", orderId: null, paymentId: null, paidAt: null, releasedAt: null, fee: 0, payout: 0 };

export interface SeekerProfile {
  id: string;
  name: string;
  kind: Kind;
  city: string;
  state: string;
  sport: string;
}

export interface SponsorProfile {
  id: string;
  brand: string;
  industry: string;
  city: string;
  state: string;
}

export type Role = "seeker" | "sponsor";

export interface SessionUser {
  id: string;
  email: string;
  role: Role;
  demo: boolean;
}

export interface DB {
  version: 1;
  user: SessionUser | null;
  /** The signed-in user's role; null when logged out. */
  role: Role | null;
  me: { seeker: SeekerProfile; sponsor: SponsorProfile };
  sponsors: SponsorProfile[];
  seekers: SeekerProfile[];
  listings: Listing[];
  briefs: Brief[];
  deals: Deal[];
  saved: string[]; // listing ids saved by the sponsor
  /** Committed ₹ per listing (accepted + completed deals), public. */
  raised: Record<string, number>;
  /** Brands backing each listing via accepted/completed deals, public. */
  backers: Record<string, string[]>;
  /** Payments are live only when Razorpay keys are configured on the server. */
  paymentsEnabled: boolean;
}
