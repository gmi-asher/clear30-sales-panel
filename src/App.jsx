import { useState, useEffect, useRef } from 'react'
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Home, BarChart3, Mail, CheckCircle, FileText, Settings, Users, Calendar, Star, Zap, X, Award, ChevronRight, ChevronDown, Search, Plus, Download, Upload, Trash2, Copy, Eye, Edit3, Clock, AlertTriangle, TrendingUp, DollarSign, Building2, GraduationCap, Phone, AtSign, StickyNote, Filter, LayoutGrid, List, ExternalLink, RotateCcw, Save, Check, MoreHorizontal, Sparkles, Loader2 } from 'lucide-react'
import jsPDF from 'jspdf'

// ─── THEME ───
const ACCENT = "#5BB4A9"
const ACCENT_LIGHT = "#EAF6F5"
const GRADIENT = "linear-gradient(135deg, #5BB4A9, #80C97A)"

// ─── STAGE DEFINITIONS ───
const STAGES = [
  { id: "outreach", label: "Outreach", color: "#6B7280" },
  { id: "meeting_booked", label: "Meeting Booked", color: "#5BB4A9" },
  { id: "meeting1_done", label: "Meeting 1 Done", color: "#4A9E94" },
  { id: "pilot_meeting_scheduled", label: "Pilot Meeting Scheduled", color: "#80C97A" },
  { id: "awaiting_pilot", label: "Awaiting Pilot Start", color: "#F5A623" },
  { id: "active_pilot", label: "Active Pilot", color: "#6AB564" },
  { id: "active_partner", label: "Active Partner", color: "#5BB4A9" },
  { id: "closed_lost", label: "Closed Lost", color: "#E53E3E" },
]

// Map old stage IDs to new ones for migration
const STAGE_MIGRATION = {
  meeting1_scheduled: "meeting_booked",
  meeting2_scheduled: "pilot_meeting_scheduled",
  meeting2_done: "awaiting_pilot",
  pilot: "active_pilot",
  contract_sent: "active_pilot",
  closed_won: "active_partner",
}

const KANBAN_GROUPS = [
  { id: "outreach", label: "Outreach", stages: ["outreach"] },
  { id: "meeting", label: "Meeting", stages: ["meeting_booked", "meeting1_done"] },
  { id: "pilot_prep", label: "Pilot Prep", stages: ["pilot_meeting_scheduled"] },
  { id: "pilot", label: "Pilot", stages: ["awaiting_pilot", "active_pilot"] },
  { id: "active", label: "Active Partners", stages: ["active_partner"] },
]

const CONFIDENCE_COLORS = {
  "N/A": "#9CA3AF", "Low": "#E5E5E5", "Medium": "#F5A623", "High": "#5BB4A9", "Very High": "#80C97A"
}

// ─── STAGE → NEXT ACTION SUGGESTIONS ───
const STAGE_NEXT_ACTIONS = {
  outreach: { label: "Follow-Up Date", placeholder: "Follow up on outreach" },
  meeting_booked: { label: "Meeting Date", placeholder: "Meeting 1 scheduled" },
  meeting1_done: { label: "Pilot Scheduling", placeholder: "Schedule pilot meeting" },
  pilot_meeting_scheduled: { label: "Pilot Meeting Date", placeholder: "Pilot meeting" },
  awaiting_pilot: { label: "Pilot Start Date", placeholder: "Pilot starting" },
  active_pilot: { label: "Review Date", placeholder: "30-day review" },
  active_partner: { label: "Next Check-In", placeholder: "Check in with partner" },
  closed_lost: { label: "Re-engage Date", placeholder: "Check back in" },
}

// ─── STAGE-AWARE CHECKLISTS ───
const STAGE_CHECKLISTS = {
  outreach: [
    { key: "leadMagnetSelected", label: "Lead magnet selected" },
    { key: "outreachEmailSent", label: "Outreach email sent" },
    { key: "sentByAssigned", label: "Sent by assigned" },
  ],
  meeting_booked: [
    { key: "confirmationPageSent", label: "Confirmation page sent" },
    { key: "demoCompleted", label: "Demo sent" },
    { key: "preMeetingSequenceStarted", label: "Pre-meeting email sequence started" },
  ],
  meeting1_done: [
    { key: "leaveWithDocSent", label: "Leave-with doc sent" },
    { key: "voucherCodesSent", label: "Voucher codes sent" },
    { key: "pilotMeetingBooked", label: "Pilot meeting booked" },
  ],
  pilot_meeting_scheduled: [
    { key: "pilotMeetingAgendaSent", label: "Pilot meeting agenda sent" },
    { key: "leaveWithDocConfirmed", label: "Leave-with doc confirmed received" },
  ],
  awaiting_pilot: [
    { key: "pilotContractSent", label: "Pilot contract sent and signed" },
    { key: "itSetupCompleted", label: "IT setup completed" },
    { key: "adminPanelDistributed", label: "Admin panel access granted" },
    { key: "distributionKitSent", label: "Distribution kit sent" },
    { key: "pilotStartDateSet", label: "Pilot start date confirmed" },
  ],
  active_pilot: [
    { key: "thirtyDayReviewScheduled", label: "30-day review meeting scheduled" },
    { key: "midPilotCheckin", label: "Mid-pilot check-in completed" },
  ],
  active_partner: [
    { key: "paidContractSent", label: "Paid contract sent" },
    { key: "onboardingComplete", label: "Onboarding complete" },
  ],
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

// ─── MASTER UNIVERSITY DATABASE (from CRM xlsx) ───
// Fields: n=name, s=state, w=website, p=studentPopulation, u=unitId, c=contacts
// Contact fields: fn=firstName, ln=lastName, t=title, o=office, r=role, pt=personaType, e=email, ph=phone, li=linkedin
const MASTER_UNIVERSITIES = [{"n":"A T Still University of Health Sciences","s":"MO","w":"www.atsu.edu/","u":177834,"p":4251},{"n":"Abilene Christian University","s":"TX","w":"www.acu.edu/","u":222178,"p":5872},{"n":"Abraham Baldwin Agricultural College","s":"GA","w":"https://www.abac.edu/","u":138558,"p":4371},{"n":"Adelphi University","s":"NY","w":"www.adelphi.edu/","u":188429,"p":8359},{"n":"Aims Community College","s":"CO","w":"www.aims.edu/","u":126207,"p":10056},{"n":"Alabama A & M University","s":"AL","w":"www.aamu.edu/","u":100654,"p":7120},{"n":"Alabama State University","s":"AL","w":"www.alasu.edu/","u":100724,"p":4308},{"n":"Albany State University","s":"GA","w":"https://www.asurams.edu/","u":138716,"p":7806},{"n":"Alvin Community College","s":"TX","w":"www.alvincollege.edu/","u":222567,"p":7563},{"n":"American College of Financial Services","s":"PA","w":"https://www.theamericancollege.edu/","u":210809,"p":14716},{"n":"American University","s":"DC","w":"www.american.edu/","u":131159,"p":15188},{"n":"Ana G. Mendez University","s":"FL","w":"www.agmu.edu/","u":483595,"p":11028},{"n":"Anderson University","s":"SC","w":"https://www.andersonuniversity.edu/","u":217633,"p":4964},{"n":"Andrews University","s":"MI","w":"https://www.andrews.edu/","u":168740,"p":4003},{"n":"Angelo State University","s":"TX","w":"www.angelo.edu/","u":222831,"p":12798},{"n":"Antelope Valley Community College District","s":"CA","w":"www.avc.edu/","u":109350,"p":17155},{"n":"Appalachian State University","s":"NC","w":"https://www.appstate.edu/","u":197869,"p":23026},{"n":"Arapahoe Community College","s":"CO","w":"www.arapahoe.edu/","u":126289,"p":18447},{"n":"Arizona State University Campus Immersion","s":"AZ","w":"www.asu.edu/","u":104151,"p":86547},{"n":"Arizona State University Digital Immersion","s":"AZ","w":"www.asu.edu/","u":483124,"p":98316,"c":[{"fn":"Flavio","ln":"Marsiglia","t":"Health Solutions Ambassador","o":"College of Health Solutions","r":"Champion","pt":"AOD Prevention / Recovery","e":"marsiglia@asu.edu","ph":"602-496-3333","li":"https://www.linkedin.com/in/flavio-marsiglia-43768920?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BkW0rBlgRTuiJh%2Ft%2FNa0ttA%3D%3D"},{"fn":"Marisa","ln":"Domino","t":"Executive Center Director and Professor","o":"College of Health Solutions","r":"Decision Maker","pt":"Student Affairs Leadership","e":"marisa.domino@asu.edu","ph":"602-496-2007","li":"https://www.linkedin.com/in/marisa-domino-283055194?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BqFCEioRgSs6BFrwH5hIvWg%3D%3D"},{"fn":"Felipe","ln":"Castro","t":"Health Solutions Ambassador","o":"College of Health Solutions","r":"Champion","pt":"Health Promotion / Wellness","e":"felipeg.castro@asu.edu","ph":"602-496-1720","li":""},{"fn":"Katelyn","ln":"Hirt","t":"Advocacy Case Manager","o":"EOSS DOS Student Advocacy Tempe I","r":"Influencer","pt":"Case Management / BIT","e":"katelyn.hirt@asu.edu","ph":"","li":""}]},{"n":"Arkansas State University","s":"AR","w":"www.astate.edu/","u":106458,"p":20313},{"n":"Arkansas Tech University","s":"AR","w":"https://www.atu.edu/","u":106467,"p":10783},{"n":"Ashland University","s":"OH","w":"https://www.ashland.edu/","u":201104,"p":5217},{"n":"Auburn University","s":"AL","w":"www.auburn.edu/","u":100858,"p":37008},{"n":"Auburn University at Montgomery","s":"AL","w":"www.aum.edu/","u":100830,"p":6526},{"n":"Augusta University","s":"GA","w":"www.augusta.edu/","u":482149,"p":11147},{"n":"Aurora University","s":"IL","w":"https://aurora.edu/","u":143118,"p":7071},{"n":"Austin Community College District","s":"TX","w":"www.austincc.edu/","u":222992,"p":58468,"c":[{"fn":"Shasta","ln":"Buchanan","t":"Vice Chancellor","o":"Student Affairs","r":"Decision Maker","pt":"Student Affairs Leadership","e":"shasta.buchanan@austincc.edu","ph":"512-223-7053","li":"https://www.linkedin.com/in/shastabuchanan/overlay/contact-info/"},{"fn":"Mary","ln":"Forrest-Wright","t":"Mental Health Counselor","o":"Mental Health Counseling","r":"Influencer","pt":"Other","e":"mary.forest-wright@austincc.edu","ph":"(512) 223.0420","li":"https://www.linkedin.com/in/mary-forrest-wright-920410283?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B5dK0SA1aTcWAc3qgMn94jQ%3D%3D"}]},{"n":"Austin Peay State University","s":"TN","w":"www.apsu.edu/","u":219602,"p":11853},{"n":"Azusa Pacific University","s":"CA","w":"www.apu.edu/","u":109785,"p":7906},{"n":"Babson College","s":"MA","w":"www.babson.edu/","u":164580,"p":4645},{"n":"Baker College","s":"MI","w":"www.baker.edu/","u":168847,"p":4976},{"n":"Bakersfield College","s":"CA","w":"https://www.bakersfieldcollege.edu/","u":109819,"p":45178},{"n":"Ball State University","s":"IN","w":"https://www.bsu.edu/","u":150136,"p":23638},{"n":"Barry University","s":"FL","w":"www.barry.edu/","u":132471,"p":7994},{"n":"Bates Technical College","s":"WA","w":"https://www.batestech.edu/","u":235671,"p":6309},{"n":"Baylor University","s":"TX","w":"www.baylor.edu/","u":223232,"p":23100},{"n":"Belhaven University","s":"MS","w":"https://www.belhaven.edu/","u":175421,"p":5176},{"n":"Bellevue College","s":"WA","w":"https://bellevuecollege.edu/","u":234669,"p":18469},{"n":"Bellevue University","s":"NE","w":"https://www.bellevue.edu/","u":180814,"p":20201},{"n":"Belmont University","s":"TN","w":"https://www.belmont.edu/","u":219709,"p":9421},{"n":"Bemidji State University","s":"MN","w":"https://www.bemidjistate.edu/","u":173124,"p":4956},{"n":"Bentley University","s":"MA","w":"www.bentley.edu/","u":164739,"p":5534},{"n":"Berklee College of Music","s":"MA","w":"www.berklee.edu/","u":164748,"p":9705},{"n":"Beth Medrash Govoha","s":"NJ","w":"bmg.edu/","u":183804,"p":10102},{"n":"Bethel University","s":"MN","w":"https://www.bethel.edu/","u":173160,"p":4501},{"n":"Bethel University","s":"TN","w":"www.bethelu.edu/","u":219718,"p":4501},{"n":"Binghamton University","s":"NY","w":"www.binghamton.edu/","u":196079,"p":20575},{"n":"Biola University","s":"CA","w":"https://www.biola.edu/","u":110097,"p":5846},{"n":"Bismarck State College","s":"ND","w":"https://bismarckstate.edu/","u":200022,"p":5401},{"n":"Black Hills State University","s":"SD","w":"www.bhsu.edu/","u":219046,"p":5715},{"n":"Boise State University","s":"ID","w":"https://www.boisestate.edu/","u":142115,"p":33009},{"n":"Boston College","s":"MA","w":"www.bc.edu/","u":164924,"p":16561},{"n":"Boston University","s":"MA","w":"www.bu.edu/","u":164988,"p":45380},{"n":"Bowie State University","s":"MD","w":"www.bowiestate.edu/","u":162007,"p":7274},{"n":"Bowling Green State University-Main Campus","s":"OH","w":"www.bgsu.edu/","u":201441,"p":19958},{"n":"Bradley University","s":"IL","w":"www.bradley.edu/","u":143358,"p":5603},{"n":"Brandeis University","s":"MA","w":"https://www.brandeis.edu/","u":165015,"p":5803},{"n":"Brazosport College","s":"TX","w":"www.brazosport.edu/","u":223506,"p":5707},{"n":"Bridgewater State University","s":"MA","w":"www.bridgew.edu/","u":165024,"p":11506},{"n":"Brigham Young University","s":"UT","w":"https://byu.edu/","u":230038,"p":39598},{"n":"Brigham Young University-Idaho","s":"ID","w":"https://www.byui.edu/","u":142522,"p":58556,"c":[{"fn":"Emily","ln":"Brumbaugh","t":"Wellness Center Director","o":"Counseling Center","r":"Decision Maker","pt":"Counseling Center Leadership","e":"brumbaughe@byui.edu","ph":"tel:208-496-7461","li":"https://www.linkedin.com/in/emily-brumbaugh-07b25a87/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BhJ%2BFqOTEQPiFzbUp2TUmvA%3D%3D"},{"fn":"Dallas","ln":"Johnson","t":"Counselor","o":"Counseling Center","r":"Influencer","pt":"Other","e":"johnsondal@byui.edu","ph":"tel:208-496-9370","li":"https://www.linkedin.com/in/dallasjohnsonphd/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BlHt8aPOMQW%2BwUfl2mN%2B1ZQ%3D%3D"},{"fn":"Jim","ln":"Hopla","t":"Faculty","o":"Department of Health Services","r":"Champion","pt":"Health Promotion / Wellness","e":"hoplaj@byui.edu","ph":"tel:208-496-4649","li":"https://www.linkedin.com/in/jim-j-hopla-01915588/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BC4kE4ylkRemUlHSQK755ww%3D%3D"}]},{"n":"Broward College","s":"FL","w":"www.broward.edu/","u":132709,"p":45660},{"n":"Brown University","s":"RI","w":"www.brown.edu/","u":217156,"p":12261},{"n":"Bryant & Stratton College-Buffalo","s":"NY","w":"https://www.bryantstratton.edu/","u":189583,"p":4217},{"n":"Bryant & Stratton College-Online","s":"NY","w":"https://www.bryantstratton.edu/","u":480091,"p":16061},{"n":"Bucknell University","s":"PA","w":"www.bucknell.edu/","u":211291,"p":4014},{"n":"Butler University","s":"IN","w":"www.butler.edu/","u":150163,"p":6465},{"n":"California Baptist University","s":"CA","w":"www.calbaptist.edu/","u":110361,"p":13806},{"n":"California Polytechnic State University-San Luis Obispo","s":"CA","w":"calpoly.edu/","u":110422,"p":23829},{"n":"California State Polytechnic University-Humboldt","s":"CA","w":"www.humboldt.edu/","u":115755,"p":6780},{"n":"California State Polytechnic University-Pomona","s":"CA","w":"www.cpp.edu/","u":110529,"p":29319},{"n":"California State University-Bakersfield","s":"CA","w":"www.csub.edu/","u":110486,"p":11993},{"n":"California State University-Channel Islands","s":"CA","w":"www.csuci.edu/","u":441937,"p":6662},{"n":"California State University-Chico","s":"CA","w":"www.csuchico.edu/","u":110538,"p":15936},{"n":"California State University-Dominguez Hills","s":"CA","w":"https://www.csudh.edu/","u":110547,"p":17196},{"n":"California State University-East Bay","s":"CA","w":"https://www.csueastbay.edu/","u":110574,"p":15103},{"n":"California State University-Fresno","s":"CA","w":"www.fresnostate.edu/","u":110556,"p":26013},{"n":"California State University-Fullerton","s":"CA","w":"www.fullerton.edu/","u":110565,"p":46633},{"n":"California State University-Long Beach","s":"CA","w":"www.csulb.edu/","u":110583,"p":44099},{"n":"California State University-Los Angeles","s":"CA","w":"https://www.calstatela.edu/","u":110592,"p":27493},{"n":"California State University-Monterey Bay","s":"CA","w":"https://csumb.edu/","u":409698,"p":7706},{"n":"California State University-Northridge","s":"CA","w":"https://www.csun.edu/","u":110608,"p":42018},{"n":"California State University-Sacramento","s":"CA","w":"https://www.csus.edu/","u":110617,"p":36908},{"n":"California State University-San Bernardino","s":"CA","w":"www.csusb.edu/","u":110510,"p":21236},{"n":"California State University-San Marcos","s":"CA","w":"www.csusm.edu/","u":366711,"p":16826},{"n":"California State University-Stanislaus","s":"CA","w":"https://www.csustan.edu/","u":110495,"p":11300},{"n":"Cameron University","s":"OK","w":"https://www.cameron.edu/","u":206914,"p":4293},{"n":"Campbell University","s":"NC","w":"https://www.campbell.edu/","u":198136,"p":5697},{"n":"Campbellsville University","s":"KY","w":"https://www.campbellsville.edu/","u":156365,"p":15615},{"n":"Carnegie Mellon University","s":"PA","w":"www.cmu.edu/","u":211440,"p":16795},{"n":"Case Western Reserve University","s":"OH","w":"www.case.edu/","u":201645,"p":12680},{"n":"Cedarville University","s":"OH","w":"https://www.cedarville.edu/","u":201654,"p":5744},{"n":"Central Connecticut State University","s":"CT","w":"www.ccsu.edu/","u":128771,"p":11379},{"n":"Central Methodist University-College of Graduate and Extended Studies","s":"MO","w":"www.centralmethodist.edu/","u":445267,"p":5073},{"n":"Central Michigan University","s":"MI","w":"https://www.cmich.edu/","u":169248,"p":16725},{"n":"Central Ohio Technical College","s":"OH","w":"www.cotc.edu/","u":201672,"p":4349},{"n":"Central State University","s":"OH","w":"https://www.centralstate.edu/","u":201690,"p":4238},{"n":"Central Washington University","s":"WA","w":"www.cwu.edu/","u":234827,"p":20461},{"n":"Champlain College","s":"VT","w":"https://www.champlain.edu/","u":230852,"p":4558},{"n":"Chapman University","s":"CA","w":"https://www.chapman.edu/","u":111948,"p":10474},{"n":"Charleston Southern University","s":"SC","w":"https://www.charlestonsouthern.edu/","u":217688,"p":4231},{"n":"Chemeketa Community College","s":"OR","w":"www.chemeketa.edu/","u":208390,"p":12632},{"n":"Christopher Newport University","s":"VA","w":"https://cnu.edu/","u":231712,"p":4642},{"n":"Cincinnati State Technical and Community College","s":"OH","w":"www.cincinnatistate.edu/","u":201928,"p":13188},{"n":"Citadel Military College of South Carolina","s":"SC","w":"https://citadel.edu/","u":217864,"p":4325},{"n":"Clark Atlanta University","s":"GA","w":"www.cau.edu/","u":138947,"p":4394},{"n":"Clark College","s":"WA","w":"https://www.clark.edu/","u":234933,"p":9732},{"n":"Clark State College","s":"OH","w":"https://www.clarkstate.edu/","u":201973,"p":6711},{"n":"Clark University","s":"MA","w":"www.clarku.edu/","u":165334,"p":4611},{"n":"Clarkson University","s":"NY","w":"https://www.clarkson.edu/","u":190044,"p":4041},{"n":"Clayton  State University","s":"GA","w":"www.clayton.edu/","u":139311,"p":7195},{"n":"Clemson University","s":"SC","w":"www.clemson.edu/","u":217882,"p":31612},{"n":"Cleveland State University","s":"OH","w":"www.csuohio.edu/","u":202134,"p":16742},{"n":"Clover Park Technical College","s":"WA","w":"www.cptc.edu/","u":234951,"p":4898},{"n":"Coastal Carolina University","s":"SC","w":"https://www.coastal.edu/","u":218724,"p":11733},{"n":"Cochise County Community College District","s":"AZ","w":"https://www.cochise.edu/","u":104425,"p":8804},{"n":"College of Central Florida","s":"FL","w":"www.cf.edu/","u":132851,"p":8099},{"n":"College of Charleston","s":"SC","w":"https://www.charleston.edu/","u":217819,"p":13568},{"n":"College of Coastal Georgia","s":"GA","w":"https://www.ccga.edu/","u":139250,"p":4001},{"n":"College of Southern Idaho","s":"ID","w":"https://www.csi.edu/","u":142559,"p":16205},{"n":"College of Southern Nevada","s":"NV","w":"www.csn.edu/","u":182005,"p":39425},{"n":"College of Staten Island CUNY","s":"NY","w":"www.csi.cuny.edu/","u":190558,"p":13127},{"n":"College of the Mainland","s":"TX","w":"www.com.edu/","u":226408,"p":6409},{"n":"Collin County Community College District","s":"TX","w":"https://www.collin.edu/","u":247834,"p":53613},{"n":"Colorado Christian University","s":"CO","w":"https://www.ccu.edu/","u":126669,"p":17187},{"n":"Colorado Mesa University","s":"CO","w":"www.coloradomesa.edu/","u":127556,"p":10157},{"n":"Colorado Mountain College","s":"CO","w":"coloradomtn.edu/","u":126711,"p":7821},{"n":"Colorado School of Mines","s":"CO","w":"www.mines.edu/","u":126775,"p":8103},{"n":"Colorado State University Global","s":"CO","w":"https://csuglobal.edu/","u":476975,"p":15502},{"n":"Colorado State University Pueblo","s":"CO","w":"https://www.csupueblo.edu/","u":128106,"p":11999},{"n":"Colorado State University-Fort Collins","s":"CO","w":"colostate.edu/","u":126818,"p":37218},{"n":"Columbia Basin College","s":"WA","w":"www.columbiabasin.edu/","u":234979,"p":8985},{"n":"Columbia College","s":"MO","w":"https://www.ccis.edu/","u":177065,"p":8694},{"n":"Columbia College Chicago","s":"IL","w":"www.colum.edu/","u":144281,"p":6888},{"n":"Columbia University in the City of New York","s":"NY","w":"www.columbia.edu/","u":190150,"p":39113},{"n":"Columbus State Community College","s":"OH","w":"https://www.cscc.edu/","u":202222,"p":42485},{"n":"Columbus State University","s":"GA","w":"www.columbusstate.edu/","u":139366,"p":9160},{"n":"Commonwealth University of Pennsylvania","s":"PA","w":"https://www.commonwealthu.edu/","u":498562,"p":12365},{"n":"Community College of Denver","s":"CO","w":"www.ccd.edu/","u":126942,"p":11317},{"n":"Concordia University-Chicago","s":"IL","w":"https://www.cuchicago.edu/","u":144351,"p":6786},{"n":"Concordia University-Irvine","s":"CA","w":"www.cui.edu/","u":112075,"p":4913},{"n":"Concordia University-Saint Paul","s":"MN","w":"https://www.csp.edu/","u":173328,"p":7743},{"n":"Concordia University-Wisconsin","s":"WI","w":"https://www.cuw.edu/","u":238616,"p":6740},{"n":"Cornell University","s":"NY","w":"www.cornell.edu/","u":190415,"p":26727},{"n":"Crafton Hills College","s":"CA","w":"www.craftonhills.edu/","u":113111,"p":9263},{"n":"Creighton University","s":"NE","w":"https://www.creighton.edu/","u":181002,"p":9884},{"n":"Culinary Institute of America","s":"NY","w":"www.ciachef.edu/","u":190503,"p":4119},{"n":"CUNY Bernard M Baruch College","s":"NY","w":"www.baruch.cuny.edu/","u":190512,"p":22934},{"n":"CUNY Brooklyn College","s":"NY","w":"www.brooklyn.edu/","u":190549,"p":17247},{"n":"CUNY City College","s":"NY","w":"www.ccny.cuny.edu/","u":190567,"p":17741},{"n":"CUNY Graduate School and University Center","s":"NY","w":"www.gc.cuny.edu/","u":190576,"p":11166},{"n":"CUNY Hunter College","s":"NY","w":"www.hunter.cuny.edu/","u":190594,"p":26815},{"n":"CUNY John Jay College of Criminal Justice","s":"NY","w":"www.jjay.cuny.edu/","u":190600,"p":16642},{"n":"CUNY Lehman College","s":"NY","w":"www.lehman.edu/","u":190637,"p":16695},{"n":"CUNY Medgar Evers College","s":"NY","w":"https://www.mec.cuny.edu/","u":190646,"p":4918},{"n":"CUNY New York City College of Technology","s":"NY","w":"www.citytech.cuny.edu/","u":190655,"p":16916},{"n":"CUNY Queens College","s":"NY","w":"https://www.qc.cuny.edu/","u":190664,"p":20162},{"n":"CUNY York College","s":"NY","w":"www.york.cuny.edu/","u":190691,"p":8099},{"n":"Cypress College","s":"CA","w":"www.cypresscollege.edu/","u":113236,"p":20211},{"n":"Dakota State University","s":"SD","w":"https://dsu.edu/","u":219082,"p":5644},{"n":"Dallas Baptist University","s":"TX","w":"https://www.dbu.edu/","u":224226,"p":4831},{"n":"Dallas College","s":"TX","w":"www.dallascollege.edu/pages/default.aspx","u":224615,"p":104064,"c":[{"fn":"Luz","ln":"Gonzalez","t":"Associate Dean","o":"Health Services and Health Promotion","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"luzgonzalez@dallascollege.edu","ph":"","li":"https://www.linkedin.com/in/luzgonzalezmsrn?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BOMztn0sCR9yf5l1nzAM4UA%3D%3D"},{"fn":"Maribel","ln":"Caballero","t":"Health Promotion Coordinator","o":"Health Services and Promotions","r":"Champion","pt":"Health Promotion / Wellness","e":"MCaballero@DallasCollege.edu","ph":"972-860-4624","li":""},{"fn":"Kaman","ln":"Green","t":"Health Promotion Coordinator","o":"Health Services and Promotions","r":"Champion","pt":"Health Promotion / Wellness","e":"KGreen1@DallasCollege.edu","ph":"972-860-8156","li":""},{"fn":"Kaitlin","ln":"Hill","t":"Associate Dean","o":"Counseling Services","r":"Decision Maker","pt":"Counseling Center Leadership","e":"kchill@DallasCollege.edu","ph":"972-860-4953","li":"https://www.linkedin.com/in/kaitlinhilllpcs?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BD2F46aHpSlqqOs98Bqcw0g%3D%3D"},{"fn":"Allison","ln":"Abbey","t":"Professional Counselor","o":"Counseling Services","r":"Influencer","pt":"Counseling Center Leadership","e":"AAbbey@DallasCollege.edu","ph":"972-860-7652","li":"https://www.linkedin.com/in/allison-abbey-ma-lpc-964a58ba?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BsjQoGGuVTBulEM4c%2BwQQQQ%3D%3D"},{"fn":"Grenalda","ln":"Spears","t":"Professional Counselor","o":"Counseling Services","r":"Influencer","pt":"AOD Prevention / Recovery","e":"gspears@DallasCollege.edu","ph":"972-273-3123","li":"https://www.linkedin.com/in/grenalda-spears-m-a-lpc-4a7a7114?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bm8MmNesIQ8W%2B1wVIa3yLOQ%3D%3D"}]},{"n":"Dalton State College","s":"GA","w":"https://www.daltonstate.edu/","u":139463,"p":5707},{"n":"Dartmouth College","s":"NH","w":"https://dartmouth.edu/","u":182670,"p":7434},{"n":"Davenport University","s":"MI","w":"www.davenport.edu/","u":169479,"p":5996},{"n":"Daytona State College","s":"FL","w":"www.daytonastate.edu/","u":133386,"p":17561},{"n":"Del Mar College","s":"TX","w":"www.delmar.edu/","u":224350,"p":13517},{"n":"Delaware State University","s":"DE","w":"www.desu.edu/","u":130934,"p":6512},{"n":"Delaware Technical Community College-Terry","s":"DE","w":"https://www.dtcc.edu/","u":130907,"p":16499},{"n":"DePaul University","s":"IL","w":"https://www.depaul.edu/","u":144740,"p":24433},{"n":"Dominican University","s":"IL","w":"https://www.dom.edu/","u":148496,"p":4219},{"n":"Doral College","s":"FL","w":"https://doral.edu/","u":500087,"p":5533},{"n":"Drake University","s":"IA","w":"www.drake.edu/","u":153269,"p":4999},{"n":"Drexel University","s":"PA","w":"https://drexel.edu/","u":212054,"p":24590},{"n":"Duke University","s":"NC","w":"www.duke.edu/","u":198419,"p":18360},{"n":"Duquesne University","s":"PA","w":"www.duq.edu/","u":212106,"p":9212},{"n":"East Carolina University","s":"NC","w":"https://www.ecu.edu/","u":198464,"p":29704},{"n":"East Stroudsburg University of Pennsylvania","s":"PA","w":"https://www.esu.edu/","u":212115,"p":6155},{"n":"East Tennessee State University","s":"TN","w":"https://www.etsu.edu/","u":220075,"p":15276},{"n":"Eastern Arizona College","s":"AZ","w":"www.eac.edu/","u":104577,"p":7093},{"n":"Eastern Connecticut State University","s":"CT","w":"https://www.easternct.edu/","u":129215,"p":4361},{"n":"Eastern Florida State College","s":"FL","w":"https://www.easternflorida.edu/","u":132693,"p":18137},{"n":"Eastern Illinois University","s":"IL","w":"https://www.eiu.edu/","u":144892,"p":10734},{"n":"Eastern Kentucky University","s":"KY","w":"https://www.eku.edu/","u":156620,"p":17607},{"n":"Eastern Michigan University","s":"MI","w":"www.emich.edu/","u":169798,"p":16093},{"n":"Eastern New Mexico University-Main Campus","s":"NM","w":"www.enmu.edu/","u":187648,"p":7107},{"n":"Eastern Oregon University","s":"OR","w":"www.eou.edu/","u":208646,"p":5151},{"n":"Eastern University","s":"PA","w":"https://www.eastern.edu/about/student-consumer-information","u":212133,"p":10139},{"n":"Eastern Washington University","s":"WA","w":"www.ewu.edu/","u":235097,"p":18373},{"n":"Edison State Community College","s":"OH","w":"https://www.edisonohio.edu/","u":202648,"p":5766},{"n":"Edmonds College","s":"WA","w":"www.edmonds.edu/","u":235103,"p":11272},{"n":"Elmhurst University","s":"IL","w":"www.elmhurst.edu/","u":144962,"p":4430},{"n":"Elon University","s":"NC","w":"https://www.elon.edu/","u":198516,"p":7562},{"n":"Embry-Riddle Aeronautical University-Daytona Beach","s":"FL","w":"daytonabeach.erau.edu/","u":133553,"p":11912},{"n":"Embry-Riddle Aeronautical University-Worldwide","s":"FL","w":"worldwide.erau.edu/","u":426314,"p":17878},{"n":"Emerson College","s":"MA","w":"www.emerson.edu/","u":165662,"p":5988},{"n":"Emory University","s":"GA","w":"www.emory.edu/","u":139658,"p":16189},{"n":"Empire State University","s":"NY","w":"www.sunyempire.edu/","u":196264,"p":16287},{"n":"Emporia State University","s":"KS","w":"www.emporia.edu/","u":155025,"p":5886},{"n":"Endicott College","s":"MA","w":"www.endicott.edu/","u":165699,"p":5091},{"n":"Ensign College","s":"UT","w":"www.ensign.edu/","u":230418,"p":11286},{"n":"Everett Community College","s":"WA","w":"www.everettcc.edu/","u":235149,"p":13611},{"n":"Excelsior University","s":"NY","w":"www.excelsior.edu/","u":196680,"p":18823},{"n":"Fairfield University","s":"CT","w":"fairfield.edu/","u":129242,"p":6991},{"n":"Fairleigh Dickinson University-Metropolitan Campus","s":"NJ","w":"https://www.fdu.edu/","u":184603,"p":8836},{"n":"Farmingdale State College","s":"NY","w":"www.farmingdale.edu/","u":196042,"p":18499},{"n":"Fashion Institute of Technology","s":"NY","w":"www.fitnyc.edu/","u":191126,"p":8986},{"n":"Fayetteville State University","s":"NC","w":"https://www.uncfsu.edu/","u":198543,"p":8337},{"n":"Ferris State University","s":"MI","w":"www.ferris.edu/","u":169910,"p":12025},{"n":"Fitchburg State University","s":"MA","w":"www.fitchburgstate.edu/","u":165820,"p":9604},{"n":"Florida Agricultural and Mechanical University","s":"FL","w":"www.famu.edu/","u":133650,"p":10418},{"n":"Florida Atlantic University","s":"FL","w":"www.fau.edu/","u":133669,"p":37809},{"n":"Florida Gateway College","s":"FL","w":"https://www.fgc.edu/","u":135160,"p":4021},{"n":"Florida Gulf Coast University","s":"FL","w":"www.fgcu.edu/","u":433660,"p":18514},{"n":"Florida Institute of Technology","s":"FL","w":"https://www.fit.edu/","u":133881,"p":10576},{"n":"Florida International University","s":"FL","w":"www.fiu.edu/","u":133951,"p":67081,"c":[{"fn":"Nataly","ln":"Amaya","t":"Senior Coordinator of Academic Support Services","o":"College of Nursing and Health Sciences","r":"Champion","pt":"Health Promotion / Wellness","e":"namaya@fiu.edu","ph":"305-348-8062","li":"https://www.linkedin.com/in/nataly-amaya-2746a714/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BazGLS3IrR3a8YWBeS1%2BKbw%3D%3D"},{"fn":"Clara","ln":"Barman","t":"Program Coordinator Health Services Administration","o":"College of Nursing and Health Sciences","r":"Champion","pt":"Health Promotion / Wellness","e":"barmanc@fiu.edu","ph":"305-919-4466","li":"https://www.linkedin.com/in/kerenchava?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3By4v%2FXaAESfGO7EqA8cD4Tw%3D%3D"},{"fn":"Shantelle","ln":"Gloria","t":"Office Manager","o":"Student Health & Wellness","r":"Influencer","pt":"Health Promotion / Wellness","e":"sgloria@fiu.edu","ph":"","li":"https://www.linkedin.com/in/shantelle-gloria-7304b0372?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B8DrH4sBUR3qJ1Kk0%2F4aBBg%3D%3D"},{"fn":"Charlie","ln":"Andrews","t":"Vice President","o":"Student Affairs","r":"Decision Maker","pt":"Student Affairs Leadership","e":"andrewsc@fiu.edu","ph":"","li":"https://www.linkedin.com/in/charlie-andrews-fiu?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BRRvEQ62OSEqyW5r8zKnS%2Bw%3D%3D"},{"fn":"Michelle","ln":"Palacio","t":"Senior Vice President","o":"Marketing and Strategic Communications; Chief Marketing & Communication Officer","r":"Decision Maker","pt":"Other","e":"palaciom@fiu.edu","ph":"","li":"https://www.linkedin.com/in/michelle-lorenzo-palacio-90606b6?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BU03ju%2BbsTbSDlQJWjK4QEQ%3D%3D"}]},{"n":"Florida SouthWestern State College","s":"FL","w":"https://www.fsw.edu/","u":133508,"p":18803},{"n":"Florida State College at Jacksonville","s":"FL","w":"www.fscj.edu/","u":133702,"p":32056},{"n":"Florida State University","s":"FL","w":"https://www.fsu.edu/","u":134097,"p":46338},{"n":"Foothill College","s":"CA","w":"https://foothill.edu/","u":114716,"p":24501},{"n":"Fordham University","s":"NY","w":"https://www.fordham.edu/","u":191241,"p":17965},{"n":"Fort Hays State University","s":"KS","w":"www.fhsu.edu/","u":155061,"p":16922},{"n":"Framingham State University","s":"MA","w":"www.framingham.edu/","u":165866,"p":5888},{"n":"Francis Marion University","s":"SC","w":"www.fmarion.edu/","u":218061,"p":4565},{"n":"Franciscan University of Steubenville","s":"OH","w":"www.franciscan.edu/","u":205957,"p":4552},{"n":"Franklin University","s":"OH","w":"www.franklin.edu/","u":202806,"p":13457},{"n":"Fresno City College","s":"CA","w":"www.fresnocitycollege.edu/","u":114789,"p":38808},{"n":"Front Range Community College","s":"CO","w":"https://www.frontrange.edu/","u":127200,"p":31536},{"n":"Frostburg State University","s":"MD","w":"www.frostburg.edu/","u":162584,"p":4515},{"n":"Gannon University","s":"PA","w":"www.gannon.edu/","u":212601,"p":5184},{"n":"GateWay Community College","s":"AZ","w":"www.gatewaycc.edu/","u":105145,"p":7866},{"n":"George Fox University","s":"OR","w":"https://www.georgefox.edu/","u":208822,"p":5008},{"n":"George Mason University","s":"VA","w":"https://www.gmu.edu/","u":232186,"p":48495},{"n":"George Washington University","s":"DC","w":"https://www.gwu.edu/","u":131469,"p":28729},{"n":"Georgetown University","s":"DC","w":"https://www.georgetown.edu/","u":131496,"p":22644},{"n":"Georgia College & State University","s":"GA","w":"www.gcsu.edu/","u":139861,"p":7785},{"n":"Georgia Gwinnett College","s":"GA","w":"www.ggc.edu/","u":447689,"p":14484},{"n":"Georgia Highlands College","s":"GA","w":"www.highlands.edu/","u":139700,"p":6460},{"n":"Georgia Institute of Technology-Main Campus","s":"GA","w":"www.gatech.edu/","u":139755,"p":57952,"c":[{"fn":"Joi","ln":"Alexander","t":"Director of Wellness Empowerment Center","o":"Wellness Empowerment Center","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"joi.alexander@gatech.edu","ph":"tel:404.894.2890","li":"https://www.linkedin.com/in/joi-alexander-drph-mches-06a93136a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BzXqaC1qnSTeG8ObWChzylQ%3D%3D"},{"fn":"Richelle","ln":"Fields","t":"Health Educator","o":"Wellness Empowerment Center - Health Education","r":"Champion","pt":"Health Promotion / Wellness","e":"richelle.fields@gatech.edu","ph":"tel:404.894.0473","li":"https://www.linkedin.com/in/richelle-fields-msld-07ba6067/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B3Owwbhb%2FRH%2B8kxWFpBb8DA%3D%3D"},{"fn":"Yuntalay","ln":"Gadson","t":"Health Educator","o":"Wellness Empowerment Center - Health Education","r":"Champion","pt":"Health Promotion / Wellness","e":"yuntalay.gadson@gatech.edu","ph":"tel:404.894.2390","li":""},{"fn":"Jess","ln":"Ponder","t":"Health Educator","o":"Wellness Empowerment Center - Health Education","r":"Champion","pt":"Health Promotion / Wellness","e":"jess.ponder@gatech.edu","ph":"tel:404.385.5375","li":"https://www.linkedin.com/in/jessponder/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BJsiUqoiZQuCnwvp2lpTZsw%3D%3D"},{"fn":"Caroline","ln":"Walker","t":"Dietitian","o":"Wellness Empowerment Center - Community Nutrition","r":"Influencer","pt":"Other","e":"caroline.walker@gatech.edu","ph":"tel:404-385-0375","li":"https://www.linkedin.com/in/caroline-walker-rdn-ldn-b8162520b/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BUGAm2umvSzyMj0GwViexXg%3D%3D"}]},{"n":"Georgia Military College","s":"GA","w":"https://www.gmc.edu/","u":485111,"p":11497},{"n":"Georgia Southern University","s":"GA","w":"www.georgiasouthern.edu/","u":139931,"p":30421},{"n":"Georgia Southwestern State University","s":"GA","w":"https://gsw.edu/","u":139764,"p":4265},{"n":"Georgia State University","s":"GA","w":"www.gsu.edu/","u":139940,"p":40847},{"n":"Glendale Community College","s":"AZ","w":"www.gccaz.edu/","u":104708,"p":16366},{"n":"Golden Gate University","s":"CA","w":"www.ggu.edu/","u":115083,"p":5866},{"n":"Gonzaga University","s":"WA","w":"https://www.gonzaga.edu/","u":235316,"p":8151},{"n":"Goodwin University","s":"CT","w":"www.goodwin.edu/","u":129154,"p":4937},{"n":"Governors State University","s":"IL","w":"https://www.govst.edu/","u":145336,"p":5270},{"n":"Grambling State University","s":"LA","w":"www.gram.edu/","u":159009,"p":5833},{"n":"Grand Valley State University","s":"MI","w":"www.gvsu.edu/","u":170082,"p":25119},{"n":"Grayson College","s":"TX","w":"grayson.edu/","u":225070,"p":6120},{"n":"Great Basin College","s":"NV","w":"www.gbcnv.edu/","u":182306,"p":4266},{"n":"Green River College","s":"WA","w":"https://www.greenriver.edu/","u":235343,"p":10085},{"n":"Greenville Technical College","s":"SC","w":"www.gvltec.edu/","u":218113,"p":14377},{"n":"Gulf Coast State College","s":"FL","w":"https://gulfcoast.edu/","u":134343,"p":6524},{"n":"Hampton University","s":"VA","w":"www.hamptonu.edu/","u":232265,"p":4278},{"n":"Harding University","s":"AR","w":"www.harding.edu/","u":107044,"p":5753},{"n":"Harrisburg University of Science and Technology","s":"PA","w":"www.harrisburgu.edu/","u":446640,"p":6615},{"n":"Harvard University","s":"MA","w":"www.harvard.edu/","u":166027,"p":37558},{"n":"Hawaii Pacific University","s":"HI","w":"https://www.hpu.edu/","u":141644,"p":6411},{"n":"Henry Ford College","s":"MI","w":"https://www.hfcc.edu/","u":170240,"p":15749},{"n":"Herzing University-Madison","s":"WI","w":"https://www.herzing.edu/","u":240392,"p":8191},{"n":"High Point University","s":"NC","w":"www.highpoint.edu/","u":198695,"p":6294},{"n":"Highline College","s":"WA","w":"www.highline.edu/","u":235431,"p":7560},{"n":"Hillsborough Community College","s":"FL","w":"https://www.hccfl.edu/","u":134495,"p":39762},{"n":"Hofstra University","s":"NY","w":"www.hofstra.edu/","u":191649,"p":11251},{"n":"Houston Christian University","s":"TX","w":"https://www.hc.edu/","u":225399,"p":5421},{"n":"Houston Community College","s":"TX","w":"www.hccs.edu/","u":225423,"p":71898,"c":[{"fn":"Nkechi","ln":"Uchegbu","t":"Lead Counselor","o":"Central College Counseling Department","r":"Influencer","pt":"Counseling Center Leadership","e":"nkechi.uchegbu@hccs.edu","ph":"713/718-7977","li":"https://www.linkedin.com/in/nkechiuchegbu/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BoUAGoWdrTtaq4YHbYnNkyA%3D%3D"},{"fn":"Ayesha","ln":"Farr","t":"Lead Counselor","o":"Northeast College Counseling Department","r":"Influencer","pt":"Counseling Center Leadership","e":"ayesha.farr@hccs.edu","ph":"713/718-8420","li":""},{"fn":"Jeff","ln":"Gricar","t":"Dean","o":"Health Sciences","r":"Decision Maker","pt":"Other","e":"jeff.gricar@hccs.edu","ph":"(713) 718-2000","li":"https://www.linkedin.com/in/jeff-gricar-ed-d-973910179/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3ByYwSS2ytRzS94LppwPGLGg%3D%3D"},{"fn":"Patricia","ln":"Ugwu","t":"Dean of Student Success","o":"Health Sciences","r":"Decision Maker","pt":"Other","e":"","ph":"713-718-7400","li":"https://www.linkedin.com/in/dr-patricia-ugwu-5682a313/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BiHSf8ws1SCu71tM%2BI1JyFA%3D%3D"}]},{"n":"Howard University","s":"DC","w":"www.howard.edu/","u":131520,"p":14631},{"n":"Idaho State University","s":"ID","w":"www.isu.edu/","u":142276,"p":15249},{"n":"Illinois Institute of Technology","s":"IL","w":"https://www.iit.edu/","u":145725,"p":10555},{"n":"Illinois State University","s":"IL","w":"illinoisstate.edu/","u":145813,"p":22892},{"n":"Indian River State College","s":"FL","w":"www.irsc.edu/","u":134608,"p":20536},{"n":"Indiana Institute of Technology-College of Professional Studies","s":"IN","w":"cps.indianatech.edu/","u":492962,"p":4076},{"n":"Indiana State University","s":"IN","w":"https://indianastate.edu/","u":151324,"p":9502},{"n":"Indiana University of Pennsylvania-Main Campus","s":"PA","w":"www.iup.edu/","u":213020,"p":10512},{"n":"Indiana University-Bloomington","s":"IN","w":"https://bloomington.iu.edu/","u":151351,"p":62701,"c":[{"fn":"Jon","ln":"Agley","t":"Associate Professor, Interim Executive Director, Prevention Insights","o":"School of Public Health","r":"Champion","pt":"Health Promotion / Wellness","e":"jagley@iu.edu","ph":"812-855-3123","li":"https://www.linkedin.com/in/jon-agley-a133a224b/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BzAM%2Fgl%2FnQIOJbwsLA6HsTA%3D%3D"},{"fn":"Kelly","ln":"Cortez","t":"Student Services Coordinator","o":"Health & Wellness Design","r":"Influencer","pt":"Health Promotion / Wellness","e":"kecortez@iu.edu","ph":"812-855-3089","li":"https://www.linkedin.com/in/kelly-cortez99/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BcLnffqj1QvWE8YRfBMI2iQ%3D%3D"},{"fn":"Kathy","ln":"Finley","t":"Senior Lecturer; Dean's Fellow and SPH Honors Program Director; BSPH Internship Coordinator: Community Health and Epidemiology","o":"Applied Health Science","r":"Champion","pt":"Health Promotion / Wellness","e":"kfinley@iu.edu","ph":"812-855-0854","li":"https://www.linkedin.com/in/kathy-finley-4425523a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BhqN3wmBkQD2qePqL3QOH3g%3D%3D"},{"fn":"Ruth","ln":"Gassman","t":"Senior Scientist, Executive Director of Prevention Insights","o":"Applied Health Science","r":"Influencer","pt":"Other","e":"rgassman@iu.edu","ph":"812-855-1237","li":"https://www.linkedin.com/in/ruth-gassman-522840115/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3Bw48ybyyFQl2r1H6OK%2BCKAg%3D%3D"},{"fn":"Jennifer","ln":"Embree","t":"Chief Wellness Officer","o":"School of Nursing","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"jembree8@iu.edu","ph":"tel:812-583-1490","li":"https://www.linkedin.com/in/jennifer-embree-b5810755/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BR8g8uA0%2FTDSN1O8gw95pMQ%3D%3D"},{"fn":"Andréa","ln":"Halpin","t":"University Director, Student Wellness and Well-being","o":"Student Access Engagement & Wellbeing","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"anhalpin@iu.edu","ph":"(317) 278-0624","li":"https://www.linkedin.com/in/andrea-halpin/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BhMimL1BITE%2BPo6ShS%2Fl2DA%3D%3D"}]},{"n":"Indiana University-East","s":"IN","w":"https://east.iu.edu/","u":151388,"p":5256},{"n":"Indiana University-Indianapolis","s":"IN","w":"https://indianapolis.iu.edu/","u":151111,"p":29063,"c":[{"fn":"Eric","ln":"Teske","t":"Director","o":"Health and Wellness Promotion","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"erictesk@iu.edu","ph":"317-274-6766","li":"https://www.linkedin.com/in/ericteske/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B0qbLUeoBThqGV6wQSYxicA%3D%3D"},{"fn":"Annika","ln":"Whitlock","t":"Health and Wellness Specialist","o":"Health and Wellness Promotion","r":"Influencer","pt":"Health Promotion / Wellness","e":"arwhitlo@iu.edu","ph":"317-274-6766","li":"https://www.linkedin.com/in/annika-whitlock/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BW39LVxlLQDiK0R0aUtMrzQ%3D%3D"},{"fn":"Danielle","ln":"Wolfe","t":"Assistant Director, Substance Use Intervention Services","o":"Health and Wellness Promotion","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"finked@iu.edu","ph":"317-274-6766","li":"https://www.linkedin.com/in/danielle-wolfe-3884656b/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BD16%2Fa6ecRLym4pGkooC1Yg%3D%3D"},{"fn":"Elisa","ln":"Harrell","t":"Senior Clinic Coordinator","o":"Counseling and Psychological Services (CAPS)","r":"Champion","pt":"Health Promotion / Wellness","e":"capsindy@iu.edu","ph":"317-274-2548","li":"https://www.linkedin.com/in/elisa-harrell-7120338a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B3MPoWQ3yROmc7rE0ZMFvNg%3D%3D"},{"fn":"John","ln":"Brinkman","t":"Health Science Lecturer","o":"School of Health & Human Sciences","r":"Champion","pt":"Other","e":"jjbrink@iu.edu","ph":"260-257-6770","li":""}]},{"n":"Indiana University-Kokomo","s":"IN","w":"https://kokomo.iu.edu/","u":151333,"p":5718},{"n":"Indiana University-Northwest","s":"IN","w":"https://northwest.iu.edu/","u":151360,"p":5733},{"n":"Indiana University-South Bend","s":"IN","w":"https://southbend.iu.edu/","u":151342,"p":8049},{"n":"Indiana University-Southeast","s":"IN","w":"https://southeast.iu.edu/","u":151379,"p":5933},{"n":"Indiana Wesleyan University-National & Global","s":"IN","w":"https://www.indwes.edu/","u":488679,"p":18713},{"n":"Inter American University of Puerto Rico-Metro","s":"PR","w":"metro.inter.edu/","u":242653,"p":5210},{"n":"Iona University","s":"NY","w":"www.iona.edu/","u":191931,"p":4328},{"n":"Iowa State University","s":"IA","w":"https://www.iastate.edu/","u":153603,"p":32133},{"n":"Ithaca College","s":"NY","w":"https://www.ithaca.edu/","u":191968,"p":5205},{"n":"Jackson College","s":"MI","w":"www.jccmi.edu/","u":170444,"p":6263},{"n":"Jackson State University","s":"MS","w":"https://www.jsums.edu/","u":175856,"p":7261},{"n":"Jacksonville State University","s":"AL","w":"https://www.jsu.edu/","u":101480,"p":11369},{"n":"Jacksonville University","s":"FL","w":"https://www.ju.edu/index.php","u":134945,"p":6521},{"n":"James A. Rhodes State College","s":"OH","w":"www.rhodesstate.edu/","u":203678,"p":4730},{"n":"James Madison University","s":"VA","w":"www.jmu.edu/index.shtml","u":232423,"p":24589,"c":[{"fn":"Tia","ln":"Mann","t":"Director of Health Promotion","o":"Health & Well-being-Well Dukes","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"manntl@jmu.edu","ph":"tel:540-568-3407","li":"https://www.linkedin.com/in/tia-mann-49b64925/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BwdtUS2P8RQWVTgKWIPYuBw%3D%3D"},{"fn":"Margaret","ln":"Benavides","t":"Personal Well-being Coordinator","o":"Health & Well-being-Well Dukes","r":"Champion","pt":"Health Promotion / Wellness","e":"benav2mx@jmu.edu","ph":"tel:540-568-5501","li":""},{"fn":"Virginia","ln":"Wrobel","t":"Wellness Programs Coordinator","o":"Health & Well-being-Well Dukes","r":"Champion","pt":"Health Promotion / Wellness","e":"zckhq3@jmu.edu","ph":"tel:540-568-4071","li":"https://www.linkedin.com/in/virginia-wrobel-1672342bb/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BKnhTbfxXTPmfHq4EgLBhmg%3D%3D"},{"fn":"Kristina","ln":"Blyer","t":"Associate Vice President for Health and Well-Being","o":"Student Affairs","r":"Decision Maker","pt":"Student Affairs Leadership","e":"blyerkb@jmu.edu","ph":"tel:540-568-3092","li":"https://www.linkedin.com/in/kristina-blyer-307a2410a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B5qfEPlJ8RQKyE4AUCjLqEQ%3D%3D"},{"fn":"Riley","ln":"Phipps","t":"Peer Educator Manager","o":"Health & Well-being-Well Dukes","r":"Influencer","pt":"Other","e":"welldukes@jmu.edu","ph":"","li":"https://www.linkedin.com/in/riley-phipps-b72b33258/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BZLSbkeW3T22IMzUA9mqNGA%3D%3D"}]},{"n":"Johns Hopkins University","s":"MD","w":"www.jhu.edu/","u":162928,"p":39148},{"n":"Johnson & Wales University-Providence","s":"RI","w":"https://www.jwu.edu/campuses/providence/","u":217235,"p":4724},{"n":"Kansas State University","s":"KS","w":"www.k-state.edu/","u":155399,"p":22106,"c":[{"fn":"Raima","ln":"Shafiq","t":"Academic Program Specialist","o":"College of Health and Human Sciences","r":"Influencer","pt":"Other","e":"happyrai@k-state.edu","ph":"785-532-1566","li":""},{"fn":"Chris","ln":"Bowman","t":"Director, Morrison Family Center for Student Well-being","o":"Morrison Family Center for Student Well-Being","r":"Decision Maker","pt":"AOD Prevention / Recovery","e":"cbowman@k-state.edu","ph":"785-532-5225","li":""},{"fn":"Jenneen","ln":"LeMay","t":"Assistant Director, Morrison Family Center for Student Well-being","o":"Morrison Family Center for Student Well-Being","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"jalemay@k-state.edu","ph":"785-532-5226","li":"https://www.linkedin.com/in/jenneen-lemay-a19a321a9/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BgvHMiqSVSeKf5QrGP%2FJ2TQ%3D%3D"},{"fn":"Jennifer","ln":"Lopez","t":"Health Educator","o":"Morrison Family Center for Student Well-Being","r":"Champion","pt":"Health Promotion / Wellness","e":"jwl7799@k-state.edu","ph":"785-532-6526","li":"https://www.linkedin.com/in/jennifer-lopez-02658635a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BHCk7TBuwQP2lcvQG59uluA%3D%3D"},{"fn":"Kim","ln":"Ybarra","t":"Prevention Coordinator","o":"Morrison Family Center for Student Well-Being","r":"Champion","pt":"Health Promotion / Wellness","e":"kwaslawski@k-state.edu","ph":"785-532-5226","li":""},{"fn":"Cheryl","ln":"Calhoun","t":"Addiction Counseling Program Coordinator","o":"Department of Sociology, Anthropology, and Social Work","r":"Champion","pt":"Other","e":"cherylcalhoun@ksu.edu","ph":"","li":""}]},{"n":"Kean University","s":"NJ","w":"https://www.kean.edu/","u":185262,"p":15610},{"n":"Keiser University-Ft Lauderdale","s":"FL","w":"www.keiseruniversity.edu/","u":135081,"p":34299},{"n":"Kennesaw State University","s":"GA","w":"www.kennesaw.edu/","u":486840,"p":52521},{"n":"Kent State University at Kent","s":"OH","w":"www.kent.edu/","u":203517,"p":32919},{"n":"Kent State University at Stark","s":"OH","w":"www.kent.edu/stark","u":203465,"p":5614},{"n":"Kutztown University of Pennsylvania","s":"PA","w":"https://www.kutztown.edu/","u":213349,"p":8245},{"n":"La Salle University","s":"PA","w":"www.lasalle.edu/","u":213367,"p":4680},{"n":"Lackawanna College","s":"PA","w":"https://www.lackawanna.edu/","u":213376,"p":4792},{"n":"Lake Erie College of Osteopathic Medicine","s":"PA","w":"lecom.edu/","u":407629,"p":4215},{"n":"Lake Washington Institute of Technology","s":"WA","w":"https://www.lwtech.edu/","u":235699,"p":4570},{"n":"Lake-Sumter State College","s":"FL","w":"www.lssc.edu/","u":135188,"p":6557},{"n":"Lamar University","s":"TX","w":"www.lamar.edu/","u":226091,"p":24003},{"n":"Lander University","s":"SC","w":"https://www.lander.edu/","u":218229,"p":4925},{"n":"Lane Community College","s":"OR","w":"https://www.lanecc.edu/","u":209038,"p":12002},{"n":"Laramie County Community College","s":"WY","w":"https://www.lccc.wy.edu/","u":240620,"p":5681},{"n":"Laredo College","s":"TX","w":"https://www.laredo.edu/index.html","u":226134,"p":13252},{"n":"Lee University","s":"TN","w":"www.leeuniversity.edu/","u":220613,"p":4264},{"n":"Lehigh University","s":"PA","w":"www.lehigh.edu/","u":213543,"p":8067},{"n":"Lesley University","s":"MA","w":"www.lesley.edu/","u":166452,"p":4431},{"n":"LeTourneau University","s":"TX","w":"www.letu.edu/","u":226231,"p":4180},{"n":"Lewis University","s":"IL","w":"www.lewisu.edu/","u":146612,"p":8396},{"n":"Lewis-Clark State College","s":"ID","w":"https://www.lcsc.edu/","u":142328,"p":4588},{"n":"Liberty University","s":"VA","w":"https://www.liberty.edu/","u":232557,"p":143337,"c":[{"fn":"Louis","ln":"Alvey","t":"Counselor","o":"","r":"Influencer","pt":"Counseling Center Leadership","e":"","ph":"","li":"https://www.linkedin.com/in/louis-alvey-09b312b2?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BMQtwYuDAQ5KaMgbtc1yC5Q%3D%3D"},{"fn":"Gabrielle","ln":"Camera","t":"Director","o":"Operations","r":"Decision Maker","pt":"Student Affairs Leadership","e":"","ph":"","li":"https://www.linkedin.com/in/ggearhart?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BCp9NNGIHSjeLDwuZLAtbIw%3D%3D"},{"fn":"Darlene","ln":"Martin","t":"Professor","o":"Public Health","r":"Champion","pt":"Health Promotion / Wellness","e":"","ph":"","li":"https://www.linkedin.com/in/darlenemartin-dhed?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BxLfCEmJYRF2tj6hxggjRgg%3D%3D"},{"fn":"Bradley","ln":"Weast","t":"Coordinator","o":"Doctoral Programs Support","r":"Champion","pt":"Other","e":"","ph":"","li":"https://www.linkedin.com/in/bradleyweast?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B4sUrroa9RtOuPZiRQs%2Bu5g%3D%3D"}]},{"n":"Lincoln Memorial University","s":"TN","w":"www.lmunet.edu/","u":220631,"p":6256},{"n":"Lindenwood University","s":"MO","w":"https://www.lindenwood.edu/","u":177968,"p":10951},{"n":"Lindsey Wilson College","s":"KY","w":"https://www.lindsey.edu/","u":157216,"p":5191},{"n":"Lipscomb University","s":"TN","w":"https://www.lipscomb.edu/","u":219976,"p":5646},{"n":"Loma Linda University","s":"CA","w":"www.llu.edu/index.html","u":117636,"p":4979},{"n":"Lone Star College System","s":"TX","w":"www.lonestar.edu/","u":227182,"p":107793,"c":[{"fn":"Debora","ln":"Butts","t":"Interim Director","o":"Health Information Technology","r":"Decision Maker","pt":"Student Affairs Leadership","e":"david.w.puller@lonestar.edu","ph":"281.943.6871","li":""},{"fn":"Sonya","ln":"Valcin","t":"Division Program Coordinator","o":"Health and Human Services","r":"Champion","pt":"Health Promotion / Wellness","e":"sonya.valcin@lonestar.edu","ph":"281-943-6832","li":""},{"fn":"Kenya","ln":"Hicks","t":"Academic Advisor for Cosmetology, EMS Professions, Health Information Technology","o":"Health and Human Services","r":"Influencer","pt":"Other","e":"kenya.r.hicks@lonestar.edu","ph":"281-765-7957","li":""},{"fn":"Brittney","ln":"Mathis","t":"Clinical Coordinator","o":"Emergency Medical Services","r":"Champion","pt":"Other","e":"Brittney.M.Mathis@lonestar.edu","ph":"281-765-7710","li":""}]},{"n":"Long Island University","s":"NY","w":"www.liu.edu/","u":192448,"p":18013},{"n":"Longwood University","s":"VA","w":"www.longwood.edu/","u":232566,"p":6157},{"n":"Lorain County Community College","s":"OH","w":"https://www.lorainccc.edu/","u":203748,"p":12456},{"n":"Los Angeles Mission College","s":"CA","w":"https://www.lamission.edu/","u":117867,"p":19099},{"n":"Los Angeles Valley College","s":"CA","w":"www.lavc.edu/","u":117733,"p":26580},{"n":"Louisiana State University and Agricultural & Mechanical College","s":"LA","w":"www.lsu.edu/","u":159391,"p":44241},{"n":"Louisiana State University-Alexandria","s":"LA","w":"www.lsua.edu/","u":159382,"p":6878},{"n":"Louisiana State University-Shreveport","s":"LA","w":"www.lsus.edu/","u":159416,"p":14871},{"n":"Louisiana Tech University","s":"LA","w":"https://www.latech.edu/","u":159647,"p":12948},{"n":"Loyola Marymount University","s":"CA","w":"https://www.lmu.edu/","u":117946,"p":11120},{"n":"Loyola University Chicago","s":"IL","w":"https://www.luc.edu/","u":146719,"p":19223},{"n":"Loyola University Maryland","s":"MD","w":"https://www.loyola.edu/","u":163046,"p":5540},{"n":"Loyola University New Orleans","s":"LA","w":"www.loyno.edu/","u":159656,"p":4875},{"n":"Lynn University","s":"FL","w":"https://www.lynn.edu/","u":132657,"p":4157},{"n":"Marian University","s":"IN","w":"www.marian.edu/","u":151786,"p":4696},{"n":"Marion Technical College","s":"OH","w":"www.mtc.edu/","u":203881,"p":4113},{"n":"Marist College","s":"NY","w":"www.marist.edu/","u":192819,"p":0},{"n":"Marquette University","s":"WI","w":"www.marquette.edu/","u":239105,"p":12327},{"n":"Marshall University","s":"WV","w":"https://www.marshall.edu/","u":237525,"p":12769},{"n":"Marymount University","s":"VA","w":"https://www.marymount.edu/","u":232706,"p":4459},{"n":"Maryville University of Saint Louis","s":"MO","w":"https://www.maryville.edu/","u":178059,"p":12225},{"n":"Massachusetts Institute of Technology","s":"MA","w":"web.mit.edu/","u":166683,"p":12915},{"n":"McNeese State University","s":"LA","w":"www.mcneese.edu/","u":159717,"p":6776},{"n":"MCPHS University","s":"MA","w":"www.mcphs.edu/","u":166656,"p":6764},{"n":"Mercer University","s":"GA","w":"https://www.mercer.edu/","u":140447,"p":10123},{"n":"Mercy University","s":"NY","w":"https://www.mercy.edu/","u":193016,"p":10508},{"n":"Merrimack College","s":"MA","w":"https://www.merrimack.edu/","u":166850,"p":6849},{"n":"Mesa Community College","s":"AZ","w":"www.mesacc.edu/","u":105154,"p":25599},{"n":"Metropolitan State University","s":"MN","w":"www.metrostate.edu/","u":174020,"p":8185},{"n":"Metropolitan State University of Denver","s":"CO","w":"www.msudenver.edu/","u":127565,"p":21767},{"n":"Miami Dade College","s":"FL","w":"www.mdc.edu/","u":135717,"p":84258,"c":[{"fn":"Ron","ln":"Winston","t":"Dean","o":"School of Health Sciences","r":"Decision Maker","pt":"Student Affairs Leadership","e":"rwinston@mdc.edu","ph":"305-237-4430","li":"https://www.linkedin.com/in/ron-winston-ed-d-4a9b8481?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BEMQVH9t4QeygTVXxQta%2Byw%3D%3D"},{"fn":"Mary","ln":"Worsley","t":"Program Coordinator","o":"Health Information Technology and Healthcare Informatics Specialist","r":"Champion","pt":"Health Promotion / Wellness","e":"mworsley@mdc.edu","ph":"305-237-4156","li":"https://www.linkedin.com/in/mary-worsley-0b5a5832/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BYkMBX1iHTROysaC0x2ScPg%3D%3D"},{"fn":"Letsha","ln":"Arnett","t":"Student Services Assistant","o":"Medical Assisting, Massage Therapy, Medical Coder Biller Specialist, Pharmacy Technician, Phlebotomy, Health Information technology, Healthcare Informatics Specialist, and Veterinary Technology","r":"Influencer","pt":"Other","e":"larnett@mdc.edu","ph":"305-237-4296","li":""},{"fn":"Marta","ln":"Lopez","t":"Program Coordinator","o":"Medical Assisting","r":"Champion","pt":"Other","e":"mlopez2@mdc.edu","ph":"305-237-4121","li":"https://www.linkedin.com/in/dr-marta-lopez-94198811/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B8puCr7LrQ%2FCp1cadTc%2F2PQ%3D%3D"}]},{"n":"Miami University-Oxford","s":"OH","w":"miamioh.edu/","u":204024,"p":19817},{"n":"Michigan State University","s":"MI","w":"https://www.msu.edu/","u":171100,"p":55377},{"n":"Michigan Technological University","s":"MI","w":"https://www.mtu.edu/","u":171128,"p":7848},{"n":"Middle Georgia State University","s":"GA","w":"https://www.mga.edu/","u":482158,"p":10139},{"n":"Middle Tennessee State University","s":"TN","w":"www.mtsu.edu/","u":220978,"p":23561},{"n":"Middlebury College","s":"VT","w":"https://www.middlebury.edu/college/","u":230959,"p":4726},{"n":"Midland College","s":"TX","w":"www.midland.edu/","u":226806,"p":7641},{"n":"Midwestern Baptist Theological Seminary","s":"MO","w":"https://www.mbts.edu/","u":178208,"p":5238},{"n":"Midwestern State University","s":"TX","w":"www.msutexas.edu/","u":226833,"p":6495},{"n":"Midwestern University-Glendale","s":"AZ","w":"https://www.midwestern.edu/","u":423643,"p":4108},{"n":"Millersville University of Pennsylvania","s":"PA","w":"www.millersville.edu/","u":214041,"p":7961},{"n":"Minnesota State University Moorhead","s":"MN","w":"https://www.mnstate.edu/","u":174358,"p":5828},{"n":"Minnesota State University-Mankato","s":"MN","w":"https://mnsu.edu/","u":173920,"p":18388},{"n":"MiraCosta College","s":"CA","w":"www.miracosta.edu/","u":118912,"p":18109},{"n":"Mississippi College","s":"MS","w":"www.mc.edu/","u":176053,"p":4960},{"n":"Mississippi State University","s":"MS","w":"https://www.msstate.edu/","u":176080,"p":25234},{"n":"Missouri Baptist University","s":"MO","w":"www.mobap.edu/","u":178244,"p":6222},{"n":"Missouri Southern State University","s":"MO","w":"www.mssu.edu/","u":178341,"p":4967},{"n":"Missouri State University-Springfield","s":"MO","w":"www.missouristate.edu/","u":179566,"p":27054},{"n":"Missouri University of Science and Technology","s":"MO","w":"https://www.mst.edu/","u":178411,"p":7655},{"n":"Missouri Western State University","s":"MO","w":"https://www.missouriwestern.edu/","u":178387,"p":4325},{"n":"Modesto Junior College","s":"CA","w":"https://www.mjc.edu/","u":118976,"p":23515},{"n":"Molloy College","s":"NY","w":"www.molloy.edu/","u":193292,"p":0},{"n":"Monmouth University","s":"NJ","w":"https://www.monmouth.edu/","u":185572,"p":5323},{"n":"Montana State University","s":"MT","w":"https://www.montana.edu/","u":180461,"p":18998},{"n":"Montana State University Billings","s":"MT","w":"https://www.msubillings.edu/","u":180179,"p":5275},{"n":"Montclair State University","s":"NJ","w":"www.montclair.edu/","u":185590,"p":25785,"c":[{"fn":"Marie","ln":"Cascarano","t":"Assistant Director","o":"Health Promotion","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"cascaranom@montclair.edu","ph":"tel:973-655-7397","li":"https://www.linkedin.com/in/mcascarano/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B0wmRLiqMSQOgPR7LHnP5xA%3D%3D"},{"fn":"John","ln":"Han","t":"Health Promotion Specialist","o":"Health Promotion","r":"Influencer","pt":"Health Promotion / Wellness","e":"hanj@montclair.edu","ph":"","li":"https://www.linkedin.com/in/john-wonjun-han-022892/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BWUJH55YWQdSZ0b2oyclQWA%3D%3D"},{"fn":"Meghan","ln":"Buckley","t":"Program Coordinator, Dean of Students, Student Development and Campus Life","o":"Mental Health and Well-Being Task Force","r":"Champion","pt":"Health Promotion / Wellness","e":"buckleym@montclair.edu","ph":"","li":"https://www.linkedin.com/in/meghan-buckley-481987191/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BRDg4pHCuRmipIHl%2BAEgohQ%3D%3D"},{"fn":"Jude","ln":"Uy","t":"Staff Psychologist/Coordinator of Prevention and Wellness Programming","o":"Counseling and Psychological Services, Student Development and Campus Life","r":"Champion","pt":"Other","e":"uyj@montclair.edu","ph":"tel:9736553653","li":""}]},{"n":"Moorpark College","s":"CA","w":"www.moorparkcollege.edu/index.shtml","u":119137,"p":21725,"c":[{"fn":"Carol","ln":"Higashida","t":"Dean","o":"Student Learning Life & Health Sciences","r":"Decision Maker","pt":"Other","e":"chigashida@vcccd.edu","ph":"(805) 378-1459","li":""},{"fn":"Daniel","ln":"Aguilar","t":"Counselor","o":"Student Services - Academic Counseling","r":"Influencer","pt":"Counseling Center Leadership","e":"daguilar@vcccd.edu","ph":"(805) 553-4867","li":""},{"fn":"Mostafa","ln":"Ghous","t":"Vice President of Student Support","o":"Executive","r":"Decision Maker","pt":"Student Affairs Leadership","e":"mghous@vcccd.edu","ph":"","li":""},{"fn":"John","ln":"Everlove","t":"Coordinator","o":"Health Sciences","r":"Champion","pt":"Health Promotion / Wellness","e":"john_everlove1@vcccd.edu","ph":"tel:+1-805-553-4132","li":""},{"fn":"Jasmine","ln":"Betka","t":"Health Educator","o":"Student Health Center","r":"Champion","pt":"Health Promotion / Wellness","e":"jasmine_betka1@vcccd.edu","ph":"","li":"https://www.linkedin.com/in/jasminebetka/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BstBgO3HkTsGvFwtTY4TxYQ%3D%3D"}]},{"n":"Morehead State University","s":"KY","w":"https://www.moreheadstate.edu/","u":157386,"p":9558},{"n":"Morgan State University","s":"MD","w":"https://www.morgan.edu/","u":163453,"p":10551},{"n":"Mt Hood Community College","s":"OR","w":"www.mhcc.edu/","u":209250,"p":11656},{"n":"Murray State University","s":"KY","w":"www.murraystate.edu/","u":157401,"p":11887},{"n":"National Louis University","s":"IL","w":"www.nl.edu/","u":147536,"p":12807},{"n":"National University","s":"CA","w":"www.nu.edu/","u":119605,"p":32813},{"n":"Naval Postgraduate School","s":"CA","w":"https://www.nps.edu/","u":119678,"p":4186},{"n":"Navarro College","s":"TX","w":"www.navarrocollege.edu/","u":227146,"p":8126},{"n":"Nebraska Wesleyan University","s":"NE","w":"https://www.nebrwesleyan.edu/","u":181446,"p":4462},{"n":"Nevada State University","s":"NV","w":"https://nevadastate.edu/","u":441900,"p":8685},{"n":"New England College","s":"NH","w":"www.nec.edu/","u":182980,"p":4152},{"n":"New Jersey City University","s":"NJ","w":"https://www.njcu.edu/","u":185129,"p":7008},{"n":"New Jersey Institute of Technology","s":"NJ","w":"https://www.njit.edu/","u":185828,"p":14640},{"n":"New Mexico State University-Main Campus","s":"NM","w":"www.nmsu.edu/","u":188030,"p":16904},{"n":"New York Institute of Technology","s":"NY","w":"www.nyit.edu/","u":194091,"p":7224},{"n":"New York University","s":"NY","w":"https://www.nyu.edu/","u":193900,"p":63571,"c":[{"fn":"Zoe","ln":"Ragouzeos","t":"Vice President, Student Health, Mental Health, and Wellbeing","o":"Student Health, Mental Health, and Wellbeing","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"zoe.ragouzeos@nyu.edu","ph":"","li":""},{"fn":"Jo Ivey","ln":"Boufford","t":"Director","o":"Doctor of Public Health Program","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"jo.boufford@nyu.edu","ph":"tel:+1 (212) 992-3724","li":"https://www.linkedin.com/in/jo-ivey-boufford-b182b6182?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B4%2BSSVqeMSMiOoMgLwVLsWg%3D%3D"},{"fn":"Kiera","ln":"Bloch","t":"Program Manager","o":"Department of Global and Environmental Health","r":"Influencer","pt":"Other","e":"kiera.bloch@nyu.edu","ph":"212-992-6331","li":"https://www.linkedin.com/in/kiera-bloch-68796349/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BQwKGsXlIQvyF4Kpg9lVJHg%3D%3D"},{"fn":"Tara","ln":"Stark","t":"Wellness Coordinator","o":"Wellness Program Facilitation Elective","r":"Champion","pt":"Health Promotion / Wellness","e":"Tara.Stark@NYULangone.org","ph":"212-263-6088","li":"https://www.linkedin.com/in/tara-stark-8b075819b?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BfVhqDOfcQ4yzNIqa%2F6QJlw%3D%3D"},{"fn":"Ivelisse","ln":"Rozon","t":"Counselor","o":"Section on Tobacco, Alcohol, and Drug Use","r":"Influencer","pt":"AOD Prevention / Recovery","e":"","ph":"tel:+19294701412","li":"https://www.linkedin.com/in/ivelisse-rozon-1945a0149/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BN2BNydwWSnSonpKwlZkA5Q%3D%3D"},{"fn":"Donna","ln":"Shelley","t":"Professor","o":"Public Health Policy and Management","r":"Champion","pt":"Health Promotion / Wellness","e":"donna.shelley@nyu.edu","ph":"tel:+1 (212) 998-5842","li":"https://www.linkedin.com/in/donna-shelley-5b80aa6a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B6tvMCqVIQyyGuvoBZpf7PQ%3D%3D"}]},{"n":"Newman University","s":"KS","w":"www.newmanu.edu/","u":155335,"p":4012},{"n":"Niagara University","s":"NY","w":"www.niagara.edu/","u":193973,"p":5148},{"n":"Nicholls State University","s":"LA","w":"www.nicholls.edu/","u":159966,"p":7065},{"n":"Norfolk State University","s":"VA","w":"www.nsu.edu/","u":232937,"p":6560},{"n":"North Carolina A & T State University","s":"NC","w":"www.ncat.edu/","u":199102,"p":15413},{"n":"North Carolina Central University","s":"NC","w":"https://www.nccu.edu/","u":199157,"p":9008},{"n":"North Carolina State University at Raleigh","s":"NC","w":"www.ncsu.edu/","u":199193,"p":41029},{"n":"North Dakota State University-Main Campus","s":"ND","w":"https://www.ndsu.edu/","u":200332,"p":13041},{"n":"North Seattle College","s":"WA","w":"www.northseattle.edu/","u":236072,"p":8134},{"n":"Northcentral University","s":"CA","w":"www.nu.edu/","u":444130,"p":12994},{"n":"Northeastern Illinois University","s":"IL","w":"www.neiu.edu/","u":147776,"p":6962},{"n":"Northeastern State University","s":"OK","w":"https://www.nsuok.edu/","u":207263,"p":8002},{"n":"Northeastern University","s":"MA","w":"www.northeastern.edu/","u":167358,"p":41654},{"n":"Northeastern University Professional Programs","s":"MA","w":"https://www.northeastern.edu/","u":482705,"p":11336},{"n":"Northern Arizona University","s":"AZ","w":"https://nau.edu/","u":105330,"p":31448},{"n":"Northern Illinois University","s":"IL","w":"www.niu.edu/","u":147703,"p":17359},{"n":"Northern Kentucky University","s":"KY","w":"www.nku.edu/","u":157447,"p":18500},{"n":"Northern Michigan University","s":"MI","w":"https://www.nmu.edu/","u":171456,"p":8049},{"n":"Northern State University","s":"SD","w":"https://northern.edu/","u":219259,"p":5717},{"n":"Northland Pioneer College","s":"AZ","w":"www.npc.edu/","u":105349,"p":4917},{"n":"Northwest Florida State College","s":"FL","w":"https://www.nwfsc.edu/","u":136233,"p":7160},{"n":"Northwest Missouri State University","s":"MO","w":"https://www.nwmissouri.edu/","u":178624,"p":12279},{"n":"Northwest Nazarene University","s":"ID","w":"https://www.nnu.edu/","u":142461,"p":10237},{"n":"Northwest Vista College","s":"TX","w":"alamo.edu/nvc/","u":420398,"p":26839},{"n":"Northwestern State University of Louisiana","s":"LA","w":"https://www.nsula.edu/","u":160038,"p":10544},{"n":"Northwestern University","s":"IL","w":"www.northwestern.edu/","u":147767,"p":26847},{"n":"Norwich University","s":"VT","w":"www.norwich.edu/","u":230995,"p":5186},{"n":"Nova Southeastern University","s":"FL","w":"www.nova.edu/","u":136215,"p":23575},{"n":"Oakland University","s":"MI","w":"www.oakland.edu/","u":171571,"p":18296},{"n":"Oberlin College","s":"OH","w":"www.oberlin.edu/","u":204501,"p":4160},{"n":"Odessa College","s":"TX","w":"www.odessa.edu/","u":227304,"p":12729},{"n":"Ohio State University-Main Campus","s":"OH","w":"www.osu.edu/","u":204796,"p":65036,"c":[{"fn":"Duane","ln":"Wegener","t":"Professor, Department Chair","o":"Department of Psychology","r":"Influencer","pt":"Other","e":"wegener.1@osu.edu","ph":"(614) 292-1866","li":""},{"fn":"Julia","ln":"Applegate","t":"Senior Lecturer on Health Behavior and Health Promotion","o":"College of Public health","r":"Champion","pt":"Health Promotion / Wellness","e":"applegate.38@osu.edu","ph":"614-929-8894","li":"https://www.linkedin.com/in/julia-m-applegate-ma-mph-25b7536?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BMKZrhAYnQe2hg49Y8lYtNw%3D%3D"},{"fn":"Yordanos (JOJO)","ln":"Beyene","t":"Senior Academic Advisor","o":"Office of Academic Programs and Student Services","r":"Influencer","pt":"Other","e":"beyene.27@osu.edu","ph":"614-292-8350","li":"https://www.linkedin.com/in/jojobeyene/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BUdQLvvdmRsqTO8u8mhEl%2Bw%3D%3D"},{"fn":"Paula","ln":"Song","t":"Dean","o":"College of Public Health","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"song.263@osu.edu","ph":"","li":"https://www.linkedin.com/in/paulasong?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B0jafLHV7RwaFPTN6P4ahzA%3D%3D"},{"fn":"Brandon","ln":"Horton","t":"Wellness Coordinator","o":"Student Wellness Center - Office of Student Life","r":"Champion","pt":"Health Promotion / Wellness","e":"horton.410@osu.edu","ph":"","li":"https://www.linkedin.com/in/brandon-horton-m-s-ches%C2%AE%EF%B8%8F-91403021a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3Bx6AC%2FOnaRoG0Nh751eEWqg%3D%3D"},{"fn":"Roger","ln":"Perkey, III","t":"Wellness Coordinator","o":"Student Wellness Center - Office of Student Life","r":"Champion","pt":"Health Promotion / Wellness","e":"perkey.10@osu.edu","ph":"614-247-5669","li":"https://www.linkedin.com/in/rdpiii-mph/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BP3c0siCCRni5Ch6QkIXi5Q%3D%3D"}]},{"n":"Ohio University-Main Campus","s":"OH","w":"https://www.ohio.edu/","u":204857,"p":28654},{"n":"Oklahoma State University-Main Campus","s":"OK","w":"www.okstate.edu/","u":207388,"p":28585},{"n":"Oklahoma State University-Oklahoma City","s":"OK","w":"osuokc.edu/","u":207397,"p":6344},{"n":"Old Dominion University","s":"VA","w":"www.odu.edu/","u":232982,"p":26280},{"n":"Olympic College","s":"WA","w":"www.olympic.edu/","u":236188,"p":7866},{"n":"Oral Roberts University","s":"OK","w":"https://oru.edu/","u":207582,"p":6376},{"n":"Oregon Institute of Technology","s":"OR","w":"https://www.oit.edu/","u":209506,"p":8796},{"n":"Oregon State University","s":"OR","w":"https://oregonstate.edu/","u":209542,"p":43223,"c":[{"fn":"Doris","ln":"Cancel-Tirado","t":"Associate Dean","o":"Student Services and Well-being","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"doris.canceltirado@oregonstate.edu","ph":"tel:541-737-6800","li":"https://www.linkedin.com/in/doris-cancel-tirado-phd-mph-216a966/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3Ba5YJx7XzSfCOZEORLrkd1w%3D%3D"},{"fn":"Amy","ln":"Frasieur","t":"Director of Health Equity & Wellness","o":"Student Health Services - Prevention & Wellness","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"Amy.Frasieur@oregonstate.edu","ph":"","li":"https://www.linkedin.com/in/amyfrasieur/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BLDVfxexrT2CyOsIV3L7IvA%3D%3D"},{"fn":"Nikia","ln":"Braxton-Franklin","t":"Alcohol & Drug Prevention Specialist","o":"Student Health Services - Prevention & Wellness","r":"Influencer","pt":"AOD Prevention / Recovery","e":"nikia.braxtonfranklin@oregonstate.edu","ph":"","li":"https://www.linkedin.com/in/nikia-franklin-95852935b/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BT2owA6U4RMCz4%2FcJFzfA3Q%3D%3D"},{"fn":"Jay","ln":"VanDenBogaard","t":"Substance Use Clinician, Collegiate Recovery Program Coordinator","o":"Student Health Services - Prevention & Wellness","r":"Champion","pt":"AOD Prevention / Recovery","e":"Jay.Vandenbogaard@oregonstate.edu","ph":"541-737-9355","li":""},{"fn":"Brooke","ln":"Martindale","t":"Wellness Specialist","o":"Student Health and Wellness","r":"Influencer","pt":"Health Promotion / Wellness","e":"brooke.martindale@osucascades.edu","ph":"541-706-2184","li":""}]},{"n":"Ozarks Technical Community College","s":"MO","w":"www.otc.edu/","u":177472,"p":14535},{"n":"Pace University","s":"NY","w":"www.pace.edu/","u":194310,"p":16012},{"n":"Palm Beach Atlantic University","s":"FL","w":"www.pba.edu/","u":136330,"p":4566},{"n":"Palm Beach State College","s":"FL","w":"www.palmbeachstate.edu/","u":136358,"p":34920,"c":[{"fn":"Becky","ln":"Mercer","t":"Associate Dean and Principal Investigator","o":"Substance Abuse Treatment and Prevention Department","r":"Decision Maker","pt":"AOD Prevention / Recovery","e":"mercerb@pbsc.edu","ph":"tel:+15612075416","li":"https://www.linkedin.com/in/becky-mercer-2a4ba8/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B%2F7WMc3PYRiyQG%2BHtvB%2BSZA%3D%3D"},{"fn":"Jada","ln":"Brooks","t":"Outreach Program Specialist","o":"Substance Abuse Treatment and Prevention Department","r":"Influencer","pt":"AOD Prevention / Recovery","e":"brooksj@pbsc.edu","ph":"","li":"https://www.linkedin.com/in/jada-brooks-519410186/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BvE7uC6XQRR2iLqTmXaYRww%3D%3D"},{"fn":"Brandon","ln":"White","t":"Grant Coordinator","o":"Substance Abuse Treatment and Prevention Department","r":"Champion","pt":"AOD Prevention / Recovery","e":"whiteb@pbsc.edu","ph":"tel:+15612075349","li":"https://www.linkedin.com/in/brandon-white-aa8a90135/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BuQDJY7LMTpWLq5wSsQ4aRQ%3D%3D"}]},{"n":"Palo Alto College","s":"TX","w":"alamo.edu/pac/","u":246354,"p":17966},{"n":"Paradise Valley Community College","s":"AZ","w":"https://www.paradisevalley.edu/","u":364016,"p":9614},{"n":"Park University","s":"MO","w":"www.park.edu/","u":178721,"p":8746},{"n":"Pasco-Hernando State College","s":"FL","w":"https://www.phsc.edu/","u":136400,"p":12450},{"n":"Pennsylvania College of Technology","s":"PA","w":"https://www.pct.edu/","u":366252,"p":6542},{"n":"Pennsylvania State University-Main Campus","s":"PA","w":"https://www.psu.edu/","u":214777,"p":53053},{"n":"Pennsylvania State University-Penn State Harrisburg","s":"PA","w":"https://harrisburg.psu.edu/","u":214713,"p":5123},{"n":"Pennsylvania State University-World Campus","s":"PA","w":"https://www.worldcampus.psu.edu/","u":479956,"p":18290},{"n":"Pennsylvania Western University","s":"PA","w":"https://www.pennwest.edu/","u":498571,"p":13624},{"n":"Pensacola State College","s":"FL","w":"www.pensacolastate.edu/","u":136473,"p":11678},{"n":"Pepperdine University","s":"CA","w":"www.pepperdine.edu/","u":121150,"p":11790},{"n":"Phoenix College","s":"AZ","w":"www.phoenixcollege.edu/","u":105428,"p":16165},{"n":"Pierce College District","s":"WA","w":"www.pierce.ctc.edu/","u":235237,"p":10595},{"n":"Pikes Peak State College","s":"CO","w":"https://www.pikespeak.edu/","u":127820,"p":16177},{"n":"Pittsburg State University","s":"KS","w":"https://www.pittstate.edu/","u":155681,"p":6816},{"n":"Plymouth State University","s":"NH","w":"www.plymouth.edu/","u":183080,"p":4102},{"n":"Point Loma Nazarene University","s":"CA","w":"www.pointloma.edu/","u":121309,"p":5331},{"n":"Point Park University","s":"PA","w":"www.pointpark.edu/","u":215442,"p":4160},{"n":"Polk State College","s":"FL","w":"www.polk.edu/","u":136516,"p":13744},{"n":"Pontifical Catholic University of Puerto Rico-Ponce","s":"PR","w":"https://www.pucpr.edu/","u":241410,"p":6041},{"n":"Portland State University","s":"OR","w":"www.pdx.edu/","u":209807,"p":24869},{"n":"Prairie View A & M University","s":"TX","w":"www.pvamu.edu/","u":227526,"p":11004},{"n":"Pratt Institute-Main","s":"NY","w":"https://www.pratt.edu/","u":194578,"p":6094},{"n":"Princeton University","s":"NJ","w":"www.princeton.edu/","u":186131,"p":9042},{"n":"Providence College","s":"RI","w":"https://www.providence.edu/","u":217402,"p":5035},{"n":"Pueblo Community College","s":"CO","w":"www.pueblocc.edu/","u":127884,"p":9185},{"n":"Purdue University Fort Wayne","s":"IN","w":"www.pfw.edu/","u":151102,"p":10011},{"n":"Purdue University Global","s":"IN","w":"https://www.purdueglobal.edu/","u":489779,"p":66383,"c":[{"fn":"Rebecca","ln":"Zolotor","t":"Dean and Vice President","o":"School of Health Sciences","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"rzolotor@purdueglobal.edu","ph":"","li":"https://www.linkedin.com/in/rebecca-zolotor-784751258?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bf2eGyzqDT663YmoZZiwcQQ%3D%3D"},{"fn":"Juliet","ln":"Bradley","t":"Professor","o":"Human Services Department","r":"Champion","pt":"Other","e":"jbradley2@purdueglobal.edu","ph":"","li":"https://www.linkedin.com/in/juliet-bradley-b90a0641?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BdQRy52DhSY%2BkYA8iKnQSAQ%3D%3D"},{"fn":"Lakieshia","ln":"Jones","t":"Professor","o":"College of Social and Behavioral Sciences","r":"Champion","pt":"AOD Prevention / Recovery","e":"Lakieshia.jones@purdueglobal.edu","ph":"","li":"https://www.linkedin.com/in/lakeisha-jones-msn-rn/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BKdcHCGxZQn2fO%2Fnv4OUaag%3D%3D"}]},{"n":"Purdue University Northwest","s":"IN","w":"www.pnw.edu/","u":490805,"p":10043},{"n":"Purdue University-Main Campus","s":"IN","w":"https://www.purdue.edu/","u":243780,"p":57417,"c":[{"fn":"Brenda","ln":"Masiga-Crowell","t":"Senior Director","o":"Student Health Services","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"","ph":"tel:+17654941720","li":"https://www.linkedin.com/in/brenda-masiga-crowell-dnp-mba-rn-cnl-aa662764/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BsfbhKV6HTny1FRlmARYsuA%3D%3D"},{"fn":"Korey","ln":"Jackson","t":"Lead HEAL Analyst, Center for Community Health Empowerment and Learning (HEAL)","o":"Office of the Provost - Health Empowerment Initiatives","r":"Champion","pt":"Health Promotion / Wellness","e":"jacksonk@purdue.edu","ph":"(765) 494-3604","li":"https://www.linkedin.com/in/korey-jackson-a14b26127/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BQd%2BUlZVaSzyvXov2dGeh%2BQ%3D%3D"},{"fn":"Mike","ln":"Warren","t":"Senior Director","o":"Recreation and Wellness","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"mikew@purdue.edu","ph":"tel:765-494-3114","li":"https://www.linkedin.com/in/mikejbwarren/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B%2Brh0aMLnTmqXgjyIl0yWDg%3D%3D"},{"fn":"Beth","ln":"Allwes","t":"Academic Advisor","o":"College of Health and Human Sciences- Student Services","r":"Influencer","pt":"Other","e":"ballwes@purdue.edu","ph":"765-494-5544","li":"https://www.linkedin.com/in/beth-allwes-61bb171b2/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BUylXdYzBReWtNKcTpMjimQ%3D%3D"},{"fn":"Jerome","ln":"Adams","t":"Distinguished Professor of Practice","o":"Department of Public Health","r":"Champion","pt":"Health Promotion / Wellness","e":"adams616@purdue.edu","ph":"765-496-1400","li":"https://www.linkedin.com/in/jerome-adams-md-mph-117b30122/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B1sQGd%2F%2FAQAaFStnY51Uxpg%3D%3D"}]},{"n":"Quincy College","s":"MA","w":"https://www.quincycollege.edu/","u":167525,"p":4684},{"n":"Quinnipiac University","s":"CT","w":"www.qu.edu/","u":130226,"p":10144},{"n":"Radford University","s":"VA","w":"https://www.radford.edu/","u":233277,"p":8695},{"n":"Ramapo College of New Jersey","s":"NJ","w":"www.ramapo.edu/","u":186201,"p":6346},{"n":"Red Rocks Community College","s":"CO","w":"www.rrcc.edu/","u":127909,"p":12139},{"n":"Regent University","s":"VA","w":"https://www.regent.edu/","u":231651,"p":13591},{"n":"Regis University","s":"CO","w":"https://www.regis.edu/","u":127918,"p":5677},{"n":"Rensselaer Polytechnic Institute","s":"NY","w":"www.rpi.edu/","u":194824,"p":7752},{"n":"Renton Technical College","s":"WA","w":"www.rtc.edu/","u":236382,"p":4932},{"n":"Rhode Island College","s":"RI","w":"www.ric.edu/","u":217420,"p":10308},{"n":"Rice University","s":"TX","w":"www.rice.edu/","u":227757,"p":9166},{"n":"Rider University","s":"NJ","w":"www.rider.edu/","u":186283,"p":4932},{"n":"Rio Hondo College","s":"CA","w":"www.riohondo.edu/","u":121886,"p":27997},{"n":"Rio Salado College","s":"AZ","w":"www.riosalado.edu/","u":105668,"p":34287},{"n":"Robert Morris University","s":"PA","w":"www.rmu.edu/","u":215655,"p":5581},{"n":"Rochester Institute of Technology","s":"NY","w":"www.rit.edu/","u":195003,"p":19382},{"n":"Rockhurst University","s":"MO","w":"https://www.rockhurst.edu/","u":179043,"p":4068},{"n":"Roger Williams University","s":"RI","w":"https://www.rwu.edu/","u":217518,"p":5071},{"n":"Roosevelt University","s":"IL","w":"www.roosevelt.edu/","u":148487,"p":4724},{"n":"Rose State College","s":"OK","w":"https://www.rose.edu/","u":207670,"p":9524},{"n":"Rowan University","s":"NJ","w":"https://www.rowan.edu/","u":184782,"p":22902},{"n":"Rutgers University-Camden","s":"NJ","w":"https://camden.rutgers.edu/","u":186371,"p":6622},{"n":"Rutgers University-New Brunswick","s":"NJ","w":"https://newbrunswick.rutgers.edu/","u":186380,"p":57297,"c":[{"fn":"Amy","ln":"Sapgnolo","t":"Senior Program Coordinator","o":"Rutgers ScarletWell","r":"Champion","pt":"Health Promotion / Wellness","e":"amy.spagnolo@rutgers.edu","ph":"","li":"https://www.linkedin.com/in/amy-b-spagnolo/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BITKc2fgGS3a1okqWxvbksw%3D%3D"},{"fn":"Francesca","ln":"Maresca","t":"Assistant Vice Chancellor for Health and Wellness","o":"Student Health","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"","ph":"848-932-1965","li":"https://www.linkedin.com/in/francesca-maresca-3a23907/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B8STjLCU8SpK%2BTH9C7pxyXw%3D%3D"},{"fn":"Nikita","ln":"Cuvilje","t":"Health Education Specialist","o":"Student Health","r":"Influencer","pt":"Health Promotion / Wellness","e":"","ph":"848-932-9160","li":""},{"fn":"Keith","ln":"Murphy","t":"Recovery Counselor, Director","o":"Alcohol and Other Drug Assistance Program (ADAP)","r":"Decision Maker","pt":"AOD Prevention / Recovery","e":"Keith.murphy@rutgers.edu","ph":"(848) 932-7884","li":"https://www.linkedin.com/in/keith-murphy-ma-lpc-lcadc-9ba53035/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BuIkFRZ0oQoi1xD%2BQkB6Yag%3D%3D"},{"fn":"Noa’a","ln":"Shimoni","t":"Associate Vice President of Student Health and Wellness","o":"Rutgers Health","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"shimonno@njms.rutgers.edu","ph":"","li":"https://www.linkedin.com/in/noa-a-shimoni-110473257?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bdi2dRuJPQYqguNU%2BZGKRkw%3D%3D"},{"fn":"Donna","ln":"Meeker-O'Rourke","t":"Program Coordinator","o":"Well-Being - Rutgers Health","r":"Champion","pt":"Health Promotion / Wellness","e":"dm1785@rbhs.rutgers.edu","ph":"","li":"https://www.linkedin.com/in/donna-meeker-o-rourke-88ab5a1a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BRzc4rGN1S6uuybuCqBb5lQ%3D%3D"}]},{"n":"Rutgers University-Newark","s":"NJ","w":"https://www.newark.rutgers.edu/","u":186399,"p":12739},{"n":"Sacred Heart University","s":"CT","w":"https://www.sacredheart.edu/","u":130253,"p":12695},{"n":"Saginaw Valley State University","s":"MI","w":"www.svsu.edu/","u":172051,"p":7637},{"n":"Saint Cloud State University","s":"MN","w":"https://www.stcloudstate.edu/","u":174783,"p":12618},{"n":"Saint Johns River State College","s":"FL","w":"www.sjrstate.edu/","u":137281,"p":9240},{"n":"Saint Joseph's University","s":"PA","w":"https://www.sju.edu/","u":215770,"p":0},{"n":"Saint Leo University","s":"FL","w":"www.saintleo.edu/","u":137032,"p":13292},{"n":"Saint Louis Community College","s":"MO","w":"https://www.stlcc.edu/","u":179308,"p":21669},{"n":"Saint Louis University","s":"MO","w":"www.slu.edu/","u":179159,"p":19321},{"n":"Saint Mary's University of Minnesota","s":"MN","w":"www.smumn.edu/","u":174817,"p":5642},{"n":"Saint Peter's University","s":"NJ","w":"www.saintpeters.edu/","u":186432,"p":4961},{"n":"Salem State University","s":"MA","w":"www.salemstate.edu/","u":167729,"p":7428},{"n":"Salisbury University","s":"MD","w":"https://www.salisbury.edu/","u":163851,"p":7497},{"n":"Sam Houston State University","s":"TX","w":"www.shsu.edu/","u":227881,"p":23694},{"n":"Samford University","s":"AL","w":"www.samford.edu/","u":102049,"p":6227},{"n":"San Antonio College","s":"TX","w":"www.alamo.edu/sac","u":227924,"p":29125},{"n":"San Diego Mesa College","s":"CA","w":"www.sdmesa.edu/","u":122375,"p":30204},{"n":"San Diego State University","s":"CA","w":"https://www.sdsu.edu/","u":122409,"p":42660},{"n":"San Francisco State University","s":"CA","w":"www.sfsu.edu/","u":122597,"p":27106},{"n":"San Jacinto Community College","s":"TX","w":"www.sanjac.edu/","u":227979,"p":43405},{"n":"San Jose State University","s":"CA","w":"www.sjsu.edu/","u":122755,"p":40205},{"n":"Santa Ana College","s":"CA","w":"www.sac.edu/","u":121619,"p":42829},{"n":"Santa Clara University","s":"CA","w":"www.scu.edu/","u":122931,"p":10129},{"n":"Santa Fe College","s":"FL","w":"www.sfcollege.edu/","u":137096,"p":17432},{"n":"Santa Monica College","s":"CA","w":"https://www.smc.edu/","u":122977,"p":33626},{"n":"Savannah College of Art and Design","s":"GA","w":"www.scad.edu/","u":140951,"p":19508},{"n":"Schoolcraft Community College District","s":"MI","w":"https://www.schoolcraft.edu/","u":172200,"p":12977},{"n":"Scottsdale Community College","s":"AZ","w":"www.scottsdalecc.edu/","u":105747,"p":11319},{"n":"Seattle Central College","s":"WA","w":"seattlecentral.edu/","u":236513,"p":8613},{"n":"Seattle University","s":"WA","w":"www.seattleu.edu/","u":236595,"p":7981},{"n":"Seminole State College of Florida","s":"FL","w":"https://www.seminolestate.edu/","u":137209,"p":20331},{"n":"Seton Hall University","s":"NJ","w":"https://www.shu.edu/","u":186584,"p":12878},{"n":"Seton Hill University","s":"PA","w":"www.setonhill.edu/","u":215947,"p":5037},{"n":"Shasta College","s":"CA","w":"https://www.shastacollege.edu/","u":123299,"p":12499},{"n":"Shenandoah University","s":"VA","w":"www.su.edu/","u":233541,"p":5036},{"n":"Shippensburg University of Pennsylvania","s":"PA","w":"www.ship.edu/","u":216010,"p":5858},{"n":"Shoreline Community College","s":"WA","w":"www.shoreline.edu/","u":236610,"p":6932},{"n":"Simmons University","s":"MA","w":"www.simmons.edu/","u":167783,"p":5787},{"n":"Sinclair Community College","s":"OH","w":"www.sinclair.edu/","u":205470,"p":33002},{"n":"Skagit Valley College","s":"WA","w":"www.skagit.edu/","u":236638,"p":6279},{"n":"Skyline College","s":"CA","w":"skylinecollege.edu/","u":123509,"p":17069},{"n":"Slippery Rock University of Pennsylvania","s":"PA","w":"https://www.sru.edu/","u":216038,"p":9586},{"n":"Snow College","s":"UT","w":"https://www.snow.edu/","u":230597,"p":6433},{"n":"Solano Community College","s":"CA","w":"welcome.solano.edu/","u":123563,"p":12782},{"n":"Sonoma State University","s":"CA","w":"https://sonoma.edu/","u":123572,"p":6695},{"n":"South Dakota State University","s":"SD","w":"https://www.sdstate.edu/","u":219356,"p":13773},{"n":"South Florida State College","s":"FL","w":"www.southflorida.edu/","u":137315,"p":4064},{"n":"South Mountain Community College","s":"AZ","w":"www.southmountaincc.edu/","u":105792,"p":6113},{"n":"South Puget Sound Community College","s":"WA","w":"www.spscc.edu/","u":236656,"p":6701},{"n":"South Seattle College","s":"WA","w":"southseattle.edu/","u":236504,"p":7797},{"n":"South Texas College","s":"TX","w":"https://www.southtexascollege.edu/","u":409315,"p":35779},{"n":"Southeast Missouri State University","s":"MO","w":"https://www.semo.edu/","u":179557,"p":10995},{"n":"Southeastern Baptist Theological Seminary","s":"NC","w":"www.collegeatsoutheastern.com/","u":199759,"p":4118},{"n":"Southeastern Louisiana University","s":"LA","w":"https://www.southeastern.edu/","u":160612,"p":17041},{"n":"Southeastern Oklahoma State University","s":"OK","w":"www.se.edu/","u":207847,"p":7653},{"n":"Southeastern University","s":"FL","w":"https://www.seu.edu/","u":137564,"p":12858},{"n":"Southern Adventist University","s":"TN","w":"www.southern.edu/","u":221661,"p":4540},{"n":"Southern Arkansas University Main Campus","s":"AR","w":"https://www.saumag.edu/","u":107983,"p":5979},{"n":"Southern California University of Health Sciences","s":"CA","w":"https://www.scuhs.edu/","u":117672,"p":4324},{"n":"Southern Connecticut State University","s":"CT","w":"www.southernct.edu/","u":130493,"p":10686},{"n":"Southern Illinois University-Carbondale","s":"IL","w":"https://siu.edu/","u":149222,"p":12745},{"n":"Southern Illinois University-Edwardsville","s":"IL","w":"www.siue.edu/","u":149231,"p":0},{"n":"Southern Methodist University","s":"TX","w":"https://www.smu.edu/","u":228246,"p":12900},{"n":"Southern New Hampshire University","s":"NH","w":"www.snhu.edu/","u":183026,"p":255134,"c":[{"fn":"Ashley","ln":"Love","t":"Program Director","o":"Public Health Programs","r":"Champion","pt":"Health Promotion / Wellness","e":"","ph":"","li":"https://www.linkedin.com/in/11drashleyslove?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B8tvwNb9wRpmal0X8%2B8iQEA%3D%3D"},{"fn":"Lynn","ln":"Ward","t":"Director","o":"Health Information Management","r":"Champion","pt":"Health Promotion / Wellness","e":"","ph":"","li":"https://www.linkedin.com/in/lynn-ward-edd-rhia-cphims-140b999a?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BKaoYrYsoT3aLGP%2FrWOLoBQ%3D%3D"},{"fn":"Brandon","ln":"Ryans","t":"Associate Dean","o":"Health Professions","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"","ph":"","li":"https://www.linkedin.com/in/bbryans?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bm%2Bvfb4%2BZTpaOoAS7VU2sOg%3D%3D"},{"fn":"Roseina","ln":"Britton","t":"Clinical Assistant Professor","o":"Clinical Faculty","r":"Influencer","pt":"Health Promotion / Wellness","e":"","ph":"","li":"https://www.linkedin.com/in/roseina-britton-phd-lpc-ncc-b9573210b?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BAIBUxRxHSNWu%2FP49uylQrw%3D%3D"}]},{"n":"Southern Oregon University","s":"OR","w":"www.sou.edu/","u":210146,"p":7070},{"n":"Southern University and A & M College","s":"LA","w":"www.subr.edu/","u":160621,"p":9246},{"n":"Southern Utah University","s":"UT","w":"https://www.suu.edu/","u":230603,"p":22495},{"n":"Southwest Minnesota State University","s":"MN","w":"www.smsu.edu/","u":175078,"p":8943},{"n":"Southwestern Oklahoma State University","s":"OK","w":"https://www.swosu.edu/","u":207865,"p":5869},{"n":"Spelman College","s":"GA","w":"www.spelman.edu/","u":141060,"p":4039},{"n":"Spokane Community College","s":"WA","w":"https://scc.spokane.edu/","u":236692,"p":9669},{"n":"Spokane Falls Community College","s":"WA","w":"https://sfcc.spokane.edu/","u":236708,"p":5444},{"n":"St Catherine University","s":"MN","w":"https://www.stkate.edu/","u":175005,"p":4300},{"n":"St Petersburg College","s":"FL","w":"www.spcollege.edu/","u":137078,"p":31520},{"n":"St Philip's College","s":"TX","w":"www.alamo.edu/spc/","u":227854,"p":23516},{"n":"St. Francis College","s":"NY","w":"https://www.sfc.edu/","u":195173,"p":4953},{"n":"St. John Fisher University","s":"NY","w":"https://www.sjf.edu/","u":195720,"p":4058},{"n":"St. John's University-New York","s":"NY","w":"www.stjohns.edu/","u":195809,"p":21357},{"n":"St. Joseph's University-New York","s":"NY","w":"www.sjny.edu/","u":195544,"p":5255},{"n":"St. Thomas University","s":"FL","w":"www.stu.edu/","u":137476,"p":7923},{"n":"Stanford University","s":"CA","w":"www.stanford.edu/","u":243744,"p":21132},{"n":"State College of Florida-Manatee-Sarasota","s":"FL","w":"www.scf.edu/","u":135391,"p":11408},{"n":"State University of New York at Cortland","s":"NY","w":"www2.cortland.edu/","u":196149,"p":7824},{"n":"State University of New York at New Paltz","s":"NY","w":"www.newpaltz.edu/","u":196176,"p":8697},{"n":"State University of New York at Oswego","s":"NY","w":"https://www.oswego.edu/","u":196194,"p":9219},{"n":"State University of New York at Plattsburgh","s":"NY","w":"https://www.plattsburgh.edu/","u":196246,"p":5289},{"n":"Stephen F Austin State University","s":"TX","w":"https://www.sfasu.edu/","u":228431,"p":12240},{"n":"Stevens Institute of Technology","s":"NJ","w":"www.stevens.edu/","u":186867,"p":9650},{"n":"Stevenson University","s":"MD","w":"www.stevenson.edu/","u":164173,"p":4050},{"n":"Stockton University","s":"NJ","w":"https://www.stockton.edu/","u":186876,"p":12036},{"n":"Stony Brook University","s":"NY","w":"https://www.stonybrook.edu/","u":196097,"p":33031},{"n":"Suffolk University","s":"MA","w":"https://www.suffolk.edu/","u":168005,"p":7246},{"n":"SUNY Brockport","s":"NY","w":"https://www.brockport.edu/","u":196121,"p":8138},{"n":"SUNY Buffalo State University","s":"NY","w":"https://suny.buffalostate.edu/","u":196130,"p":8083},{"n":"SUNY College at Geneseo","s":"NY","w":"https://www.geneseo.edu/","u":196167,"p":4230},{"n":"SUNY College of Technology at Alfred","s":"NY","w":"www.alfredstate.edu/","u":196006,"p":4281},{"n":"SUNY College of Technology at Canton","s":"NY","w":"www.canton.edu/","u":196015,"p":4269},{"n":"SUNY Old Westbury","s":"NY","w":"www.oldwestbury.edu/","u":196237,"p":5954},{"n":"SUNY Oneonta","s":"NY","w":"https://suny.oneonta.edu/","u":196185,"p":6263},{"n":"Syracuse University","s":"NY","w":"https://www.syracuse.edu/","u":196413,"p":37243,"c":[{"fn":"Maggie","ln":"Washburn","t":"Administrative Specialist, Wellness Champion","o":"Barnes Center at The Arch, Health Promotion","r":"Influencer","pt":"Health Promotion / Wellness","e":"mawashbu@syr.edu","ph":"tel:+13154438000","li":""},{"fn":"Jessica","ln":"Dennison","t":"Associate Director","o":"Health Promotion","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"","ph":"tel:+13154438000","li":""},{"fn":"Hope","ln":"Michael","t":"Assistant Director","o":"Health Promotion","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"","ph":"tel:+13154438000","li":"https://www.linkedin.com/in/hopemichael/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BwgkAHjWeQtSl050F1iN%2BXA%3D%3D"},{"fn":"Cara","ln":"Capparrelli","t":"Clinical Case Manager, Staff Therapist","o":"Counseling","r":"Influencer","pt":"Counseling Center Leadership","e":"","ph":"tel:+13154438000","li":"https://www.linkedin.com/in/cjcappar/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B3IRxZxHLTzqBjEFF8a3HfQ%3D%3D"},{"fn":"Dessa","ln":"Bergen-Cico","t":"Professor, Public Health Department; Coordinator of the Addiction Studies program","o":"Public Health","r":"Champion","pt":"Other","e":"dkbergen@syr.edu","ph":"tel:315.443.0250","li":"https://www.linkedin.com/in/dessa-bergen-cico-735133179/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BjF%2BkP0KASpmNszliWjVVpw%3D%3D"}]},{"n":"Tacoma Community College","s":"WA","w":"https://www.tacomacc.edu/","u":236753,"p":8673},{"n":"Taft College","s":"CA","w":"www.taftcollege.edu/","u":124113,"p":8130},{"n":"Tallahassee Community College","s":"FL","w":"www.tsc.fl.edu/","u":137759,"p":0},{"n":"Tarleton State University","s":"TX","w":"www.tarleton.edu/","u":228529,"p":17719},{"n":"Teachers College at Columbia University","s":"NY","w":"www.tc.columbia.edu/","u":196468,"p":5434},{"n":"Temple University","s":"PA","w":"www.temple.edu/","u":216339,"p":32591,"c":[{"fn":"Jessica","ln":"Barone","t":"Alcohol and Other Drugs Prevention Coordinator","o":"Wellness Resource Center","r":"Champion","pt":"AOD Prevention / Recovery","e":"Jessica.Barone@temple.edu","ph":"","li":"https://www.linkedin.com/in/jessica-barone?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BxVOcv7cVSLGgWUbN%2BWalJA%3D%3D"},{"fn":"Amanda","ln":"Bule","t":"Assistant Director","o":"Wellness Resource Center","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"Amanda.Bule@temple.edu","ph":"","li":""},{"fn":"Lydia","ln":"Lynes","t":"Mental Well-Being Program Coordinator","o":"Wellness Resource Center","r":"Champion","pt":"Health Promotion / Wellness","e":"Lydia.Lynes@temple.edu","ph":"","li":""},{"fn":"Liz","ln":"Zadnik","t":"Director of Wellness and Health Promotion","o":"Wellness Resource Center","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"LZadnik@temple.edu","ph":"","li":"https://www.linkedin.com/in/lizzadnik/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BqnM2JIKnQhCNXscVs%2FH84w%3D%3D"},{"fn":"Dione","ln":"Cash","t":"Associate Dean","o":"Office of Student Support","r":"Decision Maker","pt":"Student Affairs Leadership","e":"dione.cash@temple.edu","ph":"215-707-1890","li":""},{"fn":"Denise","ln":"Green","t":"Lead Administrative Specialist, Student Records","o":"Office of Student Support","r":"Influencer","pt":"Other","e":"denise.green@temple.edu","ph":"215-707-2079","li":""},{"fn":"Micki","ln":"Marchesani","t":"Lead Administrative Specialist, Student Support","o":"Office of Student Support","r":"Influencer","pt":"Other","e":"helen.miller@temple.edu","ph":"215-707-1670","li":""}]},{"n":"Tennessee State University","s":"TN","w":"www.tnstate.edu/","u":221838,"p":9000},{"n":"Tennessee Technological University","s":"TN","w":"www.tntech.edu/","u":221847,"p":11009},{"n":"Texas A & M International University","s":"TX","w":"www.tamiu.edu/","u":226152,"p":10140},{"n":"Texas A & M University-College Station","s":"TX","w":"https://www.tamu.edu/","u":228723,"p":0,"c":[{"fn":"Donaji","ln":"Stelzig","t":"Case Manager","o":"Department of Health Promotion and Community Health Sciences","r":"Influencer","pt":"Case Management / BIT","e":"donaji_s@email.tamu.edu","ph":"","li":""},{"fn":"Lei-Shih","ln":"Chen","t":"Program Director and Associate Professor","o":"","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"lacechen@tamu.edu","ph":"","li":""},{"fn":"Amanda","ln":"L","t":"Program Coordinator","o":"Aggie Recovery Community","r":"Champion","pt":"AOD Prevention / Recovery","e":"aggierecovery@tamu.edu","ph":"979.847.5677","li":"https://www.linkedin.com/in/amanda-l-10a436145/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3Bvk0ikVA5Qg6X9BMKPpoj%2Fw%3D%3D"},{"fn":"John","ln":"Shiflet","t":"Director","o":"Aggie Recovery Community","r":"Decision Maker","pt":"AOD Prevention / Recovery","e":"aggierecovery@tamu.edu","ph":"979.458.4584","li":""},{"fn":"Megan","ln":"Westerman","t":"Program Director II","o":"Health Policy and Management","r":"Champion","pt":"Health Promotion / Wellness","e":"westerman@tamu.edu","ph":"979.436.9433","li":"https://www.linkedin.com/in/megan-w-a1a51886/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BXi%2Bl5p4STmSt9LKDpfIyzw%3D%3D"},{"fn":"Payton","ln":"Garcia","t":"SeniorAdministrative Coordinator II","o":"Health Policy and Management","r":"Champion","pt":"Other","e":"payton.garcia@tamu.edu","ph":"979.436.9488","li":""}]},{"n":"Texas A & M University-Commerce","s":"TX","w":"www.tamuc.edu/","u":224554,"p":0},{"n":"Texas A & M University-Corpus Christi","s":"TX","w":"https://www.tamucc.edu/","u":224147,"p":13368},{"n":"Texas A & M University-Kingsville","s":"TX","w":"https://www.tamuk.edu/","u":228705,"p":0},{"n":"Texas A&M University-San Antonio","s":"TX","w":"www.tamusa.edu/","u":459949,"p":8715},{"n":"Texas Christian University","s":"TX","w":"https://www.tcu.edu/","u":228875,"p":13345},{"n":"Texas Southern University","s":"TX","w":"www.tsu.edu/","u":229063,"p":9393},{"n":"Texas State University","s":"TX","w":"https://www.txst.edu/","u":228459,"p":42138},{"n":"Texas Tech University","s":"TX","w":"www.ttu.edu/","u":229115,"p":43738},{"n":"Texas Tech University Health Sciences Center","s":"TX","w":"https://www.ttuhsc.edu/","u":229337,"p":6999},{"n":"Texas Woman's University","s":"TX","w":"www.twu.edu/","u":229179,"p":19542},{"n":"The Catholic University of America","s":"DC","w":"https://www.catholic.edu/","u":131283,"p":5618},{"n":"The Chicago School at Los Angeles","s":"CA","w":"https://www.thechicagoschool.edu/in-the-community/locations/","u":455664,"p":4787},{"n":"The College of New Jersey","s":"NJ","w":"https://www.tcnj.edu/","u":187134,"p":8588},{"n":"The New School","s":"NY","w":"https://www.newschool.edu/","u":193654,"p":10813},{"n":"The Southern Baptist Theological Seminary","s":"KY","w":"www.sbts.edu/","u":157748,"p":5633},{"n":"The University of Alabama","s":"AL","w":"www.ua.edu/","u":100751,"p":43627},{"n":"The University of Findlay","s":"OH","w":"findlay.edu/","u":202763,"p":6112},{"n":"The University of Montana","s":"MT","w":"www.umt.edu/","u":180489,"p":12702},{"n":"The University of Tampa","s":"FL","w":"https://www.ut.edu/","u":137847,"p":12051},{"n":"The University of Tennessee-Chattanooga","s":"TN","w":"utc.edu/","u":221740,"p":12635},{"n":"The University of Tennessee-Knoxville","s":"TN","w":"www.utk.edu/","u":221759,"p":39187,"c":[{"fn":"Julie","ln":"Carlson","t":"Wellness Coordinator, Alcohol & Other Drugs","o":"Center for Health Education and Wellness","r":"Champion","pt":"AOD Prevention / Recovery","e":"jcarls23@utk.edu","ph":"","li":"https://www.linkedin.com/in/julie-c-carlson/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B7Q15dhhoRrG1kgAZaZA2rg%3D%3D"},{"fn":"Carly","ln":"Rayburg","t":"Wellness Coordinator, Alcohol & Other Drugs","o":"Center for Health Education and Wellness","r":"Champion","pt":"Health Promotion / Wellness","e":"crayburg@utk.edu","ph":"","li":""},{"fn":"Yusof","ln":"Al-Wadei","t":"Director","o":"Center for Health Education and Wellness","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"yalwadei@utk.edu","ph":"","li":"https://www.linkedin.com/in/yusof-alwadei?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BLEOQ7T58QvuUTCMbZ6u6Ng%3D%3D"},{"fn":"Jenny","ln":"Johnson","t":"Staff Counselor","o":"Student Counseling Center","r":"Influencer","pt":"Counseling Center Leadership","e":"counselingcenter@utk.edu","ph":"(865) 974-2196","li":""}]},{"n":"The University of Tennessee-Martin","s":"TN","w":"https://www.utm.edu/","u":221768,"p":8225},{"n":"The University of Texas at Arlington","s":"TX","w":"https://www.uta.edu/","u":228769,"p":53946},{"n":"The University of Texas at Austin","s":"TX","w":"https://www.utexas.edu/","u":228778,"p":56150},{"n":"The University of Texas at Dallas","s":"TX","w":"www.utdallas.edu/","u":228787,"p":33405},{"n":"The University of Texas at El Paso","s":"TX","w":"https://www.utep.edu/","u":228796,"p":28591},{"n":"The University of Texas at San Antonio","s":"TX","w":"www.utsa.edu/","u":229027,"p":39266},{"n":"The University of Texas at Tyler","s":"TX","w":"https://www.uttyler.edu/","u":228802,"p":11795},{"n":"The University of Texas Health Science Center at Houston","s":"TX","w":"www.uth.edu/","u":229300,"p":5855},{"n":"The University of Texas Health Science Center at San Antonio","s":"TX","w":"www.uthscsa.edu/","u":228644,"p":4344},{"n":"The University of Texas Medical Branch at Galveston","s":"TX","w":"https://www.utmb.edu/","u":228653,"p":4030},{"n":"The University of Texas Permian Basin","s":"TX","w":"https://www.utpb.edu/","u":229018,"p":7372},{"n":"The University of Texas Rio Grande Valley","s":"TX","w":"www.utrgv.edu/","u":227368,"p":40284},{"n":"Thomas Edison State University","s":"NJ","w":"www.tesu.edu/","u":187046,"p":10924},{"n":"Thomas Jefferson University","s":"PA","w":"www.jefferson.edu/","u":216366,"p":9512},{"n":"Tiffin University","s":"OH","w":"www.tiffin.edu/","u":206048,"p":4866},{"n":"Touro University","s":"NY","w":"https://www.touro.edu/","u":196592,"p":14626},{"n":"Towson University","s":"MD","w":"www.towson.edu/","u":164076,"p":21858},{"n":"Trevecca Nazarene University","s":"TN","w":"https://www.trevecca.edu/","u":221892,"p":4065},{"n":"Trine University","s":"IN","w":"www.trine.edu/","u":152567,"p":5034},{"n":"Trine University-Regional/Non-Traditional Campuses","s":"IN","w":"trine.edu/online/index.aspx","u":414878,"p":13135},{"n":"Trinity Valley Community College","s":"TX","w":"www.tvcc.edu/","u":225308,"p":7722},{"n":"Troy University","s":"AL","w":"www.troy.edu/","u":102368,"p":17550},{"n":"Truckee Meadows Community College","s":"NV","w":"www.tmcc.edu/","u":182500,"p":13953},{"n":"Tufts University","s":"MA","w":"https://www.tufts.edu/","u":168148,"p":14945},{"n":"Tulane University of Louisiana","s":"LA","w":"https://tulane.edu/","u":160755,"p":15026},{"n":"Tuskegee University","s":"AL","w":"https://www.tuskegee.edu/","u":102377,"p":4240},{"n":"Tyler Junior College","s":"TX","w":"www.tjc.edu/","u":229355,"p":16068},{"n":"United States Air Force Academy","s":"CO","w":"www.usafa.edu/","u":128328,"p":5117},{"n":"United States Military Academy","s":"NY","w":"www.westpoint.edu/","u":197036,"p":4656},{"n":"United States Naval Academy","s":"MD","w":"www.usna.edu/","u":164155,"p":4671},{"n":"Unity Environmental University","s":"ME","w":"https://unity.edu/","u":161572,"p":9106},{"n":"Universidad Ana G. Mendez-Carolina Campus","s":"PR","w":"uagm.edu/","u":243346,"p":6080},{"n":"Universidad Ana G. Mendez-Cupey Campus","s":"PR","w":"uagm.edu/","u":241739,"p":7147},{"n":"Universidad Ana G. Mendez-Gurabo Campus","s":"PR","w":"uagm.edu/","u":243601,"p":11122},{"n":"Universidad del Sagrado Corazon","s":"PR","w":"www.sagrado.edu/","u":243443,"p":5576},{"n":"Universidad Politecnica de Puerto Rico","s":"PR","w":"www.pupr.edu/","u":243577,"p":5342},{"n":"University at Albany","s":"NY","w":"www.albany.edu/","u":196060,"p":27172},{"n":"University at Buffalo","s":"NY","w":"https://www.buffalo.edu/","u":196088,"p":35427},{"n":"University of Akron Main Campus","s":"OH","w":"www.uakron.edu/","u":200800,"p":15195},{"n":"University of Alabama at Birmingham","s":"AL","w":"https://www.uab.edu/","u":100663,"p":24893},{"n":"University of Alabama in Huntsville","s":"AL","w":"www.uah.edu/","u":100706,"p":9916},{"n":"University of Alaska Anchorage","s":"AK","w":"www.uaa.alaska.edu/","u":102553,"p":17753},{"n":"University of Alaska Fairbanks","s":"AK","w":"www.uaf.edu/","u":102614,"p":11023},{"n":"University of Arizona","s":"AZ","w":"https://www.arizona.edu/","u":104179,"p":61966,"c":[{"fn":"Nicole","ln":"Yuan","t":"Associate Professor and Program Director, Health Behavior and Health Promotion","o":"Mel and Enid Zuckerman College of Public Health","r":"Champion","pt":"Health Promotion / Wellness","e":"nyuan@arizona.edu","ph":"tel:520-626-7215","li":"https://www.linkedin.com/in/nicole-yuan-60a564157/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BhlY9MyFVRRuPttMypdpLpA%3D%3D"},{"fn":"Amy","ln":"Amaya","t":"Health Educator","o":"Campus Health Service","r":"Champion","pt":"Health Promotion / Wellness","e":"amayaa@arizona.edu","ph":"","li":""},{"fn":"Spencer","ln":"Gorin","t":"AOD & Harm Reduction Program Specialist","o":"Campus Health Service","r":"Champion","pt":"AOD Prevention / Recovery","e":"sgorin@email.arizona.edu","ph":"520-621-4519 or 520-979-7753","li":""},{"fn":"Cassandra","ln":"Hirdes","t":"Director, Health Promotion","o":"Campus Health","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"chirdes@email.arizona.edu","ph":"","li":"https://www.linkedin.com/in/cassandra-hirdes-6b126022/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BNC8yrA6kRGqInllFyt5jpQ%3D%3D"},{"fn":"Ande","ln":"Nutter","t":"Evaluation Specialist for Health Promotion","o":"Campus Health","r":"Influencer","pt":"Health Promotion / Wellness","e":"anutter@arizona.edu","ph":"","li":"https://www.linkedin.com/in/andeana-nutter/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BkxCsBdUEQZybVsEBvTt%2BNQ%3D%3D"}]},{"n":"University of Arkansas","s":"AR","w":"https://www.uark.edu/","u":106397,"p":34602},{"n":"University of Arkansas at Little Rock","s":"AR","w":"ualr.edu/www/","u":106245,"p":10086},{"n":"University of Arkansas Grantham","s":"AR","w":"https://www.uagrantham.edu/","u":442569,"p":5464},{"n":"University of Arkansas-Fort Smith","s":"AR","w":"https://uafs.edu/","u":108092,"p":6139},{"n":"University of Bridgeport","s":"CT","w":"www.bridgeport.edu/","u":128744,"p":5603},{"n":"University of California-Berkeley","s":"CA","w":"www.berkeley.edu/","u":110635,"p":48556},{"n":"University of California-Davis","s":"CA","w":"ucdavis.edu/","u":110644,"p":41916},{"n":"University of California-Irvine","s":"CA","w":"www.uci.edu/","u":110653,"p":38546},{"n":"University of California-Los Angeles","s":"CA","w":"www.ucla.edu/","u":110662,"p":49388},{"n":"University of California-Merced","s":"CA","w":"ucmerced.edu/","u":445188,"p":9716},{"n":"University of California-Riverside","s":"CA","w":"www.ucr.edu/","u":110671,"p":28335},{"n":"University of California-San Diego","s":"CA","w":"www.ucsd.edu/","u":110680,"p":44416},{"n":"University of California-Santa Barbara","s":"CA","w":"www.ucsb.edu/","u":110705,"p":27662},{"n":"University of California-Santa Cruz","s":"CA","w":"www.ucsc.edu/","u":110714,"p":21313},{"n":"University of Central Arkansas","s":"AR","w":"www.uca.edu/","u":106704,"p":10989},{"n":"University of Central Florida","s":"FL","w":"https://www.ucf.edu/","u":132903,"p":80755,"c":[{"fn":"Sussany","ln":"Beltran","t":"Associate Professor, Center Co-Director","o":"Center for Behavioral Health Research and Training","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"Susanny.Beltran@ucf.edu","ph":"407-823-4662","li":"https://www.linkedin.com/in/susanny-j-beltran-phd-msw-b874a980?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BVUInjy%2FmS%2B6PtZy%2FhMIIuA%3D%3D"},{"fn":"Jacob","ln":"Bleasdale","t":"Assistant Professor","o":"Health Sciences","r":"Champion","pt":"Health Promotion / Wellness","e":"jacob.bleasdale@ucf.edu","ph":"407-823-0946","li":"https://www.linkedin.com/in/jacob-bleasdale-phd-ms-ches%C2%AE-a0a83a128?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BXEW9vYjsRrq%2FDGAxoDq9jw%3D%3D"},{"fn":"Lana","ln":"Gidusko","t":"Manager","o":"Academic Support Services","r":"Influencer","pt":"Case Management / BIT","e":"lana.gidusko@ucf.edu","ph":"407-823-2595","li":"https://www.linkedin.com/in/lana-gidusko-922b1976?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Ba6Q14SmwTiiv%2BXx7rREU8Q%3D%3D"},{"fn":"Yen-Han","ln":"Lee","t":"Asssistant Professor","o":"Health Sciences","r":"Champion","pt":"Health Promotion / Wellness","e":"yen-han.lee@ucf.edu","ph":"","li":""},{"fn":"Heather","ln":"Lovett","t":"Director of Communications and Marketing","o":"Dean's Office","r":"Decision Maker","pt":"Other","e":"heather.lovett@ucf.edu","ph":"407-823-0563","li":"https://www.linkedin.com/in/heatherflovett?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B5M39ho7ISoWqTBTLhBJtAQ%3D%3D"},{"fn":"Suha","ln":"Saleh","t":"Associate Dean for Academic Affairs and Student Success, Associate Professor","o":"Dean's Office, Health Sciences","r":"Decision Maker","pt":"Student Affairs Leadership","e":"suha.saleh@ucf.edu","ph":"407-823-6761","li":"https://www.linkedin.com/in/suha-saleh-0503ab216?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BobVO8qpzQgeI78dX7bqOxQ%3D%3D"}]},{"n":"University of Central Missouri","s":"MO","w":"https://www.ucmo.edu/","u":176965,"p":17747},{"n":"University of Central Oklahoma","s":"OK","w":"https://www.uco.edu/","u":206941,"p":14247},{"n":"University of Chicago","s":"IL","w":"www.uchicago.edu/","u":144050,"p":21145},{"n":"University of Cincinnati-Blue Ash College","s":"OH","w":"www.ucblueash.edu/","u":201955,"p":11621},{"n":"University of Cincinnati-Clermont College","s":"OH","w":"www.ucclermont.edu/","u":201946,"p":15282},{"n":"University of Cincinnati-Main Campus","s":"OH","w":"www.uc.edu/","u":201885,"p":51726},{"n":"University of Colorado Boulder","s":"CO","w":"https://www.colorado.edu/","u":126614,"p":46985},{"n":"University of Colorado Colorado Springs","s":"CO","w":"https://www.uccs.edu/","u":126580,"p":14704},{"n":"University of Colorado Denver/Anschutz Medical Campus","s":"CO","w":"www.ucdenver.edu/","u":126562,"p":29066},{"n":"University of Connecticut","s":"CT","w":"https://uconn.edu/","u":129020,"p":47445},{"n":"University of Dayton","s":"OH","w":"https://udayton.edu/","u":202480,"p":12174},{"n":"University of Delaware","s":"DE","w":"www.udel.edu/","u":130943,"p":26917},{"n":"University of Denver","s":"CO","w":"www.du.edu/","u":127060,"p":16004},{"n":"University of Detroit Mercy","s":"MI","w":"https://www.udmercy.edu/","u":169716,"p":5954},{"n":"University of Florida","s":"FL","w":"https://www.ufl.edu/","u":134130,"p":61936,"c":[{"fn":"Jennifer","ln":"Royer","t":"Director","o":"Gatorwell Health Promotion Services","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"jkennymore@ufl.edu","ph":"","li":"https://www.linkedin.com/in/jenniferkennymoremph/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B6v%2Fl4%2F6%2FRLO3vZEvEaKqBg%3D%3D"},{"fn":"Candace","ln":"Kanney","t":"Health Promotion Specialist","o":"Gatorwell Health Promotion Services","r":"Influencer","pt":"Health Promotion / Wellness","e":"candacekanney@ufl.edu","ph":"","li":"https://www.linkedin.com/in/candacekanney/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B27e86x5MQ7a8avJjA6IeCg%3D%3D"},{"fn":"Stefanie Jasper","ln":"Romie","t":"Alcohol & Other Drug Services Coordinator","o":"Counseling and Wellness Center","r":"Champion","pt":"AOD Prevention / Recovery","e":"sjasperromie@ufl.edu","ph":"352-392-1575","li":"https://www.linkedin.com/in/stefanie-jasper-romie-72a48a8a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B8HwwX0HxSpSYUFSR031ujg%3D%3D"}]},{"n":"University of Florida-Online","s":"FL","w":"https://www.ufonline.ufl.edu/","u":484473,"p":6778},{"n":"University of Georgia","s":"GA","w":"www.uga.edu/","u":139959,"p":45913},{"n":"University of Hartford","s":"CT","w":"www.hartford.edu/","u":129525,"p":6922},{"n":"University of Hawaii at Manoa","s":"HI","w":"https://manoa.hawaii.edu/","u":141574,"p":21939},{"n":"University of Houston","s":"TX","w":"www.uh.edu/","u":225511,"p":51967},{"n":"University of Houston-Clear Lake","s":"TX","w":"www.uhcl.edu/","u":225414,"p":9882},{"n":"University of Houston-Downtown","s":"TX","w":"www.uhd.edu/","u":225432,"p":17196},{"n":"University of Houston-Victoria","s":"TX","w":"uhv.edu/","u":225502,"p":4784},{"n":"University of Idaho","s":"ID","w":"www.uidaho.edu/","u":142285,"p":14290},{"n":"University of Illinois Chicago","s":"IL","w":"www.uic.edu/","u":145600,"p":36493},{"n":"University of Illinois Springfield","s":"IL","w":"www.uis.edu/","u":148654,"p":5834},{"n":"University of Illinois Urbana-Champaign","s":"IL","w":"www.illinois.edu/","u":145637,"p":62797,"c":[{"fn":"Christopher","ln":"Ochs","t":"Director","o":"Staff/Faculty Assistance and Well-being Services","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"cochs@illinois.edu","ph":"tel:2172445312","li":""},{"fn":"D.J.","ln":"Taylor","t":"Learning Specialist","o":"Academic Services","r":"Influencer","pt":"Other","e":"djtaylo2@illinois.edu","ph":"tel:217-333-1568","li":"https://www.linkedin.com/in/djtaylor4?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B5cr4awOwT66cJxKvCi5AFw%3D%3D"},{"fn":"Kurt","ln":"Hegeman","t":"Clinical Counselor, AOD Clinical Program Coordinator, Co-Chair, Alcohol and Other Drug Outreach","o":"Student Affairs - Counseling Center","r":"Champion","pt":"AOD Prevention / Recovery","e":"khegeman@illinois.edu","ph":"","li":""},{"fn":"Kristin","ln":"Manzi","t":"Program Coordinator, ACE IT & Harm Reduction Peers; Clinical Specialist in Education, ACE IT Program; Co-Chair, Alcohol and Other Drug Outreach","o":"Student Affairs - Counseling Center","r":"Champion","pt":"Health Promotion / Wellness","e":"kmanz2@illinois.edu","ph":"","li":"https://www.linkedin.com/in/kristin-manzi-msw/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B7XT7ldKNRqO2qcxQ0RgQKQ%3D%3D"}]},{"n":"University of Indianapolis","s":"IN","w":"https://uindy.edu/","u":151263,"p":6136},{"n":"University of Iowa","s":"IA","w":"https://uiowa.edu/","u":153658,"p":32864},{"n":"University of Kansas","s":"KS","w":"https://ku.edu/","u":155317,"p":30885},{"n":"University of Kentucky","s":"KY","w":"www.uky.edu/","u":157085,"p":35216},{"n":"University of La Verne","s":"CA","w":"https://www.laverne.edu/","u":117140,"p":6589},{"n":"University of Louisiana at Lafayette","s":"LA","w":"www.louisiana.edu/","u":160658,"p":16810,"c":[{"fn":"Elizabeth","ln":"LaPointe","t":"Master Instructor, Distance Learning Coordinator","o":"Health Promotion & Wellness","r":"Champion","pt":"Health Promotion / Wellness","e":"elizabeth.lapointe@louisiana.edu","ph":"(337) 482-5368","li":"https://www.linkedin.com/in/elizabeth-lapointe-950b03198/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BN7KXqa5%2FQeSLXEWtAbADUQ%3D%3D"},{"fn":"Lisa","ln":"LeBlanc","t":"Master Instructor, Program Coordinator - Health Promotion and Wellness","o":"Health Promotion & Wellness","r":"Champion","pt":"Health Promotion / Wellness","e":"lisa.leblanc@louisiana.edu","ph":"(337) 482-6280","li":"https://www.linkedin.com/in/lisa-m-leblanc-med-ches-0b011124/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BGI6p1CiJQoKbA1ieJyz7lQ%3D%3D"},{"fn":"Patricia","ln":"Cottonham","t":"Vice President for Student Affairs","o":"","r":"Decision Maker","pt":"Student Affairs Leadership","e":"patcottonham@louisiana.edu","ph":"","li":"https://www.linkedin.com/in/patricia-frilot-cottonham-893bb918/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BqlRVNwkgRmC1YnwdPuj1UQ%3D%3D"},{"fn":"Hailey","ln":"Fontenot","t":"Administrative Assistant 3","o":"Department of Counseling","r":"Influencer","pt":"Counseling Center Leadership","e":"hfontenot@louisiana.edu","ph":"(337) 482-1963","li":"https://www.linkedin.com/in/hailey-fontenot-340bb320b/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BYome%2B%2FWDSCOE763WcGVoJA%3D%3D"}]},{"n":"University of Louisiana at Monroe","s":"LA","w":"www.ulm.edu/","u":159993,"p":9594},{"n":"University of Louisville","s":"KY","w":"www.louisville.edu/","u":157289,"p":26325},{"n":"University of Maine","s":"ME","w":"www.umaine.edu/","u":161253,"p":13960},{"n":"University of Maine at Augusta","s":"ME","w":"www.uma.edu/","u":161217,"p":5761},{"n":"University of Mary","s":"ND","w":"https://www.umary.edu/","u":200217,"p":4626},{"n":"University of Mary Washington","s":"VA","w":"https://www.umw.edu/","u":232681,"p":4307},{"n":"University of Maryland Global Campus","s":"MD","w":"www.umgc.edu/","u":163204,"p":94890,"c":[{"fn":"Blakely","ln":"Pomietto","t":"enior Vice-President & Chief Academic Officer","o":"Academic Affairs","r":"Decision Maker","pt":"Student Affairs Leadership","e":"blakely.pomietto@umgc.edu","ph":"(301) 985-7174","li":"https://www.linkedin.com/in/blakely-r-pomietto-edd-0991777?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3Bk5%2BnzwwASFKloKGUL1dtDg%3D%3D"},{"fn":"Martina","ln":"Hansen","t":"Senior Vice-President & Chief Student Affairs Officer","o":"Student Affairs","r":"Decision Maker","pt":"Student Affairs Leadership","e":"Martina.Hansen@umgc.edu","ph":"(301) 985-7077","li":"https://www.linkedin.com/in/martina-hansen-6236266?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BPbdWssIoRKyIR53hsVEXDw%3D%3D"}]},{"n":"University of Maryland  Baltimore","s":"MD","w":"www.umaryland.edu/","u":163259,"p":7440},{"n":"University of Maryland-Baltimore County","s":"MD","w":"umbc.edu/","u":163268,"p":15771},{"n":"University of Maryland-College Park","s":"MD","w":"www.umd.edu/","u":163286,"p":44110},{"n":"University of Massachusetts Global","s":"CA","w":"https://www.umassglobal.edu/","u":262086,"p":14135},{"n":"University of Massachusetts-Amherst","s":"MA","w":"www.umass.edu/","u":166629,"p":36745},{"n":"University of Massachusetts-Boston","s":"MA","w":"www.umb.edu/","u":166638,"p":17933},{"n":"University of Massachusetts-Dartmouth","s":"MA","w":"www.umassd.edu/","u":167987,"p":9128},{"n":"University of Massachusetts-Lowell","s":"MA","w":"www.uml.edu/","u":166513,"p":20418},{"n":"University of Memphis","s":"TN","w":"https://www.memphis.edu/","u":220862,"p":25221},{"n":"University of Miami","s":"FL","w":"www.miami.edu/","u":135726,"p":22399},{"n":"University of Michigan-Ann Arbor","s":"MI","w":"https://umich.edu/","u":170976,"p":54262},{"n":"University of Michigan-Dearborn","s":"MI","w":"https://umdearborn.edu/","u":171137,"p":9221},{"n":"University of Michigan-Flint","s":"MI","w":"www.umflint.edu/","u":171146,"p":7507},{"n":"University of Minnesota-Duluth","s":"MN","w":"https://d.umn.edu/","u":174233,"p":10069},{"n":"University of Minnesota-Twin Cities","s":"MN","w":"https://twin-cities.umn.edu/","u":174066,"p":59339,"c":[{"fn":"Katie","ln":"Schuver","t":"Lecturer, Physical Activity & Health Promotion","o":"School of Kinesiology","r":"Champion","pt":"Health Promotion / Wellness","e":"schuv007@umn.edu","ph":"","li":""},{"fn":"Darin","ln":"Erickson","t":"Professor, Division of Epidemiology & Community Health","o":"School of Public Health","r":"Champion","pt":"Other","e":"erick232@umn.edu","ph":"612-626-0516","li":"https://www.linkedin.com/in/darin-erickson-b40639173/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BiyqWZ2XPQ%2FSC%2BMxvrta%2BJg%3D%3D"},{"fn":"Ben","ln":"kohler","t":"Director, Fitness and Wellness","o":"Recreation and Wellness","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"kubik028@umn.edu","ph":"tel:6126262567","li":"https://www.linkedin.com/in/ben-kohler-aa586bb4/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BInBycQGqRmelaOjTNjD%2B%2FQ%3D%3D"},{"fn":"Nate","ln":"Kubik","t":"Wellness Manager","o":"Recreation and Wellness","r":"Influencer","pt":"Health Promotion / Wellness","e":"kubik028@umn.edu","ph":"tel:6126262567","li":"https://www.linkedin.com/in/nate-kubik-56a66b259/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BQk6sAzs%2FQa2aVNV8USfcPQ%3D%3D"},{"fn":"Jodi","ln":"Ramberg","t":"Director","o":"Counseling Services","r":"Decision Maker","pt":"AOD Prevention / Recovery","e":"rambe010@umn.edu","ph":"(218) 281-8571","li":"https://www.linkedin.com/in/jodi-ramberg/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B25hXnbrORoatMoAHH410oA%3D%3D"}]},{"n":"University of Mississippi","s":"MS","w":"www.olemiss.edu/","u":176017,"p":26841},{"n":"University of Missouri-Columbia","s":"MO","w":"https://missouri.edu/","u":178396,"p":33430},{"n":"University of Missouri-Kansas City","s":"MO","w":"https://www.umkc.edu/","u":178402,"p":17378},{"n":"University of Missouri-St Louis","s":"MO","w":"https://www.umsl.edu/","u":178420,"p":17495},{"n":"University of Mount Saint Vincent","s":"NY","w":"www.mountsaintvincent.edu/","u":193399,"p":5169},{"n":"University of Nebraska at Kearney","s":"NE","w":"www.unk.edu/","u":181215,"p":7218},{"n":"University of Nebraska at Omaha","s":"NE","w":"https://www.unomaha.edu/","u":181394,"p":17737},{"n":"University of Nebraska Medical Center","s":"NE","w":"www.unmc.edu/","u":181428,"p":4194},{"n":"University of Nebraska-Lincoln","s":"NE","w":"www.unl.edu/","u":181464,"p":25883},{"n":"University of Nevada-Las Vegas","s":"NV","w":"www.unlv.edu/","u":182281,"p":35921},{"n":"University of Nevada-Reno","s":"NV","w":"www.unr.edu/","u":182290,"p":26890},{"n":"University of New England","s":"ME","w":"https://www.une.edu/","u":161457,"p":11153},{"n":"University of New Hampshire-Main Campus","s":"NH","w":"https://www.unh.edu/","u":183044,"p":14676},{"n":"University of New Haven","s":"CT","w":"www.newhaven.edu/","u":129941,"p":11686},{"n":"University of New Mexico-Main Campus","s":"NM","w":"www.unm.edu/","u":187985,"p":24675},{"n":"University of New Orleans","s":"LA","w":"new.uno.edu/","u":159939,"p":8114},{"n":"University of North Alabama","s":"AL","w":"https://www.una.edu/","u":101879,"p":12537},{"n":"University of North Carolina at Chapel Hill","s":"NC","w":"https://www.unc.edu/","u":199120,"p":34640,"c":[{"fn":"Alice","ln":"Ammerman","t":"Director","o":"Center for Health Promotion and Disease Prevention","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"alice_ammerman@unc.edu","ph":"(919) 966-6082","li":"https://www.linkedin.com/in/alice-s-ammerman-b8060a10/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BoMdWVKQ8T4mU0WhKfrGihg%3D%3D"},{"fn":"Aparna","ln":"Anantharaman","t":"Data Manager","o":"Center for Health Promotion and Disease Prevention","r":"Influencer","pt":"Health Promotion / Wellness","e":"aaparna@unc.edu","ph":"","li":""},{"fn":"Kendra","ln":"Batten","t":"Health Counselor","o":"FAM WEL Being Study","r":"Influencer","pt":"Counseling Center Leadership","e":"kbatt@unc.edu","ph":"","li":""},{"fn":"Shakiera","ln":"Branch","t":"Health Behavior Intervention Counselor","o":"Community Health and Wellness Resource Team","r":"Influencer","pt":"Other","e":"shakiera@unc.edu","ph":"","li":"https://www.linkedin.com/in/shakiera-branch-608b8214a/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BTf9qmm3vSHOFCdfbS0%2BRrA%3D%3D"},{"fn":"Dean","ln":"Blackburn","t":"Director","o":"Student Wellness","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"blackburn@unc.edu","ph":"","li":"https://www.linkedin.com/in/dean-blackburn-545b425/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BVqR9SoJdTFuiDG4sA6%2BRMg%3D%3D"},{"fn":"Danny","ln":"DePuy","t":"Lead Substance Use Counselor","o":"Student Wellness","r":"Influencer","pt":"Counseling Center Leadership","e":"danny_depuy@unc.edu","ph":"","li":"https://www.linkedin.com/in/danny-depuy-1b582540/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B1gdCUq74R%2BmWep4be06UkA%3D%3D"},{"fn":"Hayden","ln":"Graham","t":"Recovery Programs Coordinator","o":"Student Wellness","r":"Champion","pt":"AOD Prevention / Recovery","e":"Hayden.Graham@unc.edu","ph":"","li":""},{"fn":"Yavin","ln":"Bizzarrety","t":"Health Promotion Coordinator","o":"Student Wellness","r":"Champion","pt":"Health Promotion / Wellness","e":"Yavin_Bizarretty@med.unc.edu","ph":"","li":"https://www.linkedin.com/in/yavinbizarretty/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BNq9TNFjxRmqUfKuz%2BgVArg%3D%3D"}]},{"n":"University of North Carolina at Charlotte","s":"NC","w":"https://www.charlotte.edu/","u":199139,"p":34158,"c":[{"fn":"Sophia","ln":"Marshall","t":"Director","o":"Center for Wellness Promotion","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"sophia.marshall@uncc.edu","ph":"704-687-7414","li":"https://www.linkedin.com/in/sophia-marshall-6b525a7/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B6G1wXkZKQ6KbBVyjKdEelQ%3D%3D"},{"fn":"Jazmyne","ln":"Cropp","t":"Assistant Director for Recovery Support","o":"Center for Wellness Promotion","r":"Decision Maker","pt":"AOD Prevention / Recovery","e":"jjone378@charlotte.edu","ph":"7046870175","li":"https://www.linkedin.com/in/jazmynedjones/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3Bwp8px0vnSrCofGiXQdh2vQ%3D%3D"},{"fn":"Staisha","ln":"Hamilton","t":"Associate Director for Collegiate Recovery","o":"Center for Wellness Promotion","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"shamil44@charlotte.edu","ph":"","li":"https://www.linkedin.com/in/dr-staisha-hamilton-26b132280/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BJT%2FY7jKdRIuyi69eNKOnuA%3D%3D"},{"fn":"Carmen","ln":"Barham","t":"Administrative Support Associate","o":"Division of Student Affairs - Student Assistance and Support Services","r":"Influencer","pt":"Student Affairs Leadership","e":"cballa17@charlotte.edu","ph":"","li":""}]},{"n":"University of North Carolina at Greensboro","s":"NC","w":"www.uncg.edu/","u":199148,"p":19903},{"n":"University of North Carolina at Pembroke","s":"NC","w":"https://www.uncp.edu/","u":199281,"p":9501},{"n":"University of North Carolina Wilmington","s":"NC","w":"www.uncw.edu/","u":199218,"p":20709,"c":[{"fn":"Amy","ln":"Olsen","t":"Lecturer/Coordinator for Physical Activity and Wellness Program","o":"School of Health and Applied Human Sciences","r":"Champion","pt":"Health Promotion / Wellness","e":"olsenad@uncw.edu","ph":"tel:910.962.2181","li":""},{"fn":"Ron","ln":"Galloway","t":"Staff Counselor","o":"Counseling Center","r":"Influencer","pt":"Counseling Center Leadership","e":"GallowayR@uncw.edu","ph":"","li":"https://www.linkedin.com/in/ron-galloway-11b6617/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BCq0HCmBxS8OiOsacxyLLdw%3D%3D"},{"fn":"Christine","ln":"Davis","t":"Vice Chancellor for Student Affairs","o":"Student Affairs","r":"Decision Maker","pt":"Student Affairs Leadership","e":"daviscra@uncw.edu","ph":"tel:910.962.3117","li":"https://www.linkedin.com/in/creeddavis/overlay/contact-info/"},{"fn":"Elisabeth","ln":"Baynard","t":"Associate Professor of Practice","o":"Public Health","r":"Champion","pt":"Health Promotion / Wellness","e":"baynarde@uncw.edu","ph":"tel:910.962.7704","li":"https://www.linkedin.com/in/elisabeth-baynard-ms-20a30999/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3Bu0%2BGDshaQLeiXcZYUwvaEQ%3D%3D"}]},{"n":"University of North Dakota","s":"ND","w":"https://und.edu/","u":200280,"p":18449},{"n":"University of North Florida","s":"FL","w":"https://www.unf.edu/","u":136172,"p":19675},{"n":"University of North Georgia","s":"GA","w":"www.ung.edu/","u":482680,"p":21448},{"n":"University of North Texas","s":"TX","w":"www.unt.edu/","u":227216,"p":52668},{"n":"University of North Texas at Dallas","s":"TX","w":"untdallas.edu/","u":484905,"p":4449},{"n":"University of Northern Colorado","s":"CO","w":"https://www.unco.edu/","u":127741,"p":10404},{"n":"University of Northern Iowa","s":"IA","w":"https://www.uni.edu/","u":154095,"p":10303},{"n":"University of Notre Dame","s":"IN","w":"www.nd.edu/","u":152080,"p":13675},{"n":"University of Oklahoma-Norman Campus","s":"OK","w":"https://www.ou.edu/","u":207500,"p":32954},{"n":"University of Oregon","s":"OR","w":"https://www.uoregon.edu/","u":209551,"p":25432},{"n":"University of Pennsylvania","s":"PA","w":"www.upenn.edu/","u":215062,"p":32816},{"n":"University of Pittsburgh-Pittsburgh Campus","s":"PA","w":"www.pitt.edu/","u":215293,"p":36696},{"n":"University of Puerto Rico-Mayaguez","s":"PR","w":"https://www.uprm.edu/","u":243197,"p":11239},{"n":"University of Puerto Rico-Rio Piedras","s":"PR","w":"https://www.uprrp.edu/","u":243221,"p":15593},{"n":"University of Rhode Island","s":"RI","w":"https://web.uri.edu/","u":217484,"p":20938},{"n":"University of Richmond","s":"VA","w":"https://www.richmond.edu/","u":233374,"p":4451},{"n":"University of Rochester","s":"NY","w":"https://www.rochester.edu/","u":195030,"p":14407},{"n":"University of San Diego","s":"CA","w":"www.sandiego.edu/","u":122436,"p":10282},{"n":"University of San Francisco","s":"CA","w":"https://www.usfca.edu/","u":122612,"p":10564},{"n":"University of Scranton","s":"PA","w":"www.scranton.edu/","u":215929,"p":5253},{"n":"University of South Alabama","s":"AL","w":"www.southalabama.edu/","u":102094,"p":15943},{"n":"University of South Carolina Aiken","s":"SC","w":"https://www.usca.edu/","u":218645,"p":4746},{"n":"University of South Carolina-Columbia","s":"SC","w":"www.sc.edu/","u":218663,"p":39611},{"n":"University of South Carolina-Upstate","s":"SC","w":"www.uscupstate.edu/","u":218742,"p":5855},{"n":"University of South Dakota","s":"SD","w":"https://www.usd.edu/","u":219471,"p":12921},{"n":"University of South Florida","s":"FL","w":"www.usf.edu/","u":137351,"p":56611,"c":[{"fn":"Jennifer","ln":"Bleck","t":"Assessment and Evaluation Specialist, Health & Wellness, Office of Student Success","o":"College of Public Health","r":"Influencer","pt":"Health Promotion / Wellness","e":"jbleck@usf.edu","ph":"(813) 974-8498","li":"https://www.linkedin.com/in/jennifer-bleck/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BDeIzITXESB2ILkz%2FUgDPsQ%3D%3D"},{"fn":"Somer","ln":"Burke","t":"Director","o":"Office of Student Success and Well-being","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"sgoad@usf.edu","ph":"(813) 974-6606","li":"https://www.linkedin.com/in/somerburke/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BrBsFzKWhT%2Fmpa%2FnS5%2Fty%2Fg%3D%3D"},{"fn":"Courtney","ln":"Safko","t":"Coordinator, Health Promotion Services","o":"Wellness Center","r":"Champion","pt":"Health Promotion / Wellness","e":"","ph":"","li":"https://www.linkedin.com/in/courtneysafko/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BYy6KOB87Sc6YWIZ62%2FnpHg%3D%3D"},{"fn":"Al","ln":"Gentilini","t":"Director","o":"Recreation & Wellness - A Department of Student Success","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"agentili@usf.edu","ph":"","li":"https://www.linkedin.com/in/al-gentilini-18320142/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B5lyFTMylTga%2FdUBmL7hCvA%3D%3D"},{"fn":"Vicky","ln":"Buckles","t":"Associate Professor of Instruction/Addictions & Substance Abuse Counseling Graduate Certificate Program Director","o":"College of Behavioral & Community Sciences","r":"Champion","pt":"Other","e":"vbuckles@usf.edu","ph":"813-974-2855","li":"https://www.linkedin.com/in/vicky-buckles-b917331ab/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BgsxbGQuUTzaSoSvuSVmyMA%3D%3D"},{"fn":"Tatiana","ln":"Acosta","t":"Program Specialist","o":"College of Behavioral & Community Sciences","r":"Influencer","pt":"Other","e":"tacosta@usf.edu","ph":"","li":""},{"fn":"Amanda","ln":"DePippo","t":"Associate Professor of Instruction in the Rehabilitation and Mental Health Counseling Program","o":"College of Behavioral & Community Sciences","r":"Champion","pt":"Other","e":"adepippo@usf.edu","ph":"","li":"https://www.linkedin.com/in/amanda-depippo-b453557b/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B4Khe3Ua7Saa03r2%2F2LK8ug%3D%3D"},{"fn":"Cynthia","ln":"Deluca","t":"Vice President","o":"Student Success","r":"Decision Maker","pt":"Student Affairs Leadership","e":"deluca@usf.edu","ph":"813-974-3077","li":""},{"fn":"Joseph","ln":"Puccio","t":"Medical Director of Student Health and Wellness Center","o":"Health & Wellness","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"jpuccio@usf.edu","ph":"8139742331","li":""}]},{"n":"University of Southern California","s":"CA","w":"www.usc.edu/","u":123961,"p":51953},{"n":"University of Southern Indiana","s":"IN","w":"www.usi.edu/","u":151306,"p":11111},{"n":"University of Southern Maine","s":"ME","w":"usm.maine.edu/","u":161554,"p":9676},{"n":"University of Southern Mississippi","s":"MS","w":"https://www.usm.edu/","u":176372,"p":15411},{"n":"University of St Francis","s":"IL","w":"https://www.stfrancis.edu/","u":148584,"p":5174},{"n":"University of St Thomas","s":"MN","w":"www.stthomas.edu/","u":174914,"p":4469},{"n":"University of St Thomas","s":"TX","w":"https://www.stthom.edu/","u":227863,"p":4469},{"n":"University of the Cumberlands","s":"KY","w":"www.ucumberlands.edu/","u":156541,"p":26738},{"n":"University of the District of Columbia","s":"DC","w":"www.udc.edu/","u":131399,"p":5134},{"n":"University of the Incarnate Word","s":"TX","w":"www.uiw.edu/","u":225627,"p":8798},{"n":"University of the Pacific","s":"CA","w":"https://www.pacific.edu/","u":120883,"p":7407},{"n":"University of Toledo","s":"OH","w":"www.utoledo.edu/","u":206084,"p":17497},{"n":"University of Utah","s":"UT","w":"www.utah.edu/","u":230764,"p":41068},{"n":"University of Vermont","s":"VT","w":"www.uvm.edu/","u":231174,"p":16086},{"n":"University of Virginia-Main Campus","s":"VA","w":"https://www.virginia.edu/","u":234076,"p":29758},{"n":"University of Washington-Bothell Campus","s":"WA","w":"https://www.uwb.edu/","u":377555,"p":6884},{"n":"University of Washington-Seattle Campus","s":"WA","w":"https://www.washington.edu/","u":236948,"p":60215,"c":[{"fn":"Peggy","ln":"Hannon","t":"Director","o":"Health Promotion Research Center","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"peggyh@uw.edu","ph":"206-616-7859","li":"https://www.linkedin.com/in/peggy-hannon-65b849b2/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BSFl%2BkBRDTNudOK6R0%2FOZDg%3D%3D"},{"fn":"Clarence","ln":"Spigner","t":"Professor and Faculty Lead for HSPop tuition-based Undergrad elective courses and Director of the Master of Public Health program","o":"Health Systems and Population Health","r":"Champion","pt":"Health Promotion / Wellness","e":"cspigner@uw.edu","ph":"206-616-2948","li":"https://www.linkedin.com/in/clarence-spigner-14338710?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BskKR9jgKSh%2BJWJe1k7UUUg%3D%3D"},{"fn":"Julia","ln":"Dilley","t":"Affiliate Instructor","o":"Health Systems and Population Health","r":"Champion","pt":"AOD Prevention / Recovery","e":"julia.dilley@multco.us","ph":"360-402-7877","li":""},{"fn":"Teresa","ln":"Winstead","t":"Affiliate Associate Professor","o":"Health Systems and Population Health","r":"Champion","pt":"Other","e":"twinstea@uw.edu","ph":"","li":"https://www.linkedin.com/in/teresa-winstead-835a3a158/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BVxsSD2vSR9uCZxiGeB6XwQ%3D%3D"},{"fn":"Tomomi","ln":"Ito","t":"Case Manager, Mental Health Therapist","o":"Well-being Counseling Center","r":"Influencer","pt":"Counseling Center Leadership","e":"","ph":"tel:+14259709711","li":""}]},{"n":"University of Washington-Tacoma Campus","s":"WA","w":"https://www.tacoma.uw.edu/","u":377564,"p":5651},{"n":"University of West Alabama","s":"AL","w":"www.uwa.edu/","u":101587,"p":9464},{"n":"University of West Florida","s":"FL","w":"uwf.edu/","u":138354,"p":18411},{"n":"University of West Georgia","s":"GA","w":"www.westga.edu/","u":141334,"p":15862},{"n":"University of Wisconsin-Eau Claire","s":"WI","w":"www.uwec.edu/","u":240268,"p":10928},{"n":"University of Wisconsin-Green Bay","s":"WI","w":"www.uwgb.edu/","u":240277,"p":12903},{"n":"University of Wisconsin-La Crosse","s":"WI","w":"www.uwlax.edu/","u":240329,"p":11038},{"n":"University of Wisconsin-Madison","s":"WI","w":"www.wisc.edu/","u":240444,"p":53774,"c":[{"fn":"Zoe","ln":"Hurley","t":"Health Promotion and Health Equity Advisor","o":"School of Education-Health Promotion and Health Equity, BS","r":"Champion","pt":"Health Promotion / Wellness","e":"zehurley@wisc.edu","ph":"608-262-0257","li":"https://www.linkedin.com/in/zoe-hurley-m-s-14a52a7b/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BYWFCo10wQRuJIGahXIWlNw%3D%3D"},{"fn":"Tiffany","ln":"Lomax","t":"Director of Wellbeing & Programs","o":"University Recreation and Wellbeing","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"tlomax@wisc.edu","ph":"(608) 263 - 9214","li":"https://www.linkedin.com/in/tiffany-lomax-ed-d-42b30b66/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Aprofile_common_profile_index%3B3d224688-754c-4a09-90f1-c0040b2b3fee"},{"fn":"Leah","ln":"Bastian","t":"Wellbeing Coordinator","o":"University Recreation and Wellbeing","r":"Champion","pt":"Health Promotion / Wellness","e":"lbbastian@wisc.edu","ph":"","li":"https://www.linkedin.com/in/leah-bastian-lmft-83794248/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3B3oPv5B%2BESTy6fZtToIaesw%3D%3D"},{"fn":"Kelsey","ln":"Tuthill","t":"Wellbeing Coordinator","o":"University Recreation and Wellbeing","r":"Champion","pt":"Health Promotion / Wellness","e":"ktuthill@wisc.edu","ph":"","li":"https://www.linkedin.com/in/kelsey-tuthill-31b9bb183/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BoY16ALCATcG2Edev6AjczA%3D%3D"},{"fn":"Jenna","ln":"Retzlaff","t":"Alcohol & Other Drug Misuse Prevention Specialist","o":"University Health Services","r":"Influencer","pt":"AOD Prevention / Recovery","e":"jenna.retzlaff@wisc.edu","ph":"","li":""}]},{"n":"University of Wisconsin-Milwaukee","s":"WI","w":"uwm.edu/","u":240453,"p":26166},{"n":"University of Wisconsin-Oshkosh","s":"WI","w":"https://www.uwosh.edu/","u":240365,"p":16064},{"n":"University of Wisconsin-Parkside","s":"WI","w":"https://www.uwp.edu/","u":240374,"p":4925},{"n":"University of Wisconsin-Platteville","s":"WI","w":"https://www.uwplatt.edu/","u":240462,"p":7393},{"n":"University of Wisconsin-River Falls","s":"WI","w":"https://www.uwrf.edu/","u":240471,"p":5682},{"n":"University of Wisconsin-Stevens Point","s":"WI","w":"https://www.uwsp.edu/","u":240480,"p":9050},{"n":"University of Wisconsin-Stout","s":"WI","w":"www.uwstout.edu/","u":240417,"p":7818},{"n":"University of Wisconsin-Whitewater","s":"WI","w":"www.uww.edu/","u":240189,"p":13427},{"n":"University of Wyoming","s":"WY","w":"https://www.uwyo.edu/","u":240727,"p":12323},{"n":"Upper Iowa University","s":"IA","w":"https://www.uiu.edu/","u":154493,"p":5559},{"n":"Utah State University","s":"UT","w":"https://www.usu.edu/","u":230728,"p":33665},{"n":"Utah Tech University","s":"UT","w":"utahtech.edu/","u":230171,"p":15410},{"n":"Utah Valley University","s":"UT","w":"www.uvu.edu/","u":230737,"p":55735},{"n":"Utica University","s":"NY","w":"https://www.utica.edu/","u":197045,"p":4702},{"n":"Valdosta State University","s":"GA","w":"www.valdosta.edu/","u":141264,"p":12343},{"n":"Valencia College","s":"FL","w":"valenciacollege.edu/","u":138187,"p":63109,"c":[{"fn":"Deborah","ln":"Hardy","t":"Dean of Allied Health","o":"School of Health Sciences","r":"Decision Maker","pt":"Health Promotion / Wellness","e":"v_dhardy@valenciacollege.edu","ph":"","li":""},{"fn":"Andrea","ln":"Bealler","t":"Counselor","o":"Counseling Faculty - East Campus","r":"Influencer","pt":"Other","e":"abealler@valenciacollege.edu","ph":"","li":"https://www.linkedin.com/in/andreaalfanobealler/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BYAe4HZ%2FlQ3ayY8Hjd7DhLQ%3D%3D"},{"fn":"Fontella","ln":"Jones","t":"Counselor, College Educator","o":"Counseling Faculty - Downtown Campus","r":"Champion","pt":"Health Promotion / Wellness","e":"fjones01@valenciacollege.edu","ph":"","li":"https://www.linkedin.com/in/fontella-jones-ma-559ba229/overlay/contact-info/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BWdEBn8TtQi68j1%2BgJ6N3vw%3D%3D"}]},{"n":"Vanderbilt University","s":"TN","w":"www.vanderbilt.edu/","u":221999,"p":14360},{"n":"Vermont State University","s":"VT","w":"vermontstate.edu/","u":231165,"p":7131},{"n":"Villanova University","s":"PA","w":"www.villanova.edu/","u":216597,"p":11176},{"n":"Vincennes University","s":"IN","w":"https://www.vinu.edu/","u":152637,"p":21226},{"n":"Virginia Commonwealth University","s":"VA","w":"https://www.vcu.edu/","u":234030,"p":30974},{"n":"Virginia Polytechnic Institute and State University","s":"VA","w":"www.vt.edu/","u":233921,"p":40548},{"n":"Virginia State University","s":"VA","w":"www.vsu.edu/","u":234155,"p":6003},{"n":"Wake Forest University","s":"NC","w":"www.wfu.edu/","u":199847,"p":9843},{"n":"Walla Walla Community College","s":"WA","w":"https://www.wwcc.edu/","u":236887,"p":4328},{"n":"Washburn University","s":"KS","w":"www.washburn.edu/","u":156082,"p":6517},{"n":"Washington State University","s":"WA","w":"https://wsu.edu/","u":236939,"p":29708,"c":[{"fn":"Maggie","ln":"Ruiz","t":"Student Wellness Center Coordinator","o":"Counseling, Health, and Access","r":"Champion","pt":"Health Promotion / Wellness","e":"magdelena.ruiz@wsu.edu","ph":"(360) 546-9238","li":""}]},{"n":"Washington University in St Louis","s":"MO","w":"https://washu.edu/","u":179867,"p":18015},{"n":"Wayne State College","s":"NE","w":"https://www.wsc.edu/","u":181783,"p":5949},{"n":"Wayne State University","s":"MI","w":"https://wayne.edu/","u":172644,"p":28051},{"n":"Weatherford College","s":"TX","w":"https://www.wc.edu/","u":229799,"p":7218},{"n":"Weber State University","s":"UT","w":"https://www.weber.edu/","u":230782,"p":38054},{"n":"Webster University","s":"MO","w":"www.webster.edu/","u":179894,"p":10103},{"n":"Wentworth Institute of Technology","s":"MA","w":"https://wit.edu/","u":168227,"p":4674},{"n":"Wesleyan University","s":"CT","w":"https://www.wesleyan.edu/","u":130697,"p":4158},{"n":"West Chester University of Pennsylvania","s":"PA","w":"https://www.wcupa.edu/","u":216764,"p":18762},{"n":"West Los Angeles College","s":"CA","w":"www.wlac.edu/","u":125471,"p":19187},{"n":"West Texas A & M University","s":"TX","w":"https://www.wtamu.edu/","u":229814,"p":10529},{"n":"West Virginia State University","s":"WV","w":"www.wvstateu.edu/","u":237899,"p":4312},{"n":"West Virginia University","s":"WV","w":"www.wvu.edu/","u":238032,"p":27150},{"n":"Western Carolina University","s":"NC","w":"www.wcu.edu/","u":200004,"p":13206},{"n":"Western Colorado University","s":"CO","w":"www.western.edu/","u":128391,"p":5959},{"n":"Western Connecticut State University","s":"CT","w":"https://www.wcsu.edu/","u":130776,"p":4819},{"n":"Western Governors University","s":"UT","w":"www.wgu.edu/","u":433387,"p":282150,"c":[{"fn":"Anmy","ln":"Mayfield","t":"Vice President and Dean","o":"College of Nursing","r":"Decision Maker","pt":"Student Affairs Leadership","e":"anmy.mayfield@wgu.edu","ph":"801-302-1576","li":"https://www.linkedin.com/in/anmy-mayfield-0236898b?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3BY83jortJRg%2Bq2uRMRXZoqw%3D%3D"},{"fn":"Christopher","ln":"Helmer","t":"Student Support Coordinator","o":"Academic Operations","r":"Champion","pt":"Other","e":"christopher.helmer@wgu.edu","ph":"","li":"https://www.linkedin.com/in/christopher-helmer-b61952196/overlay/about-this-profile/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BpCSlA%2BLXQn%2BzKR5KOfY%2BPQ%3D%3D"},{"fn":"Kristin","ln":"Mulica","t":"Graduation Specialist and Senior Program Mentor","o":"College of Health Professions","r":"Champion","pt":"Other","e":"kristin.mulica@wgu.edu","ph":"","li":"https://www.linkedin.com/in/kristin-mulica-msn-bsn-rn-2b6a52188/overlay/about-this-profile/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base%3BJsFFwaHqSsmOivQBSuFnQg%3D%3D"}]},{"n":"Western Illinois University","s":"IL","w":"www.wiu.edu/","u":149772,"p":8213},{"n":"Western Kentucky University","s":"KY","w":"https://www.wku.edu/","u":157951,"p":19978},{"n":"Western Michigan University","s":"MI","w":"https://wmich.edu/","u":172699,"p":18447},{"n":"Western Nevada College","s":"NV","w":"www.wnc.edu/","u":182564,"p":5583},{"n":"Western New Mexico University","s":"NM","w":"wnmu.edu/","u":188304,"p":4545},{"n":"Western Oregon University","s":"OR","w":"https://wou.edu/","u":210429,"p":7237},{"n":"Western Washington University","s":"WA","w":"wwu.edu/","u":237011,"p":16137},{"n":"Westfield State University","s":"MA","w":"www.westfield.ma.edu/","u":168263,"p":5529},{"n":"Whatcom Community College","s":"WA","w":"whatcom.edu/","u":237039,"p":4949},{"n":"Wichita State University","s":"KS","w":"www.wichita.edu/","u":156125,"p":19283},{"n":"Widener University","s":"PA","w":"https://www.widener.edu/","u":216852,"p":6270},{"n":"Wilkes University","s":"PA","w":"https://www.wilkes.edu/","u":216931,"p":7059},{"n":"William & Mary","s":"VA","w":"https://www.wm.edu/","u":231624,"p":10868},{"n":"William Carey University","s":"MS","w":"https://www.wmcarey.edu/","u":176479,"p":7130},{"n":"William Paterson University of New Jersey","s":"NJ","w":"www.wpunj.edu/","u":187444,"p":11608},{"n":"Wilmington University","s":"DE","w":"www.wilmu.edu/","u":131113,"p":19559},{"n":"Winona State University","s":"MN","w":"www.winona.edu/","u":175272,"p":6901},{"n":"Winston-Salem State University","s":"NC","w":"https://www.wssu.edu/","u":199999,"p":5324},{"n":"Winthrop University","s":"SC","w":"www.winthrop.edu/","u":218964,"p":5393},{"n":"Worcester Polytechnic Institute","s":"MA","w":"https://www.wpi.edu/","u":168421,"p":8009},{"n":"Worcester State University","s":"MA","w":"https://www.worcester.edu/","u":168430,"p":7785},{"n":"Wright State University-Main Campus","s":"OH","w":"https://www.wright.edu/","u":206604,"p":11442},{"n":"Xavier University","s":"OH","w":"https://www.xavier.edu/","u":206622,"p":6731},{"n":"Yakima Valley College","s":"WA","w":"https://www.yvcc.edu/","u":237109,"p":5189},{"n":"Yale University","s":"CT","w":"https://www.yale.edu/","u":130794,"p":16784},{"n":"Yavapai College","s":"AZ","w":"https://www.yc.edu/","u":106148,"p":9665},{"n":"Yeshiva University","s":"NY","w":"www.yu.edu/","u":197708,"p":7568},{"n":"York College of Pennsylvania","s":"PA","w":"https://www.ycp.edu/","u":217059,"p":4216},{"n":"Youngstown State University","s":"OH","w":"https://ysu.edu/","u":206695,"p":13195}]

// ─── COALITION MINI-GRANT CONTACTS (from Coalition CRM xlsx) ───
// Fields: coal=coalition, n=name, t=title, e=email, ph=phone, rl=role, mga=miniGrantAuthority, pa=pitchAngle, os=outreachStatus, nt=notes
const MASTER_COALITION_CONTACTS = [{"coal":"Missouri Partners in Prevention (PIP)","n":"Joan Masters","t":"Senior Project Director","e":"mastersj@missouri.edu","ph":"(573) 884-7551","rl":"Primary Decision Maker — PI on all grants, oversees all 24-26 member campuses. Confirmed she can direct PIP mini-grant funding to member campuses.","mga":"YES — Controls mini-grant allocation","pa":"Proof of concept — a Missouri campus already confirmed PIP could fund Clear30. Ask Joan to formalize and replicate that path for other PIP campuses.","os":"","nt":"17+ years with PIP. Knows every campus prevention coordinator in Missouri. Warm intro from a campus referral is ideal."},{"coal":"Missouri Partners in Prevention (PIP)","n":"Margo Leitschuh","t":"Prevention & Implementation Team Lead","e":"leitschuhm@missouri.edu","ph":"(573) 884-7551 (main)","rl":"Leads prevention implementation across campuses — substance misuse, suicide prevention, bystander intervention.","mga":"Indirect — can champion Clear30 with campus coordinators","pa":"Clear30 aligns with her substance misuse prevention mandate. Pitch it as a campus resource she can recommend through her campus visits and trainings.","os":"","nt":"With PIP since 2017. Most likely to influence day-to-day campus programming decisions."},{"coal":"Missouri Partners in Prevention (PIP)","n":"Kayleigh Greenwood","t":"Lead Research Coordinator","e":"kgreenwood@missouri.edu","ph":"(573) 884-7551 (main)","rl":"Manages MACHB survey data; conducts data-driven presentations to all 24 campuses annually.","mga":"Indirect — research lens. Can validate Clear30's 71% reduction outcome data.","pa":"She values data. Lead with Clear30's outcome stats (71% cannabis reduction). Ask if she'd include Clear30 as a campus resource recommendation in her annual site visit presentations.","os":"","nt":"MPH from Columbia (2021). Has direct annual touchpoint with every campus in the PIP coalition."},{"coal":"Missouri Partners in Prevention (PIP)","n":"Megan Mottola","t":"Research Coordinator","e":"mmottola@missouri.edu","ph":"(573) 884-7551 (main)","rl":"Research and evaluation support for campus programs; implements MACHB survey.","mga":"Indirect — validates program outcomes","pa":"Can be a research partner — offer to share anonymized user outcome data that aligns with PIP's evaluation metrics.","os":"","nt":"Works alongside Kayleigh. Secondary contact for research/data alignment conversations."},{"coal":"Nebraska Collegiate Prevention Alliance (NECPA)","n":"Megan Hopkins","t":"Project Director","e":"mhopkins2@unl.edu","ph":"(402) 853-4388","rl":"Primary Decision Maker — PI on all grants; directs OCC ($187K) and NECPA ($225K). Oversees all 26 member campuses.","mga":"YES — Controls grant allocation including OCC mini-grants","pa":"NECPA explicitly expanded scope to cannabis in 2021 and runs the 'Make it About You' cannabis campaign. Clear30 is a natural complement — an app that supports their data-driven harm reduction goals.","os":"","nt":"With NECPA since 2009. MSW from U of Michigan. Highly credentialed, data-driven. Lead with outcome stats and evidence base."},{"coal":"Nebraska Collegiate Prevention Alliance (NECPA)","n":"MeLissa Butler","t":"Senior Project Manager","e":"mbutler15@unl.edu","ph":"(402) 853-0742","rl":"Manages grant operations, technical assistance to campuses, grant compliance and sustainability.","mga":"Operational — manages grant execution and campus relationships","pa":"Pitch Clear30 as a turnkey digital resource that requires minimal campus staff time to deploy — aligns with her mandate to strengthen campus capacity.","os":"","nt":"In role since 2022. Manages OCC (Omaha Collegiate Consortium) grants specifically. Key contact for Omaha-area campus rollout."},{"coal":"Nebraska Collegiate Prevention Alliance (NECPA)","n":"NECPA Staff (general)","t":"Prevention Alliance Staff","e":"nepreventionalliance@nebraska.edu","ph":"(402) 853-4388","rl":"General coalition inbox — use for initial contact or if direct contact bounces.","mga":"Routing — routes to Megan Hopkins or MeLissa Butler","pa":"Same as Megan Hopkins pitch — start with cannabis harm reduction angle.","os":"","nt":"Third contact fallback. Also the address for Brief Motivational Interviewing training inquiries."},{"coal":"Ohio HECAOD / NCSC Hub","n":"Dr. Jim Lange","t":"Executive Director, HECAOD","e":"lange.221@osu.edu","ph":"(614) 292-5572","rl":"National Hub Director — runs NCSC (30+ state coalitions). HIGHEST PRIORITY contact in entire CRM.","mga":"YES — can provide warm intros to every state coalition in NCSC","pa":"Don't pitch a sale. Pitch a partnership. HECAOD is already expanding into gambling — Clear30 fits their mandate to add new harm-reduction digital tools. Request an intro to the NCSC network.","os":"","nt":"20+ years in field, 60+ publications. Former SDSU. Has co-chaired The Network AOD. A single email to Jim could unlock warm intros to 30+ state coalitions."},{"coal":"Ohio HECAOD / NCSC Hub","n":"Cindy Clouner","t":"Managing Director, HECAOD","e":"clouner.2@osu.edu","ph":"(614) 292-5572","rl":"Manages day-to-day operations and has deep relationships with NCSC state coalitions.","mga":"Operational — manages coalition partnerships and program delivery","pa":"Pitch Clear30 as a scalable digital tool that supplements what HECAOD already trains 1,000+ campuses to do. Ask about presentation opportunity at an NCSC gathering.","os":"","nt":"With HECAOD since 2015. Licensed social worker, Ohio CPS. Handles turnkey training delivery through NCSC (used for gambling program). Knows what campuses can and can't absorb."},{"coal":"Ohio HECAOD / NCSC Hub","n":"Logan Davis","t":"Outreach & Engagement Manager","e":"davis.5966@osu.edu","ph":"(614) 292-5572","rl":"Manages outreach and campus engagement for HECAOD programs.","mga":"Indirect — manages campus-level engagement","pa":"Clear30 as a tool to supplement their outreach campaigns. He can champion it at the campus level.","os":"","nt":"With HECAOD since Jan 2019. MA in Higher Education from LSU. Front-line relationship manager with campuses."},{"coal":"Illinois Higher Education Center (IHEC)","n":"Dr. Eric Davidson","t":"Director, IHEC","e":"esdavidson@eiu.edu","ph":"(217) 581-5000 (EIU main)","rl":"Founding Director — architect of the national NCSC framework. Leads all IHEC programming for Illinois campuses.","mga":"YES — Controls IHEC mini-grant and resource allocation","pa":"Davidson is nationally known for biennial review compliance expertise. Clear30 can help campuses satisfy their cannabis harm reduction documentation requirements. Pitch him as a national field builder.","os":"","nt":"PhD, MCHES. 'Nationally recognized for policy expertise.' Founding NCSC architect — warm intro from Jim Lange (HECAOD) is ideal. Can present at IHEC's annual conference."},{"coal":"Illinois Higher Education Center (IHEC)","n":"Annabelle Escamilla","t":"Assistant Director, IHEC","e":"ihec@eiu.edu","ph":"(217) 581-5000 (EIU main)","rl":"Manages trainings, webinars, IHEC affiliate meetings, and statewide conferences.","mga":"Indirect — conference/program scheduling; can add Clear30 to IHEC training curriculum","pa":"Request a slot in IHEC's Fundamentals in Substance Misuse training curriculum or annual affiliate meeting. She books all presenters.","os":"","nt":"Led 2023-2024 IHEC Orientation and Fundamentals trainings. Direct contact for conference speaker slots."},{"coal":"Illinois Higher Education Center (IHEC)","n":"IHEC Staff (general)","t":"Illinois Higher Education Center","e":"ihec@eiu.edu","ph":"(217) 581-5000","rl":"General inbox — used for all training material requests, listserv add, and resource inquiries.","mga":"Routing","pa":"Use as primary contact if direct emails don't get a response.","os":"","nt":"Listserv reaches all IHEC affiliates — ask to be featured in their monthly newsletter as a recommended campus resource."},{"coal":"Colorado CADE (NASPA-managed)","n":"Eva Esakoff","t":"Asst. Director, Statewide Coalition Evaluation & Data Projects","e":"CADE@naspa.org","ph":"(202) 265-7500","rl":"Current NASPA staff managing BOTH CADE (Colorado) and HCM (Montana). Primary day-to-day contact for both coalitions.","mga":"YES — manages CADE programmatic decisions and campus relationships","pa":"Lead with CADE's 'Time to Ungrind' stimulant campaign — show how Clear30's cannabis moderation approach parallels that harm reduction framework. Also pitch conference speaker slot at CADE Annual Fall Training.","os":"","nt":"Certified Prevention Specialist (2024). Also manages HCM Montana (same pitch works for both). Contact via CADE@naspa.org — the EVA email format is unknown but NASPA emails follow e[lastname]@naspa.org pattern: eesakoff@naspa.org (unverified)."},{"coal":"Colorado CADE (NASPA-managed)","n":"CADE Coalition (NASPA)","t":"NASPA Health, Safety & Well-Being Team","e":"CADE@naspa.org","ph":"(202) 265-7500","rl":"Official CADE coalition inbox managed by NASPA's health team.","mga":"Routing to Eva Esakoff or current NASPA team","pa":"Same as Eva Esakoff pitch.","os":"","nt":"Colorado cannabis has been legal since 2012. CADE published a Cannabis Prevention Toolkit (2018). Clear30 aligns naturally."},{"coal":"Colorado CADE (NASPA-managed)","n":"David Arnold","t":"Former NASPA AVP (now at NCAA)","e":"Contact via LinkedIn","ph":"N/A","rl":"Founded CADE and HCM programs at NASPA (2014-2024). Now at NCAA. Historical relationship — can provide warm intro to current NASPA team.","mga":"Indirect — warm intro only","pa":"Don't pitch for a deal. Ask for an intro to the current CADE contact and/or for his endorsement as a field expert.","os":"","nt":"His LinkedIn shows '100 Cups Advisors' as Principal. Highly connected. NASPA Strategies Conference still happens annually — David is likely still in the network."},{"coal":"Virginia VHESUAC / ABC Grants","n":"Chris Young","t":"Adult Education & Prevention Coordinator, Virginia ABC","e":"education@abc.virginia.gov","ph":"(804) 977-7440","rl":"Quoted in VHESUAC recognition announcements. Primary staff contact for Virginia ABC's higher education prevention programs.","mga":"YES — manages Alcohol Education & Prevention Grants (up to $10,000/org, open Jan-Mar 2026)","pa":"Grants are open NOW through March 1, 2026. Clear30 as an app for colleges/universities addresses 'high-risk drinking prevention' which is a stated grant priority. Position Clear30 as a grant-eligible digital tool.","os":"","nt":"Grant application period open Jan 1 – Mar 1, 2026. Up to $10K per grantee. Clear30 should apply OR help campuses apply for funding to deploy Clear30."},{"coal":"Virginia VHESUAC / ABC Grants","n":"Virginia ABC Education & Prevention","t":"Community Health & Engagement Division","e":"education@abc.virginia.gov","ph":"(804) 977-7440","rl":"Division that staffs VHESUAC and administers grants to colleges, universities, and community organizations.","mga":"YES — grant administration, VHESUAC staffing","pa":"Same as above. Also ask for introduction to VHESUAC Workgroup members who work directly with prevention at campuses.","os":"","nt":"VHESUAC Executive Council includes presidents and health directors from dozens of VA universities. Annual campus recognition program creates warm intros to campus contacts."},{"coal":"Virginia VHESUAC / ABC Grants","n":"Chris Holstege, MD","t":"Executive Director of Student Health Center, University of Virginia (VHESUAC Exec Council)","e":"Contact via UVA","ph":"Contact via UVA","rl":"VHESUAC Executive Council member — represents one of Virginia's flagship universities.","mga":"Indirect — campus champion","pa":"Dr. Holstege is a medical director — lead with Clear30's evidence base and clinical outcomes. Pitch the app as a clinical referral tool for his student health center.","os":"","nt":"Other VHESUAC Exec Council members include Keith Anderson (Liberty U) and Charles Klink (VCU). Entire council list at abc.virginia.gov/education/programs/vhesuac."},{"coal":"South Carolina DAODAS","n":"Michelle Nienhius","t":"Prevention Staff, DAODAS/OSUS","e":"mnienhius@daodas.sc.gov","ph":"(803) 896-1184","rl":"Primary prevention training contact. Coordinates SPF Application for Prevention Success Training (SAPST) — the gateway training for SC college prevention professionals.","mga":"Indirect — training coordinator; can champion Clear30 within the SAPST training curriculum","pa":"Pitch Clear30 as a recommended campus resource in SAPST training. College students are attending SAPST — if Michelle features Clear30, it reaches prevention professionals at 30+ SC campuses.","os":"","nt":"Her name appears on both 2023 and 2025 SAPST training listings. Also contact for the general prevention@daodas.sc.gov mailbox."},{"coal":"South Carolina DAODAS","n":"Kallie Snipes","t":"Prevention Staff, DAODAS","e":"ksnipes@daodas.sc.gov","ph":"(803) 896-1158","rl":"Coordinates AET (Alcohol Enforcement Teams) compliance trainings and campus outreach events.","mga":"Indirect — field-level prevention contact","pa":"Clear30 as a campus resource to complement compliance education. Kallie works at the campus level — she can facilitate introductions to campus prevention coordinators directly.","os":"","nt":"Direct line available (803-896-1158). Campus-level relationships are her domain."},{"coal":"South Carolina DAODAS","n":"DAODAS Prevention (general)","t":"Prevention Division, DAODAS","e":"prevention@daodas.sc.gov","ph":"(803) 896-5555","rl":"General prevention inbox for the full state prevention apparatus.","mga":"Routing to prevention staff","pa":"Use as backup. Ask to be connected with whoever manages college/university prevention grants specifically.","os":"","nt":"Sara Goldsby is Director of DAODAS (appointed 2018). DAODAS is now formally the BHDD Office of Substance Use Services. Main address: 1801 Main Street, 4th Floor, Columbia, SC 29201."}]

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
    onboardingChecklist: [true, true, true, true, true],
    upsells: { appCustomization: "not_offered", educationModules: "not_offered" },
    campusOutreach: { posters: 0, tabling: 0, socialMedia: 0, facultyReferrals: 0 },
    specialCampaigns: [
      { name: "420 Campaign", active: false, date: "", notes: "" },
      { name: "New Year's Campaign", active: false, date: "", notes: "" },
      { name: "School Year Campaign", active: false, date: "", notes: "" },
      { name: "Custom Campaign", active: false, date: "", notes: "" },
    ],
    nextMeetingDate: "", nextMeetingNotes: "",
    sentBy: "Julian",
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
    onboardingChecklist: [true, true, true, true, false],
    upsells: { appCustomization: "not_offered", educationModules: "not_offered" },
    campusOutreach: { posters: 0, tabling: 0, socialMedia: 0, facultyReferrals: 0 },
    specialCampaigns: [
      { name: "420 Campaign", active: false, date: "", notes: "" },
      { name: "New Year's Campaign", active: false, date: "", notes: "" },
      { name: "School Year Campaign", active: false, date: "", notes: "" },
      { name: "Custom Campaign", active: false, date: "", notes: "" },
    ],
    nextMeetingDate: "", nextMeetingNotes: "",
    sentBy: "Julian",
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
    onboardingChecklist: [true, true, true, false, false],
    upsells: { appCustomization: "not_offered", educationModules: "not_offered" },
    campusOutreach: { posters: 0, tabling: 0, socialMedia: 0, facultyReferrals: 0 },
    specialCampaigns: [
      { name: "420 Campaign", active: false, date: "", notes: "" },
      { name: "New Year's Campaign", active: false, date: "", notes: "" },
      { name: "School Year Campaign", active: false, date: "", notes: "" },
      { name: "Custom Campaign", active: false, date: "", notes: "" },
    ],
    nextMeetingDate: "", nextMeetingNotes: "",
    sentBy: "Julian",
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
    onboardingChecklist: [true, true, true, true, false],
    upsells: { appCustomization: "not_offered", educationModules: "not_offered" },
    campusOutreach: { posters: 0, tabling: 0, socialMedia: 0, facultyReferrals: 0 },
    specialCampaigns: [
      { name: "420 Campaign", active: false, date: "", notes: "" },
      { name: "New Year's Campaign", active: false, date: "", notes: "" },
      { name: "School Year Campaign", active: false, date: "", notes: "" },
      { name: "Custom Campaign", active: false, date: "", notes: "" },
    ],
    nextMeetingDate: "", nextMeetingNotes: "",
    sentBy: "Julian",
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
    onboardingChecklist: [false, false, false, true, false],
    upsells: { appCustomization: "not_offered", educationModules: "not_offered" },
    campusOutreach: { posters: 0, tabling: 0, socialMedia: 0, facultyReferrals: 0 },
    specialCampaigns: [
      { name: "420 Campaign", active: false, date: "", notes: "" },
      { name: "New Year's Campaign", active: false, date: "", notes: "" },
      { name: "School Year Campaign", active: false, date: "", notes: "" },
      { name: "Custom Campaign", active: false, date: "", notes: "" },
    ],
    nextMeetingDate: "", nextMeetingNotes: "",
    sentBy: "Julian",
    nextAction: "First info meeting — Asher joining", nextActionDate: "",
    notes: [
      { date: "2026-02-01", text: "30-day pilot started. Also scheduling formal info meeting for paid partnership." },
    ],
  },
  // Pipeline
  {
    id: "st-lawrence", name: "St. Lawrence University", shortName: "St. Lawrence", emailDomain: "stlawu.edu",
    studentPopulation: 2500, stage: "pilot_meeting_scheduled", confidence: "High",
    contactName: "Leslie Sanderfur", contactRole: "", contactEmail: "",
    priceStandard: 2500, pricePremium: 6250, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 10, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
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
    sentBy: "Julian",
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
    sentBy: "Fred",
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
    sentBy: "Julian",
    nextAction: "Send leave-with doc and voucher codes. Schedule Meeting 2.", nextActionDate: "2026-02-20",
    notes: [
      { date: "2026-02-10", text: "First meeting 2/10. Dr. Shima attending. Confirmation page and demo sent." },
    ],
  },
  {
    id: "umkc", name: "University of Missouri-Kansas City", shortName: "UMKC", emailDomain: "umkc.edu",
    studentPopulation: 17000, stage: "pilot_meeting_scheduled", confidence: "High",
    contactName: "Mark", contactRole: "", contactEmail: "",
    priceStandard: 5000, pricePremium: null, selectedTier: "standard",
    confirmationPageSent: true, leaveWithDocSent: false, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 10, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Send leave-with doc to Mark BEFORE meeting", nextActionDate: "2026-02-11",
    notes: [
      { date: "2026-02-07", text: "Second meeting 2/11. High confidence — first meeting went well. Single price of $5,000 (no premium). ACTION: Send leave-with to Mark before meeting." },
    ],
  },
  {
    id: "stockton", name: "Stockton University", shortName: "Stockton", emailDomain: "stockton.edu",
    studentPopulation: 9000, stage: "awaiting_pilot", confidence: "High",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 9000, pricePremium: 22500, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 12, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Follow up on close meeting — interested in premium", nextActionDate: "2026-02-19",
    notes: [
      { date: "2026-02-12", text: "Second meeting (close) on 2/12. First meeting went very well. Interested in premium customization option." },
    ],
  },
  {
    id: "eastern-illinois", name: "Eastern Illinois University", shortName: "EIU", emailDomain: "eiu.edu",
    studentPopulation: 5000, stage: "awaiting_pilot", confidence: "Medium",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 5000, pricePremium: 12500, selectedTier: "standard",
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 12, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Wait for their internal conversations. Follow up in 1 week.", nextActionDate: "2026-02-24",
    notes: [
      { date: "2026-02-17", text: "Second meeting (close) 2/17. Not interested in premium — standard only. Were reserved at first but warmed up. Need internal conversations." },
    ],
  },
  {
    id: "vassar", name: "Vassar College", shortName: "Vassar", emailDomain: "vassar.edu",
    studentPopulation: 2500, stage: "awaiting_pilot", confidence: "High",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 2500, pricePremium: 6250, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 12, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Follow up — very optimistic outcome", nextActionDate: "2026-02-24",
    notes: [
      { date: "2026-02-17", text: "Second meeting (close) 2/17. Met with 2 people — very optimistic about outcome." },
    ],
  },
  {
    id: "monmouth", name: "Monmouth University", shortName: "Monmouth", emailDomain: "monmouth.edu",
    studentPopulation: 6000, stage: "pilot_meeting_scheduled", confidence: "Very High",
    contactName: "", contactRole: "Athletic Dept + Student Oversight", contactEmail: "",
    priceStandard: 6000, pricePremium: 15000, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 10, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "CLOSE MEETING 2/19 — Highest confidence deal", nextActionDate: "2026-02-19",
    notes: [
      { date: "2026-02-12", text: "HIGHEST CONFIDENCE. Met with 3 people from athletic department and student oversight — all appear to be decision makers. Very interested in premium. Want to expand to athletics specifically." },
    ],
  },
  {
    id: "jmu", name: "James Madison University", shortName: "JMU", emailDomain: "jmu.edu",
    studentPopulation: 21000, stage: "awaiting_pilot", confidence: "Medium",
    contactName: "Paige", contactRole: "", contactEmail: "",
    priceStandard: 21000, pricePremium: 31500, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: true, demoCompleted: true, voucherCodesSent: true, firefliesMeetingNotes: false,
    emailStep: 12, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Follow up with Paige on decision", nextActionDate: "2026-02-27",
    notes: [
      { date: "2026-02-20", text: "Second meeting with Paige. Premium at $15/struggling student = $31,500. Standard = $21,000. 1 attendee." },
    ],
  },
  {
    id: "missouri-state", name: "Missouri State University", shortName: "Missouri State", emailDomain: "missouristate.edu",
    studentPopulation: 27000, stage: "meeting_booked", confidence: "N/A",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 27000, pricePremium: 40500, selectedTier: null,
    confirmationPageSent: true, leaveWithDocSent: false, demoCompleted: true, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 6, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "First meeting 2/23 with 3 people", nextActionDate: "2026-02-23",
    notes: [
      { date: "2026-02-15", text: "Meeting 2/23 with 3 people. Pricing may need adjustment — larger school. Premium uses JMU-style per-struggling-student model ($15/student = $40,500)." },
    ],
  },
  {
    id: "northeastern-illinois", name: "Northeastern Illinois University", shortName: "NEIU", emailDomain: "neiu.edu",
    studentPopulation: 5000, stage: "meeting_booked", confidence: "N/A",
    contactName: "", contactRole: "", contactEmail: "",
    priceStandard: 5000, pricePremium: 12500, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 3, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Send confirmation page and demo. Prep for first meeting.", nextActionDate: "2026-02-25",
    notes: [],
  },
  // ─── CRM OUTREACH PIPELINE (from University Partnerships CRM) ───
  {
    id: "western-governors-university", name: "Western Governors University", shortName: "WGU", emailDomain: "wgu.edu",
    studentPopulation: 282150, stage: "outreach", confidence: "N/A",
    contactName: "Anmy Mayfield", contactRole: "Vice President and Dean", contactEmail: "anmy.mayfield@wgu.edu",
    priceStandard: 282150, pricePremium: 705375, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "southern-new-hampshire-university", name: "Southern New Hampshire University", shortName: "SNHU", emailDomain: "snhu.edu",
    studentPopulation: 255134, stage: "outreach", confidence: "N/A",
    contactName: "Brandon Ryans", contactRole: "Associate Dean", contactEmail: "",
    priceStandard: 255134, pricePremium: 637835, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "liberty-university", name: "Liberty University", shortName: "Liberty", emailDomain: "liberty.edu",
    studentPopulation: 143337, stage: "outreach", confidence: "N/A",
    contactName: "Gabrielle Camera", contactRole: "Director", contactEmail: "",
    priceStandard: 143337, pricePremium: 358343, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "lone-star-college-system", name: "Lone Star College System", shortName: "Lone Star", emailDomain: "lonestar.edu",
    studentPopulation: 107793, stage: "outreach", confidence: "N/A",
    contactName: "Debora Butts", contactRole: "Interim Director", contactEmail: "david.w.puller@lonestar.edu",
    priceStandard: 107793, pricePremium: 269483, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "dallas-college", name: "Dallas College", shortName: "Dallas College", emailDomain: "dallascollege.edu",
    studentPopulation: 104064, stage: "outreach", confidence: "N/A",
    contactName: "Luz Gonzalez", contactRole: "Associate Dean", contactEmail: "luzgonzalez@dallascollege.edu",
    priceStandard: 104064, pricePremium: 260160, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "arizona-state-university", name: "Arizona State University", shortName: "ASU", emailDomain: "asu.edu",
    studentPopulation: 98316, stage: "outreach", confidence: "N/A",
    contactName: "Marisa Domino", contactRole: "Executive Center Director and Professor", contactEmail: "marisa.domino@asu.edu",
    priceStandard: 98316, pricePremium: 245790, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "university-of-maryland-global-campus", name: "University of Maryland Global Campus", shortName: "UMGC", emailDomain: "umgc.edu",
    studentPopulation: 94890, stage: "outreach", confidence: "N/A",
    contactName: "Blakely Pomietto", contactRole: "Senior Vice-President & Chief Academic Officer", contactEmail: "blakely.pomietto@umgc.edu",
    priceStandard: 94890, pricePremium: 237225, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "miami-dade-college", name: "Miami Dade College", shortName: "Miami Dade", emailDomain: "mdc.edu",
    studentPopulation: 84258, stage: "outreach", confidence: "N/A",
    contactName: "Ron Winston", contactRole: "Dean", contactEmail: "rwinston@mdc.edu",
    priceStandard: 84258, pricePremium: 210645, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "texas-am-university", name: "Texas A&M University", shortName: "Texas A&M", emailDomain: "tamu.edu",
    studentPopulation: 72982, stage: "outreach", confidence: "N/A",
    contactName: "Lei-Shih Chen", contactRole: "Program Director and Associate Professor", contactEmail: "lacechen@tamu.edu",
    priceStandard: 72982, pricePremium: 182455, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "university-of-central-florida", name: "University of Central Florida", shortName: "UCF", emailDomain: "ucf.edu",
    studentPopulation: 80755, stage: "outreach", confidence: "N/A",
    contactName: "Sussany Beltran", contactRole: "Associate Professor, Center Co-Director", contactEmail: "Susanny.Beltran@ucf.edu",
    priceStandard: 80755, pricePremium: 201888, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "houston-community-college", name: "Houston Community College", shortName: "HCC", emailDomain: "hccs.edu",
    studentPopulation: 71898, stage: "outreach", confidence: "N/A",
    contactName: "Jeff Gricar", contactRole: "Dean", contactEmail: "jeff.gricar@hccs.edu",
    priceStandard: 71898, pricePremium: 179745, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "florida-international-university", name: "Florida International University", shortName: "FIU", emailDomain: "fiu.edu",
    studentPopulation: 67081, stage: "outreach", confidence: "N/A",
    contactName: "Charlie Andrews", contactRole: "Vice President", contactEmail: "andrewsc@fiu.edu",
    priceStandard: 67081, pricePremium: 167703, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "purdue-university-global", name: "Purdue University Global", shortName: "Purdue Global", emailDomain: "purdueglobal.edu",
    studentPopulation: 66383, stage: "outreach", confidence: "N/A",
    contactName: "Rebecca Zolotor", contactRole: "Dean and Vice President", contactEmail: "rzolotor@purdueglobal.edu",
    priceStandard: 66383, pricePremium: 165958, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "ohio-state-university", name: "Ohio State University", shortName: "Ohio State", emailDomain: "osu.edu",
    studentPopulation: 65036, stage: "outreach", confidence: "N/A",
    contactName: "Paula Song", contactRole: "Dean", contactEmail: "song.263@osu.edu",
    priceStandard: 65036, pricePremium: 162590, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "new-york-university", name: "New York University", shortName: "NYU", emailDomain: "nyu.edu",
    studentPopulation: 63571, stage: "outreach", confidence: "N/A",
    contactName: "Zoe Ragouzeos", contactRole: "VP Student Health, Mental Health, and Wellbeing", contactEmail: "zoe.ragouzeos@nyu.edu",
    priceStandard: 63571, pricePremium: 158928, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "valencia-college", name: "Valencia College", shortName: "Valencia", emailDomain: "valenciacollege.edu",
    studentPopulation: 63109, stage: "outreach", confidence: "N/A",
    contactName: "Deborah Hardy", contactRole: "Dean of Allied Health", contactEmail: "v_dhardy@valenciacollege.edu",
    priceStandard: 63109, pricePremium: 157773, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "uiuc", name: "University of Illinois Urbana-Champaign", shortName: "UIUC", emailDomain: "illinois.edu",
    studentPopulation: 62797, stage: "outreach", confidence: "N/A",
    contactName: "Christopher Ochs", contactRole: "Director", contactEmail: "cochs@illinois.edu",
    priceStandard: 62797, pricePremium: 156993, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "indiana-university-bloomington", name: "Indiana University-Bloomington", shortName: "IU Bloomington", emailDomain: "iu.edu",
    studentPopulation: 62701, stage: "outreach", confidence: "N/A",
    contactName: "Jennifer Embree", contactRole: "Chief Wellness Officer", contactEmail: "jembree8@iu.edu",
    priceStandard: 62701, pricePremium: 156753, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "university-of-arizona", name: "University of Arizona", shortName: "UArizona", emailDomain: "arizona.edu",
    studentPopulation: 61966, stage: "outreach", confidence: "N/A",
    contactName: "Cassandra Hirdes", contactRole: "Director, Health Promotion", contactEmail: "chirdes@email.arizona.edu",
    priceStandard: 61966, pricePremium: 154915, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "university-of-florida", name: "University of Florida", shortName: "UF", emailDomain: "ufl.edu",
    studentPopulation: 61936, stage: "outreach", confidence: "N/A",
    contactName: "Jennifer Royer", contactRole: "Director, Gatorwell Health Promotion Services", contactEmail: "jkennymore@ufl.edu",
    priceStandard: 61936, pricePremium: 154840, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "uw-seattle", name: "University of Washington-Seattle", shortName: "UW Seattle", emailDomain: "washington.edu",
    studentPopulation: 60215, stage: "outreach", confidence: "N/A",
    contactName: "Peggy Hannon", contactRole: "Director", contactEmail: "peggyh@uw.edu",
    priceStandard: 60215, pricePremium: 150538, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "university-of-minnesota", name: "University of Minnesota-Twin Cities", shortName: "UMN", emailDomain: "umn.edu",
    studentPopulation: 59339, stage: "outreach", confidence: "N/A",
    contactName: "Ben Kohler", contactRole: "Director, Fitness and Wellness", contactEmail: "kubik028@umn.edu",
    priceStandard: 59339, pricePremium: 148348, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "byu-idaho", name: "Brigham Young University-Idaho", shortName: "BYU-Idaho", emailDomain: "byui.edu",
    studentPopulation: 58556, stage: "outreach", confidence: "N/A",
    contactName: "Emily Brumbaugh", contactRole: "Wellness Center Director", contactEmail: "brumbaughe@byui.edu",
    priceStandard: 58556, pricePremium: 146390, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "austin-community-college", name: "Austin Community College District", shortName: "ACC", emailDomain: "austincc.edu",
    studentPopulation: 58468, stage: "outreach", confidence: "N/A",
    contactName: "Shasta Buchanan", contactRole: "Vice Chancellor", contactEmail: "shasta.buchanan@austincc.edu",
    priceStandard: 58468, pricePremium: 146170, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "georgia-tech", name: "Georgia Institute of Technology", shortName: "Georgia Tech", emailDomain: "gatech.edu",
    studentPopulation: 57952, stage: "outreach", confidence: "N/A",
    contactName: "Joi Alexander", contactRole: "Director of Wellness Empowerment Center", contactEmail: "joi.alexander@gatech.edu",
    priceStandard: 57952, pricePremium: 144880, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "purdue-university", name: "Purdue University", shortName: "Purdue", emailDomain: "purdue.edu",
    studentPopulation: 57417, stage: "outreach", confidence: "N/A",
    contactName: "Brenda Masiga-Crowell", contactRole: "Senior Director", contactEmail: "",
    priceStandard: 57417, pricePremium: 143543, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "rutgers-university", name: "Rutgers University-New Brunswick", shortName: "Rutgers", emailDomain: "rutgers.edu",
    studentPopulation: 57297, stage: "outreach", confidence: "N/A",
    contactName: "Francesca Maresca", contactRole: "Asst. Vice Chancellor for Health and Wellness", contactEmail: "",
    priceStandard: 57297, pricePremium: 143243, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "university-of-south-florida", name: "University of South Florida", shortName: "USF", emailDomain: "usf.edu",
    studentPopulation: 56611, stage: "outreach", confidence: "N/A",
    contactName: "Somer Burke", contactRole: "Director", contactEmail: "sgoad@usf.edu",
    priceStandard: 56611, pricePremium: 141528, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "uw-madison", name: "University of Wisconsin-Madison", shortName: "UW-Madison", emailDomain: "wisc.edu",
    studentPopulation: 53774, stage: "outreach", confidence: "N/A",
    contactName: "Tiffany Lomax", contactRole: "Director of Wellbeing & Programs", contactEmail: "tlomax@wisc.edu",
    priceStandard: 53774, pricePremium: 134435, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "oregon-state-university", name: "Oregon State University", shortName: "Oregon State", emailDomain: "oregonstate.edu",
    studentPopulation: 43223, stage: "outreach", confidence: "N/A",
    contactName: "Doris Cancel-Tirado", contactRole: "Associate Dean", contactEmail: "doris.canceltirado@oregonstate.edu",
    priceStandard: 43223, pricePremium: 108058, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "university-of-tennessee", name: "University of Tennessee-Knoxville", shortName: "UTK", emailDomain: "utk.edu",
    studentPopulation: 39187, stage: "outreach", confidence: "N/A",
    contactName: "Yusof Al-Wadei", contactRole: "Director", contactEmail: "yalwadei@utk.edu",
    priceStandard: 39187, pricePremium: 97968, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "syracuse-university", name: "Syracuse University", shortName: "Syracuse", emailDomain: "syracuse.edu",
    studentPopulation: 37243, stage: "outreach", confidence: "N/A",
    contactName: "Jessica Dennison", contactRole: "Associate Director", contactEmail: "",
    priceStandard: 37243, pricePremium: 93108, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "palm-beach-state-college", name: "Palm Beach State College", shortName: "PBSC", emailDomain: "palmbeachstate.edu",
    studentPopulation: 34920, stage: "outreach", confidence: "N/A",
    contactName: "Becky Mercer", contactRole: "Associate Dean and Principal Investigator", contactEmail: "mercerb@pbsc.edu",
    priceStandard: 34920, pricePremium: 87300, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "unc-chapel-hill", name: "University of North Carolina at Chapel Hill", shortName: "UNC", emailDomain: "unc.edu",
    studentPopulation: 34640, stage: "outreach", confidence: "N/A",
    contactName: "Alice Ammerman", contactRole: "Director", contactEmail: "alice_ammerman@unc.edu",
    priceStandard: 34640, pricePremium: 86600, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "unc-charlotte", name: "University of North Carolina at Charlotte", shortName: "UNC Charlotte", emailDomain: "charlotte.edu",
    studentPopulation: 34158, stage: "outreach", confidence: "N/A",
    contactName: "Sophia Marshall", contactRole: "Director", contactEmail: "sophia.marshall@uncc.edu",
    priceStandard: 34158, pricePremium: 85395, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "temple-university", name: "Temple University", shortName: "Temple", emailDomain: "temple.edu",
    studentPopulation: 32591, stage: "outreach", confidence: "N/A",
    contactName: "Amanda Bule", contactRole: "Assistant Director", contactEmail: "Amanda.Bule@temple.edu",
    priceStandard: 32591, pricePremium: 81478, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "washington-state-university", name: "Washington State University", shortName: "WSU", emailDomain: "wsu.edu",
    studentPopulation: 29708, stage: "outreach", confidence: "N/A",
    contactName: "Maggie Ruiz", contactRole: "Student Wellness Center Coordinator", contactEmail: "magdelena.ruiz@wsu.edu",
    priceStandard: 29708, pricePremium: 74270, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Complete contact scraping", nextActionDate: "",
    notes: [{ date: "2026-02-20", text: "CRM Status: Scraping — contact list incomplete." }],
  },
  {
    id: "iu-indianapolis", name: "Indiana University-Indianapolis", shortName: "IU Indy", emailDomain: "iu.edu",
    studentPopulation: 29063, stage: "outreach", confidence: "N/A",
    contactName: "Eric Teske", contactRole: "Director", contactEmail: "erictesk@iu.edu",
    priceStandard: 29063, pricePremium: 72658, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "montclair-state-university", name: "Montclair State University", shortName: "Montclair", emailDomain: "montclair.edu",
    studentPopulation: 25785, stage: "outreach", confidence: "N/A",
    contactName: "Marie Cascarano", contactRole: "Assistant Director", contactEmail: "cascaranom@montclair.edu",
    priceStandard: 25785, pricePremium: 64463, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "kansas-state-university", name: "Kansas State University", shortName: "K-State", emailDomain: "k-state.edu",
    studentPopulation: 22106, stage: "outreach", confidence: "N/A",
    contactName: "Chris Bowman", contactRole: "Director, Morrison Family Center for Student Well-being", contactEmail: "cbowman@k-state.edu",
    priceStandard: 22106, pricePremium: 55265, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "moorpark-college", name: "Moorpark College", shortName: "Moorpark", emailDomain: "moorparkcollege.edu",
    studentPopulation: 21725, stage: "outreach", confidence: "N/A",
    contactName: "Carol Higashida", contactRole: "Dean", contactEmail: "chigashida@vcccd.edu",
    priceStandard: 21725, pricePremium: 54313, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "uncw", name: "University of North Carolina Wilmington", shortName: "UNCW", emailDomain: "uncw.edu",
    studentPopulation: 20709, stage: "outreach", confidence: "N/A",
    contactName: "Christine Davis", contactRole: "Vice Chancellor for Student Affairs", contactEmail: "daviscra@uncw.edu",
    priceStandard: 20709, pricePremium: 51773, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Fred",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
  {
    id: "ul-lafayette", name: "University of Louisiana at Lafayette", shortName: "UL Lafayette", emailDomain: "louisiana.edu",
    studentPopulation: 16810, stage: "outreach", confidence: "N/A",
    contactName: "Patricia Cottonham", contactRole: "Vice President for Student Affairs", contactEmail: "patcottonham@louisiana.edu",
    priceStandard: 16810, pricePremium: 42025, selectedTier: null,
    confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
    emailStep: 0, emailsSent: [],
    partnerType: null, contractTerm: null, amountPaid: 0,
    launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
    sentBy: "Julian",
    nextAction: "Begin outreach sequence", nextActionDate: "",
    notes: [],
  },
]

// ─── HELPERS ───
const STORAGE_KEY = "clear30-sales-hub"
const CURRENT_DATA_VERSION = 5 // Bump this when seed data changes to trigger merge

// ─── CONTACT ROLE / PERSONA CONSTANTS ───
const CONTACT_ROLES = ["Decision Maker", "Champion", "Influencer"]
const CONTACT_ROLE_COLORS = { "Decision Maker": { bg: "#5BB4A9", text: "#FFFFFF" }, "Champion": { bg: "#80C97A", text: "#FFFFFF" }, "Influencer": { bg: "#E5E5E5", text: "#333333" } }
const PERSONA_TYPES = ["Health Promotion / Wellness", "AOD Prevention / Recovery", "Student Affairs Leadership", "Counseling Center Leadership", "Case Management / BIT", "Other"]
const OUTREACH_STATUSES = ["Not Contacted", "Sent", "Replied", "Bounced", "OOO", "Referred", "Not Interested"]
const OUTREACH_COLORS = { "Not Contacted": "#9CA3AF", "Sent": "#F5A623", "Replied": "#80C97A", "Bounced": "#E53E3E", "OOO": "#F5A623", "Referred": "#5BB4A9", "Not Interested": "#E53E3E" }

// Migrate old flat contact fields to new contacts array + stage migration
function migrateContacts(uni) {
  // Migrate old stage IDs to new ones
  if (STAGE_MIGRATION[uni.stage]) uni = { ...uni, stage: STAGE_MIGRATION[uni.stage] }
  // Fix pricing even if contacts already migrated
  const priceTier = getPriceTier(uni.studentPopulation || 0)
  if (!uni.selectedTier && uni.stage !== "active_partner") {
    if (uni.priceStandard > priceTier.standard) uni = { ...uni, priceStandard: priceTier.standard }
    if (uni.pricePremium > priceTier.premium) uni = { ...uni, pricePremium: priceTier.premium }
  }
  if (uni.contacts && Array.isArray(uni.contacts)) return uni // Already migrated contacts
  const contacts = []
  if (uni.contactName || uni.contactEmail) {
    const nameParts = (uni.contactName || "").trim().split(/\s+/)
    const firstName = nameParts[0] || ""
    const lastName = nameParts.slice(1).join(" ") || ""
    // Infer outreach status from stage
    let outreach = "Not Contacted"
    if (uni.stage === "active_partner") outreach = "Replied"
    else if (uni.stage === "meeting_booked" || uni.stage === "meeting1_done" || uni.stage === "pilot_meeting_scheduled" || uni.stage === "awaiting_pilot" || uni.stage === "active_pilot") outreach = "Replied"
    else if (uni.emailStep > 0) outreach = "Sent"
    contacts.push({
      firstName, lastName,
      title: uni.contactRole || "",
      department: "",
      role: "Champion",
      personaType: "Other",
      email: uni.contactEmail || "",
      phone: "",
      verifyUrl: "",
      outreach,
    })
  }
  // Also migrate additionalContacts if present
  if (uni.additionalContacts && Array.isArray(uni.additionalContacts)) {
    for (const ac of uni.additionalContacts) {
      const nameParts = (ac.name || "").trim().split(/\s+/)
      contacts.push({
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        title: ac.title || "",
        department: ac.office || "",
        role: "Champion",
        personaType: "Other",
        email: ac.email || "",
        phone: ac.phone || "",
        verifyUrl: "",
        outreach: "Not Contacted",
      })
    }
  }
  const migrated = { ...uni, contacts }
  return migrated
}

function loadData() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // If stored version is older, merge new seed universities and migrate contacts
      if ((parsed.version || 1) < CURRENT_DATA_VERSION && parsed.universities) {
        const existingIds = new Set(parsed.universities.map(u => u.id))
        const newSchools = SEED_UNIVERSITIES.filter(u => !existingIds.has(u.id))
        if (newSchools.length > 0) {
          parsed.universities = [...parsed.universities, ...newSchools]
        }
        // Migrate all contacts to new format
        parsed.universities = parsed.universities.map(migrateContacts)
        parsed.version = CURRENT_DATA_VERSION
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      }
      return parsed
    }
  } catch (e) { console.warn("Failed to load:", e) }
  return null
}

function saveData(universities) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ universities, lastSaved: new Date().toISOString(), version: CURRENT_DATA_VERSION }))
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
  const textColor = confidence === "Low" ? "#333333" : color
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: color + "20", color: textColor }}>
      {confidence}
    </span>
  )
}

function StageBadge({ stage }) {
  const s = getStage(stage)
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: "#EAF6F5", color: "#5BB4A9" }}>
      {s.label}
    </span>
  )
}

function PartnerTypeBadge({ type }) {
  const config = {
    paid: { label: "Paid", bg: "#80C97A20", color: "#80C97A" },
    pilot_paid: { label: "Pilot (Paid)", bg: "#F5A62320", color: "#F5A623" },
    pilot_free: { label: "Pilot (Free)", bg: "#5BB4A920", color: "#5BB4A9" },
    free: { label: "Free", bg: "#6B728020", color: "#6B7280" },
  }
  const c = config[type] || config.free
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: c.bg, color: c.color }}>
      {c.label}
    </span>
  )
}

function ChecklistItem({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer py-1.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="w-4 h-4 rounded accent-[#5BB4A9]" />
      <span className={`text-sm ${checked ? "text-gray-500 line-through" : "text-gray-700"}`}>{label}</span>
    </label>
  )
}

function MetricCard({ label, value, sub, icon: Icon }) {
  return (
    <div className="bg-white hover:shadow-lg transition-all duration-300" style={{ padding: "20px 32px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
      <div className="flex items-center gap-5 mb-4">
        <div className="rounded-2xl flex items-center justify-center" style={{ width: "56px", height: "56px", background: "#EAF6F5" }}>
          {Icon && <Icon size={24} style={{ color: "#5BB4A9" }} />}
        </div>
        <span className="text-[15px] font-normal" style={{ color: "#333333" }}>{label}</span>
      </div>
      <div className="font-medium" style={{ fontSize: "32px", color: "#000000" }}>{value}</div>
      {sub && <div className="text-[14px] mt-1" style={{ color: "#333333" }}>{sub}</div>}
    </div>
  )
}

// ─── SIDEBAR ───
function Sidebar({ currentPage, setPage, overdueCount }) {
  const mainNav = [
    { id: "pipeline", label: "Pipeline", icon: Home },
    { id: "email", label: "Email Center", icon: Mail },
    { id: "fulfillment", label: "Fulfillment", icon: CheckCircle },
    { id: "coalition", label: "Coalition Partners", icon: Users },
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
        className="w-full flex items-center gap-3.5 rounded-lg mb-2 text-[15px] font-normal transition-all duration-200"
        style={{
          padding: "14px 20px",
          backgroundColor: active ? "#5BB4A9" : "transparent",
          color: active ? "#FFFFFF" : "#000000",
        }}
        onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = "#5BB4A9" }}
        onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = "#000000" }}
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
    <div className="w-64 min-h-screen bg-white flex flex-col" style={{ borderRight: "1px solid #E5E5E5" }}>
      <div className="p-6 pb-4">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm" style={{ background: GRADIENT }}>
            30
          </div>
          <span className="text-lg font-medium" style={{ color: "#000000" }}>Clear30</span>
        </div>
      </div>
      <div className="mx-4 mb-4 rounded-xl" style={{ background: "#EAF6F5", padding: "14px 20px" }}>
        <div className="text-[13px] font-medium" style={{ color: "#000000" }}>Sales Hub</div>
        <div className="text-[10px]" style={{ color: "#333333" }}>Asher & Julian · Partnerships</div>
      </div>
      <nav className="flex-1 px-3">
        <div className="text-[10px] font-medium uppercase tracking-wider px-4 pt-3 pb-2" style={{ color: "#333333" }}>Navigation</div>
        {mainNav.map(item => <NavButton key={item.id} item={item} />)}
        <div className="text-[10px] font-medium uppercase tracking-wider px-4 pt-5 pb-2" style={{ color: "#333333" }}>Tools</div>
        {toolsNav.map(item => <NavButton key={item.id} item={item} />)}
      </nav>
      <div className="p-4" style={{ borderTop: "1px solid #E5E5E5" }}>
        <div className="flex items-center gap-3 rounded-xl" style={{ padding: "10px 16px" }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: GRADIENT }}>AJ</div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium truncate" style={{ color: "#000000" }}>Asher & Julian</div>
            <div className="text-[10px]" style={{ color: "#333333" }}>Clear30 Partnerships</div>
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
  const [showOnTrack, setShowOnTrack] = useState(false)
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverGroup, setDragOverGroup] = useState(null)

  const pipeline = universities.filter(u => u.stage !== "closed_lost")
  const q = searchQuery.toLowerCase()
  const filtered = pipeline.filter(u => {
    if (!q) return true
    if (u.name.toLowerCase().includes(q)) return true
    if (u.shortName?.toLowerCase().includes(q)) return true
    if (u.contactName?.toLowerCase().includes(q)) return true
    if (u.contactEmail?.toLowerCase().includes(q)) return true
    if (u.contacts?.some(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q) || c.title?.toLowerCase().includes(q))) return true
    if (u.notes?.some(n => n.text?.toLowerCase().includes(q))) return true
    if (u.sentBy?.toLowerCase().includes(q)) return true
    return false
  })

  const pipelineOnly = universities.filter(u => u.stage !== "active_partner" && u.stage !== "closed_lost")
  const totalPipelineValue = pipelineOnly.reduce((sum, u) => sum + (u.priceStandard || 0), 0)
  const activePartners = universities.filter(u => u.stage === "active_partner")
  const overdueActions = pipelineOnly.filter(u => u.nextActionDate && new Date(u.nextActionDate) < new Date())
  const closingThisWeek = pipelineOnly.filter(u => {
    if (!u.nextActionDate) return false
    const d = daysUntil(u.nextActionDate)
    return d !== null && d >= 0 && d <= 7 && (u.stage === "pilot_meeting_scheduled" || u.stage === "awaiting_pilot" || u.stage === "active_pilot")
  })

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: "32px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
          <div>
            <h1 className="font-medium" style={{ fontSize: "32px", color: "#000000" }}>Pipeline</h1>
            <p className="text-[14px] mt-1" style={{ color: "#333333" }}>{universities.length} universities tracked</p>
          </div>
          <button onClick={() => setQuickAddOpen(true)} className="flex items-center gap-2 text-white text-[15px] font-medium hover:opacity-90 transition-opacity" style={{ background: GRADIENT, borderRadius: "999px", padding: "12px 28px" }}>
            <Plus size={16} /> Add School
          </button>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute top-1/2 -translate-y-1/2" style={{ color: "#BBB", left: "14px" }} />
            <input
              type="text"
              placeholder="Search schools, contacts, emails, notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[14px] border-2 rounded-xl focus:outline-none focus:border-[#5BB4A9] transition-all"
              style={{ borderColor: searchQuery ? ACCENT : "#E5E5E5", color: "#333333", padding: "10px 16px 10px 40px", backgroundColor: "#FAFAFA" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" style={{ backgroundColor: "#E5E5E5" }}>
                <X size={12} style={{ color: "#666" }} />
              </button>
            )}
          </div>
          {searchQuery && (
            <span className="text-[13px] font-medium flex-shrink-0" style={{ color: "#888" }}>{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          )}
          <div className="flex rounded-full p-1" style={{ backgroundColor: "#F5F5F5" }}>
            <button onClick={() => setViewMode("kanban")} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${viewMode === "kanban" ? "bg-white shadow-sm" : ""}`} style={{ color: viewMode === "kanban" ? "#000000" : "#333333" }}>
              <LayoutGrid size={16} />
            </button>
            <button onClick={() => setViewMode("table")} className={`px-4 py-1.5 rounded-full text-[13px] font-medium transition-all ${viewMode === "table" ? "bg-white shadow-sm" : ""}`} style={{ color: viewMode === "table" ? "#000000" : "#333333" }}>
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: "40px" }}>
        <MetricCard label="Pipeline Value" value={formatCurrency(totalPipelineValue)} sub={`${pipelineOnly.length} schools`} icon={DollarSign} />
        <MetricCard label="Active Partners" value={activePartners.length} sub={`${activePartners.reduce((s, u) => s + u.activeUsers, 0)} active users`} icon={Award} />
        <MetricCard label="Closing This Week" value={closingThisWeek.length} sub={closingThisWeek.map(u => u.shortName).join(", ") || "None"} icon={Star} />
        <MetricCard label="Overdue Actions" value={overdueActions.length} sub={overdueActions.map(u => u.shortName).join(", ") || "All clear"} icon={AlertTriangle} />
      </div>

      {/* Today's Focus — checklist-aware, hidden during search */}
      {!searchQuery && (() => {
        const today = new Date().toISOString().slice(0, 10)
        const todayFormatted = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })

        // Build focus items for each pipeline school
        const focusItems = pipelineOnly.map(school => {
          const checklist = STAGE_CHECKLISTS[school.stage] || STAGE_CHECKLISTS.outreach
          const firstUnchecked = checklist.find(({ key }) => !school[key])
          const actionNeeded = firstUnchecked ? firstUnchecked.label : "Move to next stage"
          const actionKey = firstUnchecked ? firstUnchecked.key : null

          let status = "waiting" // no date set
          let daysOverdue = null
          if (school.nextActionDate) {
            const diff = Math.floor((new Date(today) - new Date(school.nextActionDate)) / 86400000)
            if (diff > 0) { status = "overdue"; daysOverdue = diff }
            else if (diff === 0) { status = "due_today" }
            else { status = "on_track" }
          }
          return { school, actionNeeded, actionKey, status, daysOverdue }
        })

        // Sort: overdue (most days first), due_today, on_track, waiting
        const statusOrder = { overdue: 0, due_today: 1, on_track: 2, waiting: 3 }
        focusItems.sort((a, b) => {
          if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status]
          if (a.status === "overdue") return (b.daysOverdue || 0) - (a.daysOverdue || 0)
          return 0
        })

        // Primary: only overdue + due today. Secondary: on_track + waiting (collapsed)
        const urgent = focusItems.filter(f => f.status === "overdue" || f.status === "due_today")
        const secondary = focusItems.filter(f => f.status === "on_track" || f.status === "waiting")
        if (urgent.length === 0 && secondary.length === 0) return null

        const statusBadge = (status, daysOverdue) => {
          if (status === "overdue") return <span className="text-[11px] font-bold" style={{ color: "#E53E3E", backgroundColor: "#FFF5F5", borderRadius: "999px", padding: "4px 12px", whiteSpace: "nowrap" }}>OVERDUE</span>
          if (status === "due_today") return <span className="text-[11px] font-bold" style={{ color: "#92400E", backgroundColor: "#FEF3C7", borderRadius: "999px", padding: "4px 12px", whiteSpace: "nowrap" }}>DUE TODAY</span>
          if (status === "on_track") return <span className="text-[11px] font-bold" style={{ color: "#80C97A", backgroundColor: "#F0FFF0", borderRadius: "999px", padding: "4px 12px", whiteSpace: "nowrap" }}>ON TRACK</span>
          return <span className="text-[11px] font-bold" style={{ color: "#9CA3AF", backgroundColor: "#F3F4F6", borderRadius: "999px", padding: "4px 12px", whiteSpace: "nowrap" }}>WAITING</span>
        }

        const overdueCount = urgent.filter(f => f.status === "overdue").length

        return (
          <div className="bg-white" style={{ borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)", marginBottom: "48px" }}>
            {/* Header */}
            <div className="flex items-center justify-between" style={{ padding: "20px 28px", borderBottom: "1px solid #E5E5E5" }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center" style={{ width: "36px", height: "36px", borderRadius: "10px", background: GRADIENT }}>
                  <Zap size={18} style={{ color: "#FFFFFF" }} />
                </div>
                <div>
                  <div className="text-[19px] font-medium" style={{ color: "#000000" }}>Today's Focus</div>
                  <div className="text-[14px]" style={{ color: "#333333" }}>{todayFormatted}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {overdueCount > 0 && <span className="text-[13px] font-bold" style={{ color: "#E53E3E" }}>{overdueCount} overdue</span>}
                <span className="text-[14px] font-medium" style={{ color: "#5BB4A9" }}>{urgent.length} action{urgent.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Column Headers */}
            <div className="flex items-center" style={{ padding: "12px 28px", borderBottom: "1px solid #E5E5E5" }}>
              <div className="text-[12px] font-medium uppercase tracking-wider flex-1" style={{ color: "#999999" }}>University</div>
              <div className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "#999999", width: "140px" }}>Stage</div>
              <div className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "#999999", width: "220px" }}>Action Needed</div>
              <div className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "#999999", width: "90px", textAlign: "center" }}>Status</div>
              <div style={{ width: "100px" }}></div>
            </div>

            {/* Urgent Rows */}
            <div>
              {urgent.length === 0 ? (
                <div className="text-center" style={{ padding: "24px 28px", color: "#999" }}>
                  <div className="text-[14px] font-medium">No overdue or due-today actions</div>
                </div>
              ) : urgent.slice(0, 15).map((item, idx) => (
                <div
                  key={item.school.id}
                  className="flex items-center hover:bg-gray-50 transition-colors"
                  style={{ padding: "14px 28px", borderBottom: idx < Math.min(urgent.length, 15) - 1 ? "1px solid #F5F5F5" : "none" }}
                >
                  <button onClick={() => onSelectSchool(item.school.id)} className="flex-1 min-w-0 text-left">
                    <div className="text-[15px] font-medium" style={{ color: "#000000" }}>{item.school.shortName || item.school.name}</div>
                    {item.daysOverdue > 0 && <div className="text-[11px] mt-0.5" style={{ color: "#E53E3E" }}>{item.daysOverdue} day{item.daysOverdue !== 1 ? "s" : ""} overdue</div>}
                  </button>
                  <div style={{ width: "140px" }}>
                    <StageBadge stage={item.school.stage} />
                  </div>
                  <div className="text-[13px] truncate" style={{ width: "220px", color: "#333" }}>{item.actionNeeded}</div>
                  <div style={{ width: "90px", textAlign: "center" }}>{statusBadge(item.status)}</div>
                  <div style={{ width: "100px", textAlign: "right" }}>
                    {item.actionKey && (
                      <button
                        onClick={(e) => { e.stopPropagation(); onUpdate(item.school.id, { [item.actionKey]: true }) }}
                        className="text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-colors"
                        style={{ color: ACCENT, backgroundColor: ACCENT_LIGHT }}
                      >
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Collapsible on-track / waiting section */}
            {secondary.length > 0 && (
              <div style={{ borderTop: "1px solid #E5E5E5" }}>
                <button
                  onClick={() => setShowOnTrack(!showOnTrack)}
                  className="w-full flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors text-[13px] font-medium"
                  style={{ padding: "12px 28px", color: "#999" }}
                >
                  {showOnTrack ? "Hide" : "Show"} {secondary.length} on track school{secondary.length !== 1 ? "s" : ""}
                  <ChevronDown size={14} style={{ transform: showOnTrack ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {showOnTrack && (
                  <div>
                    {secondary.map((item, idx) => (
                      <div
                        key={item.school.id}
                        className="flex items-center hover:bg-gray-50 transition-colors"
                        style={{ padding: "14px 28px", borderTop: "1px solid #F5F5F5" }}
                      >
                        <button onClick={() => onSelectSchool(item.school.id)} className="flex-1 min-w-0 text-left">
                          <div className="text-[15px] font-medium" style={{ color: "#000000" }}>{item.school.shortName || item.school.name}</div>
                        </button>
                        <div style={{ width: "140px" }}>
                          <StageBadge stage={item.school.stage} />
                        </div>
                        <div className="text-[13px] truncate" style={{ width: "220px", color: "#333" }}>{item.actionNeeded}</div>
                        <div style={{ width: "90px", textAlign: "center" }}>{statusBadge(item.status)}</div>
                        <div style={{ width: "100px", textAlign: "right" }}>
                          {item.actionKey && (
                            <button
                              onClick={(e) => { e.stopPropagation(); onUpdate(item.school.id, { [item.actionKey]: true }) }}
                              className="text-[12px] font-semibold px-3 py-1.5 rounded-lg hover:opacity-80 transition-colors"
                              style={{ color: ACCENT, backgroundColor: ACCENT_LIGHT }}
                            >
                              Mark Done
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })()}

      {viewMode === "kanban" ? (
        <div className="flex gap-5 overflow-x-auto pb-4">
          {KANBAN_GROUPS.map(group => {
            const groupSchools = filtered.filter(u => group.stages.includes(u.stage))
            const groupTotal = groupSchools.reduce((sum, u) => sum + (u.priceStandard || 0), 0)
            return (
              <div
                key={group.id}
                className={`flex-shrink-0 w-80 rounded-xl p-2 -m-2 transition-colors duration-200`}
                style={{ backgroundColor: dragOverGroup === group.id ? "rgba(91,180,169,0.08)" : "transparent", outline: dragOverGroup === group.id ? "2px solid rgba(91,180,169,0.3)" : "none", outlineOffset: "-2px", borderRadius: "12px" }}
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
                      <h3 className="text-[15px] font-medium" style={{ color: "#000000" }}>{group.label}</h3>
                      <span className="text-[14px] font-normal px-2.5 py-1 rounded-full" style={{ color: "#5BB4A9", backgroundColor: "#EAF6F5" }}>{groupSchools.length}</span>
                    </div>
                    {groupTotal > 0 && <div className="text-lg font-medium mt-0.5" style={{ color: "#5BB4A9" }}>{formatCurrency(groupTotal)}</div>}
                  </div>
                  <button className="w-7 h-7 rounded-full flex items-center justify-center transition-colors" style={{ color: "#E5E5E5" }}>
                    <MoreHorizontal size={15} />
                  </button>
                </div>
                <div className="space-y-3">
                  {groupSchools.map(school => {
                    const isOverdue = school.nextActionDate && new Date(school.nextActionDate) < new Date()
                    const emailPct = Math.round((school.emailStep / 14) * 100)
                    const checklistDone = [school.confirmationPageSent, school.leaveWithDocSent, school.demoCompleted, school.voucherCodesSent, school.firefliesMeetingNotes].filter(Boolean).length
                    const stageInfo = getStage(school.stage)
                    const confColor = CONFIDENCE_COLORS[school.confidence] || "#E5E5E5"
                    return (
                    <div
                      key={school.id}
                      draggable
                      onDragStart={(e) => { setDraggedId(school.id); e.dataTransfer.effectAllowed = "move" }}
                      onDragEnd={() => { setDraggedId(null); setDragOverGroup(null) }}
                      onClick={() => onSelectSchool(school.id)}
                      className={`w-full bg-white text-left transition-all duration-200 cursor-grab active:cursor-grabbing ${draggedId === school.id ? "opacity-40" : ""}`}
                      style={{ padding: "16px 24px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)", borderLeft: `4px solid ${confColor}` }}
                    >
                      {/* Progress bar */}
                      <div className="w-full rounded-full h-[3px] mb-3" style={{ backgroundColor: "#E5E5E5" }}>
                        <div className="h-[3px] rounded-full transition-all" style={{ width: `${emailPct}%`, background: GRADIENT }} />
                      </div>
                      {/* Row 1: Name + confidence + sent by */}
                      <div className="flex items-start justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-medium" style={{ color: "#000000" }}>{school.shortName}</span>
                          {school.sentBy && (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold"
                              style={{ background: school.sentBy === "Julian" ? GRADIENT : "#6B7280", flexShrink: 0 }}
                              title={`Sent by ${school.sentBy}`}
                            >
                              {school.sentBy[0]}
                            </div>
                          )}
                        </div>
                        <ConfidenceBadge confidence={school.confidence} />
                      </div>
                      {/* Row 2: Stage subtitle */}
                      <div className="text-[14px] mb-3" style={{ color: "#333333" }}>{stageInfo.label}</div>
                      {/* Row 3: Contact + price */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {(school.contacts?.length > 0 || school.contactName) ? (
                            <>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: GRADIENT }}>
                                {(school.contacts?.[0] ? `${school.contacts[0].firstName?.[0] || ""}${school.contacts[0].lastName?.[0] || ""}` : school.contactName?.split(" ").map(n => n[0]).join("").slice(0, 2)) || "?"}
                              </div>
                              <span className="text-[14px]" style={{ color: "#333333" }}>{school.contacts?.[0] ? `${school.contacts[0].firstName} ${school.contacts[0].lastName}`.trim() : school.contactName}</span>
                            </>
                          ) : (
                            <>
                              <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: "#E5E5E5" }}>
                                <Users size={11} style={{ color: "#333333" }} />
                              </div>
                              <span className="text-[14px] italic" style={{ color: "#333333" }}>No contact</span>
                            </>
                          )}
                        </div>
                        <span className="text-[15px] font-medium" style={{ color: "#000000" }}>{formatCurrency(school.priceStandard)}</span>
                      </div>
                      {/* Row 3b: Role coverage badges */}
                      {(() => {
                        const contacts = school.contacts || []
                        const hasDM = contacts.some(c => c.role === "Decision Maker")
                        const hasCH = contacts.some(c => c.role === "Champion")
                        const hasIN = contacts.some(c => c.role === "Influencer")
                        return (
                          <div className="flex items-center gap-1.5 mb-3">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={hasDM ? { backgroundColor: "#5BB4A9", color: "#FFFFFF" } : { backgroundColor: "transparent", color: "#5BB4A9", border: "1px dashed #5BB4A9", opacity: 0.5 }}>
                              DM{!hasDM && "+"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={hasCH ? { backgroundColor: "#80C97A", color: "#FFFFFF" } : { backgroundColor: "transparent", color: "#80C97A", border: "1px dashed #80C97A", opacity: 0.5 }}>
                              CH{!hasCH && "+"}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={hasIN ? { backgroundColor: "#E5E5E5", color: "#333333" } : { backgroundColor: "transparent", color: "#999999", border: "1px dashed #D1D5DB", opacity: 0.5 }}>
                              IN{!hasIN && "+"}
                            </span>
                            {contacts.length > 1 && <span className="text-[10px] ml-1" style={{ color: "#999" }}>+{contacts.length - 1}</span>}
                          </div>
                        )
                      })()}
                      {/* Row 4: Metadata chips */}
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: "#333333" }}>
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
                          <span className={`flex items-center gap-1 ml-auto ${isOverdue ? "font-medium" : ""}`} style={{ color: isOverdue ? "#E53E3E" : "#333333" }}>
                            <Clock size={12} />
                            {isOverdue && <AlertTriangle size={10} />}
                            {new Date(school.nextActionDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                        )}
                      </div>
                      {school.stage === "active_partner" && (
                        <div className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: "1px solid #E5E5E5" }}>
                          <PartnerTypeBadge type={school.partnerType} />
                          {school.attentionNeeded && (
                            <span className="text-[11px] font-medium flex items-center gap-1" style={{ color: "#E53E3E" }}>
                              <AlertTriangle size={11} /> Needs attention
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  )})}

                  {groupSchools.length === 0 && (
                    <div className="text-[11px] text-center py-8" style={{ color: "#E5E5E5" }}>No schools</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white overflow-hidden" style={{ borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: "1px solid #E5E5E5" }}>
                {["School", "Stage", "Confidence", "Students", "Price (Std)", "Email Step", "Next Action", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[14px] font-medium" style={{ color: "#333333" }}>{h}</th>
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
                <tr key={school.id} className="hover:bg-gray-50 cursor-pointer transition-colors" style={{ borderBottom: "1px solid #E5E5E5" }} onClick={() => onSelectSchool(school.id)}>
                  <td className="px-5 py-3.5">
                    <div className="text-[15px] font-medium" style={{ color: "#000000" }}>{school.name}</div>
                    <div className="text-[14px] mt-0.5" style={{ color: "#333333" }}>{school.shortName}</div>
                  </td>
                  <td className="px-5 py-3.5"><StageBadge stage={school.stage} /></td>
                  <td className="px-5 py-3.5"><ConfidenceBadge confidence={school.confidence} /></td>
                  <td className="px-5 py-3.5 text-[14px]" style={{ color: "#333333" }}>{school.studentPopulation?.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-[15px] font-medium" style={{ color: "#000000" }}>{formatCurrency(school.priceStandard)}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 rounded-full h-1.5 w-20" style={{ backgroundColor: "#E5E5E5" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${(school.emailStep / 14) * 100}%`, background: GRADIENT }} />
                      </div>
                      <span className="text-[11px] font-normal" style={{ color: "#333333" }}>{school.emailStep}/14</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    {school.nextAction && (
                      <div className="text-[14px]" style={{ color: school.nextActionDate && new Date(school.nextActionDate) < new Date() ? "#E53E3E" : "#333333", fontWeight: school.nextActionDate && new Date(school.nextActionDate) < new Date() ? 500 : 400 }}>
                        {school.nextAction.slice(0, 40)}{school.nextAction.length > 40 ? "..." : ""}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-3.5"><ChevronRight size={16} style={{ color: "#E5E5E5" }} /></td>
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
  const [showAddContact, setShowAddContact] = useState(false)
  const [editingContactIdx, setEditingContactIdx] = useState(null)
  const [confirmDeleteIdx, setConfirmDeleteIdx] = useState(null)
  const emptyContact = { firstName: "", lastName: "", title: "", department: "", role: "Champion", personaType: "Other", email: "", phone: "", verifyUrl: "", outreach: "Not Contacted" }
  const [contactForm, setContactForm] = useState({ ...emptyContact })
  const [showVerifyUrl, setShowVerifyUrl] = useState(false)
  const [showAIImport, setShowAIImport] = useState(false)

  if (!school) return null

  const contacts = school.contacts || []
  const tier = getPriceTier(school.studentPopulation || 0)

  const addNote = () => {
    if (!newNote.trim()) return
    onUpdate({ notes: [...(school.notes || []), { date: new Date().toISOString().slice(0, 10), text: newNote }] })
    setNewNote("")
  }
  const saveContact = () => {
    if (!contactForm.firstName && !contactForm.lastName) return
    const updated = [...contacts]
    if (editingContactIdx !== null) { updated[editingContactIdx] = { ...contactForm } } else { updated.push({ ...contactForm }) }
    onUpdate({ contacts: updated, contactName: updated[0] ? `${updated[0].firstName} ${updated[0].lastName}`.trim() : "", contactEmail: updated[0]?.email || "", contactRole: updated[0]?.title || "" })
    setContactForm({ ...emptyContact }); setShowAddContact(false); setEditingContactIdx(null); setShowVerifyUrl(false)
  }
  const startEditContact = (idx) => { setContactForm({ ...contacts[idx] }); setEditingContactIdx(idx); setShowAddContact(true); setShowVerifyUrl(!!contacts[idx].verifyUrl) }
  const removeContact = (idx) => {
    const updated = contacts.filter((_, i) => i !== idx)
    onUpdate({ contacts: updated, contactName: updated[0] ? `${updated[0].firstName} ${updated[0].lastName}`.trim() : "", contactEmail: updated[0]?.email || "", contactRole: updated[0]?.title || "" })
    setConfirmDeleteIdx(null)
  }
  const updateOutreach = (idx, outreach) => { const updated = [...contacts]; updated[idx] = { ...updated[idx], outreach }; onUpdate({ contacts: updated }) }
  const cancelContactForm = () => { setContactForm({ ...emptyContact }); setShowAddContact(false); setEditingContactIdx(null); setShowVerifyUrl(false) }

  // Stage-aware checklist (uses global STAGE_CHECKLISTS)
  const currentChecklist = STAGE_CHECKLISTS[school.stage] || STAGE_CHECKLISTS.outreach
  const stageLabel = STAGES.find(s => s.id === school.stage)?.label || school.stage
  const checklistDone = currentChecklist.filter(({ key }) => school[key]).length

  const inputCls = "w-full text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20 transition-colors"
  const labelCls = "block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide"

  const sectionCls = "rounded-2xl bg-white"
  const sectionStyle = { padding: "24px 28px", border: "1px solid #F0F0F0" }
  const sectionTitleCls = "text-[15px] font-semibold mb-4"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[860px] max-h-[90vh] bg-white flex flex-col animate-fade-in" style={{ borderRadius: "1.5rem", boxShadow: "0 25px 60px rgba(0,0,0,0.15)" }}>

        {/* ── Header ── */}
        <div className="flex-shrink-0 px-10 pt-8 pb-0" style={{ borderBottom: "1px solid #F0F0F0", borderRadius: "1.5rem 1.5rem 0 0" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[26px] font-bold" style={{ color: "#000" }}>{school.name}</h2>
              <div className="flex items-center gap-2.5 mt-3">
                <StageBadge stage={school.stage} />
                <ConfidenceBadge confidence={school.confidence} />
                {school.partnerType && <PartnerTypeBadge type={school.partnerType} />}
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"><X size={20} style={{ color: "#999" }} /></button>
          </div>
          {/* Tab bar */}
          <div className="flex gap-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "contacts", label: `Contacts${contacts.length > 0 ? ` (${contacts.length})` : ""}` },
              { id: "emails", label: "Emails" },
              { id: "notes", label: "Notes" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-6 py-3.5 text-[14px] font-semibold transition-all relative" style={{ color: activeTab === tab.id ? ACCENT : "#999" }}>
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full" style={{ backgroundColor: ACCENT }} />}
              </button>
            ))}
          </div>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto px-10 py-8" style={{ backgroundColor: "#FAFAFA" }}>
          <div className="space-y-6">

          {activeTab === "overview" && (
            <>
              {/* Pricing cards */}
              <div className="grid grid-cols-3 gap-4">
                <div className="rounded-2xl text-center" style={{ padding: "24px 20px", background: GRADIENT }}>
                  <div className="text-[13px] mb-2 font-medium" style={{ color: "rgba(255,255,255,0.8)" }}>Students</div>
                  <div className="text-[26px] font-bold text-white">{school.studentPopulation?.toLocaleString() || "—"}</div>
                </div>
                <div className="rounded-2xl text-center" style={{ padding: "24px 20px", backgroundColor: "#FFF", border: "1px solid #F0F0F0" }}>
                  <div className="text-[13px] mb-2 font-medium" style={{ color: "#999" }}>Standard Price</div>
                  <div className="text-[26px] font-bold" style={{ color: "#000" }}>{formatCurrency(tier.standard)}</div>
                </div>
                <div className="rounded-2xl text-center" style={{ padding: "24px 20px", backgroundColor: "#FFF", border: "1px solid #F0F0F0" }}>
                  <div className="text-[13px] mb-2 font-medium" style={{ color: "#999" }}>Premium Price</div>
                  <div className="text-[26px] font-bold" style={{ color: "#000" }}>{formatCurrency(tier.premium)}</div>
                </div>
              </div>

              {/* Stage & Confidence section */}
              <div className={sectionCls} style={sectionStyle}>
                <div className={sectionTitleCls} style={{ color: "#000" }}>Deal Settings</div>
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className={labelCls}>Stage</label>
                    <select value={school.stage} onChange={(e) => onUpdate({ stage: e.target.value })} className={inputCls} style={{ padding: "12px 16px", fontSize: "15px" }}>
                      {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Confidence</label>
                    <select value={school.confidence} onChange={(e) => onUpdate({ confidence: e.target.value })} className={inputCls} style={{ padding: "12px 16px", fontSize: "15px" }}>
                      {["N/A", "Low", "Medium", "High", "Very High"].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* Follow-up & Next action section */}
              <div className={sectionCls} style={sectionStyle}>
                <div className={sectionTitleCls} style={{ color: "#000" }}>Follow-Up</div>
                <div className="space-y-5">
                  <div>
                    <label className={labelCls}>Follow-up Date</label>
                    <div className="relative">
                      <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#BBB" }} />
                      <input type="date" value={school.nextActionDate || ""} onChange={(e) => onUpdate({ nextActionDate: e.target.value })} className={inputCls} style={{ paddingLeft: "44px", padding: "12px 16px 12px 44px", fontSize: "15px" }} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Next Action</label>
                    <input type="text" value={school.nextAction || ""} onChange={(e) => onUpdate({ nextAction: e.target.value })} placeholder="What needs to happen next?" className={inputCls} style={{ padding: "12px 16px", fontSize: "15px" }} />
                  </div>
                </div>
              </div>

              {/* Stage checklist section */}
              <div className={sectionCls} style={sectionStyle}>
                <div className="flex items-center justify-between mb-4">
                  <div className={sectionTitleCls} style={{ color: "#000", marginBottom: 0 }}>{stageLabel} Checklist</div>
                  <span className="text-[13px] font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: checklistDone === currentChecklist.length ? "#F0FDF4" : ACCENT_LIGHT, color: checklistDone === currentChecklist.length ? "#80C97A" : ACCENT }}>{checklistDone}/{currentChecklist.length}</span>
                </div>
                <div className="space-y-1">
                  {currentChecklist.map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-4 py-3 px-4 rounded-xl cursor-pointer hover:bg-gray-50 transition-colors" style={{ border: "1px solid transparent" }}>
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-all" style={{ backgroundColor: school[key] ? ACCENT : "#FFF", border: school[key] ? "none" : "2px solid #D1D5DB" }} onClick={() => onUpdate({ [key]: !school[key] })}>
                        {school[key] && <Check size={14} className="text-white" />}
                      </div>
                      <span className="text-[14px]" style={{ color: school[key] ? "#000" : "#555" }}>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Email sequence section */}
              <div className={sectionCls} style={sectionStyle}>
                <div className="flex items-center justify-between mb-4">
                  <div className={sectionTitleCls} style={{ color: "#000", marginBottom: 0 }}>Email Sequence</div>
                  <span className="text-[13px] font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: school.emailStep >= 14 ? "#F0FDF4" : ACCENT_LIGHT, color: school.emailStep >= 14 ? "#80C97A" : ACCENT }}>{school.emailStep}/14</span>
                </div>
                <div className="flex items-center gap-1 mb-3">
                  {EMAIL_SEQUENCE.map((e, i) => (
                    <div key={i} title={e.name} className="flex-1 h-3 rounded-full transition-all cursor-pointer hover:opacity-80" style={{ background: i < school.emailStep ? GRADIENT : i === school.emailStep ? "rgba(91,180,169,0.25)" : "#EDEDED" }} onClick={() => onUpdate({ emailStep: i + 1 })} />
                  ))}
                </div>
                <div className="text-[13px]" style={{ color: "#999" }}>
                  {school.emailStep < 14 ? <>Next: <span style={{ color: ACCENT, fontWeight: 600 }}>{EMAIL_SEQUENCE[school.emailStep]?.name}</span></> : <span style={{ color: "#80C97A", fontWeight: 600 }}>All emails sent</span>}
                </div>
              </div>

              {/* Active Partner Section */}
              {school.stage === "active_partner" && (
                <div className={sectionCls} style={sectionStyle}>
                  <div className={sectionTitleCls} style={{ color: "#000" }}>Partner Details</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl" style={{ padding: "14px 18px", backgroundColor: "#FAFAFA" }}>
                      <div className="text-[12px] font-medium mb-1" style={{ color: "#999" }}>Type</div>
                      <PartnerTypeBadge type={school.partnerType} />
                    </div>
                    <div className="rounded-xl" style={{ padding: "14px 18px", backgroundColor: "#FAFAFA" }}>
                      <div className="text-[12px] font-medium mb-1" style={{ color: "#999" }}>Contract</div>
                      <div className="text-[14px] font-semibold" style={{ color: "#000" }}>{school.contractTerm || "—"}</div>
                    </div>
                    <div className="rounded-xl" style={{ padding: "14px 18px", backgroundColor: "#FAFAFA" }}>
                      <div className="text-[12px] font-medium mb-1" style={{ color: "#999" }}>Amount Paid</div>
                      <div className="text-[14px] font-semibold" style={{ color: "#000" }}>{formatCurrency(school.amountPaid)}</div>
                    </div>
                    <div className="rounded-xl" style={{ padding: "14px 18px", backgroundColor: "#FAFAFA" }}>
                      <div className="text-[12px] font-medium mb-1" style={{ color: "#999" }}>Launch Date</div>
                      <div className="text-[14px] font-semibold" style={{ color: "#000" }}>{formatDate(school.launchDate)}</div>
                    </div>
                  </div>
                  {(school.distributionChannels || []).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-4">
                      {school.distributionChannels.map(ch => <span key={ch} className="px-4 py-1.5 rounded-full text-[12px] font-medium" style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT }}>{ch}</span>)}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {activeTab === "contacts" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[14px] font-semibold" style={{ color: "#333" }}>Contacts ({contacts.length})</span>
                {!showAddContact && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShowAIImport(true)} className="flex items-center gap-1.5 px-4 py-2 text-white text-[13px] font-medium rounded-full hover:opacity-90 transition-colors" style={{ background: GRADIENT }}>
                      <Sparkles size={13} /> AI Import
                    </button>
                    <button onClick={() => { setShowAddContact(true); setEditingContactIdx(null); setContactForm({ ...emptyContact }); setShowVerifyUrl(false) }} className="flex items-center gap-1.5 px-4 py-2 text-[13px] font-medium rounded-full hover:opacity-90 transition-colors" style={{ border: `1px solid ${ACCENT}`, color: ACCENT }}>
                      <Plus size={14} /> Add Contact
                    </button>
                  </div>
                )}
              </div>

              {/* Inline Add/Edit Contact Form */}
              {showAddContact && (
                <div className="border border-gray-200 rounded-xl p-5 mb-5 space-y-3" style={{ backgroundColor: "#FAFAFA" }}>
                  <div className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: ACCENT }}>{editingContactIdx !== null ? "Edit Contact" : "New Contact"}</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>First name</label><input type="text" value={contactForm.firstName} onChange={(e) => setContactForm(p => ({ ...p, firstName: e.target.value }))} placeholder="First name" className={inputCls} autoFocus /></div>
                    <div><label className={labelCls}>Last name</label><input type="text" value={contactForm.lastName} onChange={(e) => setContactForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Last name" className={inputCls} /></div>
                  </div>
                  <div><label className={labelCls}>Title</label><input type="text" value={contactForm.title} onChange={(e) => setContactForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Director of Health Promotion" className={inputCls} /></div>
                  <div><label className={labelCls}>Department</label><input type="text" value={contactForm.department} onChange={(e) => setContactForm(p => ({ ...p, department: e.target.value }))} placeholder="e.g. Student Wellness" className={inputCls} /></div>
                  <div>
                    <label className={labelCls}>Role</label>
                    <div className="flex gap-2">
                      {CONTACT_ROLES.map(r => (
                        <button key={r} type="button" onClick={() => setContactForm(p => ({ ...p, role: r }))} className="flex-1 py-2 text-[13px] font-medium rounded-full transition-all text-center" style={{ backgroundColor: contactForm.role === r ? CONTACT_ROLE_COLORS[r].bg : "#FFF", color: contactForm.role === r ? CONTACT_ROLE_COLORS[r].text : "#999", border: contactForm.role === r ? "none" : "1px solid #E5E5E5" }}>
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div><label className={labelCls}>Persona Type</label><select value={contactForm.personaType} onChange={(e) => setContactForm(p => ({ ...p, personaType: e.target.value }))} className={inputCls}>{PERSONA_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}</select></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={labelCls}>Email</label><input type="email" value={contactForm.email} onChange={(e) => setContactForm(p => ({ ...p, email: e.target.value }))} placeholder="email@school.edu" className={inputCls} /></div>
                    <div><label className={labelCls}>Phone</label><input type="text" value={contactForm.phone} onChange={(e) => setContactForm(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" className={inputCls} /></div>
                  </div>
                  {!showVerifyUrl ? (
                    <button onClick={() => setShowVerifyUrl(true)} className="text-[11px] flex items-center gap-1" style={{ color: ACCENT }}><Plus size={10} /> Add verify link</button>
                  ) : (
                    <div><label className={labelCls}>Verify URL</label><input type="url" value={contactForm.verifyUrl} onChange={(e) => setContactForm(p => ({ ...p, verifyUrl: e.target.value }))} placeholder="https://university.edu/directory/..." className={inputCls} /></div>
                  )}
                  <div className="flex items-center gap-3 pt-1">
                    <button onClick={saveContact} disabled={!contactForm.firstName && !contactForm.lastName} className="px-6 py-2.5 text-white text-[13px] font-medium rounded-full hover:opacity-90 transition-colors" style={{ background: (contactForm.firstName || contactForm.lastName) ? GRADIENT : "#D1D5DB", cursor: (contactForm.firstName || contactForm.lastName) ? "pointer" : "not-allowed" }}>
                      {editingContactIdx !== null ? "Save Changes" : "Save Contact"}
                    </button>
                    <button onClick={cancelContactForm} className="text-[13px]" style={{ color: "#999" }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Contact Cards */}
              {contacts.length > 0 ? (
                <div className="space-y-3">
                  {contacts.map((c, idx) => (
                    <div key={idx} className="rounded-xl border border-gray-100" style={{ padding: "16px 20px", backgroundColor: "#FFF", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0 mt-0.5" style={{ background: GRADIENT }}>
                          {(c.firstName?.[0] || "") + (c.lastName?.[0] || "")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[14px] font-semibold" style={{ color: "#000" }}>{c.firstName} {c.lastName}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: CONTACT_ROLE_COLORS[c.role]?.bg || "#E5E5E5", color: CONTACT_ROLE_COLORS[c.role]?.text || "#333" }}>{c.role}</span>
                          </div>
                          <div className="text-[12px] mb-1" style={{ color: "#666" }}>{c.title}{c.department ? ` · ${c.department}` : ""}</div>
                          {c.personaType && c.personaType !== "Other" && <div className="text-[10px] mb-1.5 px-2 py-0.5 rounded-full inline-block" style={{ backgroundColor: "#F3F4F6", color: "#666" }}>{c.personaType}</div>}
                          <div className="flex items-center gap-4 text-[12px] mt-1">
                            {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-1 hover:underline" style={{ color: ACCENT }}><AtSign size={11} /> {c.email}</a>}
                            {c.phone && <span className="flex items-center gap-1" style={{ color: "#666" }}><Phone size={11} /> {c.phone}</span>}
                            {c.verifyUrl && <a href={c.verifyUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline" style={{ color: ACCENT }}><ExternalLink size={10} /> Verify</a>}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => startEditContact(idx)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" title="Edit"><Edit3 size={13} style={{ color: "#CCC" }} /></button>
                          {confirmDeleteIdx === idx ? (
                            <div className="flex items-center gap-1">
                              <button onClick={() => removeContact(idx)} className="text-[10px] font-medium px-2 py-1 rounded-full" style={{ backgroundColor: "#FEE2E2", color: "#E53E3E" }}>Remove</button>
                              <button onClick={() => setConfirmDeleteIdx(null)} className="text-[10px] px-2 py-1" style={{ color: "#999" }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => setConfirmDeleteIdx(idx)} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-red-50 transition-colors" title="Remove"><Trash2 size={13} style={{ color: "#DDD" }} /></button>
                          )}
                        </div>
                      </div>
                      <div className="mt-3 pt-3 flex items-center gap-2" style={{ borderTop: "1px solid #F5F5F5" }}>
                        <span className="text-[11px] font-medium" style={{ color: "#CCC" }}>Outreach:</span>
                        <select value={c.outreach || "Not Contacted"} onChange={(e) => updateOutreach(idx, e.target.value)} className="text-[12px] font-medium rounded-full px-3 py-1 border-0 cursor-pointer focus:outline-none" style={{ backgroundColor: `${OUTREACH_COLORS[c.outreach || "Not Contacted"]}15`, color: OUTREACH_COLORS[c.outreach || "Not Contacted"] }}>
                          {OUTREACH_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  ))}
                </div>
              ) : !showAddContact && (
                <div className="text-[13px] text-center py-10" style={{ color: "#CCC" }}>No contacts yet. Click "Add Contact" to get started.</div>
              )}
            </div>
          )}

          {activeTab === "emails" && (
            <div>
              <div className="text-[14px] font-semibold mb-3" style={{ color: "#333" }}>Email Sequence for {school.shortName}</div>
              <div className="space-y-2">
                {EMAIL_SEQUENCE.map((email, i) => {
                  const sent = i < school.emailStep
                  const isNext = i === school.emailStep
                  return (
                    <div key={i} className="flex items-center gap-4 rounded-xl transition-all" style={{ padding: "14px 20px", backgroundColor: isNext ? ACCENT_LIGHT : sent ? "#FAFAFA" : "#FFF", border: isNext ? `1px solid ${ACCENT}30` : "1px solid #F3F4F6" }}>
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0" style={{ background: sent ? GRADIENT : isNext ? `${ACCENT}30` : "#EDEDED", color: sent ? "#FFF" : isNext ? ACCENT : "#999" }}>
                        {sent ? <Check size={13} /> : email.step}
                      </div>
                      <div className="flex-1">
                        <div className="text-[13px] font-medium" style={{ color: sent ? "#999" : "#000" }}>{email.name}</div>
                        <div className="text-[11px]" style={{ color: "#CCC" }}>Day {email.dayOffset}</div>
                      </div>
                      {isNext && (
                        <button onClick={() => onUpdate({ emailStep: school.emailStep + 1 })} className="px-4 py-1.5 text-white text-[12px] font-medium rounded-full hover:opacity-90 transition-colors" style={{ background: GRADIENT }}>Mark Sent</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div className="flex flex-col h-full">
              <div className="text-[14px] font-semibold mb-3" style={{ color: "#333" }}>Activity Notes</div>
              <div className="space-y-2 flex-1 mb-4">
                {[...(school.notes || [])].reverse().map((note, i) => (
                  <div key={i} className="rounded-xl" style={{ padding: "12px 18px", backgroundColor: "#FAFAFA", border: "1px solid #F3F4F6" }}>
                    <div className="text-[11px] mb-1" style={{ color: "#CCC" }}>{formatDate(note.date)}</div>
                    <div className="text-[13px]" style={{ color: "#333" }}>{note.text}</div>
                  </div>
                ))}
                {(!school.notes || school.notes.length === 0) && (
                  <div className="text-[13px] text-center py-10" style={{ color: "#CCC" }}>No notes yet</div>
                )}
              </div>
              <div className="flex gap-3 pt-3" style={{ borderTop: "1px solid #F3F4F6" }}>
                <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Add a note..." className="flex-1 text-[13px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20" onKeyDown={(e) => e.key === "Enter" && addNote()} />
                <button onClick={addNote} className="px-5 py-2.5 text-white text-[13px] font-medium rounded-full hover:opacity-90 transition-colors" style={{ background: GRADIENT }}>Add</button>
              </div>
            </div>
          )}

          </div>
        </div>
      </div>
      {showAIImport && (
        <AIImportModal
          onSave={(contact) => {
            const updated = [...contacts, contact]
            onUpdate({ contacts: updated, contactName: updated[0] ? `${updated[0].firstName} ${updated[0].lastName}`.trim() : "", contactEmail: updated[0]?.email || "", contactRole: updated[0]?.title || "" })
          }}
          onClose={() => setShowAIImport(false)}
        />
      )}
    </div>
  )
}

// ─── EMAIL TEMPLATES ───
const TEMPLATE_CATEGORIES = ["All", "Initial Outreach", "Pre-Meeting", "Post-Meeting", "Coalition", "Follow-Up", "Fulfillment"]

const DEFAULT_EMAIL_TEMPLATES = [
  {
    id: "initial-cold-outreach",
    name: "Initial Cold Outreach",
    category: "Initial Outreach",
    sender: "Julian",
    subject: "Quick intro — Clear30 for {{university}}",
    body: `Hi {{contactName}},

My name is Julian Singleton — I lead university partnerships at Clear30. We're a mobile app that helps college students take a 30-day break from cannabis (or build healthier habits around it).

We're currently partnered with schools like the University of Michigan, Dartmouth, and Northwestern, and I'd love to explore whether Clear30 could support {{university}}'s wellness or AOD programming.

Would you be open to a quick 15-minute intro call? Happy to share what we've seen work at similar campuses.

Best,
Julian Singleton
Head of Campus Partnerships, Clear30
julian@clear30.com | 734.277.1774`,
  },
  {
    id: "warm-intro-referral",
    name: "Warm Intro / Referral",
    category: "Initial Outreach",
    sender: "Fred",
    subject: "Introduction — Clear30 Cannabis Support Program",
    body: `Dear {{contactName}},

I'm Dr. Fred Muench, President of Clear30. I'm reaching out because a colleague mentioned that {{university}} is actively looking at cannabis education and intervention tools.

Clear30 is an evidence-based mobile program that has shown a 90% reduction in cannabis use among students who complete the 30-day challenge. We're currently live at several campuses and funded by NIH/NIDA.

I'd welcome the chance to share our research and discuss how this could fit into your existing programming.

Warm regards,
Dr. Fred Muench
President, Clear30
fred@clear30.org`,
  },
  {
    id: "meeting-confirmation",
    name: "Meeting Confirmation + Resources",
    category: "Pre-Meeting",
    sender: "Julian",
    subject: "Confirmed: Clear30 x {{university}} — {{meetingDate}}",
    body: `Hi {{contactName}},

Looking forward to our meeting! Just confirming for {{meetingDate}}.

In the meantime, here are a few resources:
- Clear30 Confirmation Page: [link]
- Quick demo of the app: [link]
- Our distraction guide for students: [link]

If anyone else from your team would like to join, feel free to forward this along.

See you soon,
Julian`,
  },
  {
    id: "post-meeting-leave-behind",
    name: "Post-Meeting Leave-Behind",
    category: "Post-Meeting",
    sender: "Julian",
    subject: "Great meeting — Clear30 x {{university}} next steps",
    body: `Hi {{contactName}},

Thanks so much for taking the time to meet today. I really enjoyed learning about what {{university}} is doing around student wellness.

As promised, here are the follow-up materials:
- Partnership Overview (one-pager with pricing): [link]
- Voucher codes for your team to try the app: [codes]
- Case study from University of Michigan: [link]

Happy to answer any questions or set up a follow-up conversation with anyone else on your team. What works best for next steps?

Best,
Julian`,
  },
  {
    id: "coalition-partner-pitch",
    name: "Coalition Partner Pitch",
    category: "Coalition",
    sender: "Fred",
    subject: "Clear30 — Cannabis Support for {{coalitionName}} Member Schools",
    body: `Dear {{contactName}},

I'm Dr. Fred Muench, President of Clear30. I'm writing to introduce Clear30 to {{coalitionName}} as a resource for member institutions.

Clear30 is an NIH/NIDA-funded mobile application that helps college students take a structured 30-day break from cannabis. Our campus partnerships have shown a 90% reduction in cannabis use and 100% improvement in mental health indicators.

We'd love to explore a coalition-level partnership that would give member schools access at a reduced rate. Would you be open to a brief conversation about how this could support your member institutions?

Best regards,
Dr. Fred Muench
President, Clear30
fred@clear30.org`,
  },
  {
    id: "partner-check-in",
    name: "Partner Check-In",
    category: "Fulfillment",
    sender: "Julian",
    subject: "Check-in — Clear30 x {{university}}",
    body: `Hi {{contactName}},

Just wanted to check in on how things are going with Clear30 at {{university}}. Here's a quick snapshot:
- Active users: {{activeUsers}}
- Total signups: {{totalSignups}}

A few things I wanted to flag:
1. Your next quarterly report is coming up — I'll have that ready for you soon.
2. We've released some new features in the app that your students might benefit from.
3. Is there anything else we can do to support distribution on your end?

Let me know if you'd like to hop on a quick call to discuss.

Best,
Julian`,
  },
]

// ─── EMAIL COMMAND CENTER ───
function EmailCommandCenter({ universities, onUpdate, onSelectSchool }) {
  const [activeTab, setActiveTab] = useState("sequences")
  const [filter, setFilter] = useState("all")
  const [expandedId, setExpandedId] = useState(null)
  const [templateFilter, setTemplateFilter] = useState("All")
  const [templates, setTemplates] = useState(DEFAULT_EMAIL_TEMPLATES)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [editDraft, setEditDraft] = useState({ name: "", subject: "", body: "", category: "", sender: "" })
  const [copiedId, setCopiedId] = useState(null)
  const [showVariables, setShowVariables] = useState(false)
  const [showNewTemplate, setShowNewTemplate] = useState(false)
  const [newTemplate, setNewTemplate] = useState({ name: "", category: "Initial Outreach", sender: "Julian", subject: "", body: "" })
  const [searchQuery, setSearchQuery] = useState("")
  const pipeline = universities.filter(u => u.stage !== "active_partner" && u.stage !== "closed_lost")

  const filtered = (() => {
    let result = filter === "all" ? pipeline : pipeline.filter(u => {
      if (filter === "complete") return u.emailStep >= 14
      if (filter === "active") return u.emailStep < 14
      return true
    })
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(u => {
        if (u.name?.toLowerCase().includes(q)) return true
        if ((u.contacts || []).some(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q))) return true
        const stepIdx = u.emailStep || 0
        if (stepIdx < 14 && EMAIL_SEQUENCE[stepIdx]?.name.toLowerCase().includes(q)) return true
        if (stepIdx > 0 && EMAIL_SEQUENCE[stepIdx - 1]?.name.toLowerCase().includes(q)) return true
        return false
      })
    }
    return result
  })()

  const needsEmail = pipeline.filter(u => u.emailStep < 14).length
  const overdueSequences = pipeline.filter(u => {
    if (u.emailStep >= 14) return false
    const es = u.emailsSent || []
    if (es.length === 0) return false
    const days = Math.floor((Date.now() - new Date(es[es.length - 1]).getTime()) / 86400000)
    return days > 7
  }).length

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    })
  }

  const highlightVariables = (text) => {
    const parts = text.split(/({{[^}]+}})/g)
    return parts.map((part, i) =>
      part.startsWith("{{") ? (
        <span key={i} className="font-medium" style={{ color: "#5BB4A9" }}>{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }

  const startEditTemplate = (t) => {
    setEditingTemplate(t.id)
    setEditDraft({ name: t.name, subject: t.subject, body: t.body, category: t.category, sender: t.sender })
  }

  const saveEditTemplate = () => {
    setTemplates(prev => prev.map(t => t.id === editingTemplate ? { ...t, ...editDraft } : t))
    setEditingTemplate(null)
  }

  const addNewTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject) return
    const id = newTemplate.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
    setTemplates(prev => [...prev, { ...newTemplate, id }])
    setNewTemplate({ name: "", category: "Initial Outreach", sender: "Julian", subject: "", body: "" })
    setShowNewTemplate(false)
  }

  const filteredTemplates = templateFilter === "All" ? templates : templates.filter(t => t.category === templateFilter)

  const searchedTemplates = (() => {
    if (!searchQuery.trim()) return filteredTemplates
    const q = searchQuery.toLowerCase()
    return filteredTemplates.filter(t =>
      t.name?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q) || t.body?.toLowerCase().includes(q) || t.subject?.toLowerCase().includes(q)
    )
  })()

  const categoryColors = {
    "Initial Outreach": { bg: "#EAF6F5", color: "#5BB4A9" },
    "Pre-Meeting": { bg: "#FFF5E5", color: "#F5A623" },
    "Post-Meeting": { bg: "#E8F5E9", color: "#80C97A" },
    "Coalition": { bg: "#F0F0F0", color: "#6B7280" },
    "Follow-Up": { bg: "#EDE7F6", color: "#7C6BC4" },
    "Fulfillment": { bg: "#E3F2FD", color: "#5B9BD5" },
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "40px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "24px" }}>
          <div>
            <h1 className="font-medium" style={{ fontSize: "32px", color: "#000000" }}>Email Center</h1>
            <p className="text-[14px] mt-1" style={{ color: "#888" }}>Manage outreach sequences and email templates</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center" style={{ padding: "10px 20px", backgroundColor: ACCENT_LIGHT, borderRadius: "12px" }}>
              <div className="text-[20px] font-bold" style={{ color: ACCENT }}>{needsEmail}</div>
              <div className="text-[11px] font-medium" style={{ color: "#888" }}>Need Email</div>
            </div>
            <div className="text-center" style={{ padding: "10px 20px", backgroundColor: "#F0FDF4", borderRadius: "12px" }}>
              <div className="text-[20px] font-bold" style={{ color: "#80C97A" }}>{pipeline.filter(u => u.emailStep >= 14).length}</div>
              <div className="text-[11px] font-medium" style={{ color: "#888" }}>Complete</div>
            </div>
          </div>
        </div>
        {/* Tab Bar + Search */}
        <div className="flex items-center gap-4" style={{ marginBottom: "8px" }}>
          <div className="flex gap-2">
            {[{ id: "sequences", label: "Sequences" }, { id: "templates", label: "Templates" }].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="text-[15px] font-semibold transition-all"
                style={{
                  padding: "10px 24px",
                  borderRadius: "12px",
                  backgroundColor: activeTab === tab.id ? ACCENT : "transparent",
                  color: activeTab === tab.id ? "#FFFFFF" : "#888",
                  border: activeTab === tab.id ? "none" : "2px solid #E5E5E5",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: "#BBB" }} />
            <input
              type="text"
              placeholder={activeTab === "sequences" ? "Search schools, contacts, or email steps..." : "Search templates by name, category, or content..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-[14px] border-2 rounded-xl pl-11 pr-10 py-2.5 focus:outline-none focus:border-[#5BB4A9] transition-all"
              style={{ borderColor: searchQuery ? ACCENT : "#E5E5E5", backgroundColor: "#FAFAFA" }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors" style={{ backgroundColor: "#E5E5E5" }}>
                <X size={12} style={{ color: "#666" }} />
              </button>
            )}
          </div>
        </div>
      </div>

      {activeTab === "sequences" && (
        <>
          {/* Filter */}
          <div className="flex gap-2" style={{ marginBottom: "24px" }}>
            {[{ id: "all", label: "All Schools" }, { id: "active", label: "Needs Email" }, { id: "complete", label: "Complete" }].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className="px-5 py-2.5 rounded-full text-[14px] font-normal transition-all"
                style={{ backgroundColor: filter === f.id ? "#EAF6F5" : "transparent", color: filter === f.id ? "#5BB4A9" : "#333333", border: filter === f.id ? "none" : "1px solid #E5E5E5" }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-4 gap-6" style={{ marginBottom: "40px" }}>
            <MetricCard label="Schools in Sequence" value={pipeline.length} icon={Mail} />
            <MetricCard label="Needs Next Email" value={needsEmail} icon={Clock} />
            <MetricCard label="Sequences Complete" value={pipeline.filter(u => u.emailStep >= 14).length} icon={CheckCircle} />
            <div className="bg-white text-center" style={{ borderRadius: "1rem", padding: "20px", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)", border: overdueSequences > 0 ? "2px solid #FEE2E2" : "2px solid transparent", backgroundColor: overdueSequences > 0 ? "#FEF2F2" : "#FFFFFF" }}>
              <AlertTriangle size={20} style={{ color: overdueSequences > 0 ? "#E53E3E" : "#999", margin: "0 auto 8px" }} />
              <div className="text-[28px] font-bold" style={{ color: overdueSequences > 0 ? "#E53E3E" : "#999" }}>{overdueSequences}</div>
              <div className="text-[13px] font-medium" style={{ color: overdueSequences > 0 ? "#E53E3E" : "#999" }}>Overdue</div>
            </div>
          </div>

          {/* School Email Cards */}
          {searchQuery && (
            <div className="text-[13px] font-medium mb-4" style={{ color: "#999" }}>
              Showing {filtered.length} of {pipeline.length} schools
            </div>
          )}
          <div style={{ display: "grid", gap: "20px" }}>
            {filtered.sort((a, b) => {
              const daysA = (a.emailsSent?.length > 0) ? Math.floor((Date.now() - new Date(a.emailsSent[a.emailsSent.length - 1]).getTime()) / 86400000) : (a.emailStep >= 14 ? -1 : 999)
              const daysB = (b.emailsSent?.length > 0) ? Math.floor((Date.now() - new Date(b.emailsSent[b.emailsSent.length - 1]).getTime()) / 86400000) : (b.emailStep >= 14 ? -1 : 999)
              return daysB - daysA
            }).map(school => {
          const currentEmail = school.emailStep < 14 ? EMAIL_SEQUENCE[school.emailStep] : null
          const lastEmail = school.emailStep > 0 ? EMAIL_SEQUENCE[school.emailStep - 1] : null
          const emailPct = Math.round((school.emailStep / 14) * 100)
          const isExpanded = expandedId === school.id

          // Days-since-last-sent badge
          const emailsSent = school.emailsSent || []
          const lastSentDate = emailsSent.length > 0 ? emailsSent[emailsSent.length - 1] : null
          const daysSinceSent = lastSentDate ? Math.floor((Date.now() - new Date(lastSentDate).getTime()) / (1000 * 60 * 60 * 24)) : null
          const sentBadge = (() => {
            if (school.emailStep >= 14) return { label: "Complete", color: "#80C97A", bg: "#F0FDF4" }
            if (daysSinceSent === null) return { label: "Not started", color: "#999", bg: "#F5F5F5" }
            if (daysSinceSent <= 3) return { label: `Sent ${daysSinceSent}d ago`, color: "#80C97A", bg: "#F0FDF4" }
            if (daysSinceSent <= 7) return { label: `Sent ${daysSinceSent}d ago`, color: "#92400E", bg: "#FEF3C7" }
            return { label: `Sent ${daysSinceSent}d ago`, color: "#E53E3E", bg: "#FEF2F2" }
          })()

          return (
            <div key={school.id} className="bg-white" style={{ borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
              {/* Card Header */}
              <div className="flex items-center" style={{ padding: "20px 28px", borderBottom: "1px solid #F5F5F5" }}>
                <div className="flex-1 min-w-0">
                  <button onClick={() => onSelectSchool(school.id)} className="text-left">
                    <div className="text-[17px] font-medium hover:text-[#5BB4A9] transition-colors" style={{ color: "#000000" }}>{school.name}</div>
                  </button>
                  <div className="flex items-center gap-3 mt-2">
                    <StageBadge stage={school.stage} />
                    <span className="text-[13px]" style={{ color: "#333333" }}>{school.emailStep} of 14 emails sent</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  {/* Urgency Badge */}
                  <span className="text-[11px] font-semibold rounded-full px-3 py-1 whitespace-nowrap" style={{ backgroundColor: sentBadge.bg, color: sentBadge.color }}>
                    {sentBadge.label}
                  </span>
                  {/* Progress Ring */}
                  <div className="text-center">
                    <div className="text-[22px] font-medium" style={{ color: emailPct === 100 ? "#80C97A" : "#5BB4A9" }}>{emailPct}%</div>
                    <div className="text-[11px]" style={{ color: "#999999" }}>complete</div>
                  </div>
                </div>
              </div>

              {/* Email Status Row */}
              <div className="grid grid-cols-3" style={{ borderBottom: "1px solid #F5F5F5" }}>
                {/* Last Email Sent */}
                <div style={{ padding: "16px 28px", borderRight: "1px solid #F5F5F5" }}>
                  <div className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "#999999", marginBottom: "6px" }}>Last Sent</div>
                  {lastEmail ? (
                    <>
                      <div className="text-[14px] font-medium" style={{ color: "#000000" }}>Step {lastEmail.step}: {lastEmail.name}</div>
                      <div className="text-[12px] mt-1" style={{ color: "#333333" }}>Day {lastEmail.dayOffset}</div>
                    </>
                  ) : (
                    <div className="text-[14px]" style={{ color: "#999999" }}>No emails sent yet</div>
                  )}
                </div>

                {/* Current / Next Email */}
                <div style={{ padding: "16px 28px", borderRight: "1px solid #F5F5F5" }}>
                  <div className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "#999999", marginBottom: "6px" }}>Sending Next</div>
                  {currentEmail ? (
                    <>
                      <div className="text-[14px] font-medium" style={{ color: "#5BB4A9" }}>Step {currentEmail.step}: {currentEmail.name}</div>
                      <div className="text-[12px] mt-1" style={{ color: "#333333" }}>Day {currentEmail.dayOffset}</div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <Check size={14} style={{ color: "#80C97A" }} />
                      <span className="text-[14px] font-medium" style={{ color: "#80C97A" }}>All emails sent</span>
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="flex items-center gap-3" style={{ padding: "16px 28px" }}>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-medium uppercase tracking-wider" style={{ color: "#999999", marginBottom: "6px" }}>Email Step</div>
                    <select
                      value={school.emailStep}
                      onChange={(e) => onUpdate(school.id, { emailStep: parseInt(e.target.value) })}
                      className="text-[14px] font-medium focus:outline-none cursor-pointer w-full"
                      style={{ color: "#000000", border: "1px solid #E5E5E5", borderRadius: "8px", padding: "6px 12px", backgroundColor: "#FFFFFF" }}
                    >
                      {Array.from({ length: 15 }, (_, i) => (
                        <option key={i} value={i}>
                          {i === 0 ? "Not started" : i === 14 ? "All 14 sent" : `Step ${i} — ${EMAIL_SEQUENCE[i - 1]?.name}`}
                        </option>
                      ))}
                    </select>
                  </div>
                  {currentEmail && (
                    <button
                      onClick={() => onUpdate(school.id, { emailStep: school.emailStep + 1 })}
                      className="text-white text-[13px] font-medium hover:opacity-90 transition-colors flex-shrink-0"
                      style={{ background: GRADIENT, borderRadius: "999px", padding: "8px 20px", whiteSpace: "nowrap" }}
                    >
                      Mark Sent
                    </button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ padding: "12px 28px 16px" }}>
                <div className="flex items-center gap-1">
                  {EMAIL_SEQUENCE.map((e, i) => (
                    <div
                      key={i}
                      title={`Step ${e.step}: ${e.name}`}
                      className="flex-1 rounded-full cursor-pointer transition-all"
                      style={{
                        height: "6px",
                        backgroundColor: i < school.emailStep ? "#5BB4A9" : i === school.emailStep ? "rgba(91,180,169,0.3)" : "#E5E5E5",
                      }}
                      onClick={() => onUpdate(school.id, { emailStep: i + 1 })}
                    />
                  ))}
                </div>
              </div>

              {/* Expandable Email List */}
              {isExpanded && (
                <div style={{ padding: "0 28px 20px", borderTop: "1px solid #E5E5E5" }}>
                  <div style={{ paddingTop: "16px" }}>
                    {EMAIL_SEQUENCE.map((email, i) => {
                      const sent = i < school.emailStep
                      const isNext = i === school.emailStep
                      const sentDate = sent && school.emailsSent?.[i] ? new Date(school.emailsSent[i]) : null
                      return (
                        <div key={i} className="flex items-center gap-3" style={{ padding: "8px 0", borderBottom: i < 13 ? "1px solid #F5F5F5" : "none" }}>
                          <div className="flex items-center justify-center rounded-full" style={{ width: "24px", height: "24px", backgroundColor: sent ? "#5BB4A9" : isNext ? "rgba(91,180,169,0.2)" : "#F5F5F5", color: sent ? "#FFFFFF" : isNext ? "#5BB4A9" : "#999999", fontSize: "11px", fontWeight: "500" }}>
                            {sent ? <Check size={12} /> : email.step}
                          </div>
                          <div className="flex-1 text-[13px]" style={{ color: sent ? "#999999" : "#000000" }}>{email.name}</div>
                          {sentDate && (
                            <div className="text-[11px] font-medium" style={{ color: "#5BB4A9" }}>
                              Sent {sentDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                            </div>
                          )}
                          <div className="text-[12px]" style={{ color: "#999999" }}>Day {email.dayOffset}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Toggle Expand */}
              <button
                onClick={() => setExpandedId(isExpanded ? null : school.id)}
                className="w-full text-center hover:bg-gray-50 transition-colors text-[13px] font-medium"
                style={{ padding: "10px", color: "#5BB4A9", borderTop: "1px solid #F5F5F5", borderRadius: "0 0 1rem 1rem" }}
              >
                {isExpanded ? "Hide all emails" : "Show all emails"}
                <ChevronDown size={14} style={{ display: "inline", marginLeft: "4px", transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              </button>
            </div>
          )
        })}
          </div>
        </>
      )}

      {activeTab === "templates" && (
        <div>
          {/* Template Controls */}
          <div className="flex items-center justify-between" style={{ marginBottom: "24px" }}>
            <div className="flex gap-2 flex-wrap">
              {TEMPLATE_CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setTemplateFilter(cat)}
                  className="px-4 py-2 rounded-full text-[13px] font-normal transition-all"
                  style={{
                    backgroundColor: templateFilter === cat ? "#EAF6F5" : "transparent",
                    color: templateFilter === cat ? "#5BB4A9" : "#333333",
                    border: templateFilter === cat ? "none" : "1px solid #E5E5E5",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowNewTemplate(!showNewTemplate)}
              className="flex items-center gap-2 text-white text-[14px] font-medium hover:opacity-90 transition-opacity"
              style={{ background: GRADIENT, borderRadius: "999px", padding: "10px 24px" }}
            >
              <Plus size={16} /> New Template
            </button>
          </div>

          {/* Available Variables */}
          <div className="bg-white mb-6" style={{ borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
            <button
              onClick={() => setShowVariables(!showVariables)}
              className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
              style={{ padding: "14px 24px", borderRadius: "1rem" }}
            >
              <span className="text-[13px] font-medium" style={{ color: "#333333" }}>Available Variables</span>
              <ChevronDown size={14} style={{ color: "#999999", transform: showVariables ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
            </button>
            {showVariables && (
              <div className="flex flex-wrap gap-2" style={{ padding: "0 24px 16px" }}>
                {["{{university}}", "{{contactName}}", "{{contactRole}}", "{{studentPopulation}}", "{{standardPrice}}", "{{premiumPrice}}", "{{activeUsers}}", "{{totalSignups}}", "{{meetingDate}}", "{{coalitionName}}"].map(v => (
                  <span key={v} className="px-3 py-1.5 rounded-full text-[12px] font-medium" style={{ backgroundColor: "#EAF6F5", color: "#5BB4A9" }}>{v}</span>
                ))}
              </div>
            )}
          </div>

          {/* New Template Form */}
          {showNewTemplate && (
            <div className="bg-white mb-6" style={{ padding: "24px 28px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
              <h3 className="text-[15px] font-medium mb-4" style={{ color: "#000000" }}>New Template</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" placeholder="Template name" value={newTemplate.name} onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })} className="text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20" />
                  <select value={newTemplate.category} onChange={(e) => setNewTemplate({ ...newTemplate, category: e.target.value })} className="text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none">
                    {TEMPLATE_CATEGORIES.filter(c => c !== "All").map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select value={newTemplate.sender} onChange={(e) => setNewTemplate({ ...newTemplate, sender: e.target.value })} className="text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none">
                    <option value="Julian">Julian</option>
                    <option value="Fred">Fred</option>
                  </select>
                </div>
                <input type="text" placeholder="Subject line" value={newTemplate.subject} onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })} className="w-full text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20" />
                <textarea placeholder="Email body..." value={newTemplate.body} onChange={(e) => setNewTemplate({ ...newTemplate, body: e.target.value })} rows={6} className="w-full text-[14px] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20 resize-y" />
                <div className="flex gap-3">
                  <button onClick={addNewTemplate} className="px-6 py-2.5 text-white text-[14px] font-medium rounded-full hover:opacity-90" style={{ background: GRADIENT }}>Add Template</button>
                  <button onClick={() => setShowNewTemplate(false)} className="px-6 py-2.5 text-[14px] font-medium rounded-full" style={{ border: "1px solid #5BB4A9", color: "#5BB4A9" }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {/* Template Cards */}
          {searchQuery && (
            <div className="text-[13px] font-medium mb-4" style={{ color: "#999" }}>
              Showing {searchedTemplates.length} of {templates.length} templates
            </div>
          )}
          <div className="space-y-5">
            {searchedTemplates.map(template => {
              const catColor = categoryColors[template.category] || { bg: "#F0F0F0", color: "#6B7280" }
              const isEditing = editingTemplate === template.id

              return (
                <div key={template.id} className="bg-white" style={{ borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
                  {/* Template Header */}
                  <div className="flex items-center justify-between" style={{ padding: "20px 28px", borderBottom: "1px solid #F5F5F5" }}>
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <input type="text" value={editDraft.name} onChange={(e) => setEditDraft({ ...editDraft, name: e.target.value })} className="text-[17px] font-medium border border-gray-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20" style={{ color: "#000000" }} />
                      ) : (
                        <span className="text-[17px] font-medium" style={{ color: "#000000" }}>{template.name}</span>
                      )}
                      <span className="px-3 py-1 rounded-full text-[11px] font-medium" style={{ backgroundColor: catColor.bg, color: catColor.color }}>{template.category}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: template.sender === "Julian" ? GRADIENT : "#6B7280" }}>
                          {template.sender[0]}
                        </div>
                        <span className="text-[12px]" style={{ color: "#999999" }}>{template.sender}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isEditing ? (
                        <>
                          <button onClick={saveEditTemplate} className="px-4 py-1.5 text-white text-[12px] font-medium rounded-full" style={{ background: GRADIENT }}>Save</button>
                          <button onClick={() => setEditingTemplate(null)} className="px-4 py-1.5 text-[12px] font-medium rounded-full" style={{ border: "1px solid #E5E5E5", color: "#333333" }}>Cancel</button>
                        </>
                      ) : (
                        <button onClick={() => startEditTemplate(template)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                          <Edit3 size={14} style={{ color: "#999999" }} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Subject */}
                  <div style={{ padding: "14px 28px", borderBottom: "1px solid #F5F5F5" }}>
                    <div className="text-[12px] font-medium uppercase tracking-wider mb-1" style={{ color: "#999999" }}>Subject</div>
                    {isEditing ? (
                      <input type="text" value={editDraft.subject} onChange={(e) => setEditDraft({ ...editDraft, subject: e.target.value })} className="w-full text-[14px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20" />
                    ) : (
                      <div className="text-[14px] font-medium" style={{ color: "#000000" }}>{highlightVariables(template.subject)}</div>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => copyToClipboard(template.subject, `${template.id}-subject`)}
                        className="mt-2 flex items-center gap-1 text-[11px] font-medium hover:opacity-70 transition-opacity"
                        style={{ color: "#5BB4A9" }}
                      >
                        <Copy size={11} /> {copiedId === `${template.id}-subject` ? "Copied!" : "Copy Subject"}
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ padding: "14px 28px 20px" }}>
                    <div className="text-[12px] font-medium uppercase tracking-wider mb-2" style={{ color: "#999999" }}>Body</div>
                    {isEditing ? (
                      <textarea value={editDraft.body} onChange={(e) => setEditDraft({ ...editDraft, body: e.target.value })} rows={8} className="w-full text-[13px] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20 resize-y font-mono" />
                    ) : (
                      <div className="text-[13px] whitespace-pre-wrap leading-relaxed" style={{ color: "#333333" }}>{highlightVariables(template.body)}</div>
                    )}
                    {!isEditing && (
                      <button
                        onClick={() => copyToClipboard(template.body, `${template.id}-body`)}
                        className="mt-3 flex items-center gap-1 text-[11px] font-medium hover:opacity-70 transition-opacity"
                        style={{ color: "#5BB4A9" }}
                      >
                        <Copy size={11} /> {copiedId === `${template.id}-body` ? "Copied!" : "Copy Body"}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── COALITION PARTNERS ───
const COALITION_STAGES = [
  { id: "outreach", label: "Outreach", color: "#6B7280" },
  { id: "conversation_active", label: "Conversation Active", color: "#5BB4A9" },
  { id: "proposal_submitted", label: "Proposal Submitted", color: "#F5A623" },
  { id: "funding_committed", label: "Funding Committed", color: "#80C97A" },
  { id: "active", label: "Active", color: "#4A9E94" },
]

const COALITION_KANBAN_GROUPS = [
  { id: "outreach", label: "Outreach", stages: ["outreach"] },
  { id: "conversation", label: "Conversation", stages: ["conversation_active"] },
  { id: "proposal", label: "Proposal", stages: ["proposal_submitted"] },
  { id: "funding", label: "Funding", stages: ["funding_committed"] },
  { id: "active", label: "Active", stages: ["active"] },
]

const SEED_COALITIONS = [
  // ─── Priority 1: Mini-Grant Coalitions (from Coalition CRM) ───
  {
    id: "ohio-hecaod",
    name: "Ohio HECAOD / NCSC Hub",
    state: "OH",
    stage: "outreach",
    contacts: [
      { name: "Dr. Jim Lange", title: "Executive Director", email: "lange.221@osu.edu", miniGrantAuthority: true },
      { name: "Cindy Clouner", title: "Managing Director", email: "clouner.2@osu.edu", miniGrantAuthority: false },
      { name: "Logan Davis", title: "Outreach & Engagement Manager", email: "davis.5966@osu.edu", miniGrantAuthority: false },
    ],
    pitchAngle: "HIGHEST PRIORITY — National hub for all state coalitions. 40+ member campuses. Dr. Lange can refer to every other state.",
    sentBy: "Fred",
    notes: [{ date: "2026-02-20", text: "HECAOD is the national coordinating center. Dr. Jim Lange is the single most important contact in the entire coalition CRM — he can make warm intros to every state." }],
    linkedUniversities: ["ohio-state-university"],
  },
  {
    id: "missouri-pip",
    name: "Missouri PIP",
    state: "MO",
    stage: "outreach",
    contacts: [
      { name: "Joan Masters", title: "Sr. Project Director", email: "mastersj@missouri.edu", miniGrantAuthority: true },
      { name: "Margo Leitschuh", title: "Prevention & Implementation Team Lead", email: "leitschuhm@missouri.edu", miniGrantAuthority: false },
      { name: "Kayleigh Greenwood", title: "Lead Research Coordinator", email: "kgreenwood@missouri.edu", miniGrantAuthority: false },
      { name: "Megan Mottola", title: "Research Coordinator", email: "mmottola@missouri.edu", miniGrantAuthority: false },
    ],
    pitchAngle: "Direct funding model — Joan Masters controls mini-grant allocation. 24-26 member campuses. SAMHSA block grant funded.",
    sentBy: "Julian",
    notes: [{ date: "2026-02-20", text: "PIP provides campus mini-grants. Joan Masters is the key decision maker for funding. MO PIP also connected to Missouri State (pipeline deal)." }],
    linkedUniversities: ["missouri-state"],
  },
  {
    id: "nebraska-necpa",
    name: "Nebraska NECPA",
    state: "NE",
    stage: "outreach",
    contacts: [
      { name: "Megan Hopkins", title: "Project Director", email: "mhopkins2@unl.edu", miniGrantAuthority: true },
      { name: "MeLissa Butler", title: "Senior Project Manager", email: "mbutler15@unl.edu", miniGrantAuthority: false },
    ],
    pitchAngle: "Controls $187K OCC + $225K NECPA grants. 26 member campuses. Active cannabis education programming. Confirmed mini-grants.",
    sentBy: "Julian",
    notes: [{ date: "2026-02-20", text: "NECPA has confirmed campus mini-grants and active cannabis education focus. Megan Hopkins controls grant allocation." }],
    linkedUniversities: [],
  },
  {
    id: "illinois-ihec",
    name: "Illinois IHEC",
    state: "IL",
    stage: "outreach",
    contacts: [
      { name: "Dr. Eric Davidson", title: "Director", email: "esdavidson@eiu.edu", miniGrantAuthority: true },
      { name: "Annabelle Escamilla", title: "Assistant Director", email: "ihec@eiu.edu", miniGrantAuthority: false },
    ],
    pitchAngle: "Coalition field founder. Dr. Davidson controls IHEC mini-grant and resource allocation. Connected to EIU (pipeline deal).",
    sentBy: "Fred",
    notes: [{ date: "2026-02-20", text: "IHEC is based at Eastern Illinois University. Dr. Eric Davidson is a founder of the collegiate coalition model." }],
    linkedUniversities: ["eastern-illinois"],
  },
  {
    id: "colorado-cade",
    name: "Colorado CADE",
    state: "CO",
    stage: "outreach",
    contacts: [
      { name: "Eva Esakoff", title: "Asst. Director", email: "CADE@naspa.org", miniGrantAuthority: true },
      { name: "David Arnold", title: "Former NASPA AVP (now at NCAA)", email: "", miniGrantAuthority: false },
    ],
    pitchAngle: "Cannabis-specific toolkit. 20 member campuses. NASPA-managed. Eva also manages Montana HCM.",
    sentBy: "Julian",
    notes: [{ date: "2026-02-20", text: "CADE is managed by NASPA (not a state agency). Cannabis is their primary focus — perfect alignment with Clear30." }],
    linkedUniversities: [],
  },
  {
    id: "virginia-vhesuac",
    name: "Virginia VHESUAC / ABC Grants",
    state: "VA",
    stage: "outreach",
    contacts: [
      { name: "Chris Young", title: "Adult Education & Prevention Coordinator", email: "education@abc.virginia.gov", miniGrantAuthority: true },
      { name: "Chris Holstege, MD", title: "UVA, VHESUAC Executive Council", email: "", miniGrantAuthority: false },
    ],
    pitchAngle: "ABC grants up to $10K/org. Grant window open Jan-Mar 2026 — TIME SENSITIVE. Alcohol Education & Prevention mechanism.",
    sentBy: "Fred",
    notes: [{ date: "2026-02-20", text: "Virginia ABC Education & Prevention grants are OPEN NOW (Jan-Mar 2026). Chris Young manages grants. Urgent outreach needed." }],
    linkedUniversities: [],
  },
  {
    id: "south-carolina-daodas",
    name: "South Carolina DAODAS",
    state: "SC",
    stage: "outreach",
    contacts: [
      { name: "Michelle Nienhius", title: "Prevention Staff", email: "mnienhius@daodas.sc.gov", miniGrantAuthority: false },
      { name: "Kallie Snipes", title: "Prevention Staff", email: "ksnipes@daodas.sc.gov", miniGrantAuthority: false },
    ],
    pitchAngle: "State agency with prevention focus. SAMHSA block grant funded.",
    sentBy: "Julian",
    notes: [],
    linkedUniversities: [],
  },
  // ─── Priority 2: Confirmed Coalitions (no mini-grant contacts yet) ───
  {
    id: "michigan-mihen",
    name: "Michigan MIHEN",
    state: "MI",
    stage: "outreach",
    contacts: [
      { name: "Alex Wray", title: "Coalition Contact", email: "", miniGrantAuthority: false },
    ],
    pitchAngle: "53 member campuses — largest in CRM. Cannabis was 2025 conference theme. UMich is existing Clear30 partner.",
    sentBy: "Julian",
    notes: [{ date: "2026-02-20", text: "MIHEN has 53 campuses and chose cannabis as their 2025 conference theme. Clear30 already partners with UMich — strong warm intro angle." }],
    linkedUniversities: ["umich"],
  },
  {
    id: "new-jersey-njhec",
    name: "New Jersey NJHEC",
    state: "NJ",
    stage: "outreach",
    contacts: [
      { name: "", title: "Coalition Director", email: "", miniGrantAuthority: false },
    ],
    pitchAngle: "40+ member campuses. One of the oldest collegiate coalitions in the US.",
    sentBy: "Fred",
    notes: [],
    linkedUniversities: ["rutgers-university", "montclair-state-university"],
  },
  {
    id: "montana-hcm",
    name: "Montana HCM",
    state: "MT",
    stage: "outreach",
    contacts: [
      { name: "Eva Esakoff", title: "Asst. Director (same NASPA team as CADE)", email: "CADE@naspa.org", miniGrantAuthority: true },
    ],
    pitchAngle: "19 member campuses. Same NASPA team as CADE — expanding cannabis scope.",
    sentBy: "Fred",
    notes: [{ date: "2026-02-20", text: "HCM is managed by same NASPA team as CADE (Eva Esakoff). Pitch both together." }],
    linkedUniversities: [],
  },
  {
    id: "maryland-tmc",
    name: "Maryland TMC",
    state: "MD",
    stage: "outreach",
    contacts: [
      { name: "Dr. Amelia Arria", title: "Top Cannabis Researcher", email: "", miniGrantAuthority: false },
    ],
    pitchAngle: "The Maryland Collaborative. Dr. Amelia Arria is a top cannabis researcher — strong research credibility angle.",
    sentBy: "Julian",
    notes: [],
    linkedUniversities: [],
  },
  {
    id: "washington-ccsap",
    name: "Washington CCSAP",
    state: "WA",
    stage: "outreach",
    contacts: [
      { name: "", title: "Coalition Contact", email: "", miniGrantAuthority: false },
    ],
    pitchAngle: "Washington state collegiate coalition. Cannabis legal state — high relevance.",
    sentBy: "Fred",
    notes: [],
    linkedUniversities: ["uw-seattle", "washington-state-university"],
  },
  {
    id: "indiana-ican",
    name: "Indiana ICAN",
    state: "IN",
    stage: "outreach",
    contacts: [
      { name: "", title: "Coalition Contact", email: "", miniGrantAuthority: false },
    ],
    pitchAngle: "Indiana collegiate AOD network. Multiple pipeline schools in IN (IU Bloomington, IU Indy, Purdue).",
    sentBy: "Julian",
    notes: [],
    linkedUniversities: ["indiana-university-bloomington", "iu-indianapolis", "purdue-university"],
  },
]

const COALITION_STORAGE_KEY = "clear30-coalitions"
const CURRENT_COALITION_VERSION = 2 // Bump when coalition seed data changes

function loadCoalitionData() {
  try {
    const stored = localStorage.getItem(COALITION_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // If version is older, replace with new seed data (coalitions are fully rewritten from CRM)
      if ((parsed.version || 1) < CURRENT_COALITION_VERSION) {
        return null // Force re-seed with SEED_COALITIONS
      }
      return parsed
    }
  } catch (e) { console.warn("Failed to load coalitions:", e) }
  return null
}

function saveCoalitionData(coalitions) {
  try {
    localStorage.setItem(COALITION_STORAGE_KEY, JSON.stringify({ coalitions, lastSaved: new Date().toISOString(), version: CURRENT_COALITION_VERSION }))
  } catch (e) { console.warn("Failed to save coalitions:", e) }
}

function getCoalitionStage(id) { return COALITION_STAGES.find(s => s.id === id) || COALITION_STAGES[0] }

function CoalitionStageBadge({ stage }) {
  const s = getCoalitionStage(stage)
  return (
    <span className="inline-flex items-center px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: s.color + "20", color: s.color }}>
      {s.label}
    </span>
  )
}

function CoalitionDetailPanel({ coalition, onClose, onUpdate, universities }) {
  const [activeTab, setActiveTab] = useState("overview")
  const [newNote, setNewNote] = useState("")
  const [newContact, setNewContact] = useState({ name: "", title: "", email: "", miniGrantAuthority: false })

  if (!coalition) return null

  const addNote = () => {
    if (!newNote.trim()) return
    const notes = [...(coalition.notes || []), { date: new Date().toISOString().slice(0, 10), text: newNote }]
    onUpdate({ notes })
    setNewNote("")
  }

  const addContact = () => {
    if (!newContact.name) return
    onUpdate({ contacts: [...(coalition.contacts || []), { ...newContact }] })
    setNewContact({ name: "", title: "", email: "", miniGrantAuthority: false })
  }

  const removeContact = (idx) => {
    const contacts = [...(coalition.contacts || [])]
    contacts.splice(idx, 1)
    onUpdate({ contacts })
  }

  const updateContact = (idx, field, value) => {
    const contacts = [...(coalition.contacts || [])]
    contacts[idx] = { ...contacts[idx], [field]: value }
    onUpdate({ contacts })
  }

  const cSectionCls = "rounded-2xl bg-white"
  const cSectionStyle = { padding: "24px 28px", border: "1px solid #F0F0F0" }
  const cInputCls = "w-full text-[14px] border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20 transition-colors"
  const cLabelCls = "block text-[11px] font-medium text-gray-400 mb-1.5 uppercase tracking-wide"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-[860px] max-h-[90vh] bg-white flex flex-col animate-fade-in" style={{ borderRadius: "1.5rem", boxShadow: "0 25px 60px rgba(0,0,0,0.15)" }}>

        {/* Header */}
        <div className="flex-shrink-0 px-10 pt-8 pb-0" style={{ borderBottom: "1px solid #F0F0F0", borderRadius: "1.5rem 1.5rem 0 0" }}>
          <div className="flex items-start justify-between mb-5">
            <div>
              <h2 className="text-[26px] font-bold" style={{ color: "#000" }}>{coalition.name}</h2>
              <div className="flex items-center gap-2.5 mt-3">
                <CoalitionStageBadge stage={coalition.stage} />
                <span className="text-[13px] font-medium px-3 py-1.5 rounded-full" style={{ backgroundColor: "#F0F0F0", color: "#6B7280" }}>{coalition.state}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: coalition.sentBy === "Julian" ? GRADIENT : "#6B7280" }}>
                    {coalition.sentBy?.[0] || "?"}
                  </div>
                  <span className="text-[13px]" style={{ color: "#999" }}>{coalition.sentBy}</span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"><X size={20} style={{ color: "#999" }} /></button>
          </div>
          {/* Tab bar */}
          <div className="flex gap-1">
            {[
              { id: "overview", label: "Overview" },
              { id: "contacts", label: `Contacts (${(coalition.contacts || []).length})` },
              { id: "notes", label: "Notes" },
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className="px-6 py-3.5 text-[14px] font-semibold transition-all relative" style={{ color: activeTab === tab.id ? ACCENT : "#999" }}>
                {tab.label}
                {activeTab === tab.id && <div className="absolute bottom-0 left-3 right-3 h-[3px] rounded-full" style={{ backgroundColor: ACCENT }} />}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-10 py-8" style={{ backgroundColor: "#FAFAFA" }}>
          <div className="space-y-6">

          {activeTab === "overview" && (
            <>
              {/* Stage & Sent By */}
              <div className={cSectionCls} style={cSectionStyle}>
                <div className="text-[15px] font-semibold mb-5" style={{ color: "#000" }}>Coalition Settings</div>
                <div className="space-y-5">
                  <div>
                    <label className={cLabelCls}>Stage</label>
                    <select value={coalition.stage} onChange={(e) => onUpdate({ stage: e.target.value })} className={cInputCls} style={{ fontSize: "15px" }}>
                      {COALITION_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={cLabelCls}>Sent By</label>
                    <div className="flex gap-3">
                      {["Julian", "Fred"].map(person => (
                        <button key={person} onClick={() => onUpdate({ sentBy: person })} className="flex items-center gap-2.5 px-5 py-3 rounded-xl text-[14px] font-medium transition-all" style={{ backgroundColor: coalition.sentBy === person ? (person === "Julian" ? ACCENT_LIGHT : "#F0F0F0") : "#FFF", color: coalition.sentBy === person ? (person === "Julian" ? ACCENT : "#333") : "#999", border: coalition.sentBy === person ? `2px solid ${person === "Julian" ? ACCENT : "#999"}` : "2px solid #E5E5E5" }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-bold" style={{ background: person === "Julian" ? GRADIENT : "#6B7280" }}>{person[0]}</div>
                          {person}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pitch Angle */}
              <div className={cSectionCls} style={cSectionStyle}>
                <div className="text-[15px] font-semibold mb-4" style={{ color: "#000" }}>Pitch Angle</div>
                <textarea value={coalition.pitchAngle || ""} onChange={(e) => onUpdate({ pitchAngle: e.target.value })} rows={4} className={cInputCls + " resize-y"} style={{ fontSize: "15px" }} placeholder="Describe the pitch angle for this coalition..." />
              </div>

              {/* Linked Universities */}
              <div className={cSectionCls} style={cSectionStyle}>
                <div className="text-[15px] font-semibold mb-4" style={{ color: "#000" }}>Linked Universities</div>
                {(coalition.linkedUniversities || []).length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {(coalition.linkedUniversities || []).map(uid => {
                      const u = universities.find(u => u.id === uid)
                      return u ? (
                        <span key={uid} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium" style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT }}>
                          {u.shortName || u.name}
                          <button onClick={() => onUpdate({ linkedUniversities: coalition.linkedUniversities.filter(id => id !== uid) })} className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors"><X size={11} /></button>
                        </span>
                      ) : null
                    })}
                  </div>
                )}
                <select value="" onChange={(e) => { if (e.target.value && !(coalition.linkedUniversities || []).includes(e.target.value)) { onUpdate({ linkedUniversities: [...(coalition.linkedUniversities || []), e.target.value] }) } }} className={cInputCls} style={{ fontSize: "15px" }}>
                  <option value="">Link a university...</option>
                  {universities.filter(u => !(coalition.linkedUniversities || []).includes(u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}

          {activeTab === "contacts" && (
            <div className="space-y-4">
              {/* Existing contacts */}
              {(coalition.contacts || []).map((contact, idx) => (
                <div key={idx} className={cSectionCls} style={cSectionStyle}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[12px] font-bold" style={{ background: GRADIENT }}>
                        {(contact.name || "?")[0]}
                      </div>
                      <span className="text-[15px] font-semibold" style={{ color: "#000" }}>{contact.name || `Contact ${idx + 1}`}</span>
                      {contact.miniGrantAuthority && <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}>Mini-Grant Authority</span>}
                    </div>
                    <button onClick={() => removeContact(idx)} className="text-[12px] font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors" style={{ color: "#E53E3E" }}>Remove</button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className={cLabelCls}>Name</label><input type="text" value={contact.name} onChange={(e) => updateContact(idx, "name", e.target.value)} placeholder="Full name" className={cInputCls} /></div>
                    <div><label className={cLabelCls}>Title</label><input type="text" value={contact.title} onChange={(e) => updateContact(idx, "title", e.target.value)} placeholder="Job title" className={cInputCls} /></div>
                    <div><label className={cLabelCls}>Email</label><input type="email" value={contact.email} onChange={(e) => updateContact(idx, "email", e.target.value)} placeholder="email@org.edu" className={cInputCls} /></div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer w-full" style={{ backgroundColor: contact.miniGrantAuthority ? "#FEF3C7" : "#FAFAFA", border: "1px solid #E5E5E5" }}>
                        <input type="checkbox" checked={contact.miniGrantAuthority} onChange={(e) => updateContact(idx, "miniGrantAuthority", e.target.checked)} className="w-5 h-5 rounded accent-[#5BB4A9]" />
                        <span className="text-[14px]" style={{ color: "#333" }}>Mini-grant authority</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Contact */}
              <div className="rounded-2xl" style={{ padding: "24px 28px", border: "2px dashed #E0E0E0", backgroundColor: "#FFF" }}>
                <div className="text-[15px] font-semibold mb-4" style={{ color: "#000" }}>Add New Contact</div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div><label className={cLabelCls}>Name</label><input type="text" value={newContact.name} onChange={(e) => setNewContact({ ...newContact, name: e.target.value })} placeholder="Full name" className={cInputCls} /></div>
                  <div><label className={cLabelCls}>Title</label><input type="text" value={newContact.title} onChange={(e) => setNewContact({ ...newContact, title: e.target.value })} placeholder="Job title" className={cInputCls} /></div>
                  <div><label className={cLabelCls}>Email</label><input type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} placeholder="email@org.edu" className={cInputCls} /></div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer w-full" style={{ backgroundColor: "#FAFAFA", border: "1px solid #E5E5E5" }}>
                      <input type="checkbox" checked={newContact.miniGrantAuthority} onChange={(e) => setNewContact({ ...newContact, miniGrantAuthority: e.target.checked })} className="w-5 h-5 rounded accent-[#5BB4A9]" />
                      <span className="text-[14px]" style={{ color: "#333" }}>Mini-grant authority</span>
                    </label>
                  </div>
                </div>
                <button onClick={addContact} disabled={!newContact.name} className="px-6 py-3 text-white text-[14px] font-medium rounded-full hover:opacity-90 transition-colors disabled:opacity-40" style={{ background: GRADIENT }}>Add Contact</button>
              </div>
            </div>
          )}

          {activeTab === "notes" && (
            <div>
              {/* Add note input */}
              <div className={cSectionCls} style={{ ...cSectionStyle, marginBottom: "24px" }}>
                <div className="text-[15px] font-semibold mb-4" style={{ color: "#000" }}>Add a Note</div>
                <div className="flex gap-3">
                  <input type="text" value={newNote} onChange={(e) => setNewNote(e.target.value)} placeholder="Type your note here..." className={cInputCls + " flex-1"} style={{ fontSize: "15px" }} onKeyDown={(e) => e.key === "Enter" && addNote()} />
                  <button onClick={addNote} className="px-7 py-3 text-white text-[14px] font-medium rounded-xl hover:opacity-90 transition-colors flex-shrink-0" style={{ background: GRADIENT }}>Add</button>
                </div>
              </div>

              {/* Notes list */}
              <div className="space-y-3">
                {[...(coalition.notes || [])].reverse().map((note, i) => (
                  <div key={i} className="rounded-2xl" style={{ padding: "18px 24px", backgroundColor: "#FFF", border: "1px solid #F0F0F0" }}>
                    <div className="text-[12px] font-medium mb-2" style={{ color: "#999" }}>{formatDate(note.date)}</div>
                    <div className="text-[14px] leading-relaxed" style={{ color: "#333" }}>{note.text}</div>
                  </div>
                ))}
                {(!coalition.notes || coalition.notes.length === 0) && (
                  <div className="text-[14px] text-center py-12" style={{ color: "#CCC" }}>No notes yet. Add your first note above.</div>
                )}
              </div>
            </div>
          )}

          </div>
        </div>
      </div>
    </div>
  )
}

function CoalitionAddModal({ onAdd, onClose, onToast }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  const [name, setName] = useState("")
  const [state, setState] = useState("")
  const [pitch, setPitch] = useState("")
  const [sentBy, setSentBy] = useState("Julian")
  const [stage, setStage] = useState("outreach")

  // Contacts — from CRM and manual
  const [selectedContacts, setSelectedContacts] = useState([])
  const [manualContact, setManualContact] = useState({ name: "", title: "", email: "", miniGrantAuthority: false })
  const [showManualContact, setShowManualContact] = useState(false)
  const [noteText, setNoteText] = useState("")

  // Unique coalition names from MASTER_COALITION_CONTACTS
  const uniqueCoalitions = [...new Set(MASTER_COALITION_CONTACTS.map(c => c.coal))].filter(Boolean)
  const searchResults = searchTerm.length >= 1
    ? uniqueCoalitions.filter(c => c.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8)
    : []
  const selectedCoalContacts = name ? MASTER_COALITION_CONTACTS.filter(c => c.coal === name) : []

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectCoalition = (coalName) => {
    setName(coalName)
    setSearchTerm(coalName)
    setShowDropdown(false)
    setSelectedContacts([])
    // Try to infer state from the first contact's data
    const first = MASTER_COALITION_CONTACTS.find(c => c.coal === coalName)
    if (first?.pa) setPitch(first.pa)
  }

  const toggleContact = (idx) => {
    setSelectedContacts(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  const isValid = name.trim().length > 0

  const handleAdd = () => {
    if (!isValid) return
    const contacts = []
    for (const idx of selectedContacts) {
      const c = selectedCoalContacts[idx]
      contacts.push({ name: c.n, title: c.t, email: c.e, phone: c.ph, miniGrantAuthority: c.mga === "YES" || c.mga === "yes" })
    }
    if (manualContact.name) {
      contacts.push({ name: manualContact.name, title: manualContact.title, email: manualContact.email, miniGrantAuthority: manualContact.miniGrantAuthority })
    }
    if (contacts.length === 0) {
      contacts.push({ name: "", title: "", email: "", miniGrantAuthority: false })
    }
    onAdd({
      id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36),
      name,
      state,
      stage,
      contacts,
      pitchAngle: pitch,
      sentBy,
      notes: [{ date: new Date().toISOString().slice(0, 10), text: noteText || "Added to pipeline" }],
      linkedUniversities: [],
    })
    if (onToast) onToast(`${name} added to coalition pipeline`)
  }

  const inputCls = "w-full text-sm border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20"
  const labelCls = "block text-xs font-medium text-gray-500 mb-1.5"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white shadow-2xl w-[600px] max-h-[90vh] overflow-y-auto animate-fade-in" style={{ borderRadius: "1rem", padding: "36px 40px 32px" }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[22px] font-medium" style={{ color: "#000000" }}>Add Coalition</h2>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ color: "#333333" }}><X size={20} /></button>
        </div>

        {/* Search */}
        <div className="mb-6">
          <label className={labelCls}>Search CRM coalitions</label>
          <div className="relative" ref={dropdownRef}>
            <div className="relative">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Type to search coalitions..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true) }}
                onFocus={() => searchTerm.length >= 1 && setShowDropdown(true)}
                className={inputCls + " pl-10"}
                autoFocus
              />
            </div>
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-[200px] overflow-y-auto">
                {searchResults.map((coal, i) => {
                  const contactCount = MASTER_COALITION_CONTACTS.filter(c => c.coal === coal).length
                  return (
                    <button key={i} onClick={() => selectCoalition(coal)} className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center justify-between border-b border-gray-50 last:border-0">
                      <span className="text-sm font-medium text-gray-900">{coal}</span>
                      {contactCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT }}>{contactCount} contact{contactCount !== 1 ? "s" : ""}</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className="mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Coalition name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Missouri PIP" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>State</label>
              <input type="text" value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="e.g. MO" className={inputCls} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Stage</label>
              <select value={stage} onChange={(e) => setStage(e.target.value)} className={inputCls}>
                {COALITION_STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Sent by</label>
              <div className="flex gap-2 mt-1">
                {["Julian", "Fred"].map(person => (
                  <button key={person} type="button" onClick={() => setSentBy(person)} className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px] font-medium transition-all" style={{ backgroundColor: sentBy === person ? (person === "Julian" ? "#EAF6F5" : "#F0F0F0") : "transparent", color: sentBy === person ? (person === "Julian" ? "#5BB4A9" : "#333333") : "#999999", border: sentBy === person ? "none" : "1px solid #E5E5E5" }}>
                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold" style={{ background: person === "Julian" ? GRADIENT : "#6B7280" }}>{person[0]}</div>
                    {person}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <label className={labelCls}>Pitch angle</label>
            <textarea value={pitch} onChange={(e) => setPitch(e.target.value)} placeholder="Describe the approach for this coalition..." rows={2} className={inputCls + " resize-y"} />
          </div>
        </div>

        {/* Contacts */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users size={14} style={{ color: ACCENT }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: ACCENT }}>Contacts</span>
            </div>
            <button onClick={() => setShowManualContact(!showManualContact)} className="text-xs font-medium flex items-center gap-1" style={{ color: ACCENT }}>
              <Plus size={12} /> Add manually
            </button>
          </div>

          {selectedCoalContacts.length > 0 ? (
            <div className="space-y-2 mb-3">
              {selectedCoalContacts.map((c, idx) => (
                <button key={idx} onClick={() => toggleContact(idx)} className="w-full text-left px-4 py-3 rounded-lg border transition-all flex items-start gap-3" style={{ borderColor: selectedContacts.includes(idx) ? ACCENT : "#E5E5E5", backgroundColor: selectedContacts.includes(idx) ? ACCENT_LIGHT : "white" }}>
                  <div className="w-5 h-5 mt-0.5 rounded border flex items-center justify-center flex-shrink-0" style={{ borderColor: selectedContacts.includes(idx) ? ACCENT : "#D1D5DB", backgroundColor: selectedContacts.includes(idx) ? ACCENT : "white" }}>
                    {selectedContacts.includes(idx) && <Check size={12} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{c.n}</div>
                    <div className="text-xs text-gray-500 truncate">{c.t}{c.rl ? ` · ${c.rl}` : ""}</div>
                    {c.e && <div className="text-xs mt-0.5" style={{ color: ACCENT }}>{c.e}</div>}
                  </div>
                  {c.mga && c.mga.toUpperCase() === "YES" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">Mini-Grant Auth</span>}
                </button>
              ))}
            </div>
          ) : (
            !showManualContact && <div className="text-xs text-gray-400 mb-3 px-1">{name ? "No CRM contacts found for this coalition." : "Select a coalition above to see contacts, or add manually."}</div>
          )}

          {showManualContact && (
            <div className="border border-gray-200 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Name</label>
                  <input type="text" value={manualContact.name} onChange={(e) => setManualContact(prev => ({ ...prev, name: e.target.value }))} placeholder="Contact name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Title</label>
                  <input type="text" value={manualContact.title} onChange={(e) => setManualContact(prev => ({ ...prev, title: e.target.value }))} placeholder="Title" className={inputCls} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Email</label>
                  <input type="email" value={manualContact.email} onChange={(e) => setManualContact(prev => ({ ...prev, email: e.target.value }))} placeholder="email@org.org" className={inputCls} />
                </div>
                <label className="flex items-center gap-2 self-end pb-3 cursor-pointer">
                  <input type="checkbox" checked={manualContact.miniGrantAuthority} onChange={(e) => setManualContact(prev => ({ ...prev, miniGrantAuthority: e.target.checked }))} className="rounded" />
                  <span className="text-xs text-gray-600">Mini-grant authority</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className={labelCls}>Notes</label>
          <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Optional notes..." rows={2} className={inputCls + " resize-y"} />
        </div>

        {/* Actions */}
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 px-6 py-3.5 rounded-full text-[15px] font-medium hover:bg-gray-50 transition-colors" style={{ border: "1px solid #5BB4A9", color: "#5BB4A9", borderRadius: "999px" }}>Cancel</button>
          <button onClick={handleAdd} className="flex-1 px-6 py-3.5 text-white text-[15px] font-medium hover:opacity-90 transition-colors" style={{ background: isValid ? GRADIENT : "#D1D5DB", borderRadius: "999px", cursor: isValid ? "pointer" : "not-allowed" }} disabled={!isValid}>Add to Pipeline</button>
        </div>
      </div>
    </div>
  )
}

function CoalitionPipelinePage({ coalitions, onSelectCoalition, onUpdate, setCoalitionAddOpen }) {
  const [draggedId, setDraggedId] = useState(null)
  const [dragOverGroup, setDragOverGroup] = useState(null)

  const byStage = (stages) => coalitions.filter(c => stages.includes(c.stage))

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <div className="flex items-center justify-between" style={{ marginBottom: "20px" }}>
          <div>
            <h1 className="font-medium" style={{ fontSize: "32px", color: "#000000" }}>Coalition Partners</h1>
            <p className="text-[14px] mt-1" style={{ color: "#333333" }}>{coalitions.length} coalitions tracked</p>
          </div>
          <button onClick={() => setCoalitionAddOpen(true)} className="flex items-center gap-2 text-white text-[15px] font-medium hover:opacity-90 transition-opacity" style={{ background: GRADIENT, borderRadius: "999px", padding: "12px 28px" }}>
            <Plus size={16} /> Add Coalition
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: "40px" }}>
        <MetricCard label="Total Coalitions" value={coalitions.length} icon={Users} />
        <MetricCard label="Active Conversations" value={byStage(["conversation_active"]).length} icon={Mail} />
        <MetricCard label="Proposals Out" value={byStage(["proposal_submitted"]).length} icon={FileText} />
        <MetricCard label="Funding Committed" value={byStage(["funding_committed", "active"]).length} icon={DollarSign} />
      </div>

      {/* Kanban */}
      <div className="flex gap-5 overflow-x-auto pb-4">
        {COALITION_KANBAN_GROUPS.map(group => {
          const groupCoalitions = coalitions.filter(c => group.stages.includes(c.stage))
          return (
            <div
              key={group.id}
              className="flex-shrink-0 w-72 rounded-xl p-2 -m-2 transition-colors duration-200"
              style={{ backgroundColor: dragOverGroup === group.id ? "rgba(91,180,169,0.08)" : "transparent", outline: dragOverGroup === group.id ? "2px solid rgba(91,180,169,0.3)" : "none", outlineOffset: "-2px", borderRadius: "12px" }}
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
                <div className="flex items-center gap-2">
                  <h3 className="text-[15px] font-medium" style={{ color: "#000000" }}>{group.label}</h3>
                  <span className="text-[14px] font-normal px-2.5 py-1 rounded-full" style={{ color: "#5BB4A9", backgroundColor: "#EAF6F5" }}>{groupCoalitions.length}</span>
                </div>
              </div>
              <div className="space-y-3">
                {groupCoalitions.map(coalition => {
                  const stageInfo = getCoalitionStage(coalition.stage)
                  const contactCount = (coalition.contacts || []).filter(c => c.name).length
                  return (
                    <div
                      key={coalition.id}
                      draggable
                      onDragStart={(e) => { setDraggedId(coalition.id); e.dataTransfer.effectAllowed = "move" }}
                      onDragEnd={() => { setDraggedId(null); setDragOverGroup(null) }}
                      onClick={() => onSelectCoalition(coalition.id)}
                      className={`w-full bg-white text-left transition-all duration-200 cursor-grab active:cursor-grabbing ${draggedId === coalition.id ? "opacity-40" : ""}`}
                      style={{ padding: "16px 20px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)", borderLeft: `4px solid ${stageInfo.color}` }}
                    >
                      {/* Name + State */}
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[15px] font-medium" style={{ color: "#000000" }}>{coalition.name}</span>
                          {coalition.sentBy && (
                            <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style={{ background: coalition.sentBy === "Julian" ? GRADIENT : "#6B7280", flexShrink: 0 }} title={`Sent by ${coalition.sentBy}`}>
                              {coalition.sentBy[0]}
                            </div>
                          )}
                        </div>
                        <span className="text-[12px] px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F0F0F0", color: "#6B7280" }}>{coalition.state}</span>
                      </div>

                      {/* Pitch preview */}
                      <div className="text-[13px] mb-3 line-clamp-2" style={{ color: "#333333" }}>
                        {coalition.pitchAngle || "No pitch angle set"}
                      </div>

                      {/* Metadata */}
                      <div className="flex items-center gap-3 text-[11px]" style={{ color: "#333333" }}>
                        <span className="flex items-center gap-1" title="Contacts">
                          <Users size={12} /> {contactCount} contact{contactCount !== 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1" title="Linked universities">
                          <Building2 size={12} /> {(coalition.linkedUniversities || []).length} linked
                        </span>
                        <span className="flex items-center gap-1" title="Notes">
                          <StickyNote size={12} /> {(coalition.notes || []).length}
                        </span>
                      </div>
                    </div>
                  )
                })}
                {groupCoalitions.length === 0 && (
                  <div className="text-[11px] text-center py-8" style={{ color: "#E5E5E5" }}>No coalitions</div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── FULFILLMENT DASHBOARD ───
const ONBOARDING_STEPS = [
  "Welcome Email Sent",
  "Rollout Kit Delivered",
  "Distribution Channels Confirmed",
  "Voucher Codes Distributed",
  "First Report Sent",
]

function FulfillmentDashboard({ universities, onSelectSchool, onUpdate }) {
  const partners = universities.filter(u => u.stage === "active_partner")
  const [expandedSections, setExpandedSections] = useState({})

  const toggleSection = (schoolId, section) => {
    setExpandedSections(prev => ({
      ...prev,
      [`${schoolId}-${section}`]: !prev[`${schoolId}-${section}`],
    }))
  }

  const isSectionOpen = (schoolId, section) => expandedSections[`${schoolId}-${section}`] ?? false

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 className="font-medium" style={{ fontSize: "32px", color: "#000000" }}>Fulfillment Dashboard</h1>
        <p className="text-[14px] mt-1" style={{ color: "#333333" }}>{partners.length} active partnerships</p>
      </div>

      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: "40px" }}>
        <MetricCard label="Total Partners" value={partners.length} icon={Award} />
        <MetricCard label="Active Users" value={partners.reduce((s, u) => s + u.activeUsers, 0)} icon={Users} />
        <MetricCard label="Total Signups" value={partners.reduce((s, u) => s + u.totalSignups, 0)} icon={TrendingUp} />
        <MetricCard label="Revenue Collected" value={formatCurrency(partners.reduce((s, u) => s + u.amountPaid, 0))} icon={DollarSign} />
      </div>

      <div className="space-y-6">
        {partners.map(school => {
          const checklist = school.onboardingChecklist || [false, false, false, false, false]
          const checklistDone = checklist.filter(Boolean).length
          const upsells = school.upsells || { appCustomization: "not_offered", educationModules: "not_offered" }
          const outreach = school.campusOutreach || { posters: 0, tabling: 0, socialMedia: 0, facultyReferrals: 0 }
          const campaigns = school.specialCampaigns || [
            { name: "420 Campaign", active: false, date: "", notes: "" },
            { name: "New Year's Campaign", active: false, date: "", notes: "" },
            { name: "School Year Campaign", active: false, date: "", notes: "" },
            { name: "Custom Campaign", active: false, date: "", notes: "" },
          ]

          return (
            <div key={school.id} className="bg-white" style={{ borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)", borderLeft: school.attentionNeeded ? "4px solid #E53E3E" : "none" }}>
              {/* Card Header */}
              <div style={{ padding: "24px 32px", borderBottom: "1px solid #E5E5E5" }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-[17px] font-medium" style={{ color: "#000000" }}>{school.name}</h3>
                      <button onClick={() => onSelectSchool(school.id)} className="text-[13px] hover:underline" style={{ color: "#5BB4A9" }}>View Details</button>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <PartnerTypeBadge type={school.partnerType} />
                      {school.attentionNeeded && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium" style={{ color: "#E53E3E" }}>
                          <AlertTriangle size={12} /> Needs attention
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="rounded-2xl text-center" style={{ padding: "12px 20px", backgroundColor: "#EAF6F5" }}>
                    <div className="text-xl font-medium" style={{ color: "#000000" }}>{school.activeUsers}</div>
                    <div className="text-[11px] mt-1" style={{ color: "#333333" }}>Active</div>
                  </div>
                  <div className="rounded-2xl text-center" style={{ padding: "12px 20px", backgroundColor: "#EAF6F5" }}>
                    <div className="text-xl font-medium" style={{ color: "#000000" }}>{school.totalSignups}</div>
                    <div className="text-[11px] mt-1" style={{ color: "#333333" }}>Signups</div>
                  </div>
                  <div className="rounded-2xl text-center" style={{ padding: "12px 20px", backgroundColor: "#EAF6F5" }}>
                    <div className="text-xl font-medium" style={{ color: "#000000" }}>{formatCurrency(school.amountPaid)}</div>
                    <div className="text-[11px] mt-1" style={{ color: "#333333" }}>Paid</div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 text-[14px]">
                  <div>
                    <span style={{ color: "#333333" }}>Launched: </span>
                    <span className="font-medium" style={{ color: "#000000" }}>{formatDate(school.launchDate)}</span>
                  </div>
                  <div>
                    <span style={{ color: "#333333" }}>Contract: </span>
                    <span className="font-medium" style={{ color: "#000000" }}>{school.contractTerm || "—"}</span>
                  </div>
                  <div>
                    <span style={{ color: "#333333" }}>Next Report: </span>
                    <span className="font-medium" style={{ color: school.nextReportDue && daysUntil(school.nextReportDue) < 14 ? "#F5A623" : "#000000" }}>
                      {school.nextReportDue ? `${formatDate(school.nextReportDue)}` : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Onboarding Checklist */}
              <div style={{ borderBottom: "1px solid #E5E5E5" }}>
                <button
                  onClick={() => toggleSection(school.id, "onboarding")}
                  className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  style={{ padding: "16px 32px" }}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle size={16} style={{ color: "#5BB4A9" }} />
                    <span className="text-[14px] font-medium" style={{ color: "#000000" }}>Onboarding Checklist</span>
                    <span className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ backgroundColor: checklistDone === 5 ? "#EAF6F5" : "#FFF5E5", color: checklistDone === 5 ? "#5BB4A9" : "#F5A623" }}>
                      {checklistDone}/5
                    </span>
                  </div>
                  <ChevronDown size={16} style={{ color: "#999999", transform: isSectionOpen(school.id, "onboarding") ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {isSectionOpen(school.id, "onboarding") && (
                  <div style={{ padding: "0 32px 20px" }}>
                    <div className="space-y-1">
                      {ONBOARDING_STEPS.map((step, idx) => {
                        const canCheck = idx === 0 || checklist[idx - 1]
                        return (
                          <label
                            key={idx}
                            className={`flex items-center gap-3 py-2.5 px-4 rounded-xl transition-colors ${canCheck ? "cursor-pointer hover:bg-gray-50" : "opacity-50 cursor-not-allowed"}`}
                          >
                            <input
                              type="checkbox"
                              checked={checklist[idx]}
                              disabled={!canCheck}
                              onChange={() => {
                                if (!canCheck) return
                                const newChecklist = [...checklist]
                                newChecklist[idx] = !newChecklist[idx]
                                if (!newChecklist[idx]) {
                                  for (let i = idx + 1; i < newChecklist.length; i++) newChecklist[i] = false
                                }
                                onUpdate(school.id, { onboardingChecklist: newChecklist })
                              }}
                              className="w-4 h-4 rounded accent-[#5BB4A9]"
                            />
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold rounded-full flex items-center justify-center" style={{ width: "20px", height: "20px", backgroundColor: checklist[idx] ? "#5BB4A9" : "#E5E5E5", color: checklist[idx] ? "#FFFFFF" : "#999999" }}>
                                {checklist[idx] ? <Check size={10} /> : idx + 1}
                              </span>
                              <span className={`text-[14px] ${checklist[idx] ? "line-through text-gray-400" : ""}`} style={{ color: checklist[idx] ? undefined : "#000000" }}>{step}</span>
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Upsell Tracking */}
              <div style={{ borderBottom: "1px solid #E5E5E5" }}>
                <button
                  onClick={() => toggleSection(school.id, "upsells")}
                  className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  style={{ padding: "16px 32px" }}
                >
                  <div className="flex items-center gap-3">
                    <TrendingUp size={16} style={{ color: "#5BB4A9" }} />
                    <span className="text-[14px] font-medium" style={{ color: "#000000" }}>Upsell Tracking</span>
                  </div>
                  <ChevronDown size={16} style={{ color: "#999999", transform: isSectionOpen(school.id, "upsells") ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {isSectionOpen(school.id, "upsells") && (
                  <div style={{ padding: "0 32px 20px" }}>
                    <div className="space-y-3">
                      {[
                        { key: "appCustomization", label: "App Customization" },
                        { key: "educationModules", label: "Education Modules" },
                      ].map(({ key, label }) => (
                        <div key={key} className="flex items-center justify-between rounded-xl" style={{ padding: "12px 16px", backgroundColor: "#F9FAFB" }}>
                          <span className="text-[14px]" style={{ color: "#000000" }}>{label}</span>
                          <select
                            value={upsells[key]}
                            onChange={(e) => onUpdate(school.id, { upsells: { ...upsells, [key]: e.target.value } })}
                            className="text-[13px] font-medium rounded-lg px-3 py-1.5 focus:outline-none cursor-pointer"
                            style={{
                              border: "1px solid #E5E5E5",
                              color: upsells[key] === "accepted" ? "#80C97A" : upsells[key] === "declined" ? "#E53E3E" : upsells[key] === "offered" ? "#F5A623" : "#999999",
                            }}
                          >
                            <option value="not_offered">Not Offered</option>
                            <option value="offered">Offered</option>
                            <option value="accepted">Accepted</option>
                            <option value="declined">Declined</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Campus Outreach */}
              <div style={{ borderBottom: "1px solid #E5E5E5" }}>
                <button
                  onClick={() => toggleSection(school.id, "outreach")}
                  className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  style={{ padding: "16px 32px" }}
                >
                  <div className="flex items-center gap-3">
                    <Building2 size={16} style={{ color: "#5BB4A9" }} />
                    <span className="text-[14px] font-medium" style={{ color: "#000000" }}>Campus Outreach</span>
                  </div>
                  <ChevronDown size={16} style={{ color: "#999999", transform: isSectionOpen(school.id, "outreach") ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {isSectionOpen(school.id, "outreach") && (
                  <div style={{ padding: "0 32px 20px" }}>
                    <div className="grid grid-cols-2 gap-3">
                      {[
                        { key: "posters", label: "Posters Distributed" },
                        { key: "tabling", label: "Tabling Events" },
                        { key: "socialMedia", label: "Social Media Posts" },
                        { key: "facultyReferrals", label: "Faculty Referrals" },
                      ].map(({ key, label }) => (
                        <div key={key} className="rounded-xl" style={{ padding: "12px 16px", backgroundColor: "#F9FAFB" }}>
                          <div className="text-[12px] mb-1.5" style={{ color: "#999999" }}>{label}</div>
                          <input
                            type="number"
                            min="0"
                            value={outreach[key]}
                            onChange={(e) => onUpdate(school.id, { campusOutreach: { ...outreach, [key]: parseInt(e.target.value) || 0 } })}
                            className="w-full text-[16px] font-medium bg-transparent focus:outline-none"
                            style={{ color: "#000000" }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Special Campaigns */}
              <div style={{ borderBottom: "1px solid #E5E5E5" }}>
                <button
                  onClick={() => toggleSection(school.id, "campaigns")}
                  className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  style={{ padding: "16px 32px" }}
                >
                  <div className="flex items-center gap-3">
                    <Star size={16} style={{ color: "#5BB4A9" }} />
                    <span className="text-[14px] font-medium" style={{ color: "#000000" }}>Special Campaigns</span>
                    <span className="text-[12px] px-2.5 py-0.5 rounded-full" style={{ backgroundColor: "#EAF6F5", color: "#5BB4A9" }}>
                      {campaigns.filter(c => c.active).length} active
                    </span>
                  </div>
                  <ChevronDown size={16} style={{ color: "#999999", transform: isSectionOpen(school.id, "campaigns") ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {isSectionOpen(school.id, "campaigns") && (
                  <div style={{ padding: "0 32px 20px" }}>
                    <div className="space-y-3">
                      {campaigns.map((campaign, idx) => (
                        <div key={idx} className="rounded-xl" style={{ padding: "14px 16px", backgroundColor: "#F9FAFB" }}>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[14px] font-medium" style={{ color: "#000000" }}>{campaign.name}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={campaign.active}
                                onChange={() => {
                                  const newCampaigns = [...campaigns]
                                  newCampaigns[idx] = { ...newCampaigns[idx], active: !newCampaigns[idx].active }
                                  onUpdate(school.id, { specialCampaigns: newCampaigns })
                                }}
                                className="sr-only peer"
                              />
                              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" style={{ backgroundColor: campaign.active ? "#5BB4A9" : "#D1D5DB" }}></div>
                            </label>
                          </div>
                          {campaign.active && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <div>
                                <div className="text-[11px] mb-1" style={{ color: "#999999" }}>Date</div>
                                <input
                                  type="date"
                                  value={campaign.date}
                                  onChange={(e) => {
                                    const newCampaigns = [...campaigns]
                                    newCampaigns[idx] = { ...newCampaigns[idx], date: e.target.value }
                                    onUpdate(school.id, { specialCampaigns: newCampaigns })
                                  }}
                                  className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20"
                                />
                              </div>
                              <div>
                                <div className="text-[11px] mb-1" style={{ color: "#999999" }}>Notes</div>
                                <input
                                  type="text"
                                  value={campaign.notes}
                                  placeholder="Campaign notes..."
                                  onChange={(e) => {
                                    const newCampaigns = [...campaigns]
                                    newCampaigns[idx] = { ...newCampaigns[idx], notes: e.target.value }
                                    onUpdate(school.id, { specialCampaigns: newCampaigns })
                                  }}
                                  className="w-full text-[13px] border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Next Meeting */}
              <div>
                <button
                  onClick={() => toggleSection(school.id, "meeting")}
                  className="w-full flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  style={{ padding: "16px 32px" }}
                >
                  <div className="flex items-center gap-3">
                    <Calendar size={16} style={{ color: "#5BB4A9" }} />
                    <span className="text-[14px] font-medium" style={{ color: "#000000" }}>Next Meeting</span>
                    {school.nextMeetingDate && (
                      <span className="text-[12px]" style={{ color: "#333333" }}>{formatDate(school.nextMeetingDate)}</span>
                    )}
                  </div>
                  <ChevronDown size={16} style={{ color: "#999999", transform: isSectionOpen(school.id, "meeting") ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                </button>
                {isSectionOpen(school.id, "meeting") && (
                  <div style={{ padding: "0 32px 20px" }}>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[12px] mb-1.5" style={{ color: "#999999" }}>Meeting Date</div>
                        <input
                          type="date"
                          value={school.nextMeetingDate || ""}
                          onChange={(e) => onUpdate(school.id, { nextMeetingDate: e.target.value })}
                          className="w-full text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20"
                        />
                      </div>
                      <div>
                        <div className="text-[12px] mb-1.5" style={{ color: "#999999" }}>Meeting Notes</div>
                        <input
                          type="text"
                          value={school.nextMeetingNotes || ""}
                          placeholder="What to discuss..."
                          onChange={(e) => onUpdate(school.id, { nextMeetingNotes: e.target.value })}
                          className="w-full text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Distribution Channels Footer */}
              <div className="flex flex-wrap gap-1.5" style={{ padding: "12px 32px 16px", borderTop: "1px solid #E5E5E5" }}>
                {(school.distributionChannels || []).map(ch => (
                  <span key={ch} className="px-3 py-1.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: "#EAF6F5", color: "#5BB4A9" }}>{ch}</span>
                ))}
              </div>
            </div>
          )
        })}
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
    doc.setFillColor(91, 180, 169)
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
      const primaryContactName = school.contacts?.[0] ? `${school.contacts[0].firstName} ${school.contacts[0].lastName}`.trim() : school.contactName
      if (primaryContactName) { doc.text(`Attn: ${primaryContactName}`, margin, y); y += 6 }
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
        <h1 className="font-medium" style={{ fontSize: "32px", color: "#000000" }}>Document Generator</h1>
        <p className="text-[14px] mt-1" style={{ color: "#333333" }}>Generate customized partnership documents</p>
      </div>

      {/* Step 1: Select School */}
      <div className="bg-white p-5 mb-4" style={{ borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
        <h3 className="text-[14px] font-medium mb-3" style={{ color: "#333333" }}>1. Select University</h3>
        <select
          value={selectedSchool}
          onChange={(e) => { setSelectedSchool(e.target.value); setDocType(null) }}
          className="w-full text-[13px] border border-gray-200 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20"
        >
          <option value="">Choose a university...</option>
          {universities.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Step 2: Choose Document Type */}
      {selectedSchool && (
        <div className="bg-white p-5 mb-4" style={{ borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
          <h3 className="text-[14px] font-medium mb-3" style={{ color: "#333333" }}>2. Choose Document Type</h3>
          <div className="grid grid-cols-2 gap-3">
            {docTypes.map(dt => {
              const Icon = dt.icon
              const active = docType === dt.id
              return (
                <button
                  key={dt.id}
                  onClick={() => setDocType(dt.id)}
                  className="text-left transition-all"
                  style={{ borderRadius: "1rem", border: active ? "2px solid #5BB4A9" : "1px solid #E5E5E5", backgroundColor: active ? "#EAF6F5" : "#FFFFFF", padding: "16px 24px" }}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon size={16} style={{ color: active ? "#5BB4A9" : "#333333" }} />
                    <span className="text-[14px] font-medium" style={{ color: active ? "#5BB4A9" : "#000000" }}>{dt.label}</span>
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
        <div className="bg-white" style={{ padding: "24px 32px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
          <h3 className="text-[14px] font-medium mb-3" style={{ color: "#333333" }}>3. Generate</h3>
          <div className="rounded-2xl mb-4 text-[14px] space-y-2" style={{ padding: "20px 32px", backgroundColor: "#EAF6F5", color: "#333333" }}>
            <div><strong>University:</strong> {school.name}</div>
            <div><strong>Domain:</strong> @{school.emailDomain || "—"}</div>
            <div><strong>Students:</strong> {school.studentPopulation?.toLocaleString()}</div>
            <div><strong>Contact:</strong> {school.contacts?.[0] ? `${school.contacts[0].firstName} ${school.contacts[0].lastName}`.trim() : school.contactName || "—"}</div>
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
  const pipelineOnly = universities.filter(u => u.stage !== "active_partner" && u.stage !== "closed_lost")
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
  const COLORS = ["#5BB4A9", "#80C97A", "#4A9E94"]

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
      <div style={{ marginBottom: "32px" }}>
        <h1 className="font-medium" style={{ fontSize: "32px", color: "#000000" }}>Analytics</h1>
        <p className="text-[14px] mt-1" style={{ color: "#333333" }}>Pipeline performance and revenue overview</p>
      </div>

      <div className="grid grid-cols-4 gap-6" style={{ marginBottom: "40px" }}>
        <MetricCard label="Total Pipeline Value" value={formatCurrency(pipelineStandard)} sub="Standard pricing" icon={DollarSign} />
        <MetricCard label="Premium Potential" value={formatCurrency(pipelinePremium)} sub="If all go premium" icon={TrendingUp} />
        <MetricCard label="Revenue Collected" value={formatCurrency(activeRevenue)} sub={`${active.length} partners`} icon={Award} />
        <MetricCard label="Avg Deal Size" value={formatCurrency(Math.round(pipelineStandard / (pipelineOnly.length || 1)))} sub="Standard" icon={BarChart3} />
      </div>

      <div className="grid grid-cols-2 gap-5 mb-8">
        {/* Pipeline Funnel */}
        <div className="bg-white" style={{ padding: "24px 32px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
          <h3 className="text-[15px] font-medium mb-3" style={{ color: "#000000" }}>Pipeline Funnel</h3>
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
        <div className="bg-white" style={{ padding: "24px 32px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
          <h3 className="text-[15px] font-medium mb-3" style={{ color: "#000000" }}>Confidence Distribution</h3>
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
      <div className="bg-white" style={{ padding: "24px 32px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
        <h3 className="text-[15px] font-medium mb-3" style={{ color: "#000000" }}>Upcoming Actions</h3>
        <div className="space-y-2">
          {upcoming.map(school => {
            const days = daysUntil(school.nextActionDate)
            const overdue = days !== null && days < 0
            return (
              <div key={school.id} className={`flex items-center gap-4 rounded-2xl ${overdue ? "bg-red-50" : "bg-gray-50"}`} style={{ padding: "12px 24px" }}>
                <div className={`text-xs font-bold w-16 text-center ${overdue ? "text-[#E53E3E]" : "text-gray-500"}`}>
                  {overdue ? `${Math.abs(days)}d ago` : days === 0 ? "TODAY" : `${days}d`}
                </div>
                <div className="flex-1">
                  <div className="text-[14px] font-medium" style={{ color: "#000000" }}>{school.shortName}</div>
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
        <h1 className="font-medium" style={{ fontSize: "32px", color: "#000000" }}>Settings</h1>
        <p className="text-[14px] mt-1" style={{ color: "#333333" }}>Manage your data and preferences</p>
      </div>

      <div className="space-y-4 max-w-xl">
        <div className="bg-white" style={{ padding: "24px 32px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
          <h3 className="text-[15px] font-medium mb-3" style={{ color: "#000000" }}>Data Management</h3>
          <div className="space-y-2.5">
            <button
              onClick={() => exportData(universities)}
              className="w-full flex items-center gap-4 rounded-2xl hover:opacity-90 transition-colors text-left"
              style={{ padding: "14px 28px", backgroundColor: "#EAF6F5" }}
            >
              <Download size={16} style={{ color: "#5BB4A9" }} />
              <div>
                <div className="text-[14px] font-medium" style={{ color: "#000000" }}>Export Data</div>
                <div className="text-[11px]" style={{ color: "#333333" }}>Download a JSON backup of all your data</div>
              </div>
            </button>

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center gap-4 rounded-2xl hover:opacity-90 transition-colors text-left"
              style={{ padding: "14px 28px", backgroundColor: "#EAF6F5" }}
            >
              <Upload size={16} style={{ color: "#5BB4A9" }} />
              <div>
                <div className="text-[14px] font-medium" style={{ color: "#000000" }}>Import Data</div>
                <div className="text-[11px]" style={{ color: "#333333" }}>Load data from a JSON backup file</div>
              </div>
            </button>
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />

            <button
              onClick={() => {
                if (confirm("Reset all data to defaults? This cannot be undone.")) onReset()
              }}
              className="w-full flex items-center gap-4 rounded-2xl hover:opacity-90 transition-colors text-left"
              style={{ padding: "14px 28px", backgroundColor: "#FFF5F5" }}
            >
              <RotateCcw size={16} style={{ color: "#E53E3E" }} />
              <div>
                <div className="text-[14px] font-medium" style={{ color: "#E53E3E" }}>Reset to Defaults</div>
                <div className="text-[11px]" style={{ color: "#E53E3E" }}>Restore original seed data (destroys current data)</div>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-white" style={{ padding: "24px 32px", borderRadius: "1rem", boxShadow: "0px 2px 15px rgba(0,0,0,0.15)" }}>
          <h3 className="text-[15px] font-medium mb-3" style={{ color: "#000000" }}>About</h3>
          <div className="text-[14px] space-y-1" style={{ color: "#333333" }}>
            <div>Clear30 Sales Hub v1.0</div>
            <div>{universities.length} universities tracked</div>
            <div>Data stored locally in your browser</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── PRICING TIERS ───
function getPriceTier(pop) {
  if (pop < 5000) return { standard: 2500, premium: 6250 }
  if (pop < 10000) return { standard: 6000, premium: 15000 }
  if (pop < 20000) return { standard: 10000, premium: 25000 }
  return { standard: 17000, premium: 42500 }
}

// ─── ADD SCHOOL MODAL ───
function QuickAddModal({ onAdd, onClose, onToast }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedUni, setSelectedUni] = useState(null)
  const dropdownRef = useRef(null)
  const [name, setName] = useState("")
  const [shortName, setShortName] = useState("")
  const [state, setState] = useState("")
  const [website, setWebsite] = useState("")
  const [students, setStudents] = useState("")
  const [selectedContacts, setSelectedContacts] = useState([])
  const [manualContact, setManualContact] = useState({ name: "", title: "", email: "", phone: "" })
  const [showManualContact, setShowManualContact] = useState(false)
  const [showAIImport, setShowAIImport] = useState(false)
  const [aiContacts, setAiContacts] = useState([])
  const [stage, setStage] = useState("outreach")
  const [sentBy, setSentBy] = useState("Julian")
  const [leadMagnet, setLeadMagnet] = useState("")
  const [confidence, setConfidence] = useState("N/A")
  const [nextAction, setNextAction] = useState("Send initial outreach email")
  const [nextActionDate, setNextActionDate] = useState(new Date().toISOString().slice(0, 10))
  const [noteText, setNoteText] = useState("")

  const searchResults = searchTerm.length >= 2
    ? MASTER_UNIVERSITIES.filter(u => u.n.toLowerCase().includes(searchTerm.toLowerCase())).slice(0, 8)
    : []

  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setShowDropdown(false) }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const selectUniversity = (uni) => {
    setSelectedUni(uni); setName(uni.n); setState(uni.s); setWebsite(uni.w); setStudents(uni.p ? String(uni.p) : ""); setSearchTerm(uni.n); setShowDropdown(false); setSelectedContacts([]); setShowManualContact(false)
  }
  const clearSelection = () => {
    setSelectedUni(null); setName(""); setShortName(""); setState(""); setWebsite(""); setStudents(""); setSearchTerm(""); setSelectedContacts([]); setShowManualContact(false)
  }
  const toggleContact = (idx) => {
    setSelectedContacts(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx])
  }

  const pop = parseInt(students) || 0
  const tier = getPriceTier(pop)
  const hasContact = selectedContacts.length > 0 || (manualContact.name && manualContact.email) || aiContacts.length > 0
  const isValid = name && hasContact

  const handleAdd = () => {
    if (!isValid) return
    const newContacts = []
    if (selectedUni?.c) {
      for (const idx of selectedContacts) {
        const c = selectedUni.c[idx]
        newContacts.push({ firstName: c.fn || "", lastName: c.ln || "", title: c.t || "", department: c.o || "", role: "Champion", personaType: "Other", email: c.e || "", phone: c.ph || "", verifyUrl: "", outreach: "Not Contacted" })
      }
    }
    if (manualContact.name && manualContact.email) {
      const np = manualContact.name.trim().split(/\s+/)
      newContacts.push({ firstName: np[0] || "", lastName: np.slice(1).join(" ") || "", title: manualContact.title || "", department: "", role: "Champion", personaType: "Other", email: manualContact.email || "", phone: manualContact.phone || "", verifyUrl: "", outreach: "Not Contacted" })
    }
    for (const ac of aiContacts) { newContacts.push({ ...ac }) }
    const pc = newContacts[0] || {}
    onAdd({
      id: name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36),
      name, shortName: shortName || name.split(/\s+/).pop(),
      emailDomain: pc.email ? pc.email.split("@")[1] || "" : "",
      studentPopulation: pop, stage, confidence,
      contactName: pc.firstName ? `${pc.firstName} ${pc.lastName}`.trim() : "",
      contactRole: pc.title || "", contactEmail: pc.email || "",
      contacts: newContacts,
      priceStandard: tier.standard, pricePremium: tier.premium,
      selectedTier: null,
      confirmationPageSent: false, leaveWithDocSent: false, demoCompleted: false, voucherCodesSent: false, firefliesMeetingNotes: false,
      emailStep: 0, emailsSent: [],
      partnerType: null, contractTerm: null, amountPaid: 0,
      launchDate: null, distributionChannels: [], nextReportDue: null, activeUsers: 0, totalSignups: 0, attentionNeeded: false,
      sentBy, leadMagnetSent: leadMagnet || null,
      nextAction, nextActionDate,
      notes: [{ date: new Date().toISOString().slice(0, 10), text: noteText || "Added to pipeline" }],
      onboardingChecklist: [false, false, false, false, false],
      upsells: { appCustomization: "not_offered", educationModules: "not_offered" },
      campusOutreach: { posters: 0, tabling: 0, socialMedia: 0, facultyReferrals: 0 },
      specialCampaigns: [
        { name: "420 Campaign", active: false, date: "", notes: "" },
        { name: "New Year's Campaign", active: false, date: "", notes: "" },
        { name: "School Year Campaign", active: false, date: "", notes: "" },
        { name: "Custom Campaign", active: false, date: "", notes: "" },
      ],
      nextMeetingDate: "", nextMeetingNotes: "",
    })
    if (onToast) onToast(`${name} added to pipeline`)
  }

  const inputCls = "w-full text-[15px] border border-gray-200 rounded-xl px-5 py-3 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20 transition-colors"
  const labelCls = "block text-[13px] font-semibold mb-2"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-[720px] max-h-[90vh] flex flex-col animate-fade-in" style={{ borderRadius: "1.5rem", boxShadow: "0 30px 80px rgba(0,0,0,0.18)" }}>

        {/* ── Fixed Header ── */}
        <div className="flex items-center justify-between flex-shrink-0" style={{ padding: "28px 36px 24px", borderBottom: "1px solid #EBEBEB" }}>
          <div>
            <h2 className="text-[24px] font-bold" style={{ color: "#000", letterSpacing: "-0.3px" }}>Add University</h2>
            <p className="text-[14px] mt-1" style={{ color: "#888" }}>Search the database or enter details manually</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors" style={{ border: "1px solid #E5E5E5" }}><X size={18} style={{ color: "#666" }} /></button>
        </div>

        {/* ── Scrollable Content ── */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "32px 36px" }}>

          {/* ── Section 1: University Search ── */}
          <div style={{ marginBottom: "36px" }}>
            <div style={{ marginBottom: "16px" }}>
              <h3 className="text-[16px] font-bold" style={{ color: "#000" }}>University</h3>
              <p className="text-[13px] mt-1" style={{ color: "#999" }}>Search from 891 universities or type a name</p>
            </div>
            <div className="relative" ref={dropdownRef}>
              <input
                type="text"
                placeholder="Start typing a university name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); if (!e.target.value) clearSelection() }}
                onFocus={() => searchTerm.length >= 2 && setShowDropdown(true)}
                className="w-full text-[15px] border-2 rounded-2xl px-5 py-4 focus:outline-none transition-all"
                style={{ borderColor: selectedUni ? ACCENT : "#E0E0E0", backgroundColor: selectedUni ? ACCENT_LIGHT : "#FAFAFA" }}
                autoFocus
              />
              {showDropdown && searchResults.length > 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl max-h-[280px] overflow-y-auto">
                  {searchResults.map((uni, i) => (
                    <button key={i} onClick={() => selectUniversity(uni)} className="w-full text-left hover:bg-gray-50 flex items-center justify-between transition-colors" style={{ padding: "14px 20px", borderBottom: i < searchResults.length - 1 ? "1px solid #F5F5F5" : "none" }}>
                      <div>
                        <div className="text-[15px] font-semibold" style={{ color: "#000" }}>{uni.n}</div>
                        <div className="text-[13px] mt-1" style={{ color: "#888" }}>{uni.s}{uni.p ? ` · ${uni.p.toLocaleString()} students` : ""}</div>
                      </div>
                      {uni.c && <span className="text-[12px] font-medium px-3 py-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: ACCENT_LIGHT, color: ACCENT }}>{uni.c.length} contact{uni.c.length !== 1 ? "s" : ""}</span>}
                    </button>
                  ))}
                </div>
              )}
              {showDropdown && searchTerm.length >= 2 && searchResults.length === 0 && (
                <div className="absolute z-10 w-full mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl text-[14px]" style={{ padding: "20px 24px", color: "#888" }}>No universities found. The name you typed will be used as-is.</div>
              )}
            </div>

            {/* Selected university summary */}
            {selectedUni && (
              <div className="rounded-2xl" style={{ marginTop: "16px", padding: "20px 24px", backgroundColor: "#FAFAFA", border: "1px solid #EBEBEB" }}>
                <div className="flex items-center justify-between" style={{ marginBottom: "16px" }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: GRADIENT }}><Check size={14} className="text-white" /></div>
                    <span className="text-[14px] font-bold" style={{ color: ACCENT }}>Selected</span>
                  </div>
                  <button onClick={clearSelection} className="text-[13px] font-semibold px-4 py-1.5 rounded-full hover:bg-gray-100 transition-colors" style={{ color: ACCENT, border: `1px solid ${ACCENT}40` }}>Change</button>
                </div>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                  <div><div className="text-[12px] font-medium mb-1" style={{ color: "#AAA" }}>Name</div><div className="text-[14px] font-semibold" style={{ color: "#000" }}>{name}</div></div>
                  <div><div className="text-[12px] font-medium mb-1" style={{ color: "#AAA" }}>State</div><div className="text-[14px] font-semibold" style={{ color: "#000" }}>{state || "—"}</div></div>
                  <div><div className="text-[12px] font-medium mb-1" style={{ color: "#AAA" }}>Students</div><div className="text-[14px] font-semibold" style={{ color: "#000" }}>{pop > 0 ? pop.toLocaleString() : "—"}</div></div>
                  <div><div className="text-[12px] font-medium mb-1" style={{ color: "#AAA" }}>Website</div><div className="text-[14px] font-semibold" style={{ color: "#000" }}>{website || "—"}</div></div>
                </div>
                {pop > 0 && (
                  <div className="flex items-center gap-6" style={{ marginTop: "16px", paddingTop: "16px", borderTop: "1px solid #E5E5E5" }}>
                    <span className="text-[13px]" style={{ color: "#666" }}>Standard: <strong style={{ color: "#000" }}>${tier.standard.toLocaleString()}</strong></span>
                    <span className="text-[13px]" style={{ color: "#666" }}>Premium: <strong style={{ color: "#000" }}>${tier.premium.toLocaleString()}</strong></span>
                  </div>
                )}
              </div>
            )}

            {/* Manual entry if no selection */}
            {!selectedUni && name && (
              <div className="grid grid-cols-2 gap-4" style={{ marginTop: "16px" }}>
                <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></div>
                <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Short name</label><input type="text" value={shortName} onChange={(e) => setShortName(e.target.value)} placeholder="e.g. UMich" className={inputCls} /></div>
                <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>State</label><input type="text" value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="MI" className={inputCls} /></div>
                <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Students</label><input type="text" inputMode="numeric" value={students} onChange={(e) => setStudents(e.target.value.replace(/[^0-9]/g, ""))} placeholder="25000" className={inputCls} /></div>
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div style={{ height: "1px", backgroundColor: "#EBEBEB", marginBottom: "36px" }} />

          {/* ── Section 2: Contacts ── */}
          <div style={{ marginBottom: "36px" }}>
            <div style={{ marginBottom: "16px" }}>
              <h3 className="text-[16px] font-bold" style={{ color: "#000" }}>Contacts</h3>
              <p className="text-[13px] mt-1" style={{ color: "#999" }}>
                {selectedUni?.c?.length > 0 ? `${selectedUni.c.length} contacts found — tap to select` : "Add at least one contact with an email address"}
              </p>
            </div>

            {/* CRM contact cards */}
            {selectedUni?.c && selectedUni.c.length > 0 && (
              <div className="grid grid-cols-2 gap-4" style={{ marginBottom: "20px" }}>
                {selectedUni.c.map((c, idx) => {
                  const sel = selectedContacts.includes(idx)
                  const hasEmail = !!c.e
                  return (
                    <button key={idx} onClick={() => toggleContact(idx)} className="relative text-left rounded-2xl border-2 transition-all" style={{ padding: "16px 18px", borderColor: sel ? ACCENT : "#E5E5E5", backgroundColor: sel ? ACCENT_LIGHT : "#FFF" }}>
                      {sel && <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: GRADIENT }}><Check size={13} className="text-white" /></div>}
                      <div className="flex items-center gap-3" style={{ marginBottom: "10px" }}>
                        <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-[12px] font-bold flex-shrink-0" style={{ background: GRADIENT }}>{(c.fn?.[0] || "") + (c.ln?.[0] || "")}</div>
                        <div className="min-w-0">
                          <div className="text-[14px] font-bold truncate" style={{ color: "#000" }}>{c.fn} {c.ln}</div>
                          <div className="text-[12px] truncate" style={{ color: "#888" }}>{c.t || "No title"}</div>
                        </div>
                      </div>
                      {c.r && <span className="text-[11px] font-semibold px-3 py-1 rounded-full" style={{ backgroundColor: "#F0F0F0", color: "#555" }}>{c.r}</span>}
                      {hasEmail ? (
                        <div className="text-[12px] font-medium mt-2" style={{ color: ACCENT }}>{c.e}</div>
                      ) : (
                        <div className="text-[11px] font-semibold mt-2 px-3 py-1 rounded-full inline-flex items-center gap-1.5" style={{ backgroundColor: "#FEF3C7", color: "#92400E" }}><AlertTriangle size={11} /> No email on file</div>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {/* AI imported contacts */}
            {aiContacts.length > 0 && (
              <div style={{ marginBottom: "20px" }}>
                {aiContacts.map((ac, idx) => (
                  <div key={idx} className="flex items-center justify-between rounded-2xl border-2" style={{ padding: "14px 18px", marginBottom: "8px", borderColor: ACCENT, backgroundColor: ACCENT_LIGHT }}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ background: GRADIENT }}><Sparkles size={14} /></div>
                      <div>
                        <div className="text-[14px] font-bold" style={{ color: "#000" }}>{ac.firstName} {ac.lastName}</div>
                        <div className="text-[12px]" style={{ color: "#666" }}>{ac.title}{ac.email ? ` · ${ac.email}` : ""}</div>
                      </div>
                    </div>
                    <button onClick={() => setAiContacts(prev => prev.filter((_, i) => i !== idx))} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/60 transition-colors"><X size={14} style={{ color: "#999" }} /></button>
                  </div>
                ))}
              </div>
            )}

            {/* Add contact buttons */}
            {!showManualContact ? (
              <div className="flex items-center gap-4">
                <button onClick={() => setShowAIImport(true)} className="flex items-center gap-2 text-white text-[14px] font-semibold rounded-xl hover:opacity-90 transition-all" style={{ background: GRADIENT, padding: "12px 24px" }}>
                  <Sparkles size={16} /> AI Import
                </button>
                <button onClick={() => setShowManualContact(true)} className="flex items-center gap-2 text-[14px] font-semibold rounded-xl hover:bg-gray-50 transition-all" style={{ color: ACCENT, padding: "12px 24px", border: `2px solid ${ACCENT}` }}>
                  <Plus size={16} /> Add Manually
                </button>
              </div>
            ) : (
              <div className="rounded-2xl" style={{ padding: "24px", backgroundColor: "#FAFAFA", border: "1px solid #EBEBEB" }}>
                <div className="text-[13px] font-bold mb-4" style={{ color: ACCENT }}>New Contact</div>
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: "16px" }}>
                  <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Full Name *</label><input type="text" value={manualContact.name} onChange={(e) => setManualContact(p => ({ ...p, name: e.target.value }))} placeholder="Jane Smith" className={inputCls} /></div>
                  <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Title</label><input type="text" value={manualContact.title} onChange={(e) => setManualContact(p => ({ ...p, title: e.target.value }))} placeholder="Director of Health Promotion" className={inputCls} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4" style={{ marginBottom: "16px" }}>
                  <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Email *</label><input type="email" value={manualContact.email} onChange={(e) => setManualContact(p => ({ ...p, email: e.target.value }))} placeholder="jane@school.edu" className={inputCls} /></div>
                  <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Phone</label><input type="text" value={manualContact.phone} onChange={(e) => setManualContact(p => ({ ...p, phone: e.target.value }))} placeholder="(555) 123-4567" className={inputCls} /></div>
                </div>
                <button onClick={() => setShowManualContact(false)} className="text-[13px] font-medium px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors" style={{ color: "#999" }}>Cancel</button>
              </div>
            )}
          </div>

          {/* ── Divider ── */}
          <div style={{ height: "1px", backgroundColor: "#EBEBEB", marginBottom: "36px" }} />

          {/* ── Section 3: Deal Setup ── */}
          <div style={{ marginBottom: "12px" }}>
            <div style={{ marginBottom: "20px" }}>
              <h3 className="text-[16px] font-bold" style={{ color: "#000" }}>Deal Setup</h3>
              <p className="text-[13px] mt-1" style={{ color: "#999" }}>Configure pipeline stage and assignment</p>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Pipeline Stage</label><select value={stage} onChange={(e) => setStage(e.target.value)} className={inputCls}>{STAGES.filter(s => !["active_partner","closed_lost"].includes(s.id)).map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
                <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Confidence</label><select value={confidence} onChange={(e) => setConfidence(e.target.value)} className={inputCls}>{["N/A","Low","Medium","High","Very High"].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
              </div>

              <div>
                <label className="block text-[13px] font-semibold mb-3" style={{ color: "#333" }}>Sent By</label>
                <div className="flex gap-3">
                  {["Julian", "Fred"].map(person => (
                    <button key={person} type="button" onClick={() => setSentBy(person)} className="text-[14px] font-semibold rounded-xl transition-all" style={{ padding: "10px 28px", backgroundColor: sentBy === person ? ACCENT : "#FFF", color: sentBy === person ? "#FFF" : "#888", border: sentBy === person ? `2px solid ${ACCENT}` : "2px solid #E5E5E5" }}>
                      {person}
                    </button>
                  ))}
                </div>
              </div>

              {stage === "outreach" && (
                <div>
                  <label className="block text-[13px] font-semibold mb-3" style={{ color: "#333" }}>Lead Magnet</label>
                  <div className="flex gap-3">
                    {["Cannabis Support Kit", "Distraction Two-Pager"].map(mag => (
                      <button key={mag} type="button" onClick={() => setLeadMagnet(leadMagnet === mag ? "" : mag)} className="text-[13px] font-semibold rounded-xl transition-all" style={{ padding: "10px 20px", backgroundColor: leadMagnet === mag ? ACCENT_LIGHT : "#FFF", color: leadMagnet === mag ? ACCENT : "#888", border: leadMagnet === mag ? `2px solid ${ACCENT}` : "2px solid #E5E5E5" }}>
                        {leadMagnet === mag && <Check size={13} className="inline mr-1.5" />}{mag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Next Action</label><input type="text" value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Send initial outreach email" className={inputCls} /></div>
                <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Action Date</label><input type="date" value={nextActionDate} onChange={(e) => setNextActionDate(e.target.value)} className={inputCls} /></div>
              </div>

              <div><label className="block text-[13px] font-semibold mb-2" style={{ color: "#333" }}>Notes</label><textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Optional notes about this deal..." rows={3} className={inputCls + " resize-y"} /></div>
            </div>
          </div>
        </div>

        {/* ── Fixed Footer ── */}
        <div className="flex items-center flex-shrink-0" style={{ padding: "20px 36px 24px", borderTop: "1px solid #EBEBEB" }}>
          {!isValid && name && (
            <div className="flex items-center gap-2 text-[13px] font-medium mr-auto" style={{ color: "#F59E0B" }}>
              <AlertTriangle size={14} /> Add at least one contact with an email
            </div>
          )}
          <div className="flex gap-4 ml-auto">
            <button onClick={onClose} className="text-[15px] font-semibold rounded-xl hover:bg-gray-50 transition-colors" style={{ padding: "14px 32px", border: `2px solid #E0E0E0`, color: "#666" }}>Cancel</button>
            <button onClick={handleAdd} disabled={!isValid} className="text-[15px] font-semibold text-white rounded-xl transition-all hover:opacity-90" style={{ padding: "14px 32px", background: isValid ? GRADIENT : "#D1D5DB", cursor: isValid ? "pointer" : "not-allowed" }}>Add to Pipeline</button>
          </div>
        </div>
      </div>
      {showAIImport && (
        <AIImportModal
          onSave={(contact) => setAiContacts(prev => [...prev, contact])}
          onClose={() => setShowAIImport(false)}
        />
      )}
    </div>
  )
}

// ─── AI IMPORT MODAL ───
function AIImportModal({ onSave, onClose }) {
  const [pasteText, setPasteText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [parsed, setParsed] = useState(null)

  const parseContact = async () => {
    if (!pasteText.trim()) return
    setLoading(true)
    setError("")
    setParsed(null)
    try {
      // Smart local parser — handles tab-separated spreadsheet rows and free text
      const text = pasteText.trim()
      const fields = text.includes("\t") ? text.split("\t").map(s => s.trim()).filter(Boolean) : text.split(/\s{2,}/).map(s => s.trim()).filter(Boolean)

      let email = "", phone = "", verifyUrl = "", role = "", personaType = "", department = ""
      let firstName = "", lastName = "", title = ""
      const unmatched = []

      for (const field of fields) {
        if (/@/.test(field) && /\.\w{2,}/.test(field)) { email = field; continue }
        if (/^https?:\/\//.test(field)) { verifyUrl = field; continue }
        if (/^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/.test(field.replace(/\s/g, ""))) { phone = field; continue }
        if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(field)) continue // skip dates
        if (/^\d{1,3}$/.test(field)) continue // skip bare numbers
        const fieldLower = field.toLowerCase()
        if (CONTACT_ROLES.some(r => r.toLowerCase() === fieldLower)) { role = CONTACT_ROLES.find(r => r.toLowerCase() === fieldLower); continue }
        if (PERSONA_TYPES.some(pt => fieldLower.includes(pt.toLowerCase().split(" / ")[0]))) { personaType = PERSONA_TYPES.find(pt => fieldLower.includes(pt.toLowerCase().split(" / ")[0])); continue }
        if (/^(low|medium|high|very high|n\/a)$/i.test(field)) continue // skip confidence
        if (/^(julian|fred|jessel)$/i.test(field)) continue // skip sentBy
        unmatched.push(field)
      }

      // From unmatched: find department (long, has "department/health/student/affairs")
      const deptIdx = unmatched.findIndex(f => /department|health|student|affairs|wellness|counseling|prevention|promotion|recovery/i.test(f) && f.length > 15)
      if (deptIdx >= 0) { department = unmatched.splice(deptIdx, 1)[0] }

      // Find title (contains common title words)
      const titleIdx = unmatched.findIndex(f => /director|manager|coordinator|counselor|specialist|dean|VP|provost|chief|officer|associate|assistant|advisor/i.test(f))
      if (titleIdx >= 0) { title = unmatched.splice(titleIdx, 1)[0] }

      // First remaining short-ish field with 2-3 words is likely the name
      const nameIdx = unmatched.findIndex(f => f.split(/\s+/).length >= 2 && f.split(/\s+/).length <= 4 && f.length < 40)
      if (nameIdx >= 0) {
        const nameParts = unmatched.splice(nameIdx, 1)[0].split(/\s+/)
        // If title words are mixed into the name field (e.g. "Donaji Stelzig Case Manager"), split them
        const titleWords = ["case", "manager", "director", "coordinator", "counselor", "specialist", "dean", "associate", "assistant", "advisor"]
        const titleStart = nameParts.findIndex(w => titleWords.includes(w.toLowerCase()))
        if (titleStart > 0 && titleStart <= 3) {
          firstName = nameParts.slice(0, titleStart === 1 ? 1 : titleStart - 1).join(" ")
          lastName = titleStart > 1 ? nameParts[titleStart - 1] : ""
          if (!title) title = nameParts.slice(titleStart).join(" ")
        } else {
          firstName = nameParts[0] || ""
          lastName = nameParts.slice(1).join(" ")
        }
      }

      // If still no name, try first 1-2 word field
      if (!firstName && unmatched.length > 0) {
        const shortIdx = unmatched.findIndex(f => f.split(/\s+/).length <= 2 && f.length < 25)
        if (shortIdx >= 0) {
          const parts = unmatched.splice(shortIdx, 1)[0].split(/\s+/)
          firstName = parts[0] || ""; lastName = parts[1] || ""
        }
      }

      // Remaining unmatched could be title or department
      if (!title && unmatched.length > 0) title = unmatched.shift()
      if (!department && unmatched.length > 0) department = unmatched.shift()

      // Infer role from title if not found
      if (!role) {
        const t = (title + " " + department).toLowerCase()
        if (/director|dean|VP|provost|chief|president/i.test(t)) role = "Decision Maker"
        else if (/manager|coordinator|counselor|specialist|advisor/i.test(t)) role = "Champion"
        else role = "Influencer"
      }

      // Infer persona type from title/department if not found
      if (!personaType) {
        const t = (title + " " + department).toLowerCase()
        if (/health promotion|wellness/i.test(t)) personaType = "Health Promotion / Wellness"
        else if (/aod|alcohol|drug|substance|prevention|recovery/i.test(t)) personaType = "AOD Prevention / Recovery"
        else if (/student affairs|dean of students/i.test(t)) personaType = "Student Affairs Leadership"
        else if (/counseling|mental health/i.test(t)) personaType = "Counseling Center Leadership"
        else if (/case manage|bit|behav/i.test(t)) personaType = "Case Management / BIT"
        else personaType = "Other"
      }

      if (!firstName && !lastName && !email) throw new Error("no data")

      setParsed({ firstName, lastName, title, department, role, personaType, email, phone, verifyUrl, outreach: "Not Contacted" })
    } catch (err) {
      setError("Could not parse contact info. Try pasting a row with name, title, email separated by tabs.")
    } finally {
      setLoading(false)
    }
  }

  const tryAgain = () => { setPasteText(""); setParsed(null); setError("") }

  const inputCls = "w-full text-[14px] border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5BB4A9]/20 transition-colors"
  const labelCls = "block text-[11px] font-medium text-gray-400 mb-1 uppercase tracking-wide"

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/25 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-[560px] max-h-[80vh] flex flex-col animate-fade-in" style={{ borderRadius: "1.25rem", boxShadow: "0 25px 60px rgba(0,0,0,0.15)" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-6 pb-4 flex-shrink-0" style={{ borderBottom: "1px solid #F3F4F6" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: GRADIENT }}>
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[18px] font-semibold" style={{ color: "#000" }}>AI Import</h2>
              <p className="text-[12px]" style={{ color: "#999" }}>Paste contact info and let AI extract the fields</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"><X size={16} style={{ color: "#999" }} /></button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-7 py-5 space-y-5">
          {!parsed ? (
            <>
              <div>
                <label className={labelCls}>Paste a row from your Google Sheet or any contact info</label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder={"Jane Smith\tDirector of Health Promotion\tjsmith@school.edu\t(555) 123-4567\nOr paste any format — the AI will figure it out."}
                  rows={5}
                  className={inputCls + " resize-y font-mono text-[13px]"}
                  autoFocus
                />
              </div>
              {error && (
                <div className="rounded-xl p-4 text-[13px]" style={{ backgroundColor: "#FEF2F2", color: "#E53E3E", border: "1px solid #FEE2E2" }}>
                  {error}
                </div>
              )}
              <button
                onClick={parseContact}
                disabled={!pasteText.trim() || loading}
                className="w-full flex items-center justify-center gap-2 py-3 text-white text-[14px] font-medium rounded-full hover:opacity-90 transition-all"
                style={{ background: pasteText.trim() && !loading ? GRADIENT : "#D1D5DB", cursor: pasteText.trim() && !loading ? "pointer" : "not-allowed" }}
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Parsing...</> : <><Sparkles size={15} /> Parse Contact</>}
              </button>
            </>
          ) : (
            <>
              <div className="rounded-xl p-4" style={{ backgroundColor: ACCENT_LIGHT, border: `1px solid ${ACCENT}30` }}>
                <div className="flex items-center gap-2 mb-3">
                  <Check size={14} style={{ color: ACCENT }} />
                  <span className="text-[13px] font-semibold" style={{ color: ACCENT }}>Contact parsed — review and edit before saving</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>First Name</label><input type="text" value={parsed.firstName} onChange={(e) => setParsed(p => ({ ...p, firstName: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Last Name</label><input type="text" value={parsed.lastName} onChange={(e) => setParsed(p => ({ ...p, lastName: e.target.value }))} className={inputCls} /></div>
                </div>
                <div><label className={labelCls}>Title</label><input type="text" value={parsed.title} onChange={(e) => setParsed(p => ({ ...p, title: e.target.value }))} className={inputCls} /></div>
                <div><label className={labelCls}>Department</label><input type="text" value={parsed.department} onChange={(e) => setParsed(p => ({ ...p, department: e.target.value }))} className={inputCls} /></div>
                <div>
                  <label className={labelCls}>Role</label>
                  <div className="flex gap-2">
                    {CONTACT_ROLES.map(r => (
                      <button key={r} type="button" onClick={() => setParsed(p => ({ ...p, role: r }))} className="flex-1 py-2 text-[13px] font-medium rounded-full transition-all text-center" style={{ backgroundColor: parsed.role === r ? CONTACT_ROLE_COLORS[r].bg : "#FFF", color: parsed.role === r ? CONTACT_ROLE_COLORS[r].text : "#999", border: parsed.role === r ? "none" : "1px solid #E5E5E5" }}>
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
                <div><label className={labelCls}>Persona Type</label><select value={parsed.personaType} onChange={(e) => setParsed(p => ({ ...p, personaType: e.target.value }))} className={inputCls}>{PERSONA_TYPES.map(pt => <option key={pt} value={pt}>{pt}</option>)}</select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={labelCls}>Email</label><input type="email" value={parsed.email} onChange={(e) => setParsed(p => ({ ...p, email: e.target.value }))} className={inputCls} /></div>
                  <div><label className={labelCls}>Phone</label><input type="text" value={parsed.phone} onChange={(e) => setParsed(p => ({ ...p, phone: e.target.value }))} className={inputCls} /></div>
                </div>
                {parsed.verifyUrl && (
                  <div><label className={labelCls}>Verify URL</label><input type="url" value={parsed.verifyUrl} onChange={(e) => setParsed(p => ({ ...p, verifyUrl: e.target.value }))} className={inputCls} /></div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-7 py-4 flex-shrink-0" style={{ borderTop: "1px solid #F3F4F6" }}>
          {parsed ? (
            <>
              <button onClick={tryAgain} className="px-6 py-2.5 rounded-full text-[13px] font-medium" style={{ border: "1px solid #E5E5E5", color: "#666" }}>Try Again</button>
              <div className="flex-1" />
              <button onClick={onClose} className="px-6 py-2.5 rounded-full text-[13px] font-medium" style={{ color: "#999" }}>Cancel</button>
              <button onClick={() => { onSave(parsed); onClose() }} className="px-6 py-2.5 text-white text-[14px] font-medium rounded-full hover:opacity-90 transition-colors" style={{ background: GRADIENT }}>Save Contact</button>
            </>
          ) : (
            <button onClick={onClose} className="ml-auto px-6 py-2.5 rounded-full text-[13px] font-medium" style={{ color: "#999" }}>Cancel</button>
          )}
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
    return stored?.universities || SEED_UNIVERSITIES.map(migrateContacts)
  })
  const [selectedSchool, setSelectedSchool] = useState(null)
  const [quickAddOpen, setQuickAddOpen] = useState(false)

  // Coalition state
  const [coalitions, setCoalitions] = useState(() => {
    const stored = loadCoalitionData()
    return stored?.coalitions || SEED_COALITIONS
  })
  const [selectedCoalition, setSelectedCoalition] = useState(null)
  const [coalitionAddOpen, setCoalitionAddOpen] = useState(false)

  // Toast notifications
  const [toast, setToast] = useState(null)
  const showToast = (message) => {
    setToast(message)
    setTimeout(() => setToast(null), 3000)
  }

  // Auto-save
  useEffect(() => { saveData(universities) }, [universities])
  useEffect(() => { saveCoalitionData(coalitions) }, [coalitions])

  // Cmd+K shortcut (future: search)
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault() }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [])

  const updateUniversity = (id, updates) => {
    setUniversities(prev => prev.map(u => {
      if (u.id !== id) return u
      const merged = { ...u, ...updates }
      // Auto-sync: when emailStep advances, update primary contact outreach + record date
      if (updates.emailStep !== undefined && updates.emailStep > (u.emailStep || 0)) {
        const contacts = [...(merged.contacts || [])]
        if (contacts.length > 0 && (!contacts[0].outreach || contacts[0].outreach === "Not Contacted")) {
          contacts[0] = { ...contacts[0], outreach: "Sent" }
          merged.contacts = contacts
        }
        // Record sent date for each new step
        const emailsSent = [...(merged.emailsSent || [])]
        for (let step = (u.emailStep || 0); step < updates.emailStep; step++) {
          if (!emailsSent[step]) emailsSent[step] = new Date().toISOString()
        }
        merged.emailsSent = emailsSent
      }
      return merged
    }))
  }

  const updateCoalition = (id, updates) => {
    setCoalitions(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const overdueActions = universities.filter(u =>
    u.nextActionDate && new Date(u.nextActionDate) < new Date() && u.stage !== "active_partner" && u.stage !== "closed_lost"
  )

  const school = selectedSchool ? universities.find(u => u.id === selectedSchool) : null
  const coalition = selectedCoalition ? coalitions.find(c => c.id === selectedCoalition) : null

  const pageComponents = {
    pipeline: <PipelinePage universities={universities} onSelectSchool={setSelectedSchool} onUpdate={(id, updates) => updateUniversity(id, updates)} setQuickAddOpen={setQuickAddOpen} />,
    email: <EmailCommandCenter universities={universities} onUpdate={(id, updates) => updateUniversity(id, updates)} onSelectSchool={setSelectedSchool} />,
    fulfillment: <FulfillmentDashboard universities={universities} onSelectSchool={setSelectedSchool} onUpdate={(id, updates) => updateUniversity(id, updates)} />,
    coalition: <CoalitionPipelinePage coalitions={coalitions} onSelectCoalition={setSelectedCoalition} onUpdate={(id, updates) => updateCoalition(id, updates)} setCoalitionAddOpen={setCoalitionAddOpen} />,
    documents: <DocumentGenerator universities={universities} />,
    analytics: <AnalyticsPage universities={universities} />,
    settings: <SettingsPage universities={universities} onImport={setUniversities} onReset={() => setUniversities(SEED_UNIVERSITIES.map(migrateContacts))} />,
  }

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: "#FFFFFF" }}>
      <Sidebar currentPage={page} setPage={setPage} overdueCount={overdueActions.length} />
      <div className="flex-1 overflow-auto" style={{ maxHeight: "100vh", padding: "40px 48px" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
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
      {coalition && (
        <CoalitionDetailPanel
          coalition={coalition}
          onClose={() => setSelectedCoalition(null)}
          onUpdate={(updates) => updateCoalition(selectedCoalition, updates)}
          universities={universities}
        />
      )}
      {quickAddOpen && (
        <QuickAddModal
          onAdd={(newSchool) => { setUniversities(prev => [...prev, newSchool]); setQuickAddOpen(false) }}
          onClose={() => setQuickAddOpen(false)}
          onToast={showToast}
        />
      )}
      {coalitionAddOpen && (
        <CoalitionAddModal
          onAdd={(newCoalition) => { setCoalitions(prev => [...prev, newCoalition]); setCoalitionAddOpen(false) }}
          onClose={() => setCoalitionAddOpen(false)}
          onToast={showToast}
        />
      )}
      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-fade-in">
          <div className="flex items-center gap-2 px-6 py-3 rounded-full text-white text-[14px] font-medium shadow-lg" style={{ background: GRADIENT }}>
            <Check size={16} /> {toast}
          </div>
        </div>
      )}
    </div>
  )
}
