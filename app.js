class StaffScheduleApp {
  constructor() {
    // GitHub Sync Configuration
    
    this.currentStaff = null;
    this.currentViewStaff = null;
    this.isOverviewMode = false;

    this.privilegedUsers = new Set([
  "Greg Barton",
  "Scott McTaggart",
  "Graham Newton",
  "Stuart Grant"  // ADD THIS LINE
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
      "Dave Allison": 6,
      "Ken King": 10,
      "Bob Odney": 6,
      "Chad Hegge": 6,
      "Mackenzie Wardle": 6,
      "John Doyle": 4 
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
      "Dave Allison": 6,
      "Ken King": 12,
      "Bob Odney": 6,
      "Chad Hegge": 6,
      "Mackenzie Wardle": 6,
      "John Doyle": 4 
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
      { value: 'T', label: 'Training' },
      { value: 'V', label: 'Vacation' }  // NEW
    ];
    
    this.monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    this.daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    this.dateRangeStart = new Date(2026, 3, 1);
    this.dateRangeEnd   = new Date(2027, 2, 31);
    this.currentDate    = new Date(this.dateRangeStart.getTime());

    this.allAvailability = {};
    this.idealAvailability = {};
    this.idealDate = new Date(this.dateRangeStart.getTime());

    // Roster / lock support
    this.generatedRoster = {};
    this.rosterDate = new Date(this.dateRangeStart.getTime());
    this.lockFirstSix = false;
    this.lockLastSix = false;

    this.bindEvents();
    this.loadAllData();
  }

  // Save everything to Firebase (overwrite current data)
 saveAllData() {
  const payload = {
    allAvailability: this.allAvailability,
    idealAvailability: this.idealAvailability
  };
  firebase.database().ref("scheduleData").set(payload);
}

  

  // Live listener: keep data in sync across all devices
  loadAllData() {
    const ref = firebase.database().ref("scheduleData");

    ref.on("value", snapshot => {
      const data = snapshot.val() || {};
      this.allAvailability = data.allAvailability || {};
      this.idealAvailability = data.idealAvailability || {};

      if (this.currentStaff || this.isOverviewMode) {
        this.renderCalendar();
        this.updateAvailabilitySummary();
      }
    }, error => {
      console.error("Error listening to Firebase data", error);
    });

    // NEW: listen for schedule locks
    const locksRef = firebase.database().ref("locks");
    locksRef.on("value", snapshot => {
      const data = snapshot.val() || {};
      this.lockFirstSix = !!data.firstSixMonths;
      this.lockLastSix = !!data.lastSixMonths;
      this.updateLockStatusText();
    }, error => {
      console.error("Error listening to Firebase locks", error);
    });

    // Load generated roster persistence
    firebase.database().ref("generatedRoster").on("value", snapshot => {
      this.generatedRoster = snapshot.val() || {};
    });
  }

  bindEvents() {
    document.getElementById('staffSelect')
      .addEventListener('change', e => this.onStaffChange(e));

    document.getElementById('viewStaffSelect')
      .addEventListener('change', e => this.onViewStaffChange(e));

    document.getElementById('prevMonth')
      .addEventListener('click', () => this.changeMonth(-1));

    document.getElementById('nextMonth')
      .addEventListener('click', () => this.changeMonth(1));

    const overviewToggle = document.getElementById('overviewToggle');
    if (overviewToggle) {
      overviewToggle.addEventListener('change', e => {
        this.isOverviewMode = e.target.checked;
        this.showSchedule();
      });
    }

    const idealTab = document.getElementById('idealScheduleTab');
    if (idealTab) {
      idealTab.addEventListener('click', () => this.showIdealSchedule());
    }

    const idealPrev = document.getElementById('idealPrevMonth');
    const idealNext = document.getElementById('idealNextMonth');
    if (idealPrev && idealNext) {
      idealPrev.addEventListener('click', () => this.changeIdealMonth(-1));
      idealNext.addEventListener('click', () => this.changeIdealMonth(1));
    }

    const backBtn = document.getElementById('backToMainSchedule');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.showSchedule());
    }

    // Auto roster buttons and navigation
    const openRosterBtn = document.getElementById('openRosterView');
    const generateRosterBtn = document.getElementById('generateRosterButton');
    const rosterPrev = document.getElementById('rosterPrevMonth');
    const rosterNext = document.getElementById('rosterNextMonth');

    if (openRosterBtn) {
      openRosterBtn.addEventListener('click', () => this.showAutoRoster());
    }
    if (generateRosterBtn) {
      generateRosterBtn.addEventListener('click', () => this.onGenerateRoster());
    }
    if (rosterPrev && rosterNext) {
      rosterPrev.addEventListener('click', () => this.changeRosterMonth(-1));
      rosterNext.addEventListener('click', () => this.changeRosterMonth(1));
    }

    // NEW: schedule lock buttons (Greg only)
    const lockFirstSixBtn = document.getElementById('lockFirstSixBtn');
    const unlockFirstSixBtn = document.getElementById('unlockFirstSixBtn');
    const lockLastSixBtn = document.getElementById('lockLastSixBtn');
    const unlockLastSixBtn = document.getElementById('unlockLastSixBtn');

    const locksRef = firebase.database().ref("locks");

    const ensureGreg = () => {
      if (!this.currentStaff || this.currentStaff !== "Greg Barton") {
        alert("Only Greg can change schedule locks.");
        return false;
      }
      return true;
    };

    if (lockFirstSixBtn) {
      lockFirstSixBtn.addEventListener('click', () => {
        if (!ensureGreg()) return;
        locksRef.update({ firstSixMonths: true });
      });
    }
    if (unlockFirstSixBtn) {
      unlockFirstSixBtn.addEventListener('click', () => {
        if (!ensureGreg()) return;
        locksRef.update({ firstSixMonths: false });
      });
    }
    if (lockLastSixBtn) {
      lockLastSixBtn.addEventListener('click', () => {
        if (!ensureGreg()) return;
        locksRef.update({ lastSixMonths: true });
      });
    }
    if (unlockLastSixBtn) {
      unlockLastSixBtn.addEventListener('click', () => {
        if (!ensureGreg()) return;
        locksRef.update({ lastSixMonths: false });
      });
    }

    // Vacation summary buttons
    const showVacMonthBtn = document.getElementById('showVacationMonth');
    const showVacYearBtn  = document.getElementById('showVacationYear');

    if (showVacMonthBtn) {
      showVacMonthBtn.addEventListener('click', () => this.showVacationSummary('month'));
    }
    if (showVacYearBtn) {
      showVacYearBtn.addEventListener('click', () => this.showVacationSummary('year'));
    }
  }

  async onStaffChange(e) {
    const enteredName = e.target.value;
    if (!enteredName) {
      this.hideSchedule();
      document.getElementById('idealTabSection').style.display = 'none';
      document.getElementById('idealScheduleSection').style.display = 'none';
      return;
    }

    const code = prompt(`Enter login code for ${enteredName}:`);
    if (!code || code.trim().toUpperCase() !== this.loginCodes[enteredName].toUpperCase()) {
      alert("Incorrect code. Access denied.");
      e.target.value = "";
      this.hideSchedule();
      document.getElementById('idealTabSection').style.display = 'none';
      document.getElementById('idealScheduleSection').style.display = 'none';
      this.currentStaff = null;
      this.currentViewStaff = null;
      return;
    }

    this.currentStaff = enteredName;

    if (this.privilegedUsers.has(enteredName)) {
      this.currentViewStaff = enteredName;
      this.populateViewStaffSelector();
      document.getElementById('viewAllSection').style.display = 'block';
      document.getElementById('adminRosterControls').style.display = 'block';

      // Lock controls only for Greg
      if (enteredName === "Greg Barton") {
        document.getElementById('adminLockControls').style.display = 'block';
      } else {
        document.getElementById('adminLockControls').style.display = 'none';
      }

      // Vacation summary visible only to Greg, Scott, Graham, Dave
      const vacSec = document.getElementById('vacationSummarySection');
      if (["Greg Barton","Scott McTaggart","Graham Newton","Dave Allison"].includes(enteredName)) {
        vacSec.style.display = 'block';
      } else {
        vacSec.style.display = 'none';
      }
    } else {
      this.currentViewStaff = enteredName;
      document.getElementById('viewAllSection').style.display = 'none';
      document.getElementById('adminRosterControls').style.display = 'none';
      document.getElementById('adminLockControls').style.display = 'none';
      const vacSec = document.getElementById('vacationSummarySection');
      if (vacSec) vacSec.style.display = 'none';
    }

    if (this.idealUsers.has(enteredName)) {
      document.getElementById('idealTabSection').style.display = 'block';
    } else {
      document.getElementById('idealTabSection').style.display = 'none';
      document.getElementById('idealScheduleSection').style.display = 'none';
    }

    this.showSchedule();
  }

  populateViewStaffSelector() {
    const select = document.getElementById('viewStaffSelect');
    select.innerHTML = '';
    const staffSelect = document.getElementById('staffSelect');

    [...staffSelect.options].forEach(option => {
      if (option.value) {
        const newOption = option.cloneNode(true);
        select.appendChild(newOption);
      }
    });

    select.value = this.currentViewStaff;
  }

  onViewStaffChange(e) {
    this.currentViewStaff = e.target.value;
    this.showSchedule();
  }

  hideSchedule() {
    document.getElementById('scheduleSection').style.display = 'none';
    document.getElementById('scheduleTitle').textContent = '';
    document.getElementById('calendar').innerHTML = '';
    document.getElementById('availabilitySummary').textContent = '';
  }

  showSchedule() {
    document.getElementById('scheduleSection').style.display = 'block';
    document.getElementById('idealScheduleSection').style.display = 'none';
    document.getElementById('autoRosterSection').style.display = 'none';

    if (this.isOverviewMode) {
      document.getElementById('scheduleTitle').textContent =
        'All-Staff Availability Overview';
    } else {
      document.getElementById('scheduleTitle').textContent =
        `Schedule for ${this.currentViewStaff}`;
    }

    this.renderCalendar();
    this.updateAvailabilitySummary();
    this.updateCurrentMonthLabel();
  }

  showIdealSchedule() {
    document.getElementById('scheduleSection').style.display = 'none';
    document.getElementById('autoRosterSection').style.display = 'none';
    document.getElementById('idealScheduleSection').style.display = 'block';
    this.renderIdealCalendar();
    this.updateIdealMonthLabel();
  }

  changeMonth(direction) {
    let newMonth = this.currentDate.getMonth() + direction;
    let newYear  = this.currentDate.getFullYear();
    let newDate  = new Date(newYear, newMonth, 1);

    if (newDate < this.dateRangeStart) {
      newDate = new Date(
        this.dateRangeStart.getFullYear(),
        this.dateRangeStart.getMonth(),
        1
      );
    }
    if (newDate > this.dateRangeEnd) {
      newDate = new Date(
        this.dateRangeEnd.getFullYear(),
        this.dateRangeEnd.getMonth(),
        1
      );
    }

    this.currentDate = newDate;
    this.rosterDate = newDate;
    this.loadRosterFromFirebase();
    this.showSchedule();
  }

  changeIdealMonth(direction) {
    let newMonth = this.idealDate.getMonth() + direction;
    let newYear  = this.idealDate.getFullYear();
    let newDate  = new Date(newYear, newMonth, 1);

    if (newDate < this.dateRangeStart) {
      newDate = new Date(
        this.dateRangeStart.getFullYear(),
        this.dateRangeStart.getMonth(),
        1
      );
    }
    if (newDate > this.dateRangeEnd) {
      newDate = new Date(
        this.dateRangeEnd.getFullYear(),
        this.dateRangeEnd.getMonth(),
        1
      );
    }

    this.idealDate = newDate;
    this.renderIdealCalendar();
    this.updateIdealMonthLabel();
  }

  updateCurrentMonthLabel() {
    const monthName = this.monthNames[this.currentDate.getMonth()];
    const year      = this.currentDate.getFullYear();
    document.getElementById('currentMonth').textContent =
      `${monthName} ${year}`;
  }

  // NEW: show current lock status in the admin panel
  updateLockStatusText() {
    const el = document.getElementById('lockStatusText');
    if (!el) return;

    const first = this.lockFirstSix ? "LOCKED" : "unlocked";
    const last = this.lockLastSix ? "LOCKED" : "unlocked";
    el.textContent = `First 6 months: ${first} | Last 6 months: ${last}`;
  }

  // NEW: check if a given date is in a locked half of the schedule
  isDateLocked(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return false;

    // Midpoint = start date + 6 calendar months
    const mid = new Date(
      this.dateRangeStart.getFullYear(),
      this.dateRangeStart.getMonth() + 6,
      1
    );

    if (d >= this.dateRangeStart && d < mid) {
      return this.lockFirstSix;
    }
    if (d >= mid && d <= this.dateRangeEnd) {
      return this.lockLastSix;
    }
    return false;
  }

  updateIdealMonthLabel() {
    const monthName = this.monthNames[this.idealDate.getMonth()];
    const year      = this.idealDate.getFullYear();
    document.getElementById('idealCurrentMonth').textContent =
      `${monthName} ${year}`;
  }

  // Auto roster view controls
  showAutoRoster() {
    if (!this.currentStaff || !this.privilegedUsers.has(this.currentStaff)) return;

    document.getElementById('scheduleSection').style.display = 'none';
    document.getElementById('idealScheduleSection').style.display = 'none';
    document.getElementById('autoRosterSection').style.display = 'block';

    this.renderRosterCalendar();
    this.updateRosterMonthLabel();
  }

  changeRosterMonth(direction) {
  let newMonth = this.rosterDate.getMonth() + direction;
  let newYear  = this.rosterDate.getFullYear();
  let newDate  = new Date(newYear, newMonth, 1);

  if (newDate < this.dateRangeStart) {
    newDate = new Date(
      this.dateRangeStart.getFullYear(),
      this.dateRangeStart.getMonth(),
      1
    );
  }
  if (newDate > this.dateRangeEnd) {
    newDate = new Date(
      this.dateRangeEnd.getFullYear(),
      this.dateRangeEnd.getMonth(),
      1
    );
  }

  this.rosterDate = newDate;
  // Don't call loadRosterFromFirebase here - it's a one-way listener
  // Just render with whatever is currently in this.generatedRoster
  this.renderRosterCalendar();
  this.updateRosterMonthLabel();
}

  updateRosterMonthLabel() {
    const monthName = this.monthNames[this.rosterDate.getMonth()];
    const year      = this.rosterDate.getFullYear();
    document.getElementById('rosterCurrentMonth').textContent =
      `${monthName} ${year}`;
  }

  // Render the auto-generated roster calendar (read-only)
  renderRosterCalendar() {
  const calendarEl = document.getElementById('rosterCalendar');
  if (!calendarEl) return;
  calendarEl.innerHTML = '';

  this.daysOfWeek.forEach(day => {
    const dayNameEl = document.createElement('div');
    dayNameEl.classList.add('day-name');
    dayNameEl.textContent = day;
    calendarEl.appendChild(dayNameEl);
  });

  const year  = this.rosterDate.getFullYear();
  const month = this.rosterDate.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth    = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDayOfWeek; i++) {
    const blankCell = document.createElement('div');
    blankCell.classList.add('day-cell');
    calendarEl.appendChild(blankCell);
  }

  const getAvailableForShift = (dateStr, shiftType) => {
    const available = [];
    const rnNames = new Set([
      "Graham Newton","Stuart Grant","Kris Austin",
      "Kellie Ann Vogelaar","Janice Kirkham",
      "Flo Butler","Jodi Scott","Carolyn Hogan","Michelle Sexsmith"
    ]);

    const paraNames = new Set([
      "Greg Barton","Scott McTaggart","Dave Allison",
      "Mackenzie Wardle","Chad Hegge","Ken King",
      "John Doyle","Bob Odney"
    ]);

    const allStaff = new Set([...rnNames, ...paraNames]);
    
    allStaff.forEach(name => {
      const staffDays = this.allAvailability[name] || {};
      const entry = staffDays[dateStr];
      
      if (!entry) return;
      
      const value = entry[shiftType];
      
      if (value && value !== 'V' && value !== 'U' && value !== '') {
        available.push(name);
      }
    });

    return available.sort();
  };

  if (!this.generatedRoster) {
    this.generatedRoster = {};
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split('T')[0];

    const dayCell = document.createElement('div');
    dayCell.classList.add('day-cell');
    if (d.getDay() === 0 || d.getDay() === 6) {
      dayCell.classList.add('weekend');
    }

    const dateLabel = document.createElement('div');
    dateLabel.classList.add('date-label');
    dateLabel.textContent = day;
    dayCell.appendChild(dateLabel);

    if (!this.generatedRoster[dateStr]) {
      this.generatedRoster[dateStr] = {
        paraDay: null,
        nurseDay: null,
        paraNight: null,
        nurseNight: null,
        conflicts: false
      };
    }

    const entry = this.generatedRoster[dateStr];

    if (entry.conflicts) {
      dayCell.style.backgroundColor = '#ffcccc';
      dayCell.style.borderColor = '#ff0000';
      dayCell.style.borderWidth = '2px';
    }

    const shiftsContainer = document.createElement('div');
    shiftsContainer.style.display = 'flex';
    shiftsContainer.style.flexDirection = 'column';
    shiftsContainer.style.gap = '4px';

    // Para Day
    const pdSelect = document.createElement('select');
    pdSelect.style.width = '100%';
    pdSelect.style.padding = '4px';
    pdSelect.style.fontSize = '11px';
    pdSelect.style.fontWeight = 'bold';
    pdSelect.style.backgroundColor = '#f5f5f5';
    pdSelect.style.border = '1px solid #999';
    pdSelect.style.borderRadius = '3px';
    
    pdSelect.innerHTML = '<option value="">Para Day</option>';
    const pdAvailable = getAvailableForShift(dateStr, 'Day');
    pdAvailable.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      option.style.backgroundColor = '#90EE90';
      option.style.fontWeight = 'bold';
      option.style.color = '#000';
      pdSelect.appendChild(option);
    });
    pdSelect.value = entry.paraDay || '';
    pdSelect.addEventListener('change', (e) => this.updateRosterCell(dateStr, 'paraDay', e.target.value));
    shiftsContainer.appendChild(pdSelect);

    // Nurse Day
    const ndSelect = document.createElement('select');
    ndSelect.style.width = '100%';
    ndSelect.style.padding = '4px';
    ndSelect.style.fontSize = '11px';
    ndSelect.style.fontWeight = 'bold';
    ndSelect.style.backgroundColor = '#f5f5f5';
    ndSelect.style.border = '1px solid #999';
    ndSelect.style.borderRadius = '3px';
    
    ndSelect.innerHTML = '<option value="">Nurse Day</option>';
    const ndAvailable = getAvailableForShift(dateStr, 'Day');
    ndAvailable.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      option.style.backgroundColor = '#90EE90';
      option.style.fontWeight = 'bold';
      option.style.color = '#000';
      ndSelect.appendChild(option);
    });
    ndSelect.value = entry.nurseDay || '';
    ndSelect.addEventListener('change', (e) => this.updateRosterCell(dateStr, 'nurseDay', e.target.value));
    shiftsContainer.appendChild(ndSelect);

    // Para Night
    const pnSelect = document.createElement('select');
    pnSelect.style.width = '100%';
    pnSelect.style.padding = '4px';
    pnSelect.style.fontSize = '11px';
    pnSelect.style.fontWeight = 'bold';
    pnSelect.style.backgroundColor = '#f5f5f5';
    pnSelect.style.border = '1px solid #999';
    pnSelect.style.borderRadius = '3px';
    
    pnSelect.innerHTML = '<option value="">Para Night</option>';
    const pnAvailable = getAvailableForShift(dateStr, 'Night');
    pnAvailable.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      option.style.backgroundColor = '#90EE90';
      option.style.fontWeight = 'bold';
      option.style.color = '#000';
      pnSelect.appendChild(option);
    });
    pnSelect.value = entry.paraNight || '';
    pnSelect.addEventListener('change', (e) => this.updateRosterCell(dateStr, 'paraNight', e.target.value));
    shiftsContainer.appendChild(pnSelect);

    // Nurse Night
    const nnSelect = document.createElement('select');
    nnSelect.style.width = '100%';
    nnSelect.style.padding = '4px';
    nnSelect.style.fontSize = '11px';
    nnSelect.style.fontWeight = 'bold';
    nnSelect.style.backgroundColor = '#f5f5f5';
    nnSelect.style.border = '1px solid #999';
    nnSelect.style.borderRadius = '3px';
    
    nnSelect.innerHTML = '<option value="">Nurse Night</option>';
    const nnAvailable = getAvailableForShift(dateStr, 'Night');
    nnAvailable.forEach(name => {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      option.style.backgroundColor = '#90EE90';
      option.style.fontWeight = 'bold';
      option.style.color = '#000';
      nnSelect.appendChild(option);
    });
    nnSelect.value = entry.nurseNight || '';
    nnSelect.addEventListener('change', (e) => this.updateRosterCell(dateStr, 'nurseNight', e.target.value));
    shiftsContainer.appendChild(nnSelect);

    dayCell.appendChild(shiftsContainer);
    calendarEl.appendChild(dayCell);
  }
}

  // Update roster cell and save
  updateRosterCell(dateStr, shift, name) {
    if (!this.generatedRoster[dateStr]) {
      this.generatedRoster[dateStr] = {
        paraDay: null,
        nurseDay: null,
        paraNight: null,
        nurseNight: null,
        conflicts: false
      };
    }
    this.generatedRoster[dateStr][shift] = name || null;
    firebase.database().ref("generatedRoster").set(this.generatedRoster);
    console.log(`Updated ${dateStr} ${shift} to ${name}`);
  }

  // New method to update roster cells
  updateRosterCell(dateStr, shift, name) {
    if (!this.generatedRoster[dateStr]) {
      this.generatedRoster[dateStr] = {
        paraDay: null,
        nurseDay: null,
        paraNight: null,
        nurseNight: null,
        conflicts: false
      };
    }
    this.generatedRoster[dateStr][shift] = name || null;
    firebase.database().ref("generatedRoster").set(this.generatedRoster);
    console.log(`Updated ${dateStr} ${shift} to ${name}`);
  }

  renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    calendarEl.innerHTML = '';

    this.daysOfWeek.forEach(day => {
      const dayNameEl = document.createElement('div');
      dayNameEl.classList.add('day-name');
      dayNameEl.textContent = day;
      calendarEl.appendChild(dayNameEl);
    });

    const year  = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth    = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
      const blankCell = document.createElement('div');
      blankCell.classList.add('day-cell');
      calendarEl.appendChild(blankCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split('T')[0];

      const dayCell = document.createElement('div');
      dayCell.classList.add('day-cell');
      if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
        dayCell.classList.add('weekend');
      }

      const dateLabel = document.createElement('div');
      dateLabel.classList.add('date-label');
      dateLabel.textContent = day;
      dayCell.appendChild(dateLabel);

      if (this.isOverviewMode) {
        const counts = this.getOverviewCountsForDate(dateStr);

        const rnDiv = document.createElement('div');
        rnDiv.className = 'overview-count overview-rn';
        rnDiv.textContent =
          `RN Day: ${counts.rnDay} | RN Night: ${counts.rnNight}`;

        const pDiv = document.createElement('div');
        pDiv.className = 'overview-count overview-paramedic';
        pDiv.textContent =
          `Para Day: ${counts.paraDay} | Para Night: ${counts.paraNight}`;

        if (
          counts.rnDay === 0 ||
          counts.rnNight === 0 ||
          counts.paraDay === 0 ||
          counts.paraNight === 0
        ) {
          dayCell.classList.add('no-availability');
        }

        dayCell.appendChild(rnDiv);
        dayCell.appendChild(pDiv);
      } else {
        const dayShiftWrapper = this.createAvailabilityDropdown(dateStr, 'Day');
        dayCell.appendChild(dayShiftWrapper);
        const nightShiftWrapper = this.createAvailabilityDropdown(dateStr, 'Night');
        dayCell.appendChild(nightShiftWrapper);
      }

      calendarEl.appendChild(dayCell);
    }
  }

  getIdealTotalsForCurrentMonth() {
    const year  = this.idealDate.getFullYear();
    const month = this.idealDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const totals = {}; // name -> { day: 0, night: 0 }
    const idealUsers = ["Greg Barton","Scott McTaggart","Stuart Grant","Graham Newton"];

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];

      idealUsers.forEach(name => {
        const entry = (this.idealAvailability[name] && this.idealAvailability[name][dateStr]) || {};
        if (!totals[name]) totals[name] = { day: 0, night: 0 };

        if (entry.Day === 'D' || entry.Day === 'T' || entry.Day === 'V') totals[name].day += 1;
        if (entry.Night === 'N' || entry.Night === 'T' || entry.Night === 'V') totals[name].night += 1;
      });
    }
    return totals;
  }
  
  renderIdealCalendar() {
    const calendarEl = document.getElementById('idealCalendar');
    calendarEl.innerHTML = '';

    this.daysOfWeek.forEach(day => {
      const dayNameEl = document.createElement('div');
      dayNameEl.classList.add('day-name');
      dayNameEl.textContent = day;
      calendarEl.appendChild(dayNameEl);
    });

    const year  = this.idealDate.getFullYear();
    const month = this.idealDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth    = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
      const blankCell = document.createElement('div');
      blankCell.classList.add('day-cell');
      calendarEl.appendChild(blankCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split('T')[0];

      const dayCell = document.createElement('div');
      dayCell.classList.add('day-cell');
      if (dateObj.getDay() === 0 || dateObj.getDay() === 6) {
        dayCell.classList.add('weekend');
      }

      const dateLabel = document.createElement('div');
      dateLabel.classList.add('date-label');
      dateLabel.textContent = day;
      dayCell.appendChild(dateLabel);

      const idealUsers = ["Greg Barton","Scott McTaggart","Stuart Grant","Graham Newton"];

      idealUsers.forEach(name => {
        const entry = (this.idealAvailability[name] && this.idealAvailability[name][dateStr]) || {};
        const dayVal = entry.Day || '';
        const nightVal = entry.Night || '';
        const dayNote = entry.DayTrainingNote || '';
        const nightNote = entry.NightTrainingNote || '';

        const colorClass =
          name === "Greg Barton"    ? 'ideal-greg'   :
          name === "Graham Newton"  ? 'ideal-graham' :
          name === "Stuart Grant"   ? 'ideal-stuart' :
          name === "Scott McTaggart"? 'ideal-scott'  : '';

        if (!dayVal && !nightVal) return;

        const div = document.createElement('div');
        div.className = `ideal-entry ${colorClass}`;
        let text = `${name.split(' ')[0]}: `;
        const parts = [];
        if (dayVal === 'D') parts.push('Day');
        if (nightVal === 'N') parts.push('Night');
        if (dayVal === 'T') parts.push(`Day Training${dayNote ? ' ('+dayNote+')' : ''}`);
        if (nightVal === 'T') parts.push(`Night Training${nightNote ? ' ('+nightNote+')' : ''}`);
        text += parts.join(', ');
        div.textContent = text;
        dayCell.appendChild(div);
      });

      if (this.currentStaff && this.idealUsers.has(this.currentStaff)) {
        const dayWrapper = this.createIdealDropdown(dateStr, 'Day');
        const nightWrapper = this.createIdealDropdown(dateStr, 'Night');
        dayCell.appendChild(dayWrapper);
        dayCell.appendChild(nightWrapper);
      }

      calendarEl.appendChild(dayCell);
    }

    // Update bottom-of-page ideal summary
    const summaryEl = document.getElementById('idealSummary');
    if (summaryEl) {
      const totals = this.getIdealTotalsForCurrentMonth();
      let html = '';
      Object.keys(totals).forEach(name => {
        const t = totals[name];
        html += `${name}: Day ${t.day} | Night ${t.night}<br>`;
      });
      summaryEl.innerHTML = html;
    }
  }
  

  createAvailabilityDropdown(dateStr, shiftType) {
    const select = document.createElement('select');
    select.classList.add('availability-dropdown');
    if (shiftType === 'Day')   select.classList.add('day-shift');
    if (shiftType === 'Night') select.classList.add('night-shift');

    select.dataset.date      = dateStr;
    select.dataset.shiftType = shiftType;

    this.availabilityOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.text  = opt.label;
      select.appendChild(option);
    });

    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.placeholder = 'Training type...';
    noteInput.className = 'training-note-input';
    noteInput.style.display = 'none';

    const staff = this.currentViewStaff || this.currentStaff;
    if (staff && this.allAvailability[staff] && this.allAvailability[staff][dateStr]) {
      const stored = this.allAvailability[staff][dateStr];
      const savedVal = stored[shiftType];
      if (savedVal !== undefined) {
        select.value = savedVal;
      }
      const noteKey = shiftType === 'Day' ? 'DayTrainingNote' : 'NightTrainingNote';
      if (stored[noteKey]) {
        noteInput.value = stored[noteKey];
      }
      if (savedVal === 'T') {
        noteInput.style.display = 'block';
      }
    }

    select.addEventListener('change', () => {
      const activeStaff = this.currentStaff;
      if (!activeStaff) return;

      // Block changes in locked months
      if (this.isDateLocked(dateStr)) {
        alert('This part of the schedule has been locked by Greg. Availability changes are not allowed here.');
        // Revert dropdown to previously saved value
        const stored = this.allAvailability[activeStaff] &&
                       this.allAvailability[activeStaff][dateStr];
        const prevVal = stored ? stored[shiftType] || '' : '';
        select.value = prevVal;
        return;
      }

      if (!this.allAvailability[activeStaff]) this.allAvailability[activeStaff] = {};
      if (!this.allAvailability[activeStaff][dateStr]) {
        this.allAvailability[activeStaff][dateStr] = {
          Day: '', Night: '', DayTrainingNote: '', NightTrainingNote: ''
        };
      }
      const staffDays = this.allAvailability[activeStaff];

      const thisDateObj = new Date(dateStr);
      const prevDateObj = new Date(thisDateObj.getTime() - 24*60*60*1000);
      const nextDateObj = new Date(thisDateObj.getTime() + 24*60*60*1000);
      const prevDateStr = prevDateObj.toISOString().split('T')[0];
      const nextDateStr = nextDateObj.toISOString().split('T')[0];

      const getVal = (dStr, sh) => {
        return staffDays[dStr] ? staffDays[dStr][sh] || '' : '';
      };

      const shift = select.dataset.shiftType;
      const newVal = select.value;

      const prevNight = getVal(prevDateStr, 'Night');
      const thisNight = getVal(dateStr, 'Night');
      const thisDay   = getVal(dateStr, 'Day');
      const nextDay   = getVal(nextDateStr, 'Day');

      const restoreOldValue = () => {
        const oldVal = staffDays[dateStr][shift] || '';
        select.value = oldVal;
      };

      if (newVal === 'T' || newVal === 'V') {
        if (shift === 'Day') {
          if (prevNight === 'A' || prevNight === 'V' || thisNight === 'A' || thisNight === 'V') {
            alert('You cannot select Training/Vacation on this day while night availability/vacation exists immediately before or after. Please remove that first.');
            restoreOldValue();
            return;
          }
        } else if (shift === 'Night') {
          if (thisDay === 'A' || thisDay === 'V' || nextDay === 'A' || nextDay === 'V') {
            alert('You cannot select Training/Vacation on this night while day availability/vacation exists immediately before or after. Please remove that first.');
            restoreOldValue();
            return;
          }
        }
      }

      if (newVal === 'A' || newVal === 'V') {
        if (shift === 'Day') {
          if (
            prevNight === 'T' || prevNight === 'V' ||
            thisNight === 'T' || thisNight === 'V'
          ) {
            alert('You cannot select Available/Vacation for this Day because there is Training/Vacation on the immediately-adjacent Night. Adjust that first.');
            restoreOldValue();
            return;
          }
        } else if (shift === 'Night') {
          if (
            thisDay === 'T' || thisDay === 'V' ||
            nextDay === 'T' || nextDay === 'V'
          ) {
            alert('You cannot select Available/Vacation for this Night because there is Training/Vacation on the immediately-adjacent Day. Adjust that first.');
            restoreOldValue();
            return;
          }
        }
      }

      staffDays[dateStr][shift] = newVal;
      // Mirror Vacation into idealAvailability for ideal users
      if (this.idealUsers.has(activeStaff)) {
        if (!this.idealAvailability[activeStaff]) this.idealAvailability[activeStaff] = {};
        if (!this.idealAvailability[activeStaff][dateStr]) {
          this.idealAvailability[activeStaff][dateStr] = {
            Day: '', Night: '', DayTrainingNote: '', NightTrainingNote: ''
          };
        }
        if (newVal === 'V') {
          this.idealAvailability[activeStaff][dateStr][shift] = 'V';
        } else if (this.idealAvailability[activeStaff][dateStr][shift] === 'V') {
          this.idealAvailability[activeStaff][dateStr][shift] = '';
        }
      }

      if (newVal === 'T') {
        noteInput.style.display = 'block';
      } else {
        noteInput.style.display = 'none';
        const noteKeyClear = shiftType === 'Day' ? 'DayTrainingNote' : 'NightTrainingNote';
        staffDays[dateStr][noteKeyClear] = '';
        noteInput.value = '';
      }

      this.saveAllData();
      this.updateAvailabilitySummary();
    });

    noteInput.addEventListener('blur', () => {
      const activeStaff = this.currentStaff;
      if (!activeStaff) return;
      if (!this.allAvailability[activeStaff]) this.allAvailability[activeStaff] = {};
      if (!this.allAvailability[activeStaff][dateStr]) {
        this.allAvailability[activeStaff][dateStr] = {
          Day: '', Night: '', DayTrainingNote: '', NightTrainingNote: ''
        };
      }
      const noteKey = shiftType === 'Day' ? 'DayTrainingNote' : 'NightTrainingNote';
      this.allAvailability[activeStaff][dateStr][noteKey] = noteInput.value.trim();
      this.saveAllData();
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'shift-wrapper';
    wrapper.appendChild(select);
    wrapper.appendChild(noteInput);

    return wrapper;
  }

  createIdealDropdown(dateStr, shiftType) {
    const select = document.createElement('select');
    select.classList.add('availability-dropdown');
    select.dataset.date = dateStr;
    select.dataset.shiftType = shiftType;

    this.idealOptions.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.text = opt.label;
      select.appendChild(option);
    });

    const noteInput = document.createElement('input');
    noteInput.type = 'text';
    noteInput.placeholder = 'Training type...';
    noteInput.className = 'training-note-input';
    noteInput.style.display = 'none';

    const staff = this.currentStaff;
    if (staff && this.idealAvailability[staff] && this.idealAvailability[staff][dateStr]) {
      const stored = this.idealAvailability[staff][dateStr];
      const savedVal = stored[shiftType];
      if (savedVal !== undefined) {
        select.value = savedVal;
      }
      const noteKey = shiftType === 'Day' ? 'DayTrainingNote' : 'NightTrainingNote';
      if (stored[noteKey]) {
        noteInput.value = stored[noteKey];
      }
      if (savedVal === 'T') {
        noteInput.style.display = 'block';
      }
    }

    select.addEventListener('change', () => {
      const activeStaff = this.currentStaff;
      if (!activeStaff || !this.idealUsers.has(activeStaff)) return;

      if (!this.idealAvailability[activeStaff]) this.idealAvailability[activeStaff] = {};
      if (!this.idealAvailability[activeStaff][dateStr]) {
        this.idealAvailability[activeStaff][dateStr] = {
          Day: '', Night: '', DayTrainingNote: '', NightTrainingNote: ''
        };
      }
      const staffDays = this.idealAvailability[activeStaff];

      const newVal = select.value;
      staffDays[dateStr][shiftType] = newVal;

      // Mirror Vacation from ideal into main availability
      if (!this.allAvailability[activeStaff]) this.allAvailability[activeStaff] = {};
      if (!this.allAvailability[activeStaff][dateStr]) {
        this.allAvailability[activeStaff][dateStr] = {
          Day: '', Night: '', DayTrainingNote: '', NightTrainingNote: ''
        };
      }
      if (newVal === 'V') {
        this.allAvailability[activeStaff][dateStr][shiftType] = 'V';
      } else if (this.allAvailability[activeStaff][dateStr][shiftType] === 'V') {
        this.allAvailability[activeStaff][dateStr][shiftType] = '';
      }

      if (newVal === 'T') {
        noteInput.style.display = 'block';
      } else {
        noteInput.style.display = 'none';
        const noteKeyClear = shiftType === 'Day' ? 'DayTrainingNote' : 'NightTrainingNote';
        staffDays[dateStr][noteKeyClear] = '';
        noteInput.value = '';
      }

      this.saveAllData();
      this.renderIdealCalendar();
    });

    noteInput.addEventListener('blur', () => {
      const activeStaff = this.currentStaff;
      if (!activeStaff || !this.idealUsers.has(activeStaff)) return;
      if (!this.idealAvailability[activeStaff]) this.idealAvailability[activeStaff] = {};
      if (!this.idealAvailability[activeStaff][dateStr]) {
        this.idealAvailability[activeStaff][dateStr] = {
          Day: '', Night: '', DayTrainingNote: '', NightTrainingNote: ''
        };
      }
      const noteKey = shiftType === 'Day' ? 'DayTrainingNote' : 'NightTrainingNote';
      this.idealAvailability[activeStaff][dateStr][noteKey] = noteInput.value.trim();
      this.saveAllData();
      this.renderIdealCalendar();
    });

    const wrapper = document.createElement('div');
    wrapper.className = 'shift-wrapper';
    wrapper.appendChild(select);
    wrapper.appendChild(noteInput);

    return wrapper;
  }

  // Helper: classify staff as RN or Paramedic
  getRoleForStaff(name) {
    const rnNames = new Set([
      "Graham Newton","Stuart Grant","Kellie Ann Vogelaar",
      "Michelle Sexsmith","Carolyn Hogan","Kris Austin",
      "Flo Butler","Jodi Scott","Janice Kirkham"
    ]);

    const paraNames = new Set([
      "Greg Barton","Scott McTaggart","Dave Allison",
      "Mackenzie Wardle","Chad Hegge","Ken King",
      "John Doyle","Bob Odney"
    ]);

    if (rnNames.has(name)) return 'rn';
    if (paraNames.has(name)) return 'para';
    return null;
  }

  getOverviewCountsForDate(dateStr) {
    let rnDay = 0, rnNight = 0, paraDay = 0, paraNight = 0;

    const rnNames = new Set([
      "Graham Newton","Stuart Grant","Kellie Ann Vogelaar",
      "Michelle Sexsmith","Carolyn Hogan","Kris Austin",
      "Flo Butler","Jodi Scott","Janice Kirkham"
    ]);

    const paraNames = new Set([
      "Greg Barton","Scott McTaggart","Dave Allison",
      "Mackenzie Wardle","Chad Hegge","Ken King",
      "John Doyle","Bob Odney"
    ]);

    Object.keys(this.allAvailability).forEach(staff => {
      const staffDays = this.allAvailability[staff] || {};
      const entry     = staffDays[dateStr];
      if (!entry) return;

      const isRN   = rnNames.has(staff);
      const isPara = paraNames.has(staff);

      if (entry.Day === 'A') {
        if (isRN) rnDay++;
        if (isPara) paraDay++;
      }
      if (entry.Night === 'A') {
        if (isRN) rnNight++;
        if (isPara) paraNight++;
      }
    });

    return { rnDay, rnNight, paraDay, paraNight };
  }

  getVacationTotals(startDate, endDate) {
    // Count Day 'V' and Night 'V' as separate vacation shifts
    const totals = {}; // name -> count

    const start = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
    const end   = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

    Object.keys(this.allAvailability || {}).forEach(name => {
      const days = this.allAvailability[name] || {};
      let count = 0;

      Object.keys(days).forEach(dateStr => {
        const d = new Date(dateStr);
        if (isNaN(d)) return;
        if (d < start || d > end) return;

        const entry = days[dateStr];
        if (!entry) return;

        if (entry.Day === 'V') count += 1;
        if (entry.Night === 'V') count += 1;
      });

      if (count > 0) {
        totals[name] = count;
      }
    });

    return totals;
  }

  showVacationSummary(mode) {
    if (!this.currentStaff ||
        !["Greg Barton","Scott McTaggart","Graham Newton","Dave Allison"].includes(this.currentStaff)) {
      alert("Vacation summary is only available to Greg, Scott, Graham, or Dave.");
      return;
    }

    const outEl = document.getElementById('vacationSummaryOutput');
    if (!outEl) return;

    let start, end, title;

    if (mode === 'month') {
      // Use current visible month on main schedule
      const year  = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      start = new Date(year, month, 1);
      end   = new Date(year, month + 1, 0);
      title = `Vacation for ${this.monthNames[month]} ${year}`;
    } else {
      // Fiscal year: April 1 to March 31 containing currentDate
      const curYear  = this.currentDate.getFullYear();
      const curMonth = this.currentDate.getMonth(); // 0=Jan
      let fyStartYear, fyEndYear;
      if (curMonth >= 3) {        // April (3) or later => FY starts this year
        fyStartYear = curYear;
        fyEndYear   = curYear + 1;
      } else {                    // Jan–Mar => FY started last year
        fyStartYear = curYear - 1;
        fyEndYear   = curYear;
      }
      start = new Date(fyStartYear, 3, 1);  // April 1
      end   = new Date(fyEndYear, 2, 31);   // March 31
      title = `Vacation for Fiscal Year ${fyStartYear}-${fyEndYear}`;
    }

    const totals = this.getVacationTotals(start, end);
    const names = Object.keys(totals).sort();

    if (names.length === 0) {
      outEl.innerHTML = `${title}: No vacation recorded in this period.`;
      return;
    }

    let html = `<strong>${title}</strong><br>`;
    names.forEach(name => {
      html += `${name}: ${totals[name]} vacation shifts<br>`;
    });
    outEl.innerHTML = html;
  }

  // Helper: compute per-staff adjusted caps for the current roster month
  getMonthlyCapsForCurrentMonth() {
    const year  = this.rosterDate.getFullYear();
    const month = this.rosterDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const caps = {};   // name -> { base, vacations, cap, used }

    Object.keys(this.allAvailability || {}).forEach(name => {
      // base requirement: from 30/31 tables for that month
      let base = 0;
      if (daysInMonth === 30) {
        base = this.minimumRequired30[name] || 0;
      } else if (daysInMonth === 31) {
        base = this.minimumRequired31[name] || 0;
      } else {
        base = 0;
      }

      let vacations = 0;
      const days = this.allAvailability[name] || {};
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateStr = d.toISOString().split('T')[0];
        const entry = days[dateStr];
        // Vacation is Day = 'V' only
        if (entry && entry.Day === 'V') {
          vacations += 1;
        }
      }

      let cap = base - vacations;
      if (cap < 0) cap = 0;

      caps[name] = {
        base,
        vacations,
        cap,
        used: 0
      };
    });

    return caps;
  }

  isDoubleShift(name, dateStr, shift) {
    const entry = this.allAvailability[name] && this.allAvailability[name][dateStr];
    if (!entry) return false;

    if (shift === 'Day') {
      return entry.Night === 'A';
    } else {
      const prevDay = new Date(new Date(dateStr).getTime() - 24*60*60*1000).toISOString().split('T')[0];
      const prevEntry = this.allAvailability[name] && this.allAvailability[name][prevDay];
      return prevEntry && prevEntry.Day === 'A';
    }
  }

  // Generate roster for the current roster month (ideal-aware, no double shifts)
  onGenerateRoster() {
  const year = this.rosterDate.getFullYear();
  const month = this.rosterDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Initialize generatedRoster with structure for all days
  this.generatedRoster = {};
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split('T')[0];
    this.generatedRoster[dateStr] = {
      paraDay: null,
      nurseDay: null,
      paraNight: null,
      nurseNight: null,
      conflicts: false
    };
  }

  console.log(`\n=== ROSTER GENERATION START ===`);
  console.log(`Month: ${this.monthNames[month]} ${year}`);
  console.log(`Days in month: ${daysInMonth}`);
  
  const rnNames = new Set([
    "Graham Newton", "Stuart Grant", "Kris Austin",
    "Kellie Ann Vogelaar", "Janice Kirkham",
    "Flo Butler", "Jodi Scott", "Carolyn Hogan", "Michelle Sexsmith"
  ]);

  const paraNames = new Set([
    "Greg Barton", "Scott McTaggart", "Dave Allison",
    "Mackenzie Wardle", "Chad Hegge", "Ken King",
    "John Doyle", "Bob Odney"
  ]);

  const vacationAdjustableStaff = new Set([
    "Greg Barton", "Scott McTaggart", "Mackenzie Wardle", "Ken King",
    "Graham Newton", "Stuart Grant", "Kris Austin", "Janice Kirkham",
    "Flo Butler", "Jodi Scott", "Carolyn Hogan", "Michelle Sexsmith", "John Doyle"
  ]);

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split('T')[0];
    this.generatedRoster[dateStr] = {
      paraDay: null,
      nurseDay: null,
      paraNight: null,
      nurseNight: null,
      conflicts: false
    };
  }

  console.log("\n=== ROSTER GENERATION START ===");
  console.log("Month:", new Date(year, month, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' }));

  const requirementsTable = daysInMonth === 30 ? this.minimumRequired30 : this.minimumRequired31;
  const adjustedRequirements = {};
  
  console.log("\nSTEP 0: Calculating adjusted requirements...");
  for (const name of [...rnNames, ...paraNames]) {
    let baseRequired = requirementsTable[name] || 0;
    let vacationDays = 0;

    if (vacationAdjustableStaff.has(name) && this.allAvailability[name]) {
      const staffDays = this.allAvailability[name];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateStr = d.toISOString().split('T')[0];
        const entry = staffDays[dateStr];
        if (entry) {
          if (entry.Day === 'V') vacationDays++;
          if (entry.Night === 'V') vacationDays++;
        }
      }
    }

    const adjustedRequired = Math.max(0, baseRequired - vacationDays);
    adjustedRequirements[name] = {
      base: baseRequired,
      vacationDays: vacationDays,
      adjusted: adjustedRequired,
      assigned: 0
    };
  }

  console.log(`Requirements loaded for ${Object.keys(adjustedRequirements).length} staff members`);
  console.log(`allAvailability has data for: ${Object.keys(this.allAvailability).join(', ')}`);

  const getStaffAvailableForShift = (dateStr, shiftType) => {
  const available = [];
  
  Object.keys(this.allAvailability).forEach(name => {
    const staffDays = this.allAvailability[name] || {};
    const entry = staffDays[dateStr];
    
    if (!entry) return;
    
    const value = entry[shiftType];
    
    console.log(`  ${name} on ${dateStr} ${shiftType}: ${value}`);
    
    if (value && value !== 'V' && value !== 'U' && value !== '') {
      available.push(name);
    }
  });
  
  return available;
};

const isDoubleShifted = (name, dateStr, currentShift) => {
  const roster = this.generatedRoster[dateStr];
  if (!roster) return false;
  if (currentShift === 'paraDay' && roster.paraNight === name) return true;
  if (currentShift === 'paraNight' && roster.paraDay === name) return true;
  if (currentShift === 'nurseDay' && roster.nurseNight === name) return true;
  if (currentShift === 'nurseNight' && roster.nurseDay === name) return true;
  return false;
};

  console.log("\nSTEP 1: Placing ideal staff (Greg, Scott, Graham, Stuart)...");
  const idealPlaced = {};
  
  this.idealUsers.forEach(name => {
  idealPlaced[name] = new Set();
  const staffIdeal = this.idealAvailability[name] || {};
  const isRN = rnNames.has(name);
  
  console.log(`\n  Processing ${name}:`, Object.keys(staffIdeal).length, 'ideal dates');
  
  let placed = 0;
  Object.keys(staffIdeal).forEach(dateStr => {
      const d = new Date(dateStr);
      if (d.getMonth() !== month || d.getFullYear() !== year) return;
      
      const entry = staffIdeal[dateStr] || {};
      
      if (entry.Day === 'D') {
        const shiftKey = isRN ? 'nurseDay' : 'paraDay';
        if (!this.generatedRoster[dateStr][shiftKey] && !isDoubleShifted(name, dateStr, shiftKey)) {
          this.generatedRoster[dateStr][shiftKey] = name;
          idealPlaced[name].add(dateStr);
          adjustedRequirements[name].assigned++;
          placed++;
        }
      }
      
      if (entry.Night === 'N') {
        const shiftKey = isRN ? 'nurseNight' : 'paraNight';
        if (!this.generatedRoster[dateStr][shiftKey] && !isDoubleShifted(name, dateStr, shiftKey)) {
          this.generatedRoster[dateStr][shiftKey] = name;
          idealPlaced[name].add(dateStr);
          adjustedRequirements[name].assigned++;
          placed++;
        }
      }
    });
    
    console.log(`  ${name}: placed ${placed} shifts`);
  });

  console.log("\nSTEP 2: Filling remaining shifts...");
  let filledCount = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split('T')[0];
    const roster = this.generatedRoster[dateStr];

    if (!roster.paraDay) {
      const available = getStaffAvailableForShift(dateStr, 'Day')
        .filter(name => paraNames.has(name))
        .filter(name => !idealPlaced[name] || !idealPlaced[name].has(dateStr))
        .filter(name => !isDoubleShifted(name, dateStr, 'paraDay'))
        .sort((a, b) => adjustedRequirements[a].assigned - adjustedRequirements[b].assigned);
      
      if (available.length > 0) {
        roster.paraDay = available[0];
        adjustedRequirements[available[0]].assigned++;
        filledCount++;
      } else {
        roster.conflicts = true;
      }
    }

    if (!roster.nurseDay) {
      const available = getStaffAvailableForShift(dateStr, 'Day')
        .filter(name => rnNames.has(name))
        .filter(name => !idealPlaced[name] || !idealPlaced[name].has(dateStr))
        .filter(name => !isDoubleShifted(name, dateStr, 'nurseDay'))
        .sort((a, b) => adjustedRequirements[a].assigned - adjustedRequirements[b].assigned);
      
      if (available.length > 0) {
        roster.nurseDay = available[0];
        adjustedRequirements[available[0]].assigned++;
        filledCount++;
      } else {
        roster.conflicts = true;
      }
    }

    if (!roster.paraNight) {
      const available = getStaffAvailableForShift(dateStr, 'Night')
        .filter(name => paraNames.has(name))
        .filter(name => !idealPlaced[name] || !idealPlaced[name].has(dateStr))
        .filter(name => !isDoubleShifted(name, dateStr, 'paraNight'))
        .sort((a, b) => adjustedRequirements[a].assigned - adjustedRequirements[b].assigned);
      
      if (available.length > 0) {
        roster.paraNight = available[0];
        adjustedRequirements[available[0]].assigned++;
        filledCount++;
      } else {
        roster.conflicts = true;
      }
    }

    if (!roster.nurseNight) {
      const available = getStaffAvailableForShift(dateStr, 'Night')
        .filter(name => rnNames.has(name))
        .filter(name => !idealPlaced[name] || !idealPlaced[name].has(dateStr))
        .filter(name => !isDoubleShifted(name, dateStr, 'nurseNight'))
        .sort((a, b) => adjustedRequirements[a].assigned - adjustedRequirements[b].assigned);
      
      if (available.length > 0) {
        roster.nurseNight = available[0];
        adjustedRequirements[available[0]].assigned++;
        filledCount++;
      } else {
        roster.conflicts = true;
      }
    }
  }
  
  console.log(`  Filled ${filledCount} additional shifts`);

  console.log("\nSTEP 3: Summary...");
  let completelyFilledDays = 0;
  let conflictDays = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    const dateStr = d.toISOString().split('T')[0];
    const roster = this.generatedRoster[dateStr];
    
    if (roster.conflicts) {
      conflictDays++;
    } else if (roster.paraDay && roster.nurseDay && roster.paraNight && roster.nurseNight) {
      completelyFilledDays++;
    }
  }

  console.log(`✓ Days fully staffed: ${completelyFilledDays}/${daysInMonth}`);
  console.log(`⚠️ Days with conflicts: ${conflictDays}/${daysInMonth}`);

  console.log("\n=== ROSTER GENERATION COMPLETE ===\n");

  firebase.database().ref("generatedRoster").set(this.generatedRoster);
  this.renderRosterCalendar();

  alert(`Roster generated!\n✓ ${completelyFilledDays} days fully staffed\n⚠️ ${conflictDays} days with conflicts\n\nCheck console (F12) for details.`);
}
loadRosterFromFirebase() {
    firebase.database().ref("generatedRoster").on('value', (snapshot) => {
      if (snapshot.exists()) {
        this.generatedRoster = snapshot.val();
        console.log("✓ Roster loaded from Firebase");
        this.renderRosterCalendar();
      } else {
        this.generatedRoster = {};
        console.log("No roster found in Firebase");
      }
    });
  }
  updateAvailabilitySummary() {
    if (this.isOverviewMode) {
      const summary = document.getElementById('availabilitySummary');
      summary.textContent =
        'Overview mode: RN and Paramedic availability (A only) is shown in each day cell. Vacations still count in individual totals but not in this overview. Days with any zero coverage are highlighted.';
      summary.classList.remove('highlight-red','highlight-green');
      return;
    }

    if (!this.currentViewStaff) return;

    const selects = document.querySelectorAll('.availability-dropdown');
    const DAY = "Day", NIGHT = "Night";
    const shiftMap = new Map();
    const vacationExempt = new Set(["Kellie Ann Vogelaar","Bob Odney","Chad Hegge","Dave Allison"]);

    // Per-staff totals: count A always; count V only if not exempt
    selects.forEach(sel => {
      const val = sel.value;
      const dateStr = sel.dataset.date;
      const shift   = sel.dataset.shiftType;

      if (!shiftMap.has(dateStr)) shiftMap.set(dateStr, {});
      const cur = shiftMap.get(dateStr);

      if (val === 'A') {
        cur[shift] = true;
      } else if (val === 'V') {
        // For these staff, V does NOT contribute to totals
        if (!vacationExempt.has(this.currentViewStaff)) {
          cur[shift] = true;
        }
      }
    });

    let dayCount = 0;
    let nightCount = 0;
    let weekendCount = 0;

    const dateKeys = Array.from(shiftMap.keys()).sort();

    const isWeekendOrFriNight = (date, shift) => {
      const d = date.getDay();
      if (shift === NIGHT && d === 5) return true;
      if (d === 6 || d === 0) return true;
      return false;
    };

    dateKeys.forEach(dateStr => {
      const cur = shiftMap.get(dateStr);
      const curDate = new Date(dateStr);
      if (cur[DAY])   dayCount++;
      if (cur[NIGHT]) nightCount++;

      if (cur[DAY] && isWeekendOrFriNight(curDate, DAY))     weekendCount++;
      if (cur[NIGHT] && isWeekendOrFriNight(curDate, NIGHT)) weekendCount++;
    });

    let adjustedTotal = 0;
    let i = 0;

    while (i < dateKeys.length) {
      const thisDateStr = dateKeys[i];
      const thisDateObj = new Date(thisDateStr);
      const thisAvail   = shiftMap.get(thisDateStr);

      const nextDateStr = dateKeys[i + 1];
      const nextDateObj = nextDateStr ? new Date(nextDateStr) : null;
      const diffDays    = nextDateObj ? ((nextDateObj - thisDateObj) / (1000 * 60 * 60 * 24)) : null;
      const nextAvail   = nextDateStr ? shiftMap.get(nextDateStr) : null;

      if (thisAvail[DAY] && thisAvail[NIGHT]) {
        adjustedTotal += 1;
        if (nextAvail && diffDays === 1 && nextAvail[DAY]) {
          adjustedTotal += 1;
          i += 1;
        }
      } else if (thisAvail[NIGHT] && nextAvail && diffDays === 1 && nextAvail[DAY]) {
        adjustedTotal += 1;
        i += 2;
        continue;
      } else if (thisAvail[DAY] || thisAvail[NIGHT]) {
        adjustedTotal += 1;
      }

      i += 1;
    }

    const year      = this.currentDate.getFullYear();
    const month     = this.currentDate.getMonth();   // 0 = Jan
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const name = this.currentViewStaff;

    // default minimum from old tables
    let minimum = 0;

    const nurseNames = new Set([
      "Graham Newton","Stuart Grant","Kris Austin",
      "Kellie Ann Vogelaar","Janice Kirkham",
      "Flo Butler","Jodi Scott","Carolyn Hogan","Michelle Sexsmith"
    ]);

    if (!nurseNames.has(name)) {
      if (daysInMonth === 30 || daysInMonth === 28) {
        minimum = this.minimumRequired30[name] || 0;
      } else if (daysInMonth === 31) {
        minimum = this.minimumRequired31[name] || 0;
      }
    } else {
      const isAprMayJun = (month === 3 || month === 4 || month === 5);   // Apr, May, Jun
      const isJulOrLater = (month >= 6);                                  // Jul+

      if (isAprMayJun) {
        if (daysInMonth === 30 || daysInMonth === 28) {
          const map30 = {
            "Graham Newton": 13,
            "Stuart Grant": 13,
            "Kris Austin": 11,
            "Kellie Ann Vogelaar": 8,
            "Janice Kirkham": 7,
            "Flo Butler": 0,
            "Jodi Scott": 0,
            "Carolyn Hogan": 4,
            "Michelle Sexsmith": 4
          };
          minimum = map30[name] ?? 0;
        } else if (daysInMonth === 31) {
          const map31 = {
            "Graham Newton": 13,
            "Stuart Grant": 13,
            "Kris Austin": 12,
            "Kellie Ann Vogelaar": 8,
            "Janice Kirkham": 8,
            "Flo Butler": 0,
            "Jodi Scott": 0,
            "Carolyn Hogan": 4,
            "Michelle Sexsmith": 4
          };
          minimum = map31[name] ?? 0;
        }
      } else if (isJulOrLater) {
        if (daysInMonth === 30 || daysInMonth === 28) {
          const map30 = {
            "Graham Newton": 12,
            "Stuart Grant": 12,
            "Kris Austin": 10,
            "Kellie Ann Vogelaar": 5,
            "Janice Kirkham": 5,
            "Flo Butler": 4,
            "Carolyn Hogan": 4,
            "Michelle Sexsmith": 4
          };
          minimum = map30[name] ?? 0;
        } else if (daysInMonth === 31) {
          const map31 = {
            "Graham Newton": 12,
            "Stuart Grant": 12,
            "Kris Austin": 10,
            "Kellie Ann Vogelaar": 5,
            "Janice Kirkham": 5,
            "Flo Butler": 5,
            "Jodi Scott": 5,
            "Carolyn Hogan": 4,
            "Michelle Sexsmith": 4
          };
          minimum = map31[name] ?? 0;
        }
      } else {
        // Jan–Mar: fall back to original tables
        if (daysInMonth === 30 || daysInMonth === 28) {
          minimum = this.minimumRequired30[name] || 0;
        } else if (daysInMonth === 31) {
          minimum = this.minimumRequired31[name] || 0;
        }
      }
    }

    const requiredAdjusted = minimum * 2;

    const summaryDiv = document.getElementById('availabilitySummary');
    summaryDiv.innerHTML = `
      Day shifts (A+V): ${dayCount} | Night shifts (A+V): ${nightCount} |
      Weekend shifts (A+V): ${weekendCount} | Adjusted total availability: ${adjustedTotal}
      <br>
      Minimum base requirement: ${minimum} | Required adjusted shifts: ${requiredAdjusted}
    `;

    summaryDiv.classList.remove('highlight-red','highlight-green');
    if (adjustedTotal < requiredAdjusted) {
      summaryDiv.classList.add('highlight-red');
    } else {
      summaryDiv.classList.add('highlight-green');
    }
  }

  renderEditableRoster() {
    if (!this.privilegedUsers.has(this.currentStaff)) return;
    document.querySelectorAll('.roster-cell').forEach(cell => {
      const dateStr = cell.dataset.date;
      const shift = cell.dataset.shift;
      const role = shift.includes('para') ? 'para' : 'rn';
      const select = document.createElement('select');
      select.innerHTML = '<option value="">-- Unassigned --</option>';
      Object.keys(this.allAvailability).forEach(name => {
        const staffRole = this.getRoleForStaff(name);
        if (staffRole === role) {
          select.innerHTML += `<option value="${name}" ${this.generatedRoster?.[dateStr]?.[shift] === name ? 'selected' : ''}>${name}</option>`;
        }
      });
      select.onchange = () => {
        if (this.generatedRoster) {
          this.generatedRoster[dateStr][shift] = select.value || null;
          firebase.database().ref("generatedRoster").set(this.generatedRoster);
          this.renderRosterCalendar();
        }
      };
      cell.innerHTML = '';
      cell.appendChild(select);
    });
  }
}

window.onload = () => {
  new StaffScheduleApp();
};
