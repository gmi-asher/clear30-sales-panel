import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Home, BarChart3, Mail, CheckCircle, FileText, Settings, Users, Calendar, Star, Zap, X, Award, ChevronRight, ChevronDown, Search, Plus, Download, Upload, Trash2, Copy, Eye, Edit3, Clock, AlertTriangle, TrendingUp, DollarSign, Building2, GraduationCap, Phone, AtSign, StickyNote, Filter, LayoutGrid, List, ExternalLink, RotateCcw, Save, Check, MoreHorizontal } from 'lucide-react'
import jsPDF from 'jspdf'

// ─── THEME ───
const ACCENT = "#43b692"
const ACCENT_LIGHT = "#e8faf3"
const GRADIENT = "linear-gradient(135deg, #43b692 0%, #3bbfa0 30%, #56c9a5 60%, #7dddb5 100%)"

// ─── STAGE DEFINITIONS ───
const STAGES = [
  { id: "outreach", label: "Outreach", color: "#6B7280" },
  { id: "meeting1_scheduled", label: "Meeting 1 Scheduled", color: "#3B82F6" },
  { id: "meeting1_done", label: "Meeting 1 Done", color: "#6B5CE7" },
  { id: "meeting2_scheduled", label: "Meeting 2 Scheduled", color: "#8B5CF6" },
  { id: "meeting2_done", label: "Meeting 2 Done", color: "#A855F7" },
  { id: "pilot", label: "Pilot", color: "#F59E0B" },
  { id: "contract_sent", label: "Contract Sent", color: "#F97316" },
  { id: "closed_won", label: "Closed Won", color: "#22C55E" },
  { id: "closed_lost", label: "Closed Lost", color: "#EF4444" },
  { id: "active_partner", label: "Active Partner", color: "#43b692" },
]

const KANBAN_GROUPS = [
  { id: "outreach", label: "Outreach", stages: ["outreach"] },
  { id: "meeting1", label: "Meeting 1", stages: ["meeting1_scheduled", "meeting1_done"] },
  { id: "meeting2", label: "Meeting 2", stages: ["meeting2_scheduled", "meeting2_done"] },
  { id: "pilot", label: "Pilot", stages: ["pilot"] },
  { id: "contract", label: "Contract", stages: ["contract_sent"] },
  { id: "won", label: "Won", stages: ["closed_won"] },
  { id: "active", label: "Active Partners", stages: ["active_partner"] },
]

const CONFIDENCE_COLORS = {
  "N/A": "#9CA3AF", "Low": "#EF4444", "Medium": "#F59E0B", "High": "#22C55E", "Very High": "#43b692"
}

// ─── STAGE → NEXT ACTION SUGGESTIONS ───
const STAGE_NEXT_ACTIONS = {
  outreach: { label: "Follow-Up Date", placeholder: "Follow up on outreach" },
  meeting1_scheduled: { label: "Meeting 1 Date", placeholder: "Meeting 1" },
  meeting1_done: { label: "Meeting 2 Scheduling", placeholder: "Schedule Meeting 2" },
  meeting2_scheduled: { label: "Meeting 2 Date", placeholder: "Meeting 2" },
  meeting2_done: { label: "Pilot Start Date", placeholder: "Begin pilot setup" },
  pilot: { label: "Contract Date", placeholder: "Send contract" },
  contract_sent: { label: "Follow-Up Date", placeholder: "Follow up on contract" },
  closed_won: { label: "Onboarding Date", placeholder: "Start onboarding" },
  closed_lost: { label: "Re-engage Date", placeholder: "Check back in" },
  active_partner: { label: "Next Check-In", placeholder: "Check in with partner" },
}

// ─── EMAIL SEQUENCE ───
const EMAIL_SEQUENCE = [
  { step: 1, name: "Initial Outreach Email", dayOffset: 0 },
  { step: 2, name: "Contact / Response", dayOffset: 1 },
  { step: 3, name: "Confirmation Email", dayOffset: 2 },
  { step: 4, name: "Distraction Guide", dayOffset: 4 },
  { step: 5, name: "Case Study", dayOffset: 6 },
  { step: 6, name: "Invite Colleagues", dayOffset: 7 },
  { step: 7, name: "Meeting 1 Notification", dayOffset: 9 },
  { step: 8, name: "Meeting One", dayOffset: 11 },
  { step: 9, name: "Meeting Follow Up", dayOffset: 11 },
  { step: 10, name: "UofM Customization", dayOffset: 13 },
  { step: 11, name: "NYT Article", dayOffset: 18 },
  { step: 12, name: "Champion Decision Maker Cheat Sheet", dayOffset: 20 },
  { step: 13, name: "Meeting 2 Notification", dayOffset: 23 },
  { step: 14, name: "Second Meeting", dayOffset: 24 },
]

// ─── SEED DATA ───
const SEED_UNIVERSITIES = [
  // Active Partners
  {
    id: "umich", name: "University of Michigan", shortName: "UMich", emailDomain: "umich.edu",
    studentPopulation: 47907, stage: "active_partner", confidence: "Very High",
    contactName: "Brian Bowden", contactRole: "AOD Counselor", contactEmail: "brian@umich.edu",
    priceStandard: 4791, pricePremium: 11977, selectedTier: "standard",
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: true,
    emailStep: 14, emailsSent: [],
    partnerType: "free", contractTerm: "Ongoing", amountPaid: 0,
    launchDate: "2025-09-01", distributionChannels: ["Canvas", "Email", "Posters", "Website Hub"],
    nextReportDue: "2026-03-15", activeUsers: 24, totalSignups: 48, attentionNeeded: false,
    nextAction: "", nextActionDate: "",
    notes: [
      { date: "2025-09-01", text: "Launched successfully. Brian is our champion." },
      { date: "2025-12-15", text: "Q4 report delivered. 23 total users, 80% reduction in cannabis use." },
      { date: "2026-01-10", text: "Won't ask to pay — they helped build the product and were our first pilot school." },
    ],
  },
  {
    id: "dartmouth", name: "Dartmouth College", shortName: "Dartmouth", emailDomain: "dartmouth.edu",
    studentPopulation: 6638, stage: "active_partner", confidence: "Very High",
    contactName: "", contactRole: "Dir. Student Wellness", contactEmail: "",
    priceStandard: 664, pricePremium: 1660, selectedTier: "standard",
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: true,
    emailStep: 14, emailsSent: [],
    partnerType: "paid", contractTerm: "3-year unlimited", amountPaid: 1000,
    launchDate: "2025-10-01", distributionChannels: ["Email", "Posters", "Website"],
    nextReportDue: "2026-03-15", activeUsers: 12, totalSignups: 31, attentionNeeded: true,
    nextAction: "Check in — we've been neglecting this partnership", nextActionDate: "2026-02-20",
    notes: [
      { date: "2025-10-01", text: "Launched. Paid $1,000 initial." },
      { date: "2025-12-15", text: "Q4 report: 12 active users, 827 check-ins, 54% decrease in use, 100% mental health improvement." },
      { date: "2026-01-15", text: "Switched to 3-year unlimited license. Need to do more work here — somewhat neglected." },
    ],
  },
  {
    id: "massart", name: "Massachusetts College of Art and Design", shortName: "MassArt", emailDomain: "massart.edu",
    studentPopulation: 2000, stage: "active_partner", confidence: "High",
    contactName: "", contactRole: "Wellness Coordinator", contactEmail: "",
    priceStandard: 200, pricePremium: 500, selectedTier: "standard",
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: true,
    emailStep: 14, emailsSent: [],
    partnerType: "pilot_paid", contractTerm: "Annual", amountPaid: 500,
    launchDate: "2025-11-01", distributionChannels: ["Canvas", "Email"],
    nextReportDue: "2026-03-15", activeUsers: 8, totalSignups: 19, attentionNeeded: true,
    nextAction: "Re-engage — we've neglected this partnership", nextActionDate: "2026-02-20",
    notes: [
      { date: "2025-11-01", text: "Launched with small payment. Still pilot-like." },
      { date: "2026-01-15", text: "Somewhat neglected. Need to check in and support distribution." },
    ],
  },
  {
    id: "northwestern", name: "Northwestern University", shortName: "Northwestern", emailDomain: "northwestern.edu",
    studentPopulation: 22648, stage: "active_partner", confidence: "High",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 2265, pricePremium: 5662, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: true,
    emailStep: 14, emailsSent: [],
    partnerType: "pilot_free", contractTerm: "1-year pilot", amountPaid: 0,
    launchDate: "2025-12-01", distributionChannels: ["Email", "Website Hub"],
    nextReportDue: "2026-03-15", activeUsers: 15, totalSignups: 38, attentionNeeded: false,
    nextAction: "Ask to pay next year (pilot ends Dec 2026)", nextActionDate: "2026-10-01",
    notes: [
      { date: "2025-12-01", text: "Year-long free pilot launched. Will ask to pay next year." },
    ],
  },
  {
    id: "wustl", name: "Washington University in St. Louis", shortName: "WUSTL", emailDomain: "wustl.edu",
    studentPopulation: 16200, stage: "active_partner", confidence: "Medium",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 1620, pricePremium: 4050, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 8, emailsSent: [],
    partnerType: "pilot_free", contractTerm: "30-day pilot", amountPaid: 0,
    launchDate: "2026-02-01", distributionChannels: ["Instagram"],
    nextReportDue: "2026-03-01", activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "First info meeting — Asher joining", nextActionDate: "",
    notes: [
      { date: "2026-02-01", text: "30-day pilot started. Also scheduling formal info meeting for paid partnership." },
    ],
  },
  // Pipeline
  {
    id: "st-lawrence", name: "St. Lawrence University", shortName: "St. Lawrence", emailDomain: "stlawu.edu",
    studentPopulation: 2500, stage: "meeting2_scheduled", confidence: "High",
    contactName: "Leslie Sanderfur", contactRole: "", contactEmail: "",
    priceStandard: 2500, pricePremium: 6250, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 10, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Close meeting 2/18 at 11am", nextActionDate: "2026-02-18",
    notes: [
      { date: "2026-02-10", text: "Very interested in premium customization. Have tried other apps — concerned about engagement but believe Clear30 is niche enough. Next meeting 2/18 at 11am." },
    ],
  },
  {
    id: "butler", name: "Butler University", shortName: "Butler", emailDomain: "butler.edu",
    studentPopulation: 6000, stage: "meeting1_done", confidence: "Medium",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 6000, pricePremium: 15000, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: false, demoCompleted: true, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 8, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Send leave-with doc and voucher codes. Schedule Meeting 2.", nextActionDate: "2026-02-18",
    notes: [
      { date: "2026-02-04", text: "Meeting with 3 administrators on 2/4. First meeting done — no second meeting scheduled yet." },
    ],
  },
  {
    id: "unf", name: "University of North Florida", shortName: "UNF", emailDomain: "unf.edu",
    studentPopulation: 17000, stage: "meeting1_done", confidence: "Medium",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 17000, pricePremium: 42500, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: true, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 8, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Send follow-up materials. Emphasize tabling events with peer educators.", nextActionDate: "2026-02-19",
    notes: [
      { date: "2026-02-05", text: "First meeting 2/5 with 2 admins. Cannabis education intervention is one of their biennial review objectives. Peer educators often table on the subject." },
    ],
  },
  {
    id: "ccsu", name: "Central Connecticut State University", shortName: "CCSU", emailDomain: "ccsu.edu",
    studentPopulation: 10000, stage: "meeting1_done", confidence: "Medium",
    contactName: "Dr. Shima", contactRole: "", contactEmail: "",
    priceStandard: 10000, pricePremium: 25000, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: false, demoCompleted: true, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 8, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Send leave-with doc and voucher codes. Schedule Meeting 2.", nextActionDate: "2026-02-20",
    notes: [
      { date: "2026-02-10", text: "First meeting 2/10. Dr. Shima attending. Confirmation page and demo sent." },
    ],
  },
  {
    id: "umkc", name: "University of Missouri-Kansas City", shortName: "UMKC", emailDomain: "umkc.edu",
    studentPopulation: 17000, stage: "meeting2_scheduled", confidence: "High",
    contactName: "Mark", contactRole: "", contactEmail: "",
    priceStandard: 5000, pricePremium: null, selectedTier: "standard",
    confirmationPageSent: true, leaveWithDocSent: false, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 10, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Send leave-with doc to Mark BEFORE meeting", nextActionDate: "2026-02-11",
    notes: [
      { date: "2026-02-07", text: "Second meeting 2/11. High confidence — first meeting went well. Single price of $5,000 (no premium). ACTION: Send leave-with to Mark before meeting." },
    ],
  },
  {
    id: "stockton", name: "Stockton University", shortName: "Stockton", emailDomain: "stockton.edu",
    studentPopulation: 9000, stage: "meeting2_done", confidence: "High",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 9000, pricePremium: 22500, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 12, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Follow up on close meeting — interested in premium", nextActionDate: "2026-02-19",
    notes: [
      { date: "2026-02-12", text: "Second meeting (close) on 2/12. First meeting went very well. Interested in premium customization option." },
    ],
  },
  {
    id: "eastern-illinois", name: "Eastern Illinois University", shortName: "EIU", emailDomain: "eiu.edu",
    studentPopulation: 5000, stage: "meeting2_done", confidence: "Medium",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 5000, pricePremium: 12500, selectedTier: "standard",
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 12, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Wait for their internal conversations. Follow up in 1 week.", nextActionDate: "2026-02-24",
    notes: [
      { date: "2026-02-17", text: "Second meeting (close) 2/17. Not interested in premium — standard only. Were reserved at first but warmed up. Need internal conversations." },
    ],
  },
  {
    id: "vassar", name: "Vassar College", shortName: "Vassar", emailDomain: "vassar.edu",
    studentPopulation: 2500, stage: "meeting2_done", confidence: "High",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 2500, pricePremium: 6250, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 12, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Follow up — very optimistic outcome", nextActionDate: "2026-02-24",
    notes: [
      { date: "2026-02-17", text: "Second meeting (close) 2/17. Met with 2 people — very optimistic about outcome." },
    ],
  },
  {
    id: "monmouth", name: "Monmouth University", shortName: "Monmouth", emailDomain: "monmouth.edu",
    studentPopulation: 6000, stage: "meeting2_scheduled", confidence: "Very High",
    contactName: "", contactRole: "Athletic Dept + Student Oversight", contactEmail: "",
    priceStandard: 6000, pricePremium: 15000, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 10, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "CLOSE MEETING 2/19 — Highest confidence deal", nextActionDate: "2026-02-19",
    notes: [
      { date: "2026-02-12", text: "HIGHEST CONFIDENCE. Met with 3 people from athletic department and student oversight — all appear to be decision makers. Very interested in premium. Want to expand to athletics specifically." },
    ],
  },
  {
    id: "jmu", name: "James Madison University", shortName: "JMU", emailDomain: "jmu.edu",
    studentPopulation: 21000, stage: "meeting2_done", confidence: "Medium",
    contactName: "Paige", contactRole: "", contactEmail: "",
    priceStandard: 21000, pricePremium: 31500, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 12, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Follow up with Paige on decision", nextActionDate: "2026-02-27",
    notes: [
      { date: "2026-02-20", text: "Second meeting with Paige. Premium at $15/struggling student = $31,500. Standard = $21,000. 1 attendee." },
    ],
  },
  {
    id: "missouri-state", name: "Missouri State University", shortName: "Missouri State", emailDomain: "missouristate.edu",
    studentPopulation: 27000, stage: "meeting1_scheduled", confidence: "N/A",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 27000, pricePremium: 40500, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: false, demoCompleted: true, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 6, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "First meeting 2/23 with 3 people", nextActionDate: "2026-02-23",
    notes: [
      { date: "2026-02-15", text: "Meeting 2/23 with 3 people. Pricing may need adjustment — larger school. Premium uses JMU-style per-struggling-student model ($15/student = $40,500)." },
    ],
  },
  {
    id: "northeastern-illinois", name: "Northeastern Illinois University", shortName: "NEIU", emailDomain: "neiu.edu",
    studentPopulation: 5000, stage: "meeting1_scheduled", confidence: "N/A",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 5000, pricePremium: 12500, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 3, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    nextAction: "Send confirmation page and demo. Prep for first meeting.", nextActionDate: "2026-02-25",
    notes: [],
  },
]

// ─── HELPERS ───
const STORAGE_KEY = "clear30-sales-hub"

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch (e) { console.warn("Failed to load:", e) }
  return null
}

function saveData(universities) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ universities, lastSaved: new Date().toISOString(), version: 1 }))
  } catch (e) { console.warn("Failed to save:", e) }
}

function exportData(universities) {
  const blob = new Blob([JSON.stringify({ universities, exportDate: new Date().toISOString() }, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a"); a.href = url; a.download = `clear30-crm-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click(); URL.revokeObjectURL(url)
}

function getStage(id) { return STAGES.find(s => s.id === id) || STAGES[0] }
function daysSince(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((now - d) / (1000 * 60 * 60 * 24))
}
function daysUntil(dateStr) {
  if (!dateStr) return null
  const d = new Date(dateStr)
  const now = new Date()
  return Math.floor((d - now) / (1000 * 60 * 60 * 24))
}
function formatDate(dateStr) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}
function formatCurrency(n) {
  if (!n && n !== 0) return "—"
  return "$" + n.toLocaleString()
}

// ─── COMPONENTS ───

function ConfidenceBadge({ confidence }) {
  const color = CONFIDENCE_COLORS[confidence] || "#9CA3AF"
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: color + "20", color }}>
      {confidence}
    </span>
  )
}

function StageBadge({ stage }) {
  const s = getStage(stage)
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: s.color + "15", color: s.color }}>
      {s.label}
    </span>
  )
}

function PartnerTypeBadge({ type }) {
  const config = {
    paid: { label: "Paid", bg: "#22C55E20", color: "#22C55E" },
    pilot_paid: { label: "Pilot (Paid)", bg: "#F59E0B20", color: "#F59E0B" },
    pilot_free: { label: "Pilot (Free)", bg: "#3B82F620", color: "#3B82F6" },
    free: { label: "Free", bg: "#6B728020", color: "#6B7280" },
  }
  const c = config[type] || config.free
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-semibold" style={{ backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function ChecklistItem({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded accent-emerald-600" />
      <span className={`text-sm ${checked ? "text-gray-500 line-through" : "text-gray-700"}`}>{label}</span>
    </label>
  )
}

function MetricCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="rounded-2xl shadow-sm border border-gray-100 bg-white hover:shadow-md transition-all duration-200" style={{ padding: "20px 32px" }}>
      <div className="flex items-center gap-5 mb-4">
        <div className="rounded-2xl flex items-center justify-center" style={{ width: "56px", height: "56px", background: (color || ACCENT) + "15" }}>
          {Icon && <Icon size={24} style={{ color: color || ACCENT }} />}
        </div>
        <span className="text-sm font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-3xl font-bold text-gray-900">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  )
}

// ─── SIDEBAR ───
const GRADIENT_SUBTLE = "linear-gradient(135deg, #e8faf3 0%, #d4f5ea 50%, #e0f7f0 100%)"

function Sidebar({ currentPage, setPage, overdueCount }) {
  const mainNav = [
    { id: "pipeline", label: "Pipeline", icon: Home },
    { id: "email", label: "Email Center", icon: Mail },
    { id: "fulfillment", label: "Fulfillment", icon: CheckCircle },
  ]
  const toolsNav = [
    { id: "documents", label: "Documents", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "settings", label: "Settings", icon: Settings },
  ]

  const NavButton = ({ item }) => {
    const Icon = item.icon
    const active = currentPage === item.id
    return (
      <button
        onClick={() => setPage(item.id)}
        className={`w-full flex items-center gap-3.5 rounded-xl mb-1 text-sm font-medium transition-all duration-200 ${active ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
        style={{ padding: "12px 20px" }}
      >
        <Icon size={17} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.id === "pipeline" && overdueCount > 0 && (
          <span className="ml-auto bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">{overdueCount}</span>
        )}
      </button>
    )
  }

  return (
    <div className="w-64 min-h-screen bg-white border-r border-gray-100 flex flex-col">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: GRADIENT }}>
            30
          </div>
          <span className="text-lg font-bold text-gray-900">Clear30</span>
        </div>
      </div>
      <div className="mx-4 mb-4 rounded-xl" style={{ background: GRADIENT_SUBTLE, padding: "14px 20px" }}>
        <div className="text-[13px] font-semibold text-gray-800">Sales Hub</div>
        <div className="text-[10px] text-gray-500">Asher & Julian · Partnerships</div>
      </div>
      <nav className="flex-1 px-3">
        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-4 pt-3 pb-2">Navigation</div>
        {mainNav.map(item => <NavButton key={item.id} item={item} />)}
        <div className="text-[10px] font-medium text-gray-400 uppercase tracking-wider px-4 pt-5 pb-2">Tools</div>
        {toolsNav.map(item => <NavButton key={item.id} item={item} />)}
      </nav>
      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3 rounded-xl" style={{ padding: "10px 16px" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: ACCENT }}>AJ</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-gray-800 truncate">Asher & Julian</div>
            <div className="text-[10px] text-gray-400">Clear30 Partnerships</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PIPELINE PAGE ───
function PipelinePage({ universities, onSelectSchool, onUpdate, setQuickAddOpen }) {
  const [viewMode, setViewMode] = useState("kanban")
  const [sortBy, setSortBy] = useState("nextActionDate")
  const [searchQuery, setSearchQuery] = useState("")
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverGroup, setDragOverGroup] = useState(null)

  const pipeline = universities.filter(u => u.stage !== "closed_lost")
  const filtered = pipeline.filter(u => !searchQuery || u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.shortName.toLowerCase().includes(searchQuery.toLowerCase()))

  const pipelineOnly = universities.filter(u => u.stage !== "active_partner" && u.stage !== "closed_lost" && u.stage !== "closed_won")
  const totalPipelineValue = pipelineOnly.reduce((sum, u) => sum + (u.priceStandard || 0), 0)
  const activePartners = universities.filter(u => u.stage === "active_partner")
  const overdueActions = pipelineOnly.filter(u => u.nextActionDate && new Date(u.nextActionDate) < new Date())
  const closingThisWeek = pipelineOnly.filter(u => {
    if (!u.nextActionDate) return false
    const d = daysUntil(u.nextActionDate)
    return d !== null && d >= 0 && d <= 7 && (u.stage.includes("meeting2") || u.stage === "contract_sent")
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Pipeline</h1>
          <p className="text-[13px] text-gray-500 mt-1">{universities.length} universities tracked</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search schools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-full text-[13px] focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400 w-56"
            />
          </div>
          <div className="flex bg-gray-100 rounded-full p-1">
            <button onClick={() => setViewMode("kanban")} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${viewMode === "kanban" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode("table")} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${viewMode === "table" ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-600"}`}>
              <List size={16} />
            </button>
          </div>
          <button onClick={() => setQuickAddOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-sm font-semibold hover:opacity-90 transition-opacity" style={{ background: GRADIENT }}>
            <Plus size={16} /> Add School
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-5 mb-8">
        <MetricCard label="Pipeline Value" value={formatCurrency(totalPipelineValue)} sub={`${pipelineOnly.length} schools`} icon={DollarSign} color="#43b692" />
        <MetricCard label="Active Partners" value={activePartners.length} sub={`${activePartners.reduce((s, u) => s + u.activeUsers, 0)} active users`} icon={Award} color="#6B5CE7" />
        <MetricCard label="Closing This Week" value={closingThisWeek.length} sub={closingThisWeek.map(u => u.shortName).join(", ") || "None"} icon={Star} color="#F59E0B" />
        <MetricCard label="Overdue Actions" value={overdueActions.length} sub={overdueActions.map(u => u.shortName).join(", ") || "All clear"} icon={AlertTriangle} color={overdueActions.length > 0 ? "#EF4444" : "#22C55E"} />
      </div>

      {/* Today's Focus Banner */}
      {(() => {
        const today = new Date().toISOString().slice(0, 10)
        const todayItems = pipelineOnly.filter(u => u.nextActionDate === today)
        const overdueItems = pipelineOnly.filter(u => u.nextActionDate && u.nextActionDate < today)
        const allUrgent = [...overdueItems, ...todayItems]
        if (allUrgent.length === 0) return null
        return (
          <div className="mb-8 rounded-xl border border-emerald-200 bg-emerald-50/50">
            <div className="px-5 py-3 border-b border-emerald-100 flex items-center gap-2">
              <Zap size={16} className="text-emerald-600" />
              <span className="text-[13px] font-semibold text-emerald-800">Today's Focus</span>
              <span className="text-[11px] text-emerald-600 ml-auto">{allUrgent.length} item{allUrgent.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="p-4 space-y-2">
              {allUrgent.map(school => {
                const isOverdue = school.nextActionDate < today
                return (
                  <button
                    key={school.id}
                    onClick={() => onSelectSchool(school.id)}
                    className="w-full flex items-center gap-4 rounded-2xl bg-white/80 hover:bg-white transition-colors text-left"
                    style={{ padding: "12px 24px" }}
                  >
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isOverdue ? "bg-red-500" : "bg-emerald-500"}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[13px] text-gray-900">{school.shortName}</span>
                        {isOverdue && <span className="text-[10px] font-semibold text-red-600 bg-red-100 px-2.5 py-1 rounded-full">OVERDUE</span>}
                      </div>
                      <div className="text-[13px] text-gray-600 truncate mt-0.5">{school.nextAction}</div>
                    </div>
                    <StageBadge stage={school.stage} />
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                  </button>
                )
              })}
            </div>
          </div>
        )
      })()}

      {viewMode === "kanban" ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_GROUPS.map(group => {
            const groupSchools = filtered.filter(u => group.stages.includes(u.stage))
            const groupTotal = groupSchools.reduce((sum, u) => sum + (u.priceStandard || 0), 0)
            return (
              <div
                key={group.id}
                className={`flex-shrink-0 w-80 rounded-xl p-2 -m-2 transition-colors duration-200 ${dragOverGroup === group.id ? "bg-emerald-50/60 ring-2 ring-emerald-200 ring-inset" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragOverGroup(group.id) }}
                onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverGroup(null) }}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOverGroup(null)
                  if (draggedId) {
                    const newStage = group.stages[0]
                    onUpdate(draggedId, { stage: newStage })
                    setDraggedId(null)
                  }
                }}
              >
                <div className="flex items-center justify-between mb-3 px-1">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{group.label}</h3>
                      <span className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-2.5 py-1">{groupSchools.length}</span>
                    </div>
                    {groupTotal > 0 && <div className="text-lg font-bold text-gray-900 mt-0.5">{formatCurrency(groupTotal)}</div>}
                  </div>
                  <button className="w-7 h-7 rounded-full flex items-center justify-center text-gray-300 hover:bg-gray-100 hover:text-gray-500 transition-colors">
                    <MoreHorizontal size={15} />
                  </button>
                </div>
                <div className="space-y-3">
                  {groupSchools.map(school => {
                    const isOverdue = school.nextActionDate && new Date(school.nextActionDate) < new Date()
                    const emailPct = Math.round((school.emailStep / 14) * 100)
                    const checklistDone = [school.confirmationPageSent, school.leaveWithDocSent, school.demoCompleted, school.voucherCodesSent, school.firefliesMeetingNotes].filter(Boolean).length
                    const stageInfo = getStage(school.stage)
                    return (
                    <div
                      key={school.id}
                      draggable
                      onDragStart={(e) => { setDraggedId(school.id); e.dataTransfer.effectAllowed = "move" }}
                      onDragEnd={() => { setDraggedId(null); setDragOverGroup(null) }}
                      onClick={() => onSelectSchool(school.id)}
                      className={`w-full bg-white rounded-2xl shadow-sm border text-left hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing ${draggedId === school.id ? "opacity-40" : ""} ${isOverdue ? "border-l-[3px] border-l-red-400 border-t-gray-100 border-r-gray-100 border-b-gray-100" : "border-gray-100"}`}
                      style={{ padding: "12px 24px" }}
                    >
                      {/* Progress bar */}
                      <div className="w-full bg-gray-100 rounded-full h-[3px] mb-3">
                        <div className="h-[3px] rounded-full transition-all" style={{ width: `${emailPct}%`, background: ACCENT }} />
                      </div>
                      {/* Row 1: Name + confidence */}
                      <div className="flex items-start justify-between mb-1">
                        <span className="text-[15px] font-semibold text-gray-900">{school.shortName}</span>
                        <ConfidenceBadge confidence={school.confidence} />
                      </div>
                      {/* Row 2: Stage subtitle */}
                      <div className="text-[13px] text-gray-500 mb-3">{stageInfo.label}</div>
                      {/* Row 3: Contact + price */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          {school.contactName ? (
                            <>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: stageInfo.color }}>
                                {school.contactName.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </div>
                              <span className="text-[13px] text-gray-600">{school.contactName}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                                <Users size={11} className="text-gray-400" />
                              </div>
                              <span className="text-[13px] text-gray-400 italic">No contact</span>
                            </>
                          )}
                        </div>
                        <span className="text-[15px] font-semibold text-gray-900">{formatCurrency(school.priceStandard)}</span>
                      </div>
                      {/* Row 4: Metadata chips */}
                      <div className="flex items-center gap-3 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1" title="Emails sent">
                          <Mail size={12} /> {school.emailStep}/14
                        </span>
                        <span className="flex items-center gap-1" title="Checklist progress">
                          <CheckCircle size={12} /> {checklistDone}/5
                        </span>
                        <span className="flex items-center gap-1" title="Notes">
                          <StickyNote size={12} /> {school.notes?.length || 0}
                        </span>
                        {school.nextActionDate && (
                          <span className={`flex items-center gap-1 ml-auto ${isOverdue ? "text-red-500 font-semibold" : ""}`}>
                            <Clock size={12} />
                            {isOverdue && <AlertTriangle size={10} />}
                            {new Date(school.nextActionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      {school.stage === "active_partner" && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
                          <PartnerTypeBadge type={school.partnerType} />
                          {school.attentionNeeded && (
                            <span className="text-[11px] text-red-500 font-semibold flex items-center gap-1">
                              <AlertTriangle size={11} /> Needs attention
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )})}

                  {groupSchools.length === 0 && (
                    <div className="text-[11px] text-gray-300 text-center py-8">No schools</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["School", "Stage", "Confidence", "Students", "Price (Std)", "Email Step", "Next Action", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.sort((a, b) => {
                if (sortBy === "nextActionDate") {
                  if (!a.nextActionDate) return 1
                  if (!b.nextActionDate) return -1
                  return new Date(a.nextActionDate) - new Date(b.nextActionDate)
                }
                return a.name.localeCompare(b.name)
              }).map(school => (
                <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => onSelectSchool(school.id)}>
                  <td className="px-5 py-3.5">
                    <div className="text-[13px] font-semibold text-gray-900">{school.name}</div>
                    <div className="text-[11px] text-gray-400 mt-0.5">{school.shortName}</div>
                  </td>
                  <td className="px-5 py-3.5"><StageBadge stage={school.stage} /></td>
                  <td className="px-5 py-3.5"><ConfidenceBadge confidence={school.confidence} /></td>
                  <td className="px-5 py-3.5 text-[13px] text-gray-600">{school.studentPopulation?.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-[13px] font-semibold text-gray-700">{formatCurrency(school.priceStandard)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-20">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(school.emailStep / 14) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">{school.emailStep}/14</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {school.nextAction && (
                      <div className={`text-[13px] ${school.nextActionDate && new Date(school.nextActionDate) < new Date() ? "text-red-600 font-semibold" : "text-gray-600"}`}>
                        {school.nextAction.slice(0, 40)}{school.nextAction.length > 40 ? "..." : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><ChevronRight size={16} className="text-gray-300" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── SCHOOL DETAIL PANEL ───
function SchoolDetailPanel({ school, onClose, onUpdate }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [newNote, setNewNote] = useState("")
  const [editing, setEditing] = useState(null)
  const [editValue, setEditValue] = useState("")

  if (!school) return null

  const startEdit = (field, value) => { setEditing(field); setEditValue(value || "") }
  const saveEdit = (field) => { onUpdate({ [field]: editValue }); setEditing(null) }

  const addNote = () => {
    if (!newNote.trim()) return
    const notes = [...(school.notes || []), { date: new Date().toISOString().slice(0, 10), text: newNote }]
    onUpdate({ notes })
    setNewNote("")
  }

  const checklist = [
    { key: "confirmationPageSent", label: "Confirmation Page Sent" },
    { key: "leaveWithDocSent", label: "Leave-With Doc Sent" },
    { key: "demoCompleted", label: "Demo Completed" },
    { key: "voucherCodesSent", label: "Voucher Codes Sent" },
    { key: "firefliesMeetingNotes", label: "Fireflies Meeting Notes" },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[720px] max-h-[85vh] bg-white rounded-2xl shadow-2xl overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 z-10 rounded-t-2xl">
          <div className="px-8 pt-8 pb-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{school.name}</h2>
                <div className="flex items-center gap-2.5 mt-3">
                  <StageBadge stage={school.stage} />
                  <ConfidenceBadge confidence={school.confidence} />
                  {school.partnerType && <PartnerTypeBadge type={school.partnerType} />}
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={22} className="text-gray-400" />
              </button>
            </div>
          </div>
          <div className="flex gap-2 px-8 mt-5 pb-4">
            {["overview", "emails", "notes"].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${activeTab === tab ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 py-7 space-y-7">
          {activeTab === "overview" && (
            <>
              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 rounded-2xl" style={{ padding: "16px 32px" }}>
                  <div className="text-xs text-gray-400 mb-2">Students</div>
                  <div className="text-xl font-bold text-gray-900">{school.studentPopulation?.toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-2xl" style={{ padding: "16px 32px" }}>
                  <div className="text-xs text-gray-400 mb-2">Standard Price</div>
                  <div className="text-xl font-bold text-gray-900">{formatCurrency(school.priceStandard)}</div>
                </div>
                {school.pricePremium && (
                  <div className="bg-gray-50 rounded-2xl" style={{ padding: "16px 32px" }}>
                    <div className="text-xs text-gray-400 mb-2">Premium Price</div>
                    <div className="text-xl font-bold text-gray-900">{formatCurrency(school.pricePremium)}</div>
                  </div>
                )}
                {school.stage === "active_partner" && (
                  <div className="bg-gray-50 rounded-2xl" style={{ padding: "16px 32px" }}>
                    <div className="text-xs text-gray-400 mb-2">Active Users</div>
                    <div className="text-xl font-bold text-gray-900">{school.activeUsers} / {school.totalSignups} signups</div>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact</h3>
                <div className="space-y-3">
                  {[{ key: "contactName", label: "Name", icon: Users }, { key: "contactRole", label: "Role", icon: Building2 }, { key: "contactEmail", label: "Email", icon: AtSign }].map(({ key, label, icon: Icon }) => (
                    <div key={key} className="flex items-center gap-3">
                      <Icon size={15} className="text-gray-400" />
                      {editing === key ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input value={editValue} onChange={(e) => setEditValue(e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" autoFocus />
                          <button onClick={() => saveEdit(key)} className="text-emerald-600"><Check size={14} /></button>
                          <button onClick={() => setEditing(null)} className="text-gray-400"><X size={14} /></button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-sm text-gray-700">{school[key] || <span className="text-gray-300 italic">Not set</span>}</span>
                          <button onClick={() => startEdit(key, school[key])} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-gray-500"><Edit3 size={12} /></button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Stage */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Stage & Confidence</h3>
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={school.stage}
                    onChange={(e) => onUpdate({ stage: e.target.value })}
                    className="text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                  <select
                    value={school.confidence}
                    onChange={(e) => onUpdate({ confidence: e.target.value })}
                    className="text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  >
                    {["N/A", "Low", "Medium", "High", "Very High"].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Next Action */}
              {(() => {
                const suggestion = STAGE_NEXT_ACTIONS[school.stage] || { label: "Next Action", placeholder: "What needs to happen next?" }
                return (
                  <div>
                    <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">{suggestion.label}</h3>
                    <div className="space-y-2">
                      <input
                        type="date"
                        value={school.nextActionDate || ""}
                        onChange={(e) => onUpdate({ nextActionDate: e.target.value })}
                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                      />
                      <input
                        type="text"
                        value={school.nextAction || ""}
                        onChange={(e) => onUpdate({ nextAction: e.target.value })}
                        placeholder={suggestion.placeholder}
                        className="w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200 text-gray-600"
                      />
                    </div>
                  </div>
                )
              })()}

              {/* Checklist */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Sales Checklist</h3>
                <div className="bg-gray-50 rounded-2xl space-y-0.5" style={{ padding: "16px 24px" }}>
                  {checklist.map(({ key, label }) => (
                    <ChecklistItem key={key} label={label} checked={school[key]} onChange={() => onUpdate({ [key]: !school[key] })} />
                  ))}
                </div>
              </div>

              {/* Email Progress */}
              <div>
                <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Email Sequence ({school.emailStep}/14)</h3>
                <div className="flex items-center gap-1 mb-2">
                  {EMAIL_SEQUENCE.map((e, i) => (
                    <div
                      key={i}
                      title={e.name}
                      className={`flex-1 h-3 rounded-full transition-all cursor-pointer ${i < school.emailStep ? "bg-emerald-500 hover:bg-emerald-600" : i === school.emailStep ? "bg-emerald-200 hover:bg-emerald-300" : "bg-gray-200"}`}
                      onClick={() => onUpdate({ emailStep: i + 1 })}
                    />
                  ))}
                </div>
                <div className="text-xs text-gray-400">
                  {school.emailStep < 14 ? `Next: ${EMAIL_SEQUENCE[school.emailStep]?.name}` : "All emails sent"}
                </div>
              </div>

              {/* Active Partner Section */}
              {school.stage === "active_partner" && (
                <div>
                  <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Partner Details</h3>
                  <div className="bg-emerald-50 rounded-2xl space-y-4" style={{ padding: "20px 32px" }}>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Type:</span> <PartnerTypeBadge type={school.partnerType} /></div>
                      <div><span className="text-gray-500">Contract:</span> <span className="text-gray-900">{school.contractTerm || "—"}</span></div>
                      <div><span className="text-gray-500">Paid:</span> <span className="text-gray-900">{formatCurrency(school.amountPaid)}</span></div>
                      <div><span className="text-gray-500">Launched:</span> <span className="text-gray-900">{formatDate(school.launchDate)}</span></div>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-500">Distribution:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(school.distributionChannels || []).map(ch => (
                          <span key={ch} className="px-3 py-1 bg-white rounded-full text-xs text-gray-600">{ch}</span>
                        ))}
                      </div>
                    </div>
                    {school.nextReportDue && (
                      <div className="text-sm">
                        <span className="text-gray-500">Next Report Due:</span>{" "}
                        <span className={`font-medium ${daysUntil(school.nextReportDue) < 7 ? "text-red-600" : "text-gray-900"}`}>
                          {formatDate(school.nextReportDue)} ({daysUntil(school.nextReportDue)} days)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === "emails" && (
            <div>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Email Sequence for {school.shortName}</h3>
              <div className="space-y-2">
                {EMAIL_SEQUENCE.map((email, i) => {
                  const sent = i < school.emailStep
                  const isNext = i === school.emailStep
                  return (
                    <div key={i} className={`flex items-center gap-4 rounded-2xl transition-all ${isNext ? "bg-emerald-50 border border-emerald-200" : sent ? "bg-gray-50" : "bg-white border border-gray-100"}`} style={{ padding: "16px 24px" }}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${sent ? "bg-emerald-500 text-white" : isNext ? "bg-emerald-200 text-emerald-700" : "bg-gray-200 text-gray-500"}`}>
                        {sent ? <Check size={14} /> : email.step}
                      </div>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${sent ? "text-gray-500" : "text-gray-900"}`}>{email.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">Day {email.dayOffset}</div>
                      </div>
                      {isNext && (
                        <button
                          onClick={() => onUpdate({ emailStep: school.emailStep + 1 })}
                          className="px-5 py-2 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors"
                        >
                          Mark Sent
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div>
              <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity Notes</h3>
              <div className="flex gap-3 mb-5">
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                  onKeyDown={(e) => e.key === "Enter" && addNote()}
                />
                <button onClick={addNote} className="px-6 py-3 bg-emerald-600 text-white text-sm font-semibold rounded-full hover:bg-emerald-700 transition-colors">Add</button>
              </div>
              <div className="space-y-3">
                {[...(school.notes || [])].reverse().map((note, i) => (
                  <div key={i} className="bg-gray-50 rounded-2xl" style={{ padding: "14px 24px" }}>
                    <div className="text-xs text-gray-400 mb-1.5">{formatDate(note.date)}</div>
                    <div className="text-sm text-gray-700">{note.text}</div>
                  </div>
                ))}
                {(!school.notes || school.notes.length === 0) && (
                  <div className="text-sm text-gray-400 text-center py-8">No notes yet</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── EMAIL COMMAND CENTER ───
function EmailCommandCenter({ universities, onUpdate, onSelectSchool }) {
  const [filter, setFilter] = useState("all")
  const pipeline = universities.filter(u => u.stage !== "active_partner" && u.stage !== "closed_lost" && u.stage !== "closed_won")

  const getStatus = (u) => {
    if (u.emailStep >= 14) return "complete"
    return "active"
  }

  const filtered = filter === "all" ? pipeline : pipeline.filter(u => {
    if (filter === "complete") return u.emailStep >= 14
    if (filter === "active") return u.emailStep < 14
    return true
  })

  const needsEmail = pipeline.filter(u => u.emailStep < 14).length

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[28px] font-bold text-gray-900">Email Command Center</h1>
          <p className="text-[13px] text-gray-500 mt-1">{needsEmail} schools need emails</p>
        </div>
        <div className="flex gap-1.5">
          {[{ id: "all", label: "All" }, { id: "active", label: "Needs Email" }, { id: "complete", label: "Complete" }].map(f => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-2 rounded-full text-[13px] font-medium transition-all ${filter === f.id ? "bg-emerald-50 text-emerald-700" : "text-gray-500 hover:bg-gray-50"}`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        <MetricCard label="Schools in Sequence" value={pipeline.length} icon={Mail} color="#3B82F6" />
        <MetricCard label="Needs Next Email" value={needsEmail} icon={Clock} color="#F59E0B" />
        <MetricCard label="Sequences Complete" value={pipeline.filter(u => u.emailStep >= 14).length} icon={CheckCircle} color="#22C55E" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              {["School", "Stage", "Progress", "Next Email", "Action"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.sort((a, b) => a.emailStep - b.emailStep).map(school => {
              const nextEmail = school.emailStep < 14 ? EMAIL_SEQUENCE[school.emailStep] : null
              return (
                <tr key={school.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <button onClick={() => onSelectSchool(school.id)} className="text-left">
                      <div className="font-semibold text-[13px] text-gray-900 hover:text-emerald-600">{school.name}</div>
                    </button>
                  </td>
                  <td className="px-5 py-3.5"><StageBadge stage={school.stage} /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-1.5 w-24">
                        <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${(school.emailStep / 14) * 100}%` }} />
                      </div>
                      <span className="text-[11px] text-gray-400 w-10">{school.emailStep}/14</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="text-[13px] text-gray-600">{nextEmail ? nextEmail.name : "—"}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    {nextEmail && (
                      <button
                        onClick={() => onUpdate(school.id, { emailStep: school.emailStep + 1 })}
                        className="px-4 py-2 bg-emerald-50 text-emerald-700 text-[13px] font-medium rounded-full hover:bg-emerald-100 transition-colors"
                      >
                        Mark Sent
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── FULFILLMENT DASHBOARD ───
function FulfillmentDashboard({ universities, onSelectSchool }) {
  const partners = universities.filter(u => u.stage === "active_partner")

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-gray-900">Fulfillment Dashboard</h1>
        <p className="text-[13px] text-gray-500 mt-1">{partners.length} active partnerships</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <MetricCard label="Total Partners" value={partners.length} icon={Award} color="#43b692" />
        <MetricCard label="Active Users" value={partners.reduce((s, u) => s + u.activeUsers, 0)} icon={Users} color="#6B5CE7" />
        <MetricCard label="Total Signups" value={partners.reduce((s, u) => s + u.totalSignups, 0)} icon={TrendingUp} color="#3B82F6" />
        <MetricCard label="Revenue Collected" value={formatCurrency(partners.reduce((s, u) => s + u.amountPaid, 0))} icon={DollarSign} color="#F59E0B" />
      </div>

      <div className="grid grid-cols-2 gap-5">
        {partners.map(school => (
          <div key={school.id} onClick={() => onSelectSchool(school.id)} className={`bg-white rounded-2xl shadow-sm border transition-all hover:shadow-md cursor-pointer ${school.attentionNeeded ? "border-l-[3px] border-l-red-400 border-t-gray-100 border-r-gray-100 border-b-gray-100" : "border-gray-100"}`} style={{ padding: "24px 32px" }}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-[15px] font-semibold text-gray-900">{school.name}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <PartnerTypeBadge type={school.partnerType} />
                  {school.attentionNeeded && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-red-600 font-semibold">
                      <AlertTriangle size={12} /> Needs attention
                    </span>
                  )}
                </div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400">
                <ChevronRight size={18} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-2xl text-center" style={{ padding: "16px 32px" }}>
                <div className="text-xl font-bold text-gray-900">{school.activeUsers}</div>
                <div className="text-[11px] text-gray-400 mt-1">Active</div>
              </div>
              <div className="bg-gray-50 rounded-2xl text-center" style={{ padding: "16px 32px" }}>
                <div className="text-xl font-bold text-gray-900">{school.totalSignups}</div>
                <div className="text-[11px] text-gray-400 mt-1">Signups</div>
              </div>
              <div className="bg-gray-50 rounded-2xl text-center" style={{ padding: "16px 32px" }}>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(school.amountPaid)}</div>
                <div className="text-[11px] text-gray-400 mt-1">Paid</div>
              </div>
            </div>

            <div className="space-y-3 text-[13px]">
              <div className="flex justify-between">
                <span className="text-gray-500">Launched</span>
                <span className="font-medium text-gray-900">{formatDate(school.launchDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Contract</span>
                <span className="font-medium text-gray-900">{school.contractTerm || "—"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">Next Report</span>
                <span className={`font-medium ${school.nextReportDue && daysUntil(school.nextReportDue) < 14 ? "text-amber-600" : "text-gray-900"}`}>
                  {school.nextReportDue ? `${formatDate(school.nextReportDue)} (${daysUntil(school.nextReportDue)}d)` : "—"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-gray-100">
              {(school.distributionChannels || []).map(ch => (
                <span key={ch} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-[11px] font-medium">{ch}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── DOCUMENT GENERATOR ───
function DocumentGenerator({ universities }) {
  const [selectedSchool, setSelectedSchool] = useState("")
  const [docType, setDocType] = useState(null)
  const [generated, setGenerated] = useState(false)

  const school = universities.find(u => u.id === selectedSchool)

  const docTypes = [
    { id: "contract", label: "Partnership Contract", icon: FileText, desc: "Institutional partnership agreement with terms, pricing, and commitments" },
    { id: "security", label: "Security & Data Practices", icon: Settings, desc: "FERPA compliance, data handling, privacy documentation" },
    { id: "overview", label: "Partnership Overview", icon: Building2, desc: "Leave-with document — one-pager with pricing and outcomes" },
    { id: "invoice", label: "Invoice", icon: DollarSign, desc: "Annual campus partnership invoice" },
  ]

  const generatePDF = () => {
    if (!school || !docType) return
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" })
    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    // Header bar
    doc.setFillColor(67, 182, 146)
    doc.rect(0, 0, pageWidth, 25, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(18)
    doc.setFont("helvetica", "bold")
    doc.text("Clear30", margin, 17)
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text("Campus Partnership Program", pageWidth - margin, 17, { align: "right" })

    let y = 40

    if (docType === "contract") {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(`Clear30 x ${school.name}`, margin, y)
      y += 8
      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Institutional Partnership Agreement", margin, y)
      y += 15

      const sections = [
        `This Institutional Partnership Agreement is entered into by and between ${school.name} ("${school.shortName}") and Clear30, Inc. ("Clear30").`,
        `\n1. PURPOSE\n${school.shortName} wishes to provide its students with access to Clear30, a mobile application that helps young adults take a 30-day break from cannabis or develop healthier cannabis habits.`,
        `\n2. TERM\nThis Agreement will remain in effect for one (1) year beginning on the Effective Date.`,
        `\n3. FEES AND PAYMENT\n${school.shortName} agrees to pay Clear30 an annual fee of ${formatCurrency(school.selectedTier === "premium" ? school.pricePremium : school.priceStandard)} for campus-wide student access.\n\nPricing is based on ${school.studentPopulation?.toLocaleString()} students at $${school.selectedTier === "premium" ? "2.50" : "1.00"} per struggling student (est. 10% of enrollment).`,
        `\n4. CLEAR30 COMMITMENTS\n- Campus-specific access link and QR code\n- Rollout/distribution kit\n- Implementation support\n- Quarterly anonymized engagement reports`,
        `\n5. ${school.shortName.toUpperCase()} COMMITMENTS\n- Support program rollout through agreed channels\n- Designate a point of contact\n- Provide timely payment of fees`,
        `\n6. DATA & PRIVACY\nClear30 provides only anonymized, aggregate engagement reports. No individual student data is shared with ${school.shortName}.`,
      ]

      doc.setFontSize(10)
      sections.forEach(section => {
        const lines = doc.splitTextToSize(section, pageWidth - 2 * margin)
        if (y + lines.length * 5 > 270) { doc.addPage(); y = 25 }
        doc.text(lines, margin, y)
        y += lines.length * 5 + 3
      })

      y += 10
      doc.setFontSize(10)
      doc.text("CLEAR30, INC.", margin, y)
      doc.text(school.name.toUpperCase(), pageWidth / 2, y)
      y += 7
      doc.text("By: _______________________", margin, y)
      doc.text("By: _______________________", pageWidth / 2, y)
      y += 7
      doc.text("Julian Singleton", margin, y)
      doc.text("Name: ___________________", pageWidth / 2, y)
      y += 5
      doc.text("Head of Campus Partnerships", margin, y)
      doc.text("Title: ___________________", pageWidth / 2, y)

    } else if (docType === "security") {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text("Security, Data Practices &", margin, y)
      y += 8
      doc.text("Business System Documentation", margin, y)
      y += 10
      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Prepared for ${school.name}`, margin, y)
      y += 15

      const sections = [
        `1. OVERVIEW\nClear30 is a mobile application that helps young adults take a 30-day break from cannabis. Under this partnership, ${school.shortName} students access Clear30 at no cost by verifying their @${school.emailDomain || "[domain].edu"} email address. ${school.shortName} receives only anonymized, aggregate engagement reports.`,
        `\n2. DATA COLLECTED\nAccount data (name, email), onboarding assessment, in-app activity, and pseudoanonymized analytics events. Clear30 does NOT collect GPS/location data, passwords, or financial information.`,
        `\n3. DATA ARCHITECTURE\nAll data stored in PostgreSQL on Supabase (AWS). PII encrypted with AES-256 at rest and TLS in transit. Access restricted to CTO only.`,
        `\n4. DATA FLOW\nStudents download app independently, verify @${school.emailDomain || "[domain].edu"} email, and use app like any other user. Aggregate reports strip all PII at the database level. Minimum cohort of 3 users before any report is generated.`,
        `\n5. REGULATORY POSTURE\nClear30 is not a covered entity under HIPAA. Clear30's practices do not implicate FERPA — students engage voluntarily, no education records are transmitted.`,
        `\n6. INCIDENT RESPONSE\nBreach notification within 72 hours. Escalation path: CTO → President/CSO → External compliance consultant.`,
        `\n7. CONTACT\nSecurity: Thatcher Clough, CTO — thatcher@clear30.org\nClinical: Dr. Fred Muench, President — fred@clear30.org\nPartnerships: Julian Singleton — julian@clear30.org`,
      ]

      doc.setFontSize(10)
      sections.forEach(section => {
        const lines = doc.splitTextToSize(section, pageWidth - 2 * margin)
        if (y + lines.length * 5 > 270) { doc.addPage(); y = 25 }
        doc.text(lines, margin, y)
        y += lines.length * 5 + 5
      })

    } else if (docType === "overview") {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(16)
      doc.setFont("helvetica", "bold")
      doc.text(school.name, margin, y)
      y += 8
      doc.setFontSize(11)
      doc.setFont("helvetica", "normal")
      doc.text("Prepared for Campus Leadership", margin, y)
      y += 15

      const sections = [
        `ABOUT CLEAR30\nClear30 is an evidence-based cannabis support program designed to meet students where they are. Through a private, structured mobile app, students can engage with support on their own terms.`,
        `\nPROVEN OUTCOMES\n- 90% reduction in cannabis use (intent to quit)\n- 71% reduction across all goals\n- #1 cannabis support app in US, Canada, and Australia\n- 150,000+ downloads\n- Harvard-affiliated research, NIH/NIDA funded`,
        `\nEVERY CAMPUS LICENSE INCLUDES\n- Unlimited access for all students + staff\n- Full content library + future updates\n- Outreach/distribution kit\n- Quarterly anonymized reporting\n- Dedicated partnership support`,
        `\nPRICING (${school.studentPopulation?.toLocaleString()} students)\n\nStandard Campus Program: ${formatCurrency(school.priceStandard)}/year\n($1.00 per struggling student, est. 10% of enrollment)\n\n${school.pricePremium ? `Premium Customization: ${formatCurrency(school.pricePremium)}/year\n($2.50 per struggling student, deep campus integration)` : ""}`,
        `\nCONTACT\nJulian Singleton | University Partnerships\njulian@clear30.com | 734.277.1774`,
      ]

      doc.setFontSize(10)
      sections.forEach(section => {
        const lines = doc.splitTextToSize(section, pageWidth - 2 * margin)
        if (y + lines.length * 5 > 270) { doc.addPage(); y = 25 }
        doc.text(lines, margin, y)
        y += lines.length * 5 + 5
      })

    } else if (docType === "invoice") {
      doc.setTextColor(0, 0, 0)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text("INVOICE", margin, y)
      y += 10

      doc.setFontSize(10)
      doc.setFont("helvetica", "normal")
      doc.text(`Invoice Date: ${new Date().toLocaleDateString()}`, margin, y)
      y += 6
      doc.text(`Invoice #: INV-${school.shortName.replace(/\s/g, "").toUpperCase()}-${new Date().getFullYear()}`, margin, y)
      y += 10

      doc.text("Bill To:", margin, y)
      y += 6
      doc.setFont("helvetica", "bold")
      doc.text(school.name, margin, y)
      y += 6
      doc.setFont("helvetica", "normal")
      if (school.contactName) { doc.text(`Attn: ${school.contactName}`, margin, y); y += 6 }
      y += 10

      // Table
      doc.setFillColor(240, 240, 240)
      doc.rect(margin, y, pageWidth - 2 * margin, 8, "F")
      doc.setFont("helvetica", "bold")
      doc.text("Description", margin + 3, y + 5.5)
      doc.text("Amount", pageWidth - margin - 3, y + 5.5, { align: "right" })
      y += 12

      const tier = school.selectedTier === "premium" ? "Premium Custom" : "Standard"
      const price = school.selectedTier === "premium" ? school.pricePremium : school.priceStandard
      doc.setFont("helvetica", "normal")
      doc.text(`Clear30 Annual Campus Partnership - ${tier}`, margin + 3, y + 4)
      doc.text(formatCurrency(price), pageWidth - margin - 3, y + 4, { align: "right" })
      y += 10

      doc.line(margin, y, pageWidth - margin, y)
      y += 8
      doc.setFont("helvetica", "bold")
      doc.text("Total Due:", margin + 3, y)
      doc.text(formatCurrency(price), pageWidth - margin - 3, y, { align: "right" })
      y += 15

      doc.setFont("helvetica", "normal")
      doc.text("Payment Terms: Net 30", margin, y)
      y += 6
      doc.text("Please make payment to Clear30, Inc.", margin, y)
      y += 6
      doc.text("101 Euclid Ave, Hastings on Hudson, NY 10706", margin, y)
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight()
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text("Clear30, Inc. | clear30.org | julian@clear30.com", pageWidth / 2, pageHeight - 10, { align: "center" })

    doc.save(`Clear30_${docType}_${school.shortName.replace(/\s/g, "_")}.pdf`)
    setGenerated(true)
    setTimeout(() => setGenerated(false), 3000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-gray-900">Document Generator</h1>
        <p className="text-[13px] text-gray-500 mt-1">Generate customized partnership documents</p>
      </div>

      {/* Step 1: Select School */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">1. Select University</h3>
        <select
          value={selectedSchool}
          onChange={(e) => { setSelectedSchool(e.target.value); setDocType(null) }}
          className="w-full text-[13px] border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-200"
        >
          <option value="">Choose a university...</option>
          {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Step 2: Choose Document Type */}
      {selectedSchool && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">2. Choose Document Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {docTypes.map(dt => {
              const Icon = dt.icon
              const active = docType === dt.id
              return (
                <button
                  key={dt.id}
                  onClick={() => setDocType(dt.id)}
                  className={`text-left rounded-2xl border transition-all ${active ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200" : "border-gray-200 hover:border-gray-300"}`}
                  style={{ padding: "16px 24px" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={16} className={active ? "text-emerald-600" : "text-gray-400"} />
                    <span className={`text-[13px] font-medium ${active ? "text-emerald-700" : "text-gray-900"}`}>{dt.label}</span>
                  </div>
                  <div className="text-[11px] text-gray-500">{dt.desc}</div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Step 3: Preview & Generate */}
      {selectedSchool && docType && school && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100" style={{ padding: "24px 32px" }}>
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">3. Generate</h3>
          <div className="bg-gray-50 rounded-2xl mb-4 text-[13px] text-gray-600 space-y-2" style={{ padding: "20px 32px" }}>
            <div><strong>University:</strong> {school.name}</div>
            <div><strong>Domain:</strong> @{school.emailDomain || "—"}</div>
            <div><strong>Students:</strong> {school.studentPopulation?.toLocaleString()}</div>
            <div><strong>Contact:</strong> {school.contactName || "—"}</div>
            <div><strong>Standard Price:</strong> {formatCurrency(school.priceStandard)}</div>
            {school.pricePremium && <div><strong>Premium Price:</strong> {formatCurrency(school.pricePremium)}</div>}
          </div>
          <button onClick={generatePDF} className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white text-[13px] font-medium" style={{ background: GRADIENT }}>
            <Download size={16} />
            {generated ? "Downloaded!" : `Generate ${docTypes.find(d => d.id === docType)?.label} PDF`}
          </button>
        </div>
      )}
    </div>
  )
}

// ─── ANALYTICS PAGE ───
function AnalyticsPage({ universities }) {
  const pipeline = universities.filter(u => u.stage !== "closed_lost")
  const pipelineOnly = universities.filter(u => u.stage !== "active_partner" && u.stage !== "closed_lost" && u.stage !== "closed_won")
  const active = universities.filter(u => u.stage === "active_partner")

  // Funnel data
  const funnelData = KANBAN_GROUPS.filter(g => g.id !== "active").map(group => ({
    name: group.label,
    count: pipeline.filter(u => group.stages.includes(u.stage)).length,
  }))

  // Revenue breakdown
  const activeRevenue = active.reduce((sum, u) => sum + u.amountPaid, 0)
  const pipelineStandard = pipelineOnly.reduce((sum, u) => sum + (u.priceStandard || 0), 0)
  const pipelinePremium = pipelineOnly.reduce((sum, u) => sum + (u.pricePremium || 0), 0)

  const revenueData = [
    { name: "Collected", value: activeRevenue },
    { name: "Pipeline (Std)", value: pipelineStandard },
    { name: "Pipeline (Prem)", value: pipelinePremium },
  ]
  const COLORS = ["#43b692", "#3B82F6", "#8B5CF6"]

  // Confidence breakdown
  const confidenceData = ["Very High", "High", "Medium", "Low", "N/A"].map(c => ({
    name: c,
    count: pipelineOnly.filter(u => u.confidence === c).length,
    color: CONFIDENCE_COLORS[c],
  })).filter(d => d.count > 0)

  // Upcoming actions
  const upcoming = pipelineOnly
    .filter(u => u.nextActionDate)
    .sort((a, b) => new Date(a.nextActionDate) - new Date(b.nextActionDate))
    .slice(0, 10)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-gray-900">Analytics</h1>
        <p className="text-[13px] text-gray-500 mt-1">Pipeline performance and revenue overview</p>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-8">
        <MetricCard label="Total Pipeline Value" value={formatCurrency(pipelineStandard)} sub="Standard pricing" icon={DollarSign} color="#43b692" />
        <MetricCard label="Premium Potential" value={formatCurrency(pipelinePremium)} sub="If all go premium" icon={TrendingUp} color="#8B5CF6" />
        <MetricCard label="Revenue Collected" value={formatCurrency(activeRevenue)} sub={`${active.length} partners`} icon={Award} color="#22C55E" />
        <MetricCard label="Avg Deal Size" value={formatCurrency(Math.round(pipelineStandard / (pipelineOnly.length || 1)))} sub="Standard" icon={BarChart3} color="#3B82F6" />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-8">
        {/* Pipeline Funnel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100" style={{ padding: "24px 32px" }}>
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Pipeline Funnel</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={funnelData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
              <Tooltip />
              <Bar dataKey="count" fill={ACCENT} radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100" style={{ padding: "24px 32px" }}>
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Confidence Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={confidenceData} dataKey="count" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, count }) => `${name}: ${count}`}>
                {confidenceData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upcoming Actions */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100" style={{ padding: "24px 32px" }}>
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Upcoming Actions</h3>
        <div className="space-y-2">
          {upcoming.map(school => {
            const days = daysUntil(school.nextActionDate)
            const overdue = days !== null && days < 0
            return (
              <div key={school.id} className={`flex items-center gap-4 rounded-2xl ${overdue ? "bg-red-50" : "bg-gray-50"}`} style={{ padding: "12px 24px" }}>
                <div className={`text-xs font-bold w-16 text-center ${overdue ? "text-red-600" : "text-gray-500"}`}>
                  {overdue ? `${Math.abs(days)}d ago` : days === 0 ? "TODAY" : `${days}d`}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{school.shortName}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{school.nextAction}</div>
                </div>
                <StageBadge stage={school.stage} />
              </div>
            )
          })}
          {upcoming.length === 0 && <div className="text-sm text-gray-400 text-center py-8">No upcoming actions</div>}
        </div>
      </div>
    </div>
  )
}

// ─── SETTINGS PAGE ───
function SettingsPage({ universities, onImport, onReset }) {
  const fileInputRef = useRef(null)

  const handleImport = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result)
        if (data.universities) {
          onImport(data.universities)
          alert("Data imported successfully!")
        }
      } catch (err) {
        alert("Failed to import: invalid JSON file")
      }
    }
    reader.readAsText(file)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-gray-900">Settings</h1>
        <p className="text-[13px] text-gray-500 mt-1">Manage your data and preferences</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100" style={{ padding: "24px 32px" }}>
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">Data Management</h3>
          <div className="space-y-2.5">
            <button
              onClick={() => exportData(universities)}
              className="w-full flex items-center gap-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors text-left"
              style={{ padding: "14px 28px" }}
            >
              <Download size={16} className="text-gray-400" />
              <div>
                <div className="text-[13px] font-medium text-gray-900">Export Data</div>
                <div className="text-[11px] text-gray-400">Download a JSON backup of all your data</div>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors text-left"
              style={{ padding: "14px 28px" }}
            >
              <Upload size={16} className="text-gray-400" />
              <div>
                <div className="text-[13px] font-medium text-gray-900">Import Data</div>
                <div className="text-[11px] text-gray-400">Load data from a JSON backup file</div>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

            <button
              onClick={() => {
                if (confirm("Reset all data to defaults? This cannot be undone.")) onReset()
              }}
              className="w-full flex items-center gap-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors text-left"
              style={{ padding: "14px 28px" }}
            >
              <RotateCcw size={16} className="text-red-400" />
              <div>
                <div className="text-[13px] font-medium text-red-700">Reset to Defaults</div>
                <div className="text-[11px] text-red-400">Restore original seed data (destroys current data)</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100" style={{ padding: "24px 32px" }}>
          <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">About</h3>
          <div className="text-[13px] text-gray-500 space-y-1">
            <div>Clear30 Sales Hub v1.0</div>
            <div>{universities.length} universities tracked</div>
            <div>Data stored locally in your browser</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── QUICK ADD MODAL ───
function QuickAddModal({ onAdd, onClose }) {
  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")
  const [students, setStudents] = useState("")
  const [contact, setContact] = useState("")
  const [email, setEmail] = useState("")

  const handleAdd = () => {
    if (!name) return
    const pop = parseInt(students) || 0
    onAdd({
      id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
      name,
      shortName: shortName || name.split(" ").slice(-1)[0],
      emailDomain: "",
      studentPopulation: pop,
      stage: "outreach",
      confidence: "N/A",
      contactName: contact,
      contactRole: "",
      contactEmail: email,
      priceStandard: Math.round(pop * 0.1),
      pricePremium: Math.round(pop * 0.1 * 2.5),
      selectedTier: null,
      confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
      emailStep: 0, emailsSent: [],
      partnerType: null, contractTerm: null, amountPaid: 0,
      launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
      nextAction: "Send initial outreach email", nextActionDate: new Date().toISOString().slice(0, 10),
      notes: [{ date: new Date().toISOString().slice(0, 10), text: "Added to pipeline" }],
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl px-10 pt-10 pb-9 w-[540px] animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-gray-900">Add University</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"><X size={20} /></button>
        </div>
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">University name *</label>
            <input type="text" placeholder="e.g. University of Michigan" value={name} onChange={(e) => setName(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" autoFocus />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Short name</label>
              <input type="text" placeholder="e.g. UMich" value={shortName} onChange={(e) => setShortName(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Student population</label>
              <input type="text" inputMode="numeric" placeholder="e.g. 25000" value={students} onChange={(e) => setStudents(e.target.value.replace(/[^0-9]/g, ""))} className="w-full text-sm border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Contact name</label>
              <input type="text" placeholder="e.g. Jane Smith" value={contact} onChange={(e) => setContact(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Contact email</label>
              <input type="email" placeholder="e.g. jane@school.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full text-sm border border-gray-200 rounded-xl px-5 py-3.5 focus:outline-none focus:ring-2 focus:ring-emerald-200" />
            </div>
          </div>
        </div>
        <div className="flex gap-4 mt-10">
          <button onClick={onClose} className="flex-1 px-6 py-3.5 border border-gray-200 rounded-full text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">Cancel</button>
          <button onClick={handleAdd} className="flex-1 px-6 py-3.5 rounded-full text-white text-sm font-semibold" style={{ background: GRADIENT }} disabled={!name}>Add to Pipeline</button>
        </div>
      </div>
    </div>
  )
}

// ─── MAIN APP ───
export default function App() {
  const [page, setPage] = useState("pipeline")
  const [universities, setUniversities] = useState(() => {
    const stored = loadData()
    return stored?.universities || SEED_UNIVERSITIES
  })
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  // Auto-save
  useEffect(() => { saveData(universities) }, [universities])

  // Cmd+K shortcut (future: search)
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const updateUniversity = (id, updates) => {
    setUniversities(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }

  const overdueActions = universities.filter(u =>
    u.nextActionDate && new Date(u.nextActionDate) < new Date() && u.stage !== "active_partner" && u.stage !== "closed_lost"
  )

  const school = selectedSchool ? universities.find(u => u.id === selectedSchool) : null

  const pageComponents = {
    pipeline: <PipelinePage universities={universities} onSelectSchool={setSelectedSchool} onUpdate={(id, updates) => updateUniversity(id, updates)} setQuickAddOpen={setQuickAddOpen} />,
    email: <EmailCommandCenter universities={universities} onUpdate={(id, updates) => updateUniversity(id, updates)} onSelectSchool={setSelectedSchool} />,
    fulfillment: <FulfillmentDashboard universities={universities} onSelectSchool={setSelectedSchool} />,
    documents: <DocumentGenerator universities={universities} />,
    analytics: <AnalyticsPage universities={universities} />,
    settings: <SettingsPage universities={universities} onImport={setUniversities} onReset={() => setUniversities(SEED_UNIVERSITIES)} />,
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar currentPage={page} setPage={setPage} overdueCount={overdueActions.length} />
      <div className="flex-1 p-8 overflow-auto" style={{ maxHeight: "100vh" }}>
        <div className="max-w-[1200px] mx-auto">
          {pageComponents[page]}
        </div>
      </div>
      {school && (
        <SchoolDetailPanel
          school={school}
          onClose={() => setSelectedSchool(null)}
          onUpdate={(updates) => updateUniversity(selectedSchool, updates)}
        />
      )}
      {quickAddOpen && (
        <QuickAddModal
          onAdd={(newSchool) => { setUniversities(prev => [...prev, newSchool]); setQuickAddOpen(false) }}
          onClose={() => setQuickAddOpen(false)}
        />
      )}
    </div>
  )
}
