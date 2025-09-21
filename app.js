class StaffScheduleApp {
    constructor() {
        this.currentStaff = null;
        this.privilegedUsers = new Set([
            "Greg Barton",
            "Graham Newton",
            "Scott McTaggart"
        ]);
        this.privilegedAuthenticated = false;

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

        this.paramedics = [
            "Greg Barton",
            "Scott McTaggart",
            "Dave Allison",
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

        this.octokit = new Octokit({
            auth: 'YOUR_GITHUB_OAUTH_TOKEN' // Replace with your OAuth token
        });
        this.repoOwner = "YOUR_GITHUB_USERNAME"; // Replace with your GitHub username
        this.repoName = "YOUR_REPO_NAME"; // Replace with your repo name

        this.sharedUsers = ["Greg Barton", "Scott McTaggart", "Graham Newton", "Stuart Grant"];
        this.masterInputData = {};

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

        if (this.privilegedUsers.has(staffName)) {
            if (this.currentStaff !== staffName || !this.privilegedAuthenticated) {
                const code = prompt(`Enter login code for ${staffName}:`);
                if (code !== this.loginCodes[staffName]) {
                    alert("Incorrect code. Access denied.");
                    document.getElementById('staffSelect').value = "";
                    this.hideSchedule();
                    this.currentStaff = null;
                    this.privilegedAuthenticated = false;
                    return;
                }
                this.privilegedAuthenticated = true;
            }
        } else {
            this.privilegedAuthenticated = false;
        }

        this.currentStaff = staffName;
        this.masterCalendarActive = false;
        this.sharedInputActive = false;
        await this.loadAvailability(staffName);
        this.showSchedule();
    }

    async loadAvailability(staffName) {
        const path = `data/availability/${staffName.toLowerCase().replace(/\s+/g, "_")}.json`;
        try {
            const response = await this.octokit.repos.getContent({
                owner: this.repoOwner,
                repo: this.repoName,
                path,
            });
            this.scheduleData[staffName] = JSON.parse(atob(response.data.content));
        } catch {
            this.scheduleData[staffName] = {};
        }
    }

    async saveAvailability() {
        if (!this.currentStaff) return;
        const staffName = this.currentStaff;
        const path = `data/availability/${staffName.toLowerCase().replace(/\s+/g, "_")}.json`;
        let sha;
        try {
            const response = await this.octokit.repos.getContent({
                owner: this.repoOwner,
                repo: this.repoName,
                path,
            });
            sha = response.data.sha;
        } catch { }
        await this.octokit.repos.createOrUpdateFileContents({
            owner: this.repoOwner,
            repo: this.repoName,
            path,
            message: `Update availability for ${staffName}`,
            content: btoa(JSON.stringify(this.scheduleData[staffName])),
            sha,
        });
    }

    hideSchedule() {
        document.getElementById('scheduleSection').style.display = 'none';
        document.getElementById('scheduleTitle').textContent = '';
        document.getElementById('calendar').innerHTML = '';
        document.getElementById('availabilitySummary').textContent = '';
        ['masterCalendarBtn', 'sharedInputBtn'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) btn.style.display = 'none';
        });
    }

    showSchedule() {
        document.getElementById('scheduleSection').style.display = 'block';
        this.masterCalendarActive = false;
        this.sharedInputActive = false;
        document.getElementById('scheduleTitle').textContent = `Schedule for ${this.currentStaff}`;
        this.renderCalendar();

        if (this.privilegedUsers.has(this.currentStaff)) {
            let masterBtn = document.getElementById('masterCalendarBtn');
            if (!masterBtn) {
                masterBtn = document.createElement('button');
                masterBtn.id = 'masterCalendarBtn';
                masterBtn.textContent = 'View Master Calendar';
                masterBtn.style.margin = '10px auto 0';
                masterBtn.style.display = 'block';
                masterBtn.addEventListener('click', () => this.showMasterCalendar());
                document.getElementById('scheduleSection').appendChild(masterBtn);
            }
            masterBtn.style.display = 'block';

            let sharedBtn = document.getElementById('sharedInputBtn');
            if (!sharedBtn) {
                sharedBtn = document.createElement('button');
                sharedBtn.id = 'sharedInputBtn';
                sharedBtn.textContent = 'Edit Ideal Shared Schedule';
                sharedBtn.style.margin = '10px auto 0';
                sharedBtn.style.display = 'block';
                sharedBtn.addEventListener('click', () => this.toggleSharedInput());
                document.getElementById('scheduleSection').appendChild(sharedBtn);
            }
            sharedBtn.style.display = 'block';
        } else {
            let masterBtn = document.getElementById('masterCalendarBtn');
            if (masterBtn) masterBtn.style.display = 'none';

            let sharedBtn = document.getElementById('sharedInputBtn');
            if (sharedBtn) sharedBtn.style.display = 'none';
        }
    }

    toggleSharedInput() {
        if (this.sharedInputActive) {
            this.sharedInputActive = false;
            this.showSchedule();
        } else {
            this.sharedInputActive = true;
            this.masterCalendarActive = false;
            this.renderSharedInputCalendar();
        }
    }

    changeMonth(direction) {
        let newMonth = this.currentDate.getMonth() + direction;
        let newYear = this.currentDate.getFullYear();

        let newDate = new Date(newYear, newMonth, 1);
        if (newDate < this.dateRangeStart) newDate = new Date(this.dateRangeStart.getFullYear(), this.dateRangeStart.getMonth(), 1);
        if (newDate > this.dateRangeEnd) newDate = new Date(this.dateRangeEnd.getFullYear(), this.dateRangeEnd.getMonth(), 1);

        this.currentDate = newDate;

        if (this.masterCalendarActive) this.showMasterCalendar();
        else if (this.sharedInputActive) this.renderSharedInputCalendar();
        else this.renderCalendar();
    }

    renderCalendar() {
        const calendarEl = document.getElementById('calendar');
        calendarEl.innerHTML = '';

        document.getElementById('currentMonth').textContent = `${this.monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;

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

            if (dateObj < this.dateRangeStart || dateObj > this.dateRangeEnd) {
                const emptyCell = document.createElement('div');
                emptyCell.classList.add('day-cell');
                calendarEl.appendChild(emptyCell);
                continue;
            }

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

        this.updateAvailabilitySummary();
    }

    createAvailabilityDropdown(dateStr, shiftType) {
        const select = document.createElement('select');
        select.classList.add('availability-dropdown');
        select.dataset.date = dateStr;
        select.dataset.shiftType = shiftType;

        const options = this.availabilityOptions;
        const staffSchedule = this.scheduleData[this.currentStaff] || {};
        const key = `${dateStr}_${shiftType}`;
        const currentValue = staffSchedule[key] || '';

        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.text = opt.label;
            option.selected = (opt.value === currentValue);
            select.appendChild(option);
        });

        select.addEventListener('change', async e => {
            if (!this.scheduleData[this.currentStaff]) this.scheduleData[this.currentStaff] = {};
            this.scheduleData[this.currentStaff][key] = e.target.value;
            this.updateAvailabilitySummary();
            await this.saveAvailability();
        });

        return select;
    }

    updateAvailabilitySummary() {
        if (!this.currentStaff) return;
        const data = this.scheduleData[this.currentStaff] || {};

        let totalDayShifts = 0;
        let totalNightShifts = 0;
        let totalWeekendShifts = 0;
        let adjustedAvailabilityCount = 0;

        const keys = Object.keys(data).filter(k => data[k] === 'A').sort();
        let previousDate = null;
        let previousShift = null;

        const parseKey = (key) => {
            const parts = key.split('_');
            return { date: parts[0], shift: parts[1] };
        };

        for (let key of keys) {
            const { date, shift } = parseKey(key);
            const dt = new Date(date);

            if (shift === 'Day') totalDayShifts++;
            else if (shift === 'Night') totalNightShifts++;
            if (dt.getDay() === 0 || dt.getDay() === 6) totalWeekendShifts++;

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
        summaryDiv.innerHTML = `Day Shifts Available: ${totalDayShifts} | Night Shifts Available: ${totalNightShifts} | Weekend Shifts Available: ${totalWeekendShifts} | Adjusted Total Availability: ${adjustedAvailabilityCount}`;
    }
}

window.onload = () => {
    new StaffScheduleApp();
};