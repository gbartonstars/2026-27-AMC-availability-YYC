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

    this.allAvailability = {};
    this.idealAvailability = {};
    this.generatedRoster = {};      // auto-generated roster from Firebase
    this.idealDate = new Date(this.dateRangeStart.getTime());
    this.rosterDate = new Date(this.dateRangeStart.getTime()); // roster view month
// lock flags (first / last 6 months)
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

  // Live listeners: keep data in sync across all devices
  loadAllData() {
    const scheduleRef = firebase.database().ref("scheduleData");
    scheduleRef.on("value", snapshot => {
      const data = snapshot.val() || {};
      this.allAvailability = data.allAvailability || {};
      this.idealAvailability = data.idealAvailability || {};

      if (this.currentStaff || this.isOverviewMode) {
        this.renderCalendar();
        this.updateAvailabilitySummary();
      }
    }, error => {
      console.error("Error listening to Firebase scheduleData", error);
    });

    const rosterRef = firebase.database().ref("generatedRoster");
    rosterRef.on("value", snapshot => {
      this.generatedRoster = snapshot.val() || {};
      if (document.getElementById("autoRosterSection").style.display === "block") {
        this.renderRosterCalendar();
        this.updateRosterMonthLabel();
      }
    }, error => {
      console.error("Error listening to Firebase generatedRoster", error);
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
  }
  async onStaffChange(e) {
    const enteredName = e.target.value;
    if (!enteredName) {
      this.hideSchedule();
      document.getElementById('idealTabSection').style.display = 'none';
      document.getElementById('idealScheduleSection').style.display = 'none';
      document.getElementById('adminRosterControls').style.display = 'none';
      document.getElementById('autoRosterSection').style.display = 'none';
      return;
    }

    const code = prompt(`Enter login code for ${enteredName}:`);
    if (!code || code.trim().toUpperCase() !== this.loginCodes[enteredName].toUpperCase()) {
      alert("Incorrect code. Access denied.");
      e.target.value = "";
      this.hideSchedule();
      document.getElementById('idealTabSection').style.display = 'none';
      document.getElementById('idealScheduleSection').style.display = 'none';
      document.getElementById('adminRosterControls').style.display = 'none';
      document.getElementById('autoRosterSection').style.display = 'none';
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
    } else {
      this.currentViewStaff = enteredName;
      document.getElementById('viewAllSection').style.display = 'none';
      document.getElementById('adminRosterControls').style.display = 'none';
      document.getElementById('adminLockControls').style.display = 'none';
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
    this.renderRosterCalendar();
    this.updateRosterMonthLabel();
  }

  updateRosterMonthLabel() {
    const monthName = this.monthNames[this.rosterDate.getMonth()];
    const year      = this.rosterDate.getFullYear();
    document.getElementById('rosterCurrentMonth').textContent =
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

  // Render the auto-generated roster calendar (read-only)
  renderRosterCalendar() {
    const calendarEl = document.getElementById('rosterCalendar');
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

      const entry = (this.generatedRoster && this.generatedRoster[dateStr]) || {};

      const pd = document.createElement('div');
      pd.textContent = `Para Day: ${entry.paraDay || '-'}`;
      const nd = document.createElement('div');
      nd.textContent = `Nurse Day: ${entry.nurseDay || '-'}`;
      const pn = document.createElement('div');
      pn.textContent = `Para Night: ${entry.paraNight || '-'}`;
      const nn = document.createElement('div');
      nn.textContent = `Nurse Night: ${entry.nurseNight || '-'}`;

      dayCell.appendChild(pd);
      dayCell.appendChild(nd);
      dayCell.appendChild(pn);
      dayCell.appendChild(nn);

      calendarEl.appendChild(dayCell);
    }
  }

  // Placeholder for the actual generator (Phase 2)
  onGenerateRoster() {
    if (!this.currentStaff || this.currentStaff !== "Greg Barton") {
      alert("Only Greg can generate the roster.");
      return;
    }

    alert("Roster generation logic will be added in the next phase.");
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

    selects.forEach(sel => {
      if (sel.value === 'A' || sel.value === 'V') {
        const dateStr = sel.dataset.date;
        const shift   = sel.dataset.shiftType;
        if (!shiftMap.has(dateStr)) shiftMap.set(dateStr, {});
        shiftMap.get(dateStr)[shift] = true;
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
    const month     = this.currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let minimum = 0;
    if (daysInMonth === 30) {
      minimum = this.minimumRequired30[this.currentViewStaff] || 0;
    } else if (daysInMonth === 31) {
      minimum = this.minimumRequired31[this.currentViewStaff] || 0;
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
}

window.onload = () => {
  new StaffScheduleApp();
};
