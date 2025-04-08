// Global variable for calendar year
let currentCalendarYear;

// === Validation Helper Functions ===
function showError(inputId, message) {
    const errorSpan = document.getElementById(inputId + 'Error');
    const inputElement = document.getElementById(inputId);
    if (errorSpan) {
        errorSpan.textContent = message;
        errorSpan.style.display = 'block';
    }
    if (inputElement) {
        inputElement.classList.add('input-error');
    }
}

function clearError(inputId) {
    const errorSpan = document.getElementById(inputId + 'Error');
    const inputElement = document.getElementById(inputId);
    if (errorSpan) {
        errorSpan.textContent = '';
        errorSpan.style.display = 'none';
    }
    if (inputElement) {
        inputElement.classList.remove('input-error');
    }
}

function clearAllErrors() {
    clearError('startDate');
    clearError('endDate');
    clearError('hoursPerWeek');
    clearError('hourlyRate');
    clearError('totalHoursInput');
}

// === Main Calculation Function ===
function calculateTotalHours() {
  // Don't clear errors automatically on every calculation triggered by input event
  // Errors will be cleared/shown based on current input values during validation
  // clearAllErrors(); // Removed from here

  let isValid = true;

  // Get Input Values & Elements
  const startInputEl = document.getElementById("startDate");
  const endInputEl = document.getElementById("endDate");
  const hoursPerWeekEl = document.getElementById("hoursPerWeek");
  const totalHoursInputEl = document.getElementById("totalHoursInput");
  const hourlyRateEl = document.getElementById("hourlyRate");

  const startInput = startInputEl.value;
  const endInput = endInputEl.value;
  const hoursPerWeekInput = hoursPerWeekEl.value;
  const totalHoursInputStr = totalHoursInputEl.value;
  const hourlyRateStr = hourlyRateEl.value;

  // Clear previous errors before re-validating
  clearAllErrors();

  // --- Input Validation ---
  if (!startInput) {
    showError('startDate', 'Start date is required.');
    isValid = false;
  }
  if (!endInput) {
    showError('endDate', 'End date is required.');
    isValid = false;
  }
  // Allow calculation even if hours/week is temporarily empty during typing, but show error if needed
  if (!hoursPerWeekInput || isNaN(parseFloat(hoursPerWeekInput)) || parseFloat(hoursPerWeekInput) <= 0) {
      if (hoursPerWeekInput) { // Only show error if there's some invalid input, not just empty
         showError('hoursPerWeek', 'Please enter a valid positive number for hours per week.');
      }
      isValid = false; // Treat empty/invalid hours as non-calculable state
  }
  // Optional: Validate rate if entered
  if (hourlyRateStr && (isNaN(parseFloat(hourlyRateStr)) || parseFloat(hourlyRateStr) <= 0)) {
      showError('hourlyRate', 'Please enter a valid positive number for hourly rate.');
      // We don't set isValid = false here, calculations can proceed without rate
  }
  // Optional: Validate optional total hours if entered
  if (totalHoursInputStr && (isNaN(parseFloat(totalHoursInputStr)) || parseFloat(totalHoursInputStr) < 0)) {
      showError('totalHoursInput', 'Please enter a valid non-negative number for optional total hours.');
      // We don't set isValid = false here, calculations can proceed without optional hours
  }


  // --- Date Validation ---
  const startDate = new Date(startInput);
  const endDate = new Date(endInput);
  if (startInput && endInput && startDate instanceof Date && !isNaN(startDate) && endDate instanceof Date && !isNaN(endDate) && startDate > endDate) {
    showError('endDate', 'End date must be after start date.');
    isValid = false;
  } else if ((startInput && !(startDate instanceof Date && !isNaN(startDate))) || (endInput && !(endDate instanceof Date && !isNaN(endDate)))){
     if (startInput && !(startDate instanceof Date && !isNaN(startDate))) {
        showError('startDate', 'Invalid date format.');
        isValid = false;
     }
      if (endInput && !(endDate instanceof Date && !isNaN(endDate))) {
        showError('endDate', 'Invalid date format.');
        isValid = false;
     }
  }


  // --- Stop or Proceed with Calculations ---
  if (!isValid) {
    // Clear results if fundamental inputs are invalid
    document.getElementById("weeksPassed").textContent = '--';
    document.getElementById("totalHours").textContent = '--';
    document.getElementById("weeksRemaining").textContent = '--';
    document.getElementById("remainingHours").textContent = '--';
    document.getElementById("remainingHoursUntilToday").textContent = '--';
    document.getElementById("confirmedTotal").textContent = '--';
    document.getElementById("amountPaidFromToday").textContent = '--';
    return;
  }

  // --- Proceed with Calculations (only if core inputs are valid) ---
  const hoursPerWeek = parseFloat(hoursPerWeekInput);
  const totalHoursInputVal = parseFloat(totalHoursInputStr); // May be NaN
  const hourlyRate = parseFloat(hourlyRateStr); // May be NaN

  const today = new Date();
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;

  // Calculate weeks/days/hours passed
  const daysPassed = Math.max(0, Math.floor((today - startDate) / msPerDay) + 1);
  const weeksPassed = Math.floor(daysPassed / 7);
  const extraDaysPassed = daysPassed % 7;
  const totalHoursWorked = (weeksPassed * hoursPerWeek) + ((extraDaysPassed / 7) * hoursPerWeek);

  // Calculate weeks/days/hours remaining
  const daysRemaining = Math.max(0, Math.floor((endDate - today) / msPerDay));
  const weeksRemaining = Math.floor(daysRemaining / 7);
  const extraDaysRemaining = daysRemaining % 7;
  const remainingHours = (weeksRemaining * hoursPerWeek) + ((extraDaysRemaining / 7) * hoursPerWeek);

  // Calculate Remaining Hours Until Today
  let remainingUntilToday = '--';
   if (!isNaN(totalHoursInputVal) && totalHoursInputVal >= 0) {
     remainingUntilToday = (totalHoursInputVal - totalHoursWorked).toFixed(2) + " hours";
   } else {
     remainingUntilToday = 'N/A';
   }


  // Calculate and display Amount Paid based on Optional Total Hours
  let amountPaidForOptionalHours = '--';
  if (!isNaN(totalHoursInputVal) && totalHoursInputVal > 0 && !isNaN(hourlyRate) && hourlyRate > 0) {
    amountPaidForOptionalHours = (totalHoursInputVal * hourlyRate).toFixed(2);
    document.getElementById("confirmedTotal").textContent = `$${amountPaidForOptionalHours}`;
  } else {
    document.getElementById("confirmedTotal").textContent = '--';
  }


  // Calculate and display Total Amount Paid FROM today
  let amountPaidFromToday = '--';
  if (!isNaN(hourlyRate) && hourlyRate > 0) {
    amountPaidFromToday = (remainingHours * hourlyRate).toFixed(2);
    document.getElementById("amountPaidFromToday").textContent = `$${amountPaidFromToday}`;
  } else {
    document.getElementById("amountPaidFromToday").textContent = '--';
  }


  // Update other HTML elements
  document.getElementById("weeksPassed").textContent = `${weeksPassed} weeks and ${extraDaysPassed} days`;
  document.getElementById("totalHours").textContent = `${totalHoursWorked.toFixed(2)} hours`;
  document.getElementById("weeksRemaining").textContent = `${weeksRemaining} weeks and ${extraDaysRemaining} days`;
  document.getElementById("remainingHours").textContent = `${remainingHours.toFixed(2)} hours`;
  document.getElementById("remainingHoursUntilToday").textContent = remainingUntilToday;
}


// === Calendar Functions ===
// ... (getWeekStartEnd, formatDate, generateWeeksForYear, getWeekNumber functions remain the same as before) ...
function getWeekStartEnd(year, weekNumber) {
  const janFirst = new Date(year, 0, 1);
  const dayOfWeek = janFirst.getDay() || 7;
  janFirst.setDate(janFirst.getDate() + 4 - dayOfWeek);
  const firstThursday = janFirst.getTime();
  const start = new Date(firstThursday + (weekNumber - 1) * 7 * 24 * 60 * 60 * 1000);
  start.setDate(start.getDate() - 3); // Monday
  const end = new Date(start);
  end.setDate(start.getDate() + 6); // Sunday
  return { start, end };
}

function formatDate(date) {
  const options = { weekday: 'short', month: 'short', day: 'numeric' };
  if (date instanceof Date && !isNaN(date)) {
      return date.toLocaleDateString('en-US', options);
  }
  return 'Invalid Date';
}

function generateWeeksForYear(year) {
  const tbody = document.getElementById('weekTableBody');
  tbody.innerHTML = '';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastDayOfYear = new Date(year, 11, 31);
  const weekOfLastDay = getWeekNumber(lastDayOfYear);
   const dayOfLastDay = lastDayOfYear.getDay() || 7;
   const totalWeeks = (weekOfLastDay < 52) ? 52 : ((dayOfLastDay >= 4 || weekOfLastDay === 53) ? 53 : 52);


  const totalDaysInYear = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 366 : 365;

  const calendarTitleEl = document.getElementById('calendarTitle');
  if (calendarTitleEl) {
      calendarTitleEl.textContent = `Week Numbers of ${year}`;
  }

  for (let week = 1; week <= totalWeeks; week++) {
    const { start, end } = getWeekStartEnd(year, week);

     if(start.getFullYear() < year){
         start.setFullYear(year, 0, 1);
     }
     if(end.getFullYear() > year){
         end.setFullYear(year, 11, 31);
     }

    const yearStartDate = new Date(year, 0, 1);
    const daysElapsed = Math.max(0, Math.floor((end - yearStartDate) / (1000 * 60 * 60 * 24)) + 1);
    const percent = Math.min(100, Math.max(0, Math.round((daysElapsed / totalDaysInYear) * 100)));

    const tr = document.createElement('tr');
    if (today >= start && today <= end) {
      tr.classList.add('highlight');
    }

    tr.innerHTML = `
      <td>Week ${week}</td>
      <td>${formatDate(start)}</td>
      <td>${formatDate(end)}</td>
      <td>${percent}%</td>
    `;

    tbody.appendChild(tr);
  }
}


function getWeekNumber(d) {
    if (!(d instanceof Date && !isNaN(d))) return NaN;
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
}

// === Initialization and Event Listeners ===
window.onload = function() {
  currentCalendarYear = new Date().getFullYear();
  generateWeeksForYear(currentCalendarYear);

  // Add event listeners for year navigation
  document.getElementById('prevYearBtn').addEventListener('click', () => {
      currentCalendarYear--;
      generateWeeksForYear(currentCalendarYear);
  });

  document.getElementById('nextYearBtn').addEventListener('click', () => {
      currentCalendarYear++;
      generateWeeksForYear(currentCalendarYear);
  });

  // --- Add listeners to input fields for automatic calculation ---
  const inputIdsToWatch = ['startDate', 'endDate', 'hoursPerWeek', 'hourlyRate', 'totalHoursInput'];
  inputIdsToWatch.forEach(id => {
      const inputElement = document.getElementById(id);
      if (inputElement) {
          // 'input' event triggers on value change (typing, date select, etc.)
          inputElement.addEventListener('input', calculateTotalHours);
      }
  });

  // Add listener to the button as well (optional, but good UX)
  const calculateButton = document.getElementById('calculateButton');
  if (calculateButton) {
      calculateButton.addEventListener('click', calculateTotalHours);
  }

  // Initial calculation attempt in case inputs have default values (e.g., from browser cache)
  // calculateTotalHours(); // You might uncomment this if needed, but placeholders won't trigger it

};