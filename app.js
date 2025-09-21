class StaffScheduleApp {
  constructor() {
    this.currentStaff = null;
    this.privilegedUsers = new Set([
      "Greg Barton",
      "Graham Newton",
      "Scott McTaggart"
    ]);
    this.privilegedAuthenticated = false;

    this.availabilityViewers = new Set([
      "Greg Barton",
      "Scott McTaggart",
      "Graham Newton"
    ]);

    this.loginCodes = {
      "Greg Barton": "B123",
      "Scott McTaggart": "S456",
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

    this.paramedics = [
      "Greg Barton",
      "Scott McTaggart",
      "Mackenzie Wardell",
      "Chad Hegge",
      "Ken King",
      "John Doyle",
      "Bob Odney"
    ];

    this.nurses = [
      "Graham Newton",
      "Stuart Grant",
      "Kellie Ann Vogelaar",
      "Michelle Sexsmith",
      "Carolyn Hogan",
      "Kris Austin",
      "Flo Butler",
      "Jodi Scott",
      "Janice Kirkham"
    ];

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

    this.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    this.daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    this.dateRangeStart = new Date(2026, 3, 1);
    this.dateRangeEnd = new Date(2027, 2, 31);
    this.currentDate = new Date(this.dateRangeStart.getTime());
    this.scheduleData = {};
    this.masterCalendarActive = false;
    this.sharedInputActive = false;

    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('staffSelect').addEventListener('change', e => this.onStaffChange(e));
    document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
    document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
  }

  async onStaffChange(e) {
    const staffName = e.target.value;

    if (!staffName) {
      this.hideSchedule();
      return;
    }

    const code = prompt(`Enter login code for ${staffName}:`);

    if (!code || code.trim().toUpperCase() !== this.loginCodes[staffName].toUpperCase()) {
      alert("Incorrect code. Access denied.");
      document.getElementById('staffSelect').value = "";
      this.hideSchedule();
      this.currentStaff = null;
      return;
    }

    this.privilegedAuthenticated = this.privilegedUsers.has(staffName);
    this.currentStaff = staffName;
    this.masterCalendarActive = false;
    this.sharedInputActive = false;

    await this.loadAvailability(staffName);
    this.showSchedule();
  }

  async loadAvailability(staffName) {
    // This can be adapted to your data loading method
    this.scheduleData[staffName] = {};
  }

  hideSchedule() {
    document.getElementById('scheduleSection').style.display = 'none';
    document.getElementById('scheduleTitle').textContent = '';
    document.getElementById('calendar').innerHTML = '';
    document.getElementById('availabilitySummary').textContent = '';
  }

  showSchedule() {
    document.getElementById('scheduleSection').style.display = 'block';
    document.getElementById('scheduleTitle').textContent = `Schedule for ${this.currentStaff}`;
    this.renderCalendar();
  }

  changeMonth(direction) {
    let newMonth = this.currentDate.getMonth() + direction;
    let newYear = this.currentDate.getFullYear();

    let newDate = new Date(newYear, newMonth, 1);
    if (newDate < this.dateRangeStart) newDate = new Date(this.dateRangeStart.getFullYear(), this.dateRangeStart.getMonth(), 1);
    if (newDate > this.dateRangeEnd) newDate = new Date(this.dateRangeEnd.getFullYear(), this.dateRangeEnd.getMonth(), 1);

    this.currentDate = newDate;
    this.renderCalendar();
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

      // Basic dropdowns, values ignored in this minimal example
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
    select.dataset.date = dateStr;
    select.dataset.shiftType = shiftType;

    // Sample availability options
    const options = [
      { value: '', label: 'Not Specified' },
      { value: 'A', label: 'A - Available' },
      { value: 'U', label: 'U - Unavailable' },
      { value: 'R', label: 'R - Requested Off' },
      { value: 'S', label: 'S - Scheduled' },
      { value: 'V', label: 'V - Vacation' },
      { value: 'T', label: 'T - Training' },
      { value: 'K', label: 'K - Sick' }
    ];

    options.forEach(opt => {
      const option = document.createElement('option');
      option.value = opt.value;
      option.text = opt.label;
      select.appendChild(option);
    });

    return select;
  }
}

window.onload = () => {
  new StaffScheduleApp();
};