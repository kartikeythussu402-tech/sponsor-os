import { UNPAID, type Brief, type Deal, type Listing, type SeekerProfile, type SponsorProfile } from "./types";

/* All names below are FICTIONAL sample data for the demo. */

const days = (n: number) => new Date(Date.now() - n * 864e5).toISOString();
const ahead = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);

export const ME_SEEKER: SeekerProfile = { id: "sk_me", name: "Rohtak Rangers Kabaddi Club", kind: "team", city: "Rohtak", state: "Haryana", sport: "Kabaddi" };
export const ME_SPONSOR: SponsorProfile = { id: "sp_me", brand: "Kesar Fizz Energy Drink", industry: "Beverages", city: "Gurugram", state: "Haryana" };

const seekers: SeekerProfile[] = [
  ME_SEEKER,
  { id: "sk_2", name: "Malabar Women's Football League", kind: "league", city: "Kozhikode", state: "Kerala", sport: "Football" },
  { id: "sk_3", name: "Dharavi Gully Premier League", kind: "tournament", city: "Mumbai", state: "Maharashtra", sport: "Cricket" },
  { id: "sk_4", name: "Ananya Rao — para sprinter (T47)", kind: "athlete", city: "Bengaluru", state: "Karnataka", sport: "Athletics" },
  { id: "sk_5", name: "Bhiwani Fight Academy", kind: "team", city: "Bhiwani", state: "Haryana", sport: "Boxing" },
  { id: "sk_6", name: "Sundargarh Village Hockey Cup", kind: "tournament", city: "Sundargarh", state: "Odisha", sport: "Hockey" },
  { id: "sk_7", name: "Pune Ultimate Open", kind: "event", city: "Pune", state: "Maharashtra", sport: "Ultimate Frisbee" },
  { id: "sk_8", name: "Kartar Singh — junior wrestler (57 kg)", kind: "athlete", city: "Ludhiana", state: "Punjab", sport: "Wrestling" },
  { id: "sk_9", name: "Chennai Rapid Chess Open", kind: "tournament", city: "Chennai", state: "Tamil Nadu", sport: "Chess" },
  { id: "sk_10", name: "Shillong Hoops Night League", kind: "league", city: "Shillong", state: "Meghalaya", sport: "Basketball" },
];

const sponsors: SponsorProfile[] = [
  ME_SPONSOR,
  { id: "sp_2", brand: "Pragati Cement", industry: "Construction materials", city: "Jaipur", state: "Rajasthan" },
  { id: "sp_3", brand: "Bholu Bites Snacks", industry: "FMCG — snacks", city: "Indore", state: "Madhya Pradesh" },
  { id: "sp_4", brand: "KiteFit Gyms", industry: "Fitness", city: "Bengaluru", state: "Karnataka" },
  { id: "sp_5", brand: "Northstar Paints", industry: "Home improvement", city: "Kochi", state: "Kerala" },
  { id: "sp_6", brand: "Ladder Coaching Institute", industry: "Education", city: "Kota", state: "Rajasthan" },
];

const L = (l: Omit<Listing, "createdAt"> & { ago: number }): Listing => {
  const { ago, ...rest } = l;
  return { ...rest, createdAt: days(ago) };
};

const listings: Listing[] = [
  L({
    id: "ls_rohtak", ownerId: "sk_me", kind: "team", title: "Rohtak Rangers Kabaddi Club", sport: "Kabaddi", level: "state", city: "Rohtak", state: "Haryana",
    dates: "Season: Nov 2026 – Feb 2027 · 14 matches", headline: "Haryana's loudest village kabaddi crowds — back us for the state league season.",
    story: "We're a 22-player club founded by former Haryana state players to give rural youth a route into pro kabaddi. Our home matches pull 2,000–3,000 people from 12 surrounding villages, and three of our alumni now play in national-level leagues. This season we need help with travel, kit and a proper physio.",
    audience: { attendance: 28000, instagram: 18400, youtube: 9200, whatsapp: 4100, demographic: "Men & women 15–35, rural & semi-urban Haryana; strong family attendance at weekend matches" },
    formats: ["Jersey / kit logo", "Banners & boundary boards", "Social media posts", "Product sampling stall", "Athlete appearances"],
    packages: [
      { id: "p1", name: "Matchday Partner", price: 25000, deliverables: ["2 boundary banners at all home matches", "Logo on match posters", "4 Instagram posts"] },
      { id: "p2", name: "Kit Sponsor", price: 75000, deliverables: ["Logo on front of jersey (22 players)", "Sampling stall at 7 home matches", "8 Instagram posts + 2 reels", "Team appearance at 1 brand event"] },
      { id: "p3", name: "Title Sponsor", price: 200000, deliverables: ["Club renamed '[Brand] Rohtak Rangers' for the season", "All Kit Sponsor benefits", "Live-stream mentions every match", "Season highlight film with brand integration"] },
    ],
    goal: 300000, acceptsInKind: true, contactName: "Coach Jagdeep Malik", pastSponsors: "Local dairy co-operative (2025, in-kind)", ago: 6,
  }),
  L({
    id: "ls_malabar", ownerId: "sk_2", kind: "league", title: "Malabar Women's Football League", sport: "Football", level: "district", city: "Kozhikode", state: "Kerala",
    dates: "Jan – Mar 2027 · 8 teams · 28 fixtures", headline: "Eight women's club teams, one district, a sold-out final every year.",
    story: "The only all-women football league in north Kerala, now in its third season. 180 players aged 14–30, half of them school and college students. Matches are streamed on our YouTube channel with Malayalam commentary.",
    audience: { attendance: 15000, instagram: 26000, youtube: 31000, whatsapp: 2200, demographic: "Families, women 16–40, Malayali diaspora watching online" },
    formats: ["Title sponsorship", "Jersey / kit logo", "Live-stream mentions", "Social media posts", "Prize money / trophies"],
    packages: [
      { id: "p1", name: "Stream Partner", price: 40000, deliverables: ["Logo overlay on all 28 live streams", "Pre-match read-out", "Highlights description link"] },
      { id: "p2", name: "Golden Boot Sponsor", price: 60000, deliverables: ["Named award + trophy", "Award ceremony stage branding", "6 social posts"] },
      { id: "p3", name: "League Title Partner", price: 350000, deliverables: ["'[Brand] Malabar Women's League' naming", "Logo on all team kits", "Final-day sampling zone", "Season documentary credit"] },
    ],
    goal: 450000, acceptsInKind: true, contactName: "Shahana P.", pastSponsors: "Kozhikode Sports Council (grant)", ago: 3,
  }),
  L({
    id: "ls_dharavi", ownerId: "sk_3", kind: "tournament", title: "Dharavi Gully Premier League", sport: "Cricket", level: "grassroots", city: "Mumbai", state: "Maharashtra",
    dates: "15–22 Dec 2026", headline: "32 tennis-ball cricket teams, 8 nights under floodlights, 1 neighbourhood.",
    story: "A community tournament run by local youth groups since 2019. Every match is a street festival — DJs, food stalls and the whole lane watching. Proceeds fund cricket coaching for 60 kids.",
    audience: { attendance: 12000, instagram: 9800, youtube: 4500, whatsapp: 6000, demographic: "Young men & teens 14–30, dense urban Mumbai, high mobile-video consumption" },
    formats: ["Banners & boundary boards", "Product sampling stall", "Social media posts", "Prize money / trophies"],
    packages: [
      { id: "p1", name: "Over-of-the-Night", price: 8000, deliverables: ["Branded 'Over of the Night' award each night", "Shout-out on PA system", "2 reels"] },
      { id: "p2", name: "Stall + Boards", price: 20000, deliverables: ["Sampling stall all 8 nights", "4 boundary boards", "Logo on posters"] },
      { id: "p3", name: "Presenting Partner", price: 60000, deliverables: ["'Presented by' on everything", "Trophy branding", "Winner's cheque presented by brand"] },
    ],
    goal: 90000, acceptsInKind: true, contactName: "Imran Shaikh", pastSponsors: "Two local mobile shops, a chai chain (2025)", ago: 1,
  }),
  L({
    id: "ls_ananya", ownerId: "sk_4", kind: "athlete", title: "Ananya Rao — para sprinter (T47)", sport: "Athletics", level: "national", city: "Bengaluru", state: "Karnataka",
    dates: "2027 season · targeting Asian Para Games qualification", headline: "National T47 100m silver medallist chasing an Asian Para Games spot.",
    story: "I'm a 21-year-old sprinter born with a below-elbow limb difference. I train twice a day at the state sports hostel. I need support for spikes, a coach's travel to qualifying meets, and a better nutrition plan.",
    audience: { attendance: 2000, instagram: 42000, youtube: 3100, whatsapp: 0, demographic: "Young women, disability-community followers, fitness audiences; high engagement on training reels" },
    formats: ["Athlete appearances", "Social media posts", "Jersey / kit logo"],
    packages: [
      { id: "p1", name: "Training Partner", price: 30000, deliverables: ["Logo on training kit", "Monthly training reel featuring brand"] },
      { id: "p2", name: "Season Sponsor", price: 150000, deliverables: ["Logo on competition kit (where rules allow)", "2 appearances / talks", "Content rights to training footage", "Monthly social posts"] },
    ],
    goal: 180000, acceptsInKind: true, contactName: "Ananya Rao", pastSponsors: "None yet", ago: 9,
  }),
  L({
    id: "ls_bhiwani", ownerId: "sk_5", kind: "team", title: "Bhiwani Fight Academy", sport: "Boxing", level: "state", city: "Bhiwani", state: "Haryana",
    dates: "Year-round · 3 inter-district meets", headline: "'Mini Cuba' boxing academy training 70 kids, 12 state medallists.",
    story: "A small academy in India's boxing heartland. We train 70 boys and girls for free; equipment is ageing and we need a second ring.",
    audience: { attendance: 3500, instagram: 7600, youtube: 2100, whatsapp: 900, demographic: "Teens 12–19 and their families; Haryana sports community" },
    formats: ["Jersey / kit logo", "Banners & boundary boards", "Social media posts"],
    packages: [
      { id: "p1", name: "Equipment Partner", price: 35000, deliverables: ["Logo on new gloves & headgear", "Plaque at academy", "3 posts"] },
      { id: "p2", name: "Academy Patron", price: 120000, deliverables: ["Second ring named after brand", "Logo on all academy kit for a year", "CSR impact report"] },
    ],
    goal: 155000, acceptsInKind: true, contactName: "Coach Sunita Ahlawat", pastSponsors: "Retired Army officers' association", ago: 12,
  }),
  L({
    id: "ls_sundargarh", ownerId: "sk_6", kind: "tournament", title: "Sundargarh Village Hockey Cup", sport: "Hockey", level: "district", city: "Sundargarh", state: "Odisha",
    dates: "6–12 Jan 2027", headline: "48 village teams in India's hockey cradle — 20,000 spectators over a week.",
    story: "Played on mud and turf grounds across the district, this cup has produced several India internationals. We need help with prize money, a medical tent, and live streaming.",
    audience: { attendance: 20000, instagram: 5400, youtube: 8800, whatsapp: 3000, demographic: "Tribal & rural communities, Odia diaspora online, families" },
    formats: ["Title sponsorship", "Banners & boundary boards", "Prize money / trophies", "Live-stream mentions"],
    packages: [
      { id: "p1", name: "Medical Tent Partner", price: 25000, deliverables: ["Branded medical tent all week", "Mention in opening & closing"] },
      { id: "p2", name: "Prize Partner", price: 80000, deliverables: ["Branded winners' & runners-up trophies", "Prize cheque handed by brand", "Boards at final"] },
      { id: "p3", name: "Title Partner", price: 250000, deliverables: ["'[Brand] Sundargarh Hockey Cup'", "All banners & streams", "Village outreach day"] },
    ],
    goal: 300000, acceptsInKind: false, contactName: "Albert Kujur", pastSponsors: "District administration (partial)", ago: 4,
  }),
  L({
    id: "ls_pune", ownerId: "sk_7", kind: "event", title: "Pune Ultimate Open", sport: "Ultimate Frisbee", level: "national", city: "Pune", state: "Maharashtra",
    dates: "1–2 Feb 2027", headline: "Mixed-gender ultimate frisbee — 24 teams, self-refereed, very online.",
    story: "One of India's biggest ultimate tournaments; mixed teams of students and young professionals from 11 cities. The community is tight-knit and shares everything online.",
    audience: { attendance: 1800, instagram: 15000, youtube: 2600, whatsapp: 3500, demographic: "Urban 20–32, college students and young professionals, high disposable income" },
    formats: ["Product sampling stall", "Social media posts", "Jersey / kit logo", "Title sponsorship"],
    packages: [
      { id: "p1", name: "Hydration Partner", price: 30000, deliverables: ["Exclusive drinks at all fields", "Logo on volunteer tees", "Recap post"] },
      { id: "p2", name: "Spirit Award Partner", price: 45000, deliverables: ["Named 'Spirit of the Game' award", "Stage time at ceremony", "4 posts"] },
    ],
    goal: 120000, acceptsInKind: true, contactName: "Neha Kulkarni", pastSponsors: "A craft coffee roaster, a sports physio clinic", ago: 2,
  }),
  L({
    id: "ls_kartar", ownerId: "sk_8", kind: "athlete", title: "Kartar Singh — junior wrestler (57 kg)", sport: "Wrestling", level: "national", city: "Ludhiana", state: "Punjab",
    dates: "2027 season", headline: "U-20 national bronze medallist training at a village akhara.",
    story: "I train at our village akhara and need a proper diet and travel support for national camps. My family runs a small dairy farm.",
    audience: { attendance: 5000, instagram: 11000, youtube: 0, whatsapp: 0, demographic: "Punjab & Haryana wrestling fans, rural youth" },
    formats: ["Athlete appearances", "Social media posts"],
    packages: [{ id: "p1", name: "Diet & Travel Partner", price: 60000, deliverables: ["Brand on singlet at akhara dangals", "Monthly content", "Appearance at 1 store/event"] }],
    goal: 60000, acceptsInKind: true, contactName: "Kartar Singh", pastSponsors: "Village panchayat", ago: 15,
  }),
  L({
    id: "ls_chennai", ownerId: "sk_9", kind: "tournament", title: "Chennai Rapid Chess Open", sport: "Chess", level: "state", city: "Chennai", state: "Tamil Nadu",
    dates: "21–22 Nov 2026", headline: "600 players from age 7 to 70 — plus 40,000 watching the live boards.",
    story: "A FIDE-rated rapid open with a big junior section. Parents, schools and coaching academies are all in the hall.",
    audience: { attendance: 2400, instagram: 6200, youtube: 40000, whatsapp: 5000, demographic: "Parents of school kids, students, Tamil Nadu's chess community" },
    formats: ["Title sponsorship", "Banners & boundary boards", "Prize money / trophies", "Live-stream mentions"],
    packages: [
      { id: "p1", name: "Junior Prize Partner", price: 30000, deliverables: ["Named U-12 prizes", "Hall banner", "Stream mention"] },
      { id: "p2", name: "Title Partner", price: 150000, deliverables: ["Event naming", "Stage + hall branding", "Logo on live-board overlay"] },
    ],
    goal: 180000, acceptsInKind: false, contactName: "R. Venkatesh", pastSponsors: "Two coaching academies", ago: 7,
  }),
  L({
    id: "ls_shillong", ownerId: "sk_10", kind: "league", title: "Shillong Hoops Night League", sport: "Basketball", level: "grassroots", city: "Shillong", state: "Meghalaya",
    dates: "Every Saturday, Oct – Dec 2026", headline: "Streetball under lights — music, food trucks and 16 teams.",
    story: "A weekly night league that's become the city's Saturday plan. Live music between quarters, local food vendors, and a growing online following across the North-East.",
    audience: { attendance: 9000, instagram: 21000, youtube: 1500, whatsapp: 1800, demographic: "Urban youth 16–30 across the North-East" },
    formats: ["Social media posts", "Product sampling stall", "Banners & boundary boards", "Jersey / kit logo"],
    packages: [
      { id: "p1", name: "Night Partner", price: 15000, deliverables: ["One Saturday fully branded", "Sampling + 2 reels"] },
      { id: "p2", name: "Season Partner", price: 90000, deliverables: ["Court branding all season", "Logo on all bibs", "10 reels"] },
    ],
    goal: 120000, acceptsInKind: true, contactName: "Daniel Syiem", pastSponsors: "A local café, a sneaker store", ago: 5,
  }),
];

const B = (b: Omit<Brief, "createdAt"> & { ago: number }): Brief => {
  const { ago, ...rest } = b;
  return { ...rest, createdAt: days(ago) };
};

const briefs: Brief[] = [
  B({
    id: "br_me", ownerId: "sp_me", brand: "Kesar Fizz Energy Drink", industry: "Beverages",
    about: "A new Haryana-made energy drink launching across North India. We want to be seen where young people actually play — not on billboards.",
    sports: ["Kabaddi", "Wrestling", "Boxing", "Cricket"], states: ["Haryana", "Punjab", "Delhi", "Uttar Pradesh"], levels: ["grassroots", "district", "state"],
    budgetMin: 20000, budgetMax: 150000, objectives: ["Product sampling", "Brand awareness", "Content & social"], formats: ["Product sampling stall", "Jersey / kit logo", "Social media posts"],
    deadline: ahead(45), ago: 10,
  }),
  B({
    id: "br_2", ownerId: "sp_2", brand: "Pragati Cement", industry: "Construction materials",
    about: "Regional cement brand with a CSR mandate around rural youth and infrastructure for sport.",
    sports: [], states: ["Rajasthan", "Haryana", "Madhya Pradesh", "Gujarat"], levels: ["grassroots", "district"],
    budgetMin: 50000, budgetMax: 300000, objectives: ["Community / CSR", "Brand awareness"], formats: ["Title sponsorship", "Banners & boundary boards"],
    deadline: ahead(60), ago: 14,
  }),
  B({
    id: "br_3", ownerId: "sp_3", brand: "Bholu Bites Snacks", industry: "FMCG — snacks",
    about: "Value snack brand — we want sampling at crowded, festive local tournaments.",
    sports: ["Cricket", "Kabaddi", "Football", "Kho-kho"], states: ["Pan-India"], levels: ["grassroots", "district"],
    budgetMin: 5000, budgetMax: 40000, objectives: ["Product sampling", "Local footfall"], formats: ["Product sampling stall", "Banners & boundary boards"],
    deadline: ahead(30), ago: 3,
  }),
  B({
    id: "br_4", ownerId: "sp_4", brand: "KiteFit Gyms", industry: "Fitness",
    about: "South India gym chain looking for athlete ambassadors with real stories and strong Instagram.",
    sports: ["Athletics", "Boxing", "Badminton", "Football"], states: ["Karnataka", "Tamil Nadu", "Kerala", "Telangana"], levels: ["state", "national"],
    budgetMin: 25000, budgetMax: 200000, objectives: ["Content & social", "Brand awareness"], formats: ["Athlete appearances", "Social media posts"],
    deadline: ahead(25), ago: 6,
  }),
  B({
    id: "br_5", ownerId: "sp_5", brand: "Northstar Paints", industry: "Home improvement",
    about: "Kerala paint brand — we love community sport and family audiences.",
    sports: ["Football", "Volleyball", "Hockey"], states: ["Kerala", "Karnataka", "Odisha"], levels: [],
    budgetMin: 30000, budgetMax: 400000, objectives: ["Brand awareness", "Community / CSR"], formats: ["Title sponsorship", "Jersey / kit logo", "Live-stream mentions"],
    deadline: ahead(50), ago: 8,
  }),
  B({
    id: "br_6", ownerId: "sp_6", brand: "Ladder Coaching Institute", industry: "Education",
    about: "Competitive-exam coaching; we want to reach students and parents through school-age competitions.",
    sports: ["Chess", "Athletics", "Badminton"], states: ["Pan-India"], levels: [],
    budgetMin: 15000, budgetMax: 120000, objectives: ["Brand awareness", "Local footfall"], formats: ["Prize money / trophies", "Banners & boundary boards", "Title sponsorship"],
    deadline: ahead(35), ago: 2,
  }),
];

const msg = (from: "sponsor" | "seeker", text: string, ago: number) => ({ id: `m${Math.random().toString(36).slice(2, 8)}`, from, text, at: days(ago) });

const deals: Deal[] = [
  {
    id: "dl_1", listingId: "ls_rohtak", briefId: "br_3", sponsorId: "sp_3", seekerId: "sk_me", initiatedBy: "sponsor", packageId: "p1", amount: 25000, inKind: "500 snack packs per home match",
    status: "negotiating",
    messages: [
      msg("sponsor", "Hi Coach! We'd love the Matchday Partner package plus snack sampling. Could we add a stall at home matches?", 4),
      msg("seeker", "Thank you! The stall is part of the Kit Sponsor tier, but we can do it for ₹30,000 total with your snacks for the crowd.", 3),
    ],
    deliverables: [], payment: UNPAID, createdAt: days(4), updatedAt: days(3),
  },
  {
    id: "dl_2", listingId: "ls_rohtak", briefId: "br_2", sponsorId: "sp_2", seekerId: "sk_me", initiatedBy: "seeker", packageId: "p2", amount: 75000, inKind: "",
    status: "accepted",
    messages: [
      msg("seeker", "Namaste! Your CSR focus on rural youth fits our club perfectly. Proposing the Kit Sponsor package.", 9),
      msg("sponsor", "Approved by our CSR team. Let's do it — please share the jersey artwork for sign-off.", 7),
    ],
    deliverables: [
      { id: "d1", text: "Logo on front of jersey (22 players)", done: true, proof: "Jersey proofs signed off by brand" },
      { id: "d2", text: "Sampling stall at 7 home matches", done: false, proof: "" },
      { id: "d3", text: "8 Instagram posts + 2 reels", done: false, proof: "" },
      { id: "d4", text: "Team appearance at 1 brand event", done: false, proof: "" },
    ],
    payment: { status: "held", orderId: null, paymentId: "sample_escrow", paidAt: days(6), releasedAt: null, fee: 0, payout: 0 },
    createdAt: days(9), updatedAt: days(2),
  },
  {
    id: "dl_3", listingId: "ls_bhiwani", briefId: "br_me", sponsorId: "sp_me", seekerId: "sk_5", initiatedBy: "sponsor", packageId: "p1", amount: 35000, inKind: "Energy drinks for academy kids at meets",
    status: "proposed",
    messages: [msg("sponsor", "Hi Coach Sunita — Kesar Fizz would like to back your Equipment Partner package. Can our logo go on the new gloves?", 1)],
    deliverables: [], payment: UNPAID, createdAt: days(1), updatedAt: days(1),
  },
];

/** Fictional starting data, loaded into the database on first run. */
export function seedData() {
  return { seekers, sponsors, listings, briefs, deals, saved: { sp_me: ["ls_dharavi"] } as Record<string, string[]> };
}
