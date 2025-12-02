class StaffScheduleApp {
  constructor() {
    this.currentStaff = null;        // who is logged in
    this.currentViewStaff = null;    // whose calendar is being viewed

    this.privilegedUsers = new Set([
      "Greg Barton",
      "Scott McTaggart",
      "Graham Newton"
    ]);

    this.loginCodes = {
      "Greg Barton": "B123",
      "Scott McTaggart": "S456",
      "Dave Allison": "D789",
      "Mackenzie Wardell": "M321",
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

    // Minimum availability (per month) for 30‑day months
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
      "Mackenzie Wardell": 6
    };

    // Minimum availability (per month) for 31‑day months
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
      "Mackenzie Wardell": 6
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

    this.monthNames = [
      "January","February","March","April","May","June",
      "July","August","September","October","November","December"
    ];
    this.daysOfWeek = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

    // April 2026 to March 2027
    this.dateRangeStart = new Date(2026, 3, 1);
    this.dateRangeEnd   = new Date(2027, 2, 31);
    this.currentDate    = new Date(this.dateRangeStart.getTime());

    this.bindEvents();
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
  }

  async onStaffChange(e) {
    const enteredName = e.target.value;
    if (!enteredName) {
      this.hideSchedule();
      return;
    }

    const code = prompt(`Enter login code for ${enteredName}:`);
    if (!code || code.trim().toUpperCase() !== this.loginCodes[enteredName].toUpperCase()) {
      alert("Incorrect code. Access denied.");
      e.target.value = "";
      this.hideSchedule();
      this.currentStaff = null;
      this.currentViewStaff = null;
      return;
    }

    this.currentStaff = enteredName;

    if (this.privilegedUsers.has(enteredName)) {
      this.currentViewStaff = enteredName;
      this.populateViewStaffSelector();
      document.getElementById('viewAllSection').style.display = 'block';
    } else {
      this.currentViewStaff = enteredName;
      document.getElementById('viewAllSection').style.display = 'none';
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
    document.getElementById('scheduleTitle').textContent =
      `Schedule for ${this.currentViewStaff}`;
    this.renderCalendar();
    this.updateAvailabilitySummary();
    this.updateCurrentMonthLabel();
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

  updateCurrentMonthLabel() {
    const monthName = this.monthNames[this.currentDate.getMonth()];
    const year      = this.currentDate.getFullYear();
    document.getElementById('currentMonth').textContent =
      `${monthName} ${year}`;
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

      const dayShiftSelect = this.createAvailabilityDropdown(dateStr, 'Day');
      dayCell.appendChild(dayShiftSelect);

      const nightShiftSelect = this.createAvailabilityDropdown(dateStr, 'Night');
      dayCell.appendChild(nightShiftSelect);

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

    select.addEventListener('change', () => this.updateAvailabilitySummary());
    return select;
  }

  updateAvailabilitySummary() {
    if (!this.currentViewStaff) return;

    const selects = document.querySelectorAll('.availability-dropdown');
    const DAY = "Day", NIGHT = "Night";
    const shiftMap = new Map();

    selects.forEach(sel => {
      if (sel.value === 'A') {
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
      if (shift === NIGHT && d === 5) return true; // Friday night
      if (d === 6 || d === 0) return true;        // Saturday/Sunday
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

    // Adjusted availability calculation (based on your rules)
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
        // Day + Night same day = 1 shift
        adjustedTotal += 1;

        // If next day also has Day, that is an additional independent shift
        if (nextAvail && diffDays === 1 && nextAvail[DAY]) {
          adjustedTotal += 1;
          i += 1; // next day’s Day handled
        }
      } else if (thisAvail[NIGHT] && nextAvail && diffDays === 1 && nextAvail[DAY]) {
        // Night then next day Day = 1 combined shift
        adjustedTotal += 1;
        i += 2; // skip next day’s Day (already counted)
        continue;
      } else if (thisAvail[DAY] || thisAvail[NIGHT]) {
        // Standalone Day or Night, not captured in a pair
        adjustedTotal += 1;
      }

      i += 1;
    }

    // Determine the minimum for this staff member in this month
    const year  = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let minimum = 0;
    if (daysInMonth === 30) {
      minimum = this.minimumRequired30[this.currentViewStaff] || 0;
    } else if (daysInMonth === 31) {
      minimum = this.minimumRequired31[this.currentViewStaff] || 0;
    } else {
      minimum = 0; // for February or other lengths, if ever used
    }

    const requiredAdjusted = minimum * 2;

    const summaryDiv = document.getElementById('availabilitySummary');
    summaryDiv.innerHTML = `
      Day shifts available: ${dayCount} | Night shifts available: ${nightCount} |
      Weekend shifts available: ${weekendCount} | Adjusted total availability: ${adjustedTotal}
      <br>
      Minimum base requirement: ${minimum} | Required adjusted shifts: ${requiredAdjusted}
    `;

    // Color highlighting based on meeting requirement
    summaryDiv.classList.remove('highlight-red', 'highlight-green');
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