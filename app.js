updateAvailability() {
  if (!this.currentStaff) return;
  const selects = document.querySelectorAll('.availability-dropdown');
  
  // Map dates to shift availability
  const availabilityMap = new Map();
  selects.forEach(sel => {
    if(sel.value === 'A') {
      if (!availabilityMap.has(sel.dataset.date)) availabilityMap.set(sel.dataset.date, {Day: false, Night: false});
      availabilityMap.get(sel.dataset.date)[sel.dataset.shift] = true;
    }
  });
  
  // Sort dates for sequential processing
  const sortedDates = Array.from(availabilityMap.keys()).sort();
  let adjustedCount = 0;
  let i = 0;
  
  // For calculating totals
  let dayCount = 0;
  let nightCount = 0;
  let weekendCount = 0;

  const isWeekend = dateObj => {
    let day = dateObj.getDay();
    return day == 0 || day == 6;
  };
  
  while (i < sortedDates.length) {
    let currDateStr = sortedDates[i];
    let currDate = new Date(currDateStr);
    let currAvail = availabilityMap.get(currDateStr);

    if (currAvail.Day) dayCount++;
    if (currAvail.Night) nightCount++;
    
    if (isWeekend(currDate) || (currDate.getDay() === 5)) {
      // Include Friday night, Sat and Sun all times as weekend shifts
      if (currAvail.Day) weekendCount++;
      if (currAvail.Night) weekendCount++;
    }
    
    let nextDateStr = sortedDates[i+1];
    let nextDate = nextDateStr ? new Date(nextDateStr) : null;
    let nextAvail = nextDateStr ? availabilityMap.get(nextDateStr) : null;

    let combinedCurrent = currAvail.Day && currAvail.Night;
    let hasNextDayShift = nextAvail && nextAvail.Day;
    let hasNextNightShift = nextAvail && nextAvail.Night;
    let dayGap = nextDate ? (nextDate - currDate) / 86400000 : null;

    if(combinedCurrent){
      // current day both shifts
      
      if(hasNextDayShift && dayGap == 1){
        adjustedCount += 2;
        i+=2;
        continue;
      }
      else{
        adjustedCount +=1;
        i++;
        continue;
      }
    } else if(currAvail.Day){
      if(i>0){
        // Check if previous day had night
        let prevDateStr = sortedDates[i-1];
        let prevDate = new Date(prevDateStr);
        let prevAvail = availabilityMap.get(prevDateStr);
        let dayDiff = (currDate - prevDate) / 86400000;
        
        if(!(prevAvail.Night && dayDiff ===1)){
          adjustedCount +=1;
          i++;
          continue;
        }
        else{
          i++;
          continue;
        }
      } else {
        adjustedCount +=1;
        i++;
        continue;
      }
    } else if(currAvail.Night){
      if(hasNextDayShift && dayGap ==1){
        adjustedCount +=1;
        i +=2;
        continue;
      } else {
        adjustedCount +=1;
        i++;
        continue;
      }
    } else {
      i++;
    }
  }
  
  // Show the counts
  const summary = `Day shifts available: ${dayCount} | Night shifts available: ${nightCount} | Weekend shifts available: ${weekendCount} | Adjusted availability: ${adjustedCount}`;
  const summaryDiv = document.getElementById('availabilitySummary');
  summaryDiv.textContent = summary;
}