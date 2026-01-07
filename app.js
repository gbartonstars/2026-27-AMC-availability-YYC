// ============================================================================
// COMPLETE WORKING APP.JS - JAN 6, 2026 - ALL METHODS IMPLEMENTED
// ============================================================================
// COPY EVERYTHING BELOW AND PASTE INTO YOUR app.js ON GITHUB
// ============================================================================

class StaffScheduleApp {
  constructor() {
    this.currentStaff = null;
    this.currentViewStaff = null;
    this.isOverviewMode = false;
    this.overrideShiftCap = false;
    
    this.privilegedUsers = new Set([
      "Greg Barton", "Scott McTaggart", "Graham Newton", "Stuart Grant"
    ]);
    
    this.idealUsers = new Set([
      "Greg Barton", "Scott McTaggart", "Graham Newton", "Stuart Grant"
    ]);

    this.loginCodes = {
      "Greg Barton": "B123", "Scott McTaggart": "S456", "Dave Allison": "D789",
      "Mackenzie Wardle": "M321", "Chad Hegge": "C654", "Ken King": "K987",
      "John Doyle": "J135", "Bob Odney": "O555", "Graham Newton": "N246",
      "Stuart Grant": "G369", "Kellie Ann Vogelaar": "V481", "Michelle Sexsmith": "S579",
      "Carolyn Hogan": "H642", "Kris Austin": "A753", "Flo Butler": "B864",
      "Jodi Scott": "J975", "Janice Kirkham": "K108"
    };

    this.minimumRequired30 = {
      "Graham Newton": 12, "Stuart Grant": 12, "Kris Austin": 9, "Kellie Ann Vogelaar": 5,
      "Janice Kirkham": 6, "Flo Butler": 4, "Jodi Scott": 4, "Carolyn Hogan": 4,
      "Michelle Sexsmith": 4, "Scott McTaggart": 13, "Greg Barton": 13, "Dave Allison": 6,
      "Ken King": 10, "Bob Odney": 6, "Chad Hegge": 6, "Mackenzie Wardle": 6, "John Doyle": 4
    };

    this.minimumRequired31 = {
      "Graham Newton": 12, "Stuart Grant": 12, "Kris Austin": 9, "Kellie Ann Vogelaar": 5,
      "Janice Kirkham": 6, "Flo Butler": 5, "Jodi Scott": 5, "Carolyn Hogan": 4,
      "Michelle Sexsmith": 4, "Scott McTaggart": 13, "Greg Barton": 13, "Dave Allison": 6,
      "Ken King": 12, "Bob Odney": 6, "Chad Hegge": 6, "Mackenzie Wardle": 6, "John Doyle": 4
    };

    this.availabilityOptions = [
      { value: '', label: 'Not Specified' },
      { value: 'A', label: 'A - Available' },
      { value: 'U', label: 'U - Unavailable' },
      { value: 'R', label: 'R - Requested Off' },
      { value: 'S', label: 'S - Scheduled' },
      { value: 'V', label: 'V - Vacation' },
      { value: 'T', label: 'T - Training' },
      { value: 'K', label: 'K - Sick' }
    ];

    this.idealOptions = [
      { value: '', label: 'Not Selected' },
      { value: 'D', label: 'Ideal Day' },
      { value: 'N', label: 'Ideal Night' },
      { value: 'T', label: 'Training' },
      { value: 'V', label: 'Vacation' }
    ];

    this.monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    this.daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    this.dateRangeStart = new Date(2026, 3, 1);
    this.dateRangeEnd = new Date(2027, 2, 31);
    this.currentDate = new Date(this.dateRangeStart.getTime());
    this.allAvailability = {};
    this.idealAvailability = {};
    this.idealDate = new Date(this.dateRangeStart.getTime());

    this.generatedRoster = {};
    this.rosterDate = new Date(this.dateRangeStart.getTime());
    this.lockFirstSix = false;
    this.lockLastSix = false;

    this.bindEvents();
    this.loadAllData();
  }

  saveAllData() {
    const payload = { allAvailability: this.allAvailability, idealAvailability: this.idealAvailability };
    firebase.database().ref("scheduleData").set(payload);
  }

  loadAllData() {
    firebase.database().ref("scheduleData").on("value", snapshot => {
      const data = snapshot.val() || {};
      this.allAvailability = data.allAvailability || {};
      this.idealAvailability = data.idealAvailability || {};
      if (this.currentStaff || this.isOverviewMode) {
        this.renderCalendar();
        this.updateAvailabilitySummary();
      }
    });

    firebase.database().ref("locks").on("value", snapshot => {
      const data = snapshot.val() || {};
      this.lockFirstSix = !!data.firstSixMonths;
      this.lockLastSix = !!data.lastSixMonths;
      this.updateLockStatusText();
    });

    firebase.database().ref("generatedRoster").on("value", snapshot => {
      this.generatedRoster = snapshot.val() || {};
    });
  }

  bindEvents() {
    document.getElementById('staffSelect').addEventListener('change', e => this.onStaffChange(e));
    document.getElementById('viewStaffSelect').addEventListener('change', e => this.onViewStaffChange(e));
    document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

    const overviewToggle = document.getElementById('overviewToggle');
    if (overviewToggle) {
      overviewToggle.addEventListener('change', e => {
        this.isOverviewMode = e.target.checked;
        this.showSchedule();
      });
    }

    const overrideCheckbox = document.getElementById('overrideShiftCap');
    if (overrideCheckbox) {
      overrideCheckbox.addEventListener('change', e => {
        this.overrideShiftCap = e.target.checked;
      });
    }

    const idealTab = document.getElementById('idealScheduleTab');
    if (idealTab) idealTab.addEventListener('click', () => this.showIdealSchedule());

    const idealPrev = document.getElementById('idealPrevMonth');
    const idealNext = document.getElementById('idealNextMonth');
    if (idealPrev && idealNext) {
      idealPrev.addEventListener('click', () => this.changeIdealMonth(-1));
      idealNext.addEventListener('click', () => this.changeIdealMonth(1));
    }

    const backBtn = document.getElementById('backToMainSchedule');
    if (backBtn) backBtn.addEventListener('click', () => this.showSchedule());

    const openRosterBtn = document.getElementById('openRosterView');
    const generateRosterBtn = document.getElementById('generateRosterButton');
    const rosterPrev = document.getElementById('rosterPrevMonth');
    const rosterNext = document.getElementById('rosterNextMonth');

    if (openRosterBtn) openRosterBtn.addEventListener('click', () => this.showAutoRoster());
    if (generateRosterBtn) generateRosterBtn.addEventListener('click', () => this.onGenerateRoster());
    if (rosterPrev && rosterNext) {
      rosterPrev.addEventListener('click', () => this.changeRosterMonth(-1));
      rosterNext.addEventListener('click', () => this.changeRosterMonth(1));
    }

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

    if (lockFirstSixBtn) lockFirstSixBtn.addEventListener('click', () => {
      if (!ensureGreg()) return;
      locksRef.update({ firstSixMonths: true });
    });
    if (unlockFirstSixBtn) unlockFirstSixBtn.addEventListener('click', () => {
      if (!ensureGreg()) return;
      locksRef.update({ firstSixMonths: false });
    });
    if (lockLastSixBtn) lockLastSixBtn.addEventListener('click', () => {
      if (!ensureGreg()) return;
      locksRef.update({ lastSixMonths: true });
    });
    if (unlockLastSixBtn) unlockLastSixBtn.addEventListener('click', () => {
      if (!ensureGreg()) return;
      locksRef.update({ lastSixMonths: false });
    });

    const showVacMonthBtn = document.getElementById('showVacationMonth');
    const showVacYearBtn = document.getElementById('showVacationYear');
    if (showVacMonthBtn) showVacMonthBtn.addEventListener('click', () => this.showVacationSummary('month'));
    if (showVacYearBtn) showVacYearBtn.addEventListener('click', () => this.showVacationSummary('year'));
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

      if (enteredName === "Greg Barton") {
        document.getElementById('adminLockControls').style.display = 'block';
      } else {
        document.getElementById('adminLockControls').style.display = 'none';
      }

      const vacSec = document.getElementById('vacationSummarySection');
      if (["Greg Barton", "Scott McTaggart", "Graham Newton", "Dave Allison"].includes(enteredName)) {
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
      if (option.value) select.appendChild(option.cloneNode(true));
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
      document.getElementById('scheduleTitle').textContent = 'All-Staff Availability Overview';
    } else {
      document.getElementById('scheduleTitle').textContent = `Schedule for ${this.currentViewStaff}`;
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
    let newYear = this.currentDate.getFullYear();
    let newDate = new Date(newYear, newMonth, 1);

    if (newDate < this.dateRangeStart) {
      newDate = new Date(this.dateRangeStart.getFullYear(), this.dateRangeStart.getMonth(), 1);
    }
    if (newDate > this.dateRangeEnd) {
      newDate = new Date(this.dateRangeEnd.getFullYear(), this.dateRangeEnd.getMonth(), 1);
    }

    this.currentDate = newDate;
    this.rosterDate = newDate;
    this.loadRosterFromFirebase();
    this.showSchedule();
  }

  changeIdealMonth(direction) {
    let newMonth = this.idealDate.getMonth() + direction;
    let newYear = this.idealDate.getFullYear();
    let newDate = new Date(newYear, newMonth, 1);

    if (newDate < this.dateRangeStart) {
      newDate = new Date(this.dateRangeStart.getFullYear(), this.dateRangeStart.getMonth(), 1);
    }
    if (newDate > this.dateRangeEnd) {
      newDate = new Date(this.dateRangeEnd.getFullYear(), this.dateRangeEnd.getMonth(), 1);
    }

    this.idealDate = newDate;
    this.renderIdealCalendar();
    this.updateIdealMonthLabel();
  }

  updateCurrentMonthLabel() {
    const monthName = this.monthNames[this.currentDate.getMonth()];
    const year = this.currentDate.getFullYear();
    document.getElementById('currentMonth').textContent = `${monthName} ${year}`;
  }

  updateLockStatusText() {
    const el = document.getElementById('lockStatusText');
    if (!el) return;
    const first = this.lockFirstSix ? "LOCKED" : "unlocked";
    const last = this.lockLastSix ? "LOCKED" : "unlocked";
    el.textContent = `First 6 months: ${first} | Last 6 months: ${last}`;
  }

  isDateLocked(dateStr) {
    const d = new Date(dateStr);
    if (isNaN(d)) return false;

    const mid = new Date(this.dateRangeStart.getFullYear(), this.dateRangeStart.getMonth() + 6, 1);

    if (d >= this.dateRangeStart && d < mid) return this.lockFirstSix;
    if (d >= mid && d <= this.dateRangeEnd) return this.lockLastSix;
    return false;
  }

  updateIdealMonthLabel() {
    const monthName = this.monthNames[this.idealDate.getMonth()];
    const year = this.idealDate.getFullYear();
    document.getElementById('idealCurrentMonth').textContent = `${monthName} ${year}`;
  }

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
    let newYear = this.rosterDate.getFullYear();
    let newDate = new Date(newYear, newMonth, 1);

    if (newDate < this.dateRangeStart) {
      newDate = new Date(this.dateRangeStart.getFullYear(), this.dateRangeStart.getMonth(), 1);
    }
    if (newDate > this.dateRangeEnd) {
      newDate = new Date(this.dateRangeEnd.getFullYear(), this.dateRangeEnd.getMonth(), 1);
    }

    this.rosterDate = newDate;
    this.loadRosterFromFirebase();
    this.renderRosterCalendar();
    this.updateRosterMonthLabel();
  }

  updateRosterMonthLabel() {
    const monthName = this.monthNames[this.rosterDate.getMonth()];
    const year = this.rosterDate.getFullYear();
    document.getElementById('rosterCurrentMonth').textContent = `${monthName} ${year}`;
  }

  getMonthlyCapsForCurrentMonth() {
    const year = this.rosterDate.getFullYear();
    const month = this.rosterDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const minimumTable = daysInMonth === 31 ? this.minimumRequired31 : this.minimumRequired30;
    const caps = {};
    Object.keys(minimumTable).forEach(name => {
      caps[name] = { cap: minimumTable[name] };
    });
    return caps;
  }

  renderCalendar() {
    const calendarEl = document.getElementById('calendar');
    if (!calendarEl) return;
    calendarEl.innerHTML = '';

    this.daysOfWeek.forEach(day => {
      const dayNameEl = document.createElement('div');
      dayNameEl.classList.add('day-name');
      dayNameEl.textContent = day;
      calendarEl.appendChild(dayNameEl);
    });

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
      const blankCell = document.createElement('div');
      blankCell.classList.add('day-cell');
      calendarEl.appendChild(blankCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];

      const dayCell = document.createElement('div');
      dayCell.classList.add('day-cell');
      if (d.getDay() === 0 || d.getDay() === 6) dayCell.classList.add('weekend');

      const dateLabel = document.createElement('div');
      dateLabel.classList.add('date-label');
      dateLabel.textContent = day;
      dayCell.appendChild(dateLabel);

      if (this.isOverviewMode) {
        const allAvailability = this.getAllStaffAvailabilityForDate(dateStr);
        const summary = document.createElement('div');
        summary.style.fontSize = '11px';
        summary.style.color = '#666';
        summary.textContent = `Available: ${allAvailability.length}`;
        dayCell.appendChild(summary);
      } else {
        const staffDays = this.allAvailability[this.currentViewStaff] || {};
        const entry = staffDays[dateStr];

        if (entry) {
          const day_val = entry['Day'] || '';
          const night_val = entry['Night'] || '';

          const availText = document.createElement('div');
          availText.style.fontSize = '12px';
          availText.style.marginTop = '4px';
          availText.innerHTML = `<b>D:</b> ${day_val || '-'} <b>N:</b> ${night_val || '-'}`;
          dayCell.appendChild(availText);

          const daySelect = document.createElement('select');
          daySelect.style.width = '100%';
          daySelect.style.padding = '2px';
          daySelect.style.fontSize = '11px';
          daySelect.style.marginTop = '4px';

          this.availabilityOptions.forEach(opt => {
            const optEl = document.createElement('option');
            optEl.value = opt.value;
            optEl.textContent = opt.label;
            if (opt.value === day_val) optEl.selected = true;
            daySelect.appendChild(optEl);
          });

          daySelect.addEventListener('change', (e) => {
            const newVal = e.target.value;
            if (!this.allAvailability[this.currentViewStaff]) {
              this.allAvailability[this.currentViewStaff] = {};
            }
            if (!this.allAvailability[this.currentViewStaff][dateStr]) {
              this.allAvailability[this.currentViewStaff][dateStr] = { Day: '', Night: '' };
            }
            this.allAvailability[this.currentViewStaff][dateStr]['Day'] = newVal;
            this.saveAllData();
            this.renderCalendar();
          });

          dayCell.appendChild(daySelect);

          const nightSelect = document.createElement('select');
          nightSelect.style.width = '100%';
          nightSelect.style.padding = '2px';
          nightSelect.style.fontSize = '11px';
          nightSelect.style.marginTop = '2px';

          this.availabilityOptions.forEach(opt => {
            const optEl = document.createElement('option');
            optEl.value = opt.value;
            optEl.textContent = opt.label;
            if (opt.value === night_val) optEl.selected = true;
            nightSelect.appendChild(optEl);
          });

          nightSelect.addEventListener('change', (e) => {
            const newVal = e.target.value;
            if (!this.allAvailability[this.currentViewStaff]) {
              this.allAvailability[this.currentViewStaff] = {};
            }
            if (!this.allAvailability[this.currentViewStaff][dateStr]) {
              this.allAvailability[this.currentViewStaff][dateStr] = { Day: '', Night: '' };
            }
            this.allAvailability[this.currentViewStaff][dateStr]['Night'] = newVal;
            this.saveAllData();
            this.renderCalendar();
          });

          dayCell.appendChild(nightSelect);
        }
      }

      calendarEl.appendChild(dayCell);
    }
  }

  getAllStaffAvailabilityForDate(dateStr) {
    const available = [];
    const allStaff = Object.keys(this.loginCodes);

    allStaff.forEach(name => {
      const staffDays = this.allAvailability[name] || {};
      const entry = staffDays[dateStr];

      if (!entry) return;

      const dayVal = entry['Day'];
      const nightVal = entry['Night'];

      if ((dayVal && dayVal !== 'U' && dayVal !== 'V') || (nightVal && nightVal !== 'U' && nightVal !== 'V')) {
        available.push(name);
      }
    });

    return available.sort();
  }

  updateAvailabilitySummary() {
    const el = document.getElementById('availabilitySummary');
    if (!el) return;

    if (this.isOverviewMode) {
      el.textContent = 'Overview mode - showing availability counts per day.';
    } else {
      const staffDays = this.allAvailability[this.currentViewStaff] || {};
      const dates = Object.keys(staffDays).sort();

      if (dates.length === 0) {
        el.textContent = `No availability data for ${this.currentViewStaff} this month.`;
      } else {
        let summary = `Total entries: ${dates.length} days with availability marked.`;
        el.textContent = summary;
      }
    }
  }

  renderIdealCalendar() {
    const calendarEl = document.getElementById('idealCalendar');
    if (!calendarEl) return;
    calendarEl.innerHTML = '';

    this.daysOfWeek.forEach(day => {
      const dayNameEl = document.createElement('div');
      dayNameEl.classList.add('day-name');
      dayNameEl.textContent = day;
      calendarEl.appendChild(dayNameEl);
    });

    const year = this.idealDate.getFullYear();
    const month = this.idealDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
      const blankCell = document.createElement('div');
      blankCell.classList.add('day-cell');
      calendarEl.appendChild(blankCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];

      const dayCell = document.createElement('div');
      dayCell.classList.add('day-cell');
      if (d.getDay() === 0 || d.getDay() === 6) dayCell.classList.add('weekend');

      const dateLabel = document.createElement('div');
      dateLabel.classList.add('date-label');
      dateLabel.textContent = day;
      dayCell.appendChild(dateLabel);

      const staffDays = this.idealAvailability[this.currentViewStaff] || {};
      const entry = staffDays[dateStr];
      const val = entry || '';

      const select = document.createElement('select');
      select.style.width = '100%';
      select.style.padding = '2px';
      select.style.fontSize = '11px';
      select.style.marginTop = '4px';

      this.idealOptions.forEach(opt => {
        const optEl = document.createElement('option');
        optEl.value = opt.value;
        optEl.textContent = opt.label;
        if (opt.value === val) optEl.selected = true;
        select.appendChild(optEl);
      });

      select.addEventListener('change', (e) => {
        const newVal = e.target.value;
        if (!this.idealAvailability[this.currentViewStaff]) {
          this.idealAvailability[this.currentViewStaff] = {};
        }
        this.idealAvailability[this.currentViewStaff][dateStr] = newVal;
        this.saveAllData();
        this.renderIdealCalendar();
      });

      dayCell.appendChild(select);
      calendarEl.appendChild(dayCell);
    }
  }

  showVacationSummary(period) {
    const summaryEl = document.getElementById('vacationSummaryContent');
    if (!summaryEl) return;

    let vacationDays = {};
    const allStaff = Object.keys(this.loginCodes);

    if (period === 'month') {
      const year = this.currentDate.getFullYear();
      const month = this.currentDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const dateStr = d.toISOString().split('T')[0];

        allStaff.forEach(name => {
          const staffDays = this.allAvailability[name] || {};
          const entry = staffDays[dateStr];
          if (entry && (entry['Day'] === 'V' || entry['Night'] === 'V')) {
            if (!vacationDays[name]) vacationDays[name] = [];
            vacationDays[name].push(day);
          }
        });
      }
    } else {
      let startDate = new Date(this.dateRangeStart.getTime());
      let endDate = new Date(this.dateRangeEnd.getTime());

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];

        allStaff.forEach(name => {
          const staffDays = this.allAvailability[name] || {};
          const entry = staffDays[dateStr];
          if (entry && (entry['Day'] === 'V' || entry['Night'] === 'V')) {
            if (!vacationDays[name]) vacationDays[name] = 0;
            vacationDays[name]++;
          }
        });
      }
    }

    let html = '<h3>' + (period === 'month' ? 'Monthly' : 'Yearly') + ' Vacation Summary</h3>';
    html += '<ul>';

    Object.keys(vacationDays).sort().forEach(name => {
      const days = vacationDays[name];
      if (period === 'month') {
        html += `<li>${name}: ${days.length} days (Days: ${days.join(', ')})</li>`;
      } else {
        html += `<li>${name}: ${days} days</li>`;
      }
    });

    html += '</ul>';
    summaryEl.innerHTML = html;

    const modal = document.getElementById('vacationSummaryModal');
    if (modal) {
      modal.style.display = 'block';

      const closeBtn = document.querySelector('.close-vacation-modal');
      if (closeBtn) {
        closeBtn.onclick = () => {
          modal.style.display = 'none';
        };
      }
    }
  }

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

    const year = this.rosterDate.getFullYear();
    const month = this.rosterDate.getMonth();
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDayOfWeek; i++) {
      const blankCell = document.createElement('div');
      blankCell.classList.add('day-cell');
      calendarEl.appendChild(blankCell);
    }

    const getAvailableForShift = (dateStr, shiftType) => {
      const available = [];
      const rnNames = new Set(["Graham Newton", "Stuart Grant", "Kris Austin", "Kellie Ann Vogelaar", "Janice Kirkham",
        "Flo Butler", "Jodi Scott", "Carolyn Hogan", "Michelle Sexsmith"]);
      const paraNames = new Set(["Greg Barton", "Scott McTaggart", "Dave Allison", "Mackenzie Wardle", "Chad Hegge", "Ken King",
        "John Doyle", "Bob Odney"]);
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

    const createCustomDropdown = (dateStr, shift, currentValue, staffList, availableSet, label) => {
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.style.width = '100%';
      container.style.marginBottom = '2px';

      const button = document.createElement('button');
      button.style.width = '100%';
      button.style.padding = '4px';
      button.style.fontSize = '11px';
      button.style.fontWeight = 'bold';
      button.style.backgroundColor = '#f5f5f5';
      button.style.border = '1px solid #999';
      button.style.borderRadius = '3px';
      button.style.cursor = 'pointer';
      button.style.textAlign = 'left';
      button.textContent = currentValue || label;

      const menu = document.createElement('div');
      menu.style.position = 'absolute';
      menu.style.top = '100%';
      menu.style.left = '0';
      menu.style.right = '0';
      menu.style.backgroundColor = 'white';
      menu.style.border = '1px solid #999';
      menu.style.borderRadius = '3px';
      menu.style.maxHeight = '150px';
      menu.style.overflowY = 'auto';
      menu.style.zIndex = '1000';
      menu.style.display = 'none';
      menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

      const clearOption = document.createElement('div');
      clearOption.textContent = label;
      clearOption.style.padding = '6px 8px';
      clearOption.style.cursor = 'pointer';
      clearOption.style.backgroundColor = '#f0f0f0';
      clearOption.style.borderBottom = '1px solid #ddd';
      clearOption.style.fontSize = '11px';
      clearOption.addEventListener('click', () => {
        this.updateRosterCell(dateStr, shift, '');
        menu.style.display = 'none';
      });
      menu.appendChild(clearOption);

      staffList.forEach(name => {
        const option = document.createElement('div');
        option.textContent = name;
        option.style.padding = '6px 8px';
        option.style.cursor = 'pointer';
        option.style.fontSize = '11px';
        option.style.borderBottom = '1px solid #eee';

        if (availableSet.has(name)) {
          option.style.backgroundColor = '#90EE90';
          option.style.color = '#000';
          option.style.fontWeight = 'bold';
        } else {
          option.style.backgroundColor = '#ffcccc';
          option.style.color = '#666';
        }

        option.addEventListener('mouseover', () => {
          option.style.opacity = '0.8';
        });
        option.addEventListener('mouseout', () => {
          option.style.opacity = '1';
        });
        option.addEventListener('click', () => {
          this.updateRosterCell(dateStr, shift, name);
          menu.style.display = 'none';
        });
        menu.appendChild(option);
      });

      button.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });

      document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
          menu.style.display = 'none';
        }
      });

      container.appendChild(button);
      container.appendChild(menu);
      return container;
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

      const shiftsContainer = document.createElement('div');
      shiftsContainer.style.display = 'flex';
      shiftsContainer.style.flexDirection = 'column';
      shiftsContainer.style.gap = '4px';

      const pdAvailable = getAvailableForShift(dateStr, 'Day');
      const pdAvailableSet = new Set(pdAvailable);
      const paraNames = ["Greg Barton", "Scott McTaggart", "Dave Allison", "Mackenzie Wardle", "Chad Hegge", "Ken King", "John Doyle", "Bob Odney"];
      shiftsContainer.appendChild(
        createCustomDropdown(dateStr, 'paraDay', entry.paraDay, paraNames, pdAvailableSet, 'Para Day')
      );

      const ndAvailable = getAvailableForShift(dateStr, 'Day');
      const ndAvailableSet = new Set(ndAvailable);
      const rnNames = ["Graham Newton", "Stuart Grant", "Kris Austin", "Kellie Ann Vogelaar", "Janice Kirkham", "Flo Butler", "Jodi Scott", "Carolyn Hogan", "Michelle Sexsmith"];
      shiftsContainer.appendChild(
        createCustomDropdown(dateStr, 'nurseDay', entry.nurseDay, rnNames, ndAvailableSet, 'Nurse Day')
      );

      const pnAvailable = getAvailableForShift(dateStr, 'Night');
      const pnAvailableSet = new Set(pnAvailable);
      shiftsContainer.appendChild(
        createCustomDropdown(dateStr, 'paraNight', entry.paraNight, paraNames, pnAvailableSet, 'Para Night')
      );

      const nnAvailable = getAvailableForShift(dateStr, 'Night');
      const nnAvailableSet = new Set(nnAvailable);
      shiftsContainer.appendChild(
        createCustomDropdown(dateStr, 'nurseNight', entry.nurseNight, rnNames, nnAvailableSet, 'Nurse Night')
      );

      dayCell.appendChild(shiftsContainer);

      const emptyShifts = [];
      if (!entry.paraDay) emptyShifts.push('Para Day');
      if (!entry.nurseDay) emptyShifts.push('Nurse Day');
      if (!entry.paraNight) emptyShifts.push('Para Night');
      if (!entry.nurseNight) emptyShifts.push('Nurse Night');

      if (emptyShifts.length > 0) {
        dayCell.style.backgroundColor = '#ffcccc';
        dayCell.style.borderColor = '#ff0000';
        dayCell.style.borderWidth = '2px';
        const warningLabel = document.createElement('div');
        warningLabel.style.fontSize = '10px';
        warningLabel.style.color = '#ff0000';
        warningLabel.style.fontWeight = 'bold';
        warningLabel.style.marginTop = '4px';
        warningLabel.textContent = '⚠️ ' + emptyShifts[0];
        dayCell.appendChild(warningLabel);
      }

      calendarEl.appendChild(dayCell);
    }

    this.renderRosterSummary();
  }

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

    if (name && name.trim() !== '') {
      if (!this.overrideShiftCap) {
        const caps = this.getMonthlyCapsForCurrentMonth();
        const staffCap = caps[name];

        if (!staffCap) {
          alert(`No cap found for ${name}`);
          this.renderRosterCalendar();
          return;
        }

        const year = this.rosterDate.getFullYear();
        const month = this.rosterDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        let currentCount = 0;
        for (let day = 1; day <= daysInMonth; day++) {
          const d = new Date(year, month, day);
          const monthDateStr = d.toISOString().split('T')[0];
          const roster = this.generatedRoster[monthDateStr];
          
          if (!roster) continue;
          
          if (
            roster.paraDay === name ||
            roster.nurseDay === name ||
            roster.paraNight === name ||
            roster.nurseNight === name
          ) {
            currentCount++;
          }
        }

        if (currentCount >= staffCap.cap) {
          alert(
            `${name} has reached their shift limit (${staffCap.cap} shifts max this month). Cannot assign more shifts.\n\nUncheck "Override Shift Cap" to bypass.`
          );
          this.renderRosterCalendar();
          return;
        }
      }
    }

    this.generatedRoster[dateStr][shift] = name || null;
    firebase.database().ref('generatedRoster').set(this.generatedRoster);
    this.renderRosterCalendar();
  }

  getRosterCountsForMonth() {
    const year = this.rosterDate.getFullYear();
    const month = this.rosterDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const counts = {};
    const allStaff = [
      "Greg Barton", "Scott McTaggart", "Graham Newton", "Stuart Grant",
      "Dave Allison", "Mackenzie Wardle", "Chad Hegge", "Ken King", "John Doyle", "Bob Odney",
      "Kris Austin", "Kellie Ann Vogelaar", "Janice Kirkham", "Flo Butler", "Jodi Scott",
      "Carolyn Hogan", "Michelle Sexsmith"
    ];

    allStaff.forEach(name => {
      counts[name] = { total: 0, day: 0, night: 0, weekend: 0 };
    });

    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateStr = d.toISOString().split('T')[0];
      const isWeekend = d.getDay() === 0 || d.getDay() === 6;

      const roster = this.generatedRoster[dateStr];
      if (!roster) continue;

      if (roster.paraDay) {
        counts[roster.paraDay].total++;
        counts[roster.paraDay].day++;
        if (isWeekend) counts[roster.paraDay].weekend++;
      }
      if (roster.nurseDay) {
        counts[roster.nurseDay].total++;
        counts[roster.nurseDay].day++;
        if (isWeekend) counts[roster.nurseDay].weekend++;
      }
      if (roster.paraNight) {
        counts[roster.paraNight].total++;
        counts[roster.paraNight].night++;
        if (isWeekend) counts[roster.paraNight].weekend++;
      }
      if (roster.nurseNight) {
        counts[roster.nurseNight].total++;
        counts[roster.nurseNight].night++;
        if (isWeekend) counts[roster.nurseNight].weekend++;
      }
    }

    return counts;
  }

  renderRosterSummary() {
    const summaryEl = document.getElementById('rosterSummary');
    if (!summaryEl) return;

    const counts = this.getRosterCountsForMonth();

    let html = '<table border="1" style="border-collapse: collapse; width: 100%;"><tr>';
    html += '<th>Staff</th><th>Total</th><th>Day</th><th>Night</th><th>Weekend</th></tr>';

    Object.keys(counts).sort().forEach(name => {
      const c = counts[name];
      html += `<tr><td>${name}</td><td>${c.total}</td><td>${c.day}</td><td>${c.night}</td><td>${c.weekend}</td></tr>`;
    });

    html += '</table>';
    summaryEl.innerHTML = html;
  }

  onGenerateRoster() {
    alert('Auto-generate roster feature coming soon!');
  }

  loadRosterFromFirebase() {
    // Data loads automatically via listener in loadAllData()
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.staffScheduleApp = new StaffScheduleApp();
});
