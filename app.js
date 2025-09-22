class StaffScheduleApp {
  constructor() {
    this.currentStaff = null;
    this.currentViewStaff = null;
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

    this.monthNames = ["January", "February", "March", "April", "May", "June","July", "August", "September", "October", "November", "December"];
    this.daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this.dateRangeStart = new Date(2026, 3, 1);
    this.dateRangeEnd = new Date(2027, 2, 31);
    this.currentDate = new Date(this.dateRangeStart.getTime());

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('staffSelect').addEventListener('change', e => this.onStaffChange(e));
    document.getElementById('viewStaffSelect').addEventListener('change', e => this.onViewStaffChange(e));
    document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
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
    document.getElementById('scheduleTitle').textContent = `Schedule for ${this.currentViewStaff}`;
    this.renderCalendar();
    this.updateAvailabilitySummary();
    this.updateCurrentMonthLabel();
  }

  changeMonth(direction) {
    let newMonth = this.currentDate.getMonth() + direction;
    let newYear = this.currentDate.getFullYear();
    let newDate = new Date(newYear, newMonth, 1);
    if (newDate < this.dateRangeStart) newDate = new Date(this.dateRangeStart.getFullYear(), this.dateRangeStart.getMonth(), 1);
    if (newDate > this.dateRangeEnd) newDate = new Date(this.dateRangeEnd.getFullYear(), this.dateRangeEnd.getMonth(), 1);
    this.currentDate = newDate;
    this.showSchedule();
  }

  updateCurrentMonthLabel() {
    const monthName = this.monthNames[this.currentDate.getMonth()];
    const year = this.currentDate.getFullYear();
    document.getElementById('currentMonth').textContent = `${monthName} ${year}`;
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
      const dateObj = new Date(year, month, day);
      const dateStr = dateObj.toISOString().split('T')[0];
      const dayCell = document.createElement('div');
      dayCell.classList.add('day-cell');
      if (dateObj.getDay() === 0 || dateObj.getDay() === 6) dayCell.classList.add('weekend');
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
    if (shiftType === 'Day') select.classList.add('day-shift');
    else if (shiftType === 'Night') select.classList.add('night-shift');
    select.dataset.date = dateStr;
    select.dataset.shiftType = shiftType;
    const options = this.availabilityOptions;
    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.text = opt.label;
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
        const shift = sel.dataset.shiftType;
        if (!shiftMap.has(dateStr)) shiftMap.set(dateStr, {});
        shiftMap.get(dateStr)[shift] = true;
      }
    });

    let dayCount = 0, nightCount = 0, weekendCount = 0;
    const dateKeys = Array.from(shiftMap.keys()).sort();

    // Helper for weekends (Friday night, Sat/Sun)
    const isWeekendOrFriNight = (date, shift) => {
      const d = date.getDay();
      if (shift === NIGHT && d === 5) return true;
      if (d === 6 || d === 0) return true;
      return false;
    };

    // Standard shift totals
    dateKeys.forEach(dateStr => {
      const cur = shiftMap.get(dateStr);
      const curDate = new Date(dateStr);
      if (cur[DAY]) dayCount++;
      if (cur[NIGHT]) nightCount++;
      if (cur[DAY] && isWeekendOrFriNight(curDate, DAY)) weekendCount++;
      if (cur[NIGHT] && isWeekendOrFriNight(curDate, NIGHT)) weekendCount++;
    });

    // Adjusted availability calculation with sliding window logic
    let adjustedTotal = 0, i = 0;
    while (i < dateKeys.length) {
      const thisDateStr = dateKeys[i];
      const thisDateObj = new Date(thisDateStr);
      const thisAvail = shiftMap.get(thisDateStr);
      const nextDateStr = dateKeys[i+1];
      const nextDateObj = nextDateStr ? new Date(nextDateStr) : null;
      const diffDays = nextDateObj ? ((nextDateObj-thisDateObj)/(1000*60*60*24)) : null;
      const nextAvail = nextDateStr ? shiftMap.get(nextDateStr) : null;
      // CASE 1: Both Day and Night on same day
      if (thisAvail[DAY] && thisAvail[NIGHT]) {
        adjustedTotal += 1;
        // check if next day Day is also available, in which case it's a new shift
        if (
          nextAvail && diffDays === 1 && nextAvail[DAY]
        ) {
          adjustedTotal += 1;
          i += 1; // Next day handled
        }
      } else if (thisAvail[DAY]) {
        // Day shift alone (not covered by previous night)
        if (!(i > 0 && shiftMap.get(dateKeys[i-1])[NIGHT] && ((new Date(dateKeys[i-1])).getTime() === (thisDateObj.getTime() - 24*3600*1000)))) {
          adjustedTotal += 1;
        }
      } else if (thisAvail[NIGHT]) {
        // Night only, if next day Day is also available, it's the same shift; else, own shift
        if (nextAvail && diffDays === 1 && nextAvail[DAY]) {
          adjustedTotal += 1;
          i += 1; // Next day handled as well
        } else {
          adjustedTotal += 1;
        }
      }
      i += 1;
    }

    const summaryDiv = document.getElementById('availabilitySummary');
    summaryDiv.innerHTML = `
      Day shifts available: ${dayCount} | Night shifts available: ${nightCount} | 
      Weekend shifts available: ${weekendCount} | Adjusted total availability: ${adjustedTotal}
    `;
  }
}

window.onload = () => {
  new StaffScheduleApp();
};