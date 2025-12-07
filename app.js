// Use the already initialized global firebase app
const db = firebase.database();

class StaffScheduleApp {
  constructor() {
    this.currentStaff = null;
    this.currentViewStaff = null;
    this.isOverviewMode = false;

    this.privilegedUsers = new Set([
      "Greg Barton",
      "Scott McTaggart",
      "Graham Newton"
    ]);

    this.idealUsers = new Set([
      "Greg Barton",
      "Scott McTaggart",
      "Graham Newton",
      "Stuart Grant"
    ]);

    this.loginCodes = {
      "Greg Barton": "B123",
      "Scott McTaggart": "S456",
      "Dave Allison": "D789",
      "Mackenzie Wardle": "M321",
      "Chad Hegge": "C654",
      "Ken King": "K987",
      "John Doyle": "J135",
      "Bob Odney": "O555",
      "Graham Newton": "N246",
      "Stuart Grant": "G369",
      "Kellie Ann Vogelaar": "V481",
      "Michelle Sexsmith": "S579",
      "Carolyn Hogan": "H642",
      "Kris Austin": "A753",
      "Flo Butler": "B864",
      "Jodi Scott": "J975",
      "Janice Kirkham": "K108"
    };

    this.minimumRequired30 = {
      "Graham Newton": 12,
      "Stuart Grant": 12,
      "Kris Austin": 9,
      "Kellie Ann Vogelaar": 5,
      "Janice Kirkham": 6,
      "Flo Butler": 4,
      "Jodi Scott": 4,
      "Carolyn Hogan": 4,
      "Michelle Sexsmith": 4,
      "Scott McTaggart": 13,
      "Greg Barton": 13,
      "Dave Allison": 7,
      "Ken King": 11,
      "Bob Odney": 5,
      "Chad Hegge": 5,
      "Mackenzie Wardle": 6
    };

    this.minimumRequired31 = {
      "Graham Newton": 12,
      "Stuart Grant": 12,
      "Kris Austin": 9,
      "Kellie Ann Vogelaar": 5,
      "Janice Kirkham": 6,
      "Flo Butler": 5,
      "Jodi Scott": 5,
      "Carolyn Hogan": 4,
      "Michelle Sexsmith": 4,
      "Scott McTaggart": 13,
      "Greg Barton": 13,
      "Dave Allison": 8,
      "Ken King": 12,
      "Bob Odney": 5,
      "Chad Hegge": 5,
      "Mackenzie Wardle": 6
    };

    this.availabilityOptions = [
      { value: '',  label: 'Not Specified' },
      { value: 'A', label: 'A - Available' },
      { value: 'U', label: 'U - Unavailable' },
      { value: 'R', label: 'R - Requested Off' },
      { value: 'S', label: 'S - Scheduled' },
      { value: 'V', label: 'V - Vacation' },
      { value: 'T', label: 'T - Training' },
      { value: 'K', label: 'K - Sick' }
    ];

    this.idealOptions = [
      { value: '',  label: 'Not Selected' },
      { value: 'D', label: 'Ideal Day' },
      { value: 'N', label: 'Ideal Night' },
      { value: 'T', label: 'Training' }
    ];

    this.monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    this.daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    this.dateRangeStart = new Date(2026, 3, 1);
    this.dateRangeEnd   = new Date(2027, 2, 31);
    this.currentDate    = new Date(this.dateRangeStart.getTime());
    this.idealDate      = new Date(this.dateRangeStart.getTime());

    // In‑memory caches of Firebase data
    this.allAvailability = {};
    this.idealAvailability = {};

    this.bindEvents();
    this.setupFirebaseListeners();
  }

  // ---------- Firebase sync helpers ----------

  setupFirebaseListeners() {
    // Listen for all availability changes
    db.ref("availability").on("value", snapshot => {
      this.allAvailability = snapshot.val() || {};
      // Re-render if a staff is selected or overview is on
      if (this.currentStaff || this.isOverviewMode) {
        this.renderCalendar();
        this.updateAvailabilitySummary();
      }
    });

    // Listen for ideal schedule changes
    db.ref("idealAvailability").on("value", snapshot => {
      this.idealAvailability = snapshot.val() || {};
      if (document.getElementById("idealScheduleSection").style.display === "block") {
        this.renderIdealCalendar();
      }
    });
  }

  saveAvailabilityToFirebase(staff, dateStr, payload) {
    db.ref(`availability/${staff}/${dateStr}`).set(payload);
  }

  saveIdealToFirebase(staff, dateStr, payload) {
    db.ref(`idealAvailability/${staff}/${dateStr}`).set(payload);
  }

  // ---------- UI / event binding ----------

  bindEvents() {
    document.getElementById('staffSelect')
      .addEventListener('change', e => this.onStaffChange(e));

    document.getElementById('viewStaffSelect')
      .addEventListener('change', e => this.onViewStaffChange(e));

    document.getElementById('prevMonth')
      .addEventListener('click', () => this.changeMonth(-1));

    document.getElementById('nextMonth')
      .addEventListener('click', () => this.changeMonth(1));

    const overviewToggle =