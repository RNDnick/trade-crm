// Seed / mock data for the TradeFlow prototype. Everything here is fictional
// demo content used only to populate the app on first run.

function iso(daysFromToday, hour = 9, minute = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export const AVATAR_COLORS = ["#1a73e8", "#188038", "#e37400", "#d93025", "#9334e6", "#00838f"];

export function colorForId(id) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export const PIPELINE_STAGES = [
  { id: "new", label: "New" },
  { id: "contacted", label: "Contacted" },
  { id: "quoted", label: "Quote Sent" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
];

export const JOB_STATUSES = [
  { id: "scheduled", label: "Scheduled" },
  { id: "in_progress", label: "In Progress" },
  { id: "complete", label: "Complete" },
  { id: "invoiced", label: "Invoiced" },
  { id: "paid", label: "Paid" },
];

export const LEAD_SOURCES = ["Google Search", "Referral", "Facebook", "Checkatrade", "Repeat customer", "Walk-in"];

export function seedData() {
  const contacts = [
    { id: "c1", name: "Margaret Hollis", phone: "+44 7700 900123", email: "margaret.hollis@example.com", address: "14 Elm Grove, Bristol BS6 5RT", notes: "Prefers calls after 5pm. Has a dog, use the side gate." },
    { id: "c2", name: "Dave Okafor", phone: "+44 7700 900456", email: "dave.okafor@example.com", address: "3 Kestrel Way, Bristol BS9 2LP", notes: "Landlord, manages 4 rental properties." },
    { id: "c3", name: "Priya Chandra", phone: "+44 7700 900789", email: "priya.chandra@example.com", address: "27 Birch Close, Bath BA1 3FF", notes: "New build, still snagging with the developer." },
    { id: "c4", name: "Tom Fletcher", phone: "+44 7700 900321", email: "tom.fletcher@example.com", address: "9 Vicarage Road, Bristol BS3 4HN", notes: "" },
    { id: "c5", name: "Sarah Bevan", phone: "+44 7700 900654", email: "sarah.bevan@example.com", address: "56 Whiteladies Rd, Bristol BS8 2QY", notes: "Cash buyer, wants work done before Christmas." },
    { id: "c6", name: "Imran Malik", phone: "+44 7700 900987", email: "imran.malik@example.com", address: "2 Orchard Ave, Bristol BS7 8UD", notes: "Found us on Google, comparing three quotes." },
    { id: "c7", name: "Helen Voss", phone: "+44 7700 900112", email: "helen.voss@example.com", address: "18 Cotham Hill, Bristol BS6 6LA", notes: "Repeat customer — rewired the kitchen in 2024." },
    { id: "c8", name: "Ben Larsson", phone: "+44 7700 900334", email: "ben.larsson@example.com", address: "41 Gloucester Rd, Bristol BS7 8AD", notes: "" },
  ];

  const leads = [
    { id: "l1", contactId: "c3", title: "Full rewire — 3 bed semi", value: 4200, source: "Checkatrade", stage: "new", createdAt: iso(-1) },
    { id: "l2", contactId: "c6", title: "Consumer unit upgrade", value: 650, source: "Google Search", stage: "new", createdAt: iso(-2) },
    { id: "l3", contactId: "c2", title: "EICR — 4 rental flats", value: 980, source: "Referral", stage: "contacted", createdAt: iso(-4) },
    { id: "l4", contactId: "c4", title: "Outdoor socket + garden lighting", value: 420, source: "Facebook", stage: "contacted", createdAt: iso(-6) },
    { id: "l5", contactId: "c5", title: "Kitchen extension electrics", value: 3100, source: "Repeat customer", stage: "quoted", createdAt: iso(-9) },
    { id: "l6", contactId: "c8", title: "EV charger install", value: 890, source: "Google Search", stage: "quoted", createdAt: iso(-11) },
    { id: "l7", contactId: "c7", title: "Downstairs loo re-wire", value: 310, source: "Repeat customer", stage: "won", createdAt: iso(-16) },
    { id: "l8", contactId: "c1", title: "Fuse board + smoke alarm upgrade", value: 720, source: "Referral", stage: "won", createdAt: iso(-20) },
    { id: "l9", contactId: "c8", title: "Garage sub-board", value: 540, source: "Walk-in", stage: "lost", createdAt: iso(-25) },
  ];

  const jobs = [
    { id: "j1", contactId: "c7", leadId: "l7", title: "Downstairs loo re-wire", status: "scheduled", value: 310, scheduledDate: iso(2, 9, 0), notes: "Customer has materials on site already." },
    { id: "j2", contactId: "c1", leadId: "l8", title: "Fuse board + smoke alarm upgrade", status: "in_progress", value: 720, scheduledDate: iso(0, 8, 30), notes: "Day 1 of 2. Isolate supply with DNO before 8am." },
    { id: "j3", contactId: "c5", leadId: null, title: "Utility room re-wire (from Feb quote)", status: "complete", value: 1150, scheduledDate: iso(-5, 9, 0), notes: "Signed off, awaiting invoice." },
    { id: "j4", contactId: "c4", leadId: null, title: "Bathroom extractor fan replacement", status: "invoiced", value: 180, scheduledDate: iso(-10, 13, 0), notes: "Invoice #1042 sent." },
    { id: "j5", contactId: "c2", leadId: null, title: "PAT testing — 4 flats", status: "paid", value: 260, scheduledDate: iso(-18, 10, 0), notes: "Paid by bank transfer." },
  ];

  const appointments = [
    { id: "a1", contactId: "c1", jobId: "j2", leadId: null, title: "Fuse board upgrade — day 2", type: "job", date: iso(0, 8, 30), duration: 240, location: "14 Elm Grove, Bristol BS6 5RT", notes: "Bring spare 100A main switch." },
    { id: "a2", contactId: "c6", jobId: null, leadId: "l2", title: "Quote visit — consumer unit", type: "quote", date: iso(0, 13, 0), duration: 30, location: "2 Orchard Ave, Bristol BS7 8UD", notes: "" },
    { id: "a3", contactId: "c3", jobId: null, leadId: "l1", title: "Site survey — full rewire", type: "quote", date: iso(1, 10, 0), duration: 60, location: "27 Birch Close, Bath BA1 3FF", notes: "Ask about access to loft." },
    { id: "a4", contactId: "c7", jobId: "j1", leadId: null, title: "Downstairs loo re-wire", type: "job", date: iso(2, 9, 0), duration: 180, location: "18 Cotham Hill, Bristol BS6 6LA", notes: "" },
    { id: "a5", contactId: "c8", jobId: null, leadId: "l6", title: "Follow-up call — EV charger quote", type: "callback", date: iso(2, 16, 0), duration: 15, location: "", notes: "Chase decision, quote sent 3 days ago." },
    { id: "a6", contactId: "c2", jobId: null, leadId: "l3", title: "EICR — Flat 2", type: "job", date: iso(4, 9, 0), duration: 120, location: "3 Kestrel Way, Bristol BS9 2LP", notes: "" },
    { id: "a7", contactId: "c5", jobId: null, leadId: "l5", title: "Quote follow-up call", type: "callback", date: iso(-1, 11, 0), duration: 15, location: "", notes: "" },
  ];

  const settings = {
    businessName: "Voss Electrical Services",
    ownerName: "Nick Williams",
    trade: "Electrician",
    theme: "system",
    calendarConnections: { google: false, outlook: false },
  };

  return { contacts, leads, jobs, appointments, settings };
}
