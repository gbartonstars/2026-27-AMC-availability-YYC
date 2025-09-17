class StaffScheduleApp {
    constructor() {
        this.currentStaff = null;
        this.currentRole = null;
        this.currentDate = new Date(2026, 3, 1); // April 1, 2026 (month 0-indexed)
        this.scheduleData = {};
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
        this.paramedics = ["Greg Barton", "Scott McTaggart", "Dave Allison", "Mackenzie Wardell", "Chad Hegge", "Ken King", "John Doyle"];
        this.nurses = ["Graham Newton", "Stuart Grant", "Kellie Ann Vogelaar", "Michelle Sexsmith", "Carolyn Hogan", "Kris Austin", "Flo Butler", "Jodi Scott", "Janice Kirkham"];
        this.monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        this.dateRangeStart = new Date(2026, 3, 1);
        this.dateRangeEnd = new Date(2027, 2, 31);
        this.currentMonth = this.dateRangeStart.getMonth();
        this.currentYear = this.dateRangeStart.getFullYear();
        this.bindEvents();
    }

    bindEvents() {
        document.getElementById('staffSelect').addEventListener('change', (e) => this.onStaffChange(e));
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));
    }

    onStaffChange(event) {
        const staffName = event.target.value;
        if (!staffName) {
            this.hideSchedule();
            return;
        }
        this.currentStaff = staffName;
        this.currentRole = this.paramedics.includes(staffName) ? 'paramedic' : 'nurse';
        if (!this.scheduleData[staffName]) {
            this.scheduleData[staffName] = {};
        }
        this.showSchedule();
    }

    hideSchedule() {
        document.getElementById('scheduleSection').style.display = 'none';
        document.getElementById('scheduleTitle').textContent = '';
    }

    showSchedule() {
        document.getElementById('scheduleSection').style.display = 'block';
        document.getElementById('scheduleTitle').textContent = `Schedule for ${this.currentStaff}`;
        this.renderMonth();
    }

    changeMonth(direction) {
        let newMonth = this.currentMonth + direction;
        let newYear = this.currentYear;
        if (newYear === this.dateRangeStart.getFullYear() && newMonth < this.dateRangeStart.getMonth()) {
            newMonth = this.dateRangeStart.getMonth();
        }
        if (newYear === this.dateRangeEnd.getFullYear() && newMonth > this.dateRangeEnd.getMonth()) {
            newMonth = this.dateRangeEnd.getMonth();
        }
        if (newMonth < 0) {
            newYear -= 1;
            newMonth = 11;
        } else if (newMonth > 11) {
            newYear += 1;
            newMonth = 0;
        }
        this.currentMonth = newMonth;
        this.currentYear = newYear;
        this.renderMonth();
    }

    renderMonth() {
        const tbody = document.querySelector('#scheduleTable tbody');
        tbody.innerHTML = '';
        const firstDay = new Date(this.currentYear, this.currentMonth, 1);
        const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
        const staffData = this.scheduleData[this.currentStaff];
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const date = new Date(this.currentYear, this.currentMonth, day);
            if (date < this.dateRangeStart || date > this.dateRangeEnd) continue;
            const dateString = date.toISOString().split('T')[0];
            const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' });

            const tr = document.createElement('tr');
            if (date.getDay() === 0 || date.getDay() === 6) {
                tr.classList.add('weekend');
            }
            const dateCell = document.createElement('td');
            dateCell.textContent = dateString;
            tr.appendChild(dateCell);

            const dayCell = document.createElement('td');
            dayCell.textContent = dayOfWeek;
            tr.appendChild(dayCell);

            const dayShiftCell = document.createElement('td');
            const dayShiftSelect = this.createAvailabilityDropdown(dateString, 'Day');
            dayShiftCell.appendChild(dayShiftSelect);
            tr.appendChild(dayShiftCell);

            const nightShiftCell = document.createElement('td');
            const nightShiftSelect = this.createAvailabilityDropdown(dateString, 'Night');
            nightShiftCell.appendChild(nightShiftSelect);
            tr.appendChild(nightShiftCell);

            tbody.appendChild(tr);
        }
        document.getElementById('currentMonth').textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
        this.updateAvailabilitySummary();
    }

    createAvailabilityDropdown(dateString, shiftType) {
        const select = document.createElement('select');
        select.classList.add('availability-dropdown');
        select.dataset.date = dateString;
        select.dataset.shiftType = shiftType;

        const options = this.availabilityOptions;
        const staffData = this.scheduleData[this.currentStaff] || {};
        const key = `${dateString}_${shiftType}`;
        const currentValue = staffData[key] || '';

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.text = opt.label;
            option.selected = (opt.value === currentValue);
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            this.scheduleData[this.currentStaff][key] = e.target.value;
            this.updateAvailabilitySummary();
        });

        return select;
    }

    updateAvailabilitySummary() {
        if (!this.currentStaff) return;
        const staffData = this.scheduleData[this.currentStaff] || {};

        let totalDayShifts = 0;
        let totalNightShifts = 0;
        let totalWeekendShifts = 0;
        let adjustedAvailabilityCount = 0;

        const keys = Object.keys(staffData).filter(k => staffData[k] === 'A').sort();
        let previousDate = null;
        let previousShift = null;

        const parseKey = (key) => {
            const parts = key.split('_');
            return { date: parts[0], shift: parts[1] };
        };

        for (let key of keys) {
            const { date, shift } = parseKey(key);
            const dt = new Date(date);

            // Count day/night/weekend shifts
            if (shift === 'Day') totalDayShifts++;
            else if (shift === 'Night') totalNightShifts++;
            if (dt.getDay() === 0 || dt.getDay() === 6) totalWeekendShifts++;

            // Adjusted availability to count consecutive day-night or night-day as one shift
            if (previousDate) {
                const prevDt = new Date(previousDate);
                const diffDays = (dt - prevDt) / (1000 * 3600 * 24);

                if (diffDays === 0) {
                    if ((previousShift === 'Day' && shift === 'Night') || (previousShift === 'Night' && shift === 'Day')) {
                        previousDate = date;
                        previousShift = shift;
                        continue;
                    }
                } else if (diffDays === 1) {
                    if (previousShift === 'Night' && shift === 'Day') {
                        previousDate = date;
                        previousShift = shift;
                        continue;
                    }
                } else if (diffDays === -1) {
                    if (previousShift === 'Day' && shift === 'Night') {
                        previousDate = date;
                        previousShift = shift;
                        continue;
                    }
                }
            }
            adjustedAvailabilityCount++;
            previousDate = date;
            previousShift = shift;
        }

        const summaryDiv = document.getElementById('availabilitySummary');
        summaryDiv.innerHTML = \`Day Shifts Available: \${totalDayShifts} | Night Shifts Available: \${totalNightShifts} | Weekend Shifts Available: \${totalWeekendShifts} | Adjusted Total Availability: \${adjustedAvailabilityCount}\`;
    }
}

window.onload = () => {
    new StaffScheduleApp();
};