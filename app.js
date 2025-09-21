class StaffScheduleApp {
  constructor() {
    this.currentStaff = null;
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
    this.bindEvents();
  }

  bindEvents() {
    console.log("Binding event to staffSelect");
    const select = document.getElementById('staffSelect');
    if(select) {
      select.addEventListener('change', e => this.onStaffChange(e));
    } else {
      console.error('staffSelect element not found');
    }
  }

  onStaffChange(e) {
    const staffName = e.target.value;
    console.log("Staff selected:", staffName);
    if(!staffName) return;

    const code = prompt(`Enter login code for ${staffName}:`);
    console.log("Code entered:", code);

    if(!code || code.trim().toUpperCase() !== this.loginCodes[staffName].toUpperCase()) {
      alert("Incorrect code. Access denied.");
      e.target.value = "";
      return;
    }

    this.currentStaff = staffName;
    alert(`Welcome, ${staffName}!`);
    // Further logic for showing schedule etc. goes here
  }
}

window.onload = () => {
  new StaffScheduleApp();
};