// Global variables
let currentCalendarYear;
let currentPaymentMonth;
let currentPaymentYear;

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
    clearError('totalBudget');
}

// === Date/Time Helper Functions ===
function formatDate(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    if (date instanceof Date && !isNaN(date)) {
        return date.toLocaleDateString('en-US', options);
    }
    return 'Invalid Date';
}

function formatMonthYear(date) {
    const options = { month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// === Get Pay Periods for a Month ===
function getPayPeriodsForMonth(year, month, startDate, endDate, hoursPerWeek, hourlyRate) {
    const payPeriods = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First pay period (5th to 19th, paid on 19th)
    const firstPayDay = new Date(year, month, 19);
    const firstPeriodStart = new Date(year, month, 5); // Assuming it starts on the 5th
    const firstPeriodEnd = new Date(year, month, 19);

    // Second pay period (20th to 4th of next month, paid on 4th of next month)
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const secondPayDay = new Date(year, month + 1, 4);
    const secondPeriodStart = new Date(year, month, 20);
    const secondPeriodEnd = new Date(year, month + 1, 4);

    // Check if periods are within the contract dates
    const contractStart = new Date(startDate);
    const contractEnd = new Date(endDate);
    contractStart.setHours(0, 0, 0, 0);
    contractEnd.setHours(0, 0, 0, 0);

    // Calculate hours for first period (5th-19th)
    if (firstPeriodEnd >= contractStart && firstPeriodStart <= contractEnd) {
        const actualStart = new Date(Math.max(firstPeriodStart.getTime(), contractStart.getTime()));
        const actualEnd = new Date(Math.min(firstPeriodEnd.getTime(), contractEnd.getTime()));
        const days = (actualEnd - actualStart) / (1000 * 60 * 60 * 24) + 1;
        const hours = (days / 7) * hoursPerWeek;
        const amount = hours * hourlyRate;

        let status = 'Future';
        if (today > firstPayDay) {
            status = 'Paid';
        } else if (today >= firstPeriodStart) {
            status = 'Pending';
        }

        payPeriods.push({
            period: `5th-19th`,
            hours: hours.toFixed(2),
            amount: amount.toFixed(2),
            status: status
        });
    }

    // Calculate hours for second period (20th-4th)
    if (secondPeriodEnd >= contractStart && secondPeriodStart <= contractEnd) {
        const actualStart = new Date(Math.max(secondPeriodStart.getTime(), contractStart.getTime()));
        const actualEnd = new Date(Math.min(secondPeriodEnd.getTime(), contractEnd.getTime()));
        const days = (actualEnd - actualStart) / (1000 * 60 * 60 * 24) + 1;
        const hours = (days / 7) * hoursPerWeek;
        const amount = hours * hourlyRate;

        let status = 'Future';
        if (today > secondPayDay) {
            status = 'Paid';
        } else if (today >= secondPeriodStart) {
            status = 'Pending';
        }

        payPeriods.push({
            period: `20th-4th`,
            hours: hours.toFixed(2),
            amount: amount.toFixed(2),
            status: status
        });
    }

    return payPeriods;
}

// === Update Payment Schedule Table ===
function updatePaymentSchedule() {
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const hoursPerWeekInput = document.getElementById('hoursPerWeek').value;
    const hourlyRateInput = document.getElementById('hourlyRate').value;

    if (!startDateInput || !endDateInput || !hoursPerWeekInput || !hourlyRateInput) {
        // Not enough data to calculate payment schedule
        return;
    }

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);
    const hoursPerWeek = parseFloat(hoursPerWeekInput);
    const hourlyRate = parseFloat(hourlyRateInput);

    if (isNaN(startDate) || isNaN(endDate) || isNaN(hoursPerWeek) || isNaN(hourlyRate)) {
        // Invalid input data
        return;
    }

    const paymentTableBody = document.getElementById('paymentTableBody');
    paymentTableBody.innerHTML = '';

    // Update the month-year display
    document.getElementById('currentMonthYear').textContent = formatMonthYear(new Date(currentPaymentYear, currentPaymentMonth));

    // Get pay periods for the current month
    const payPeriods = getPayPeriodsForMonth(
        currentPaymentYear, 
        currentPaymentMonth, 
        startDate, 
        endDate, 
        hoursPerWeek, 
        hourlyRate
    );

    if (payPeriods.length === 0) {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td colspan="4" style="text-align: center;">No pay periods in this month</td>`;
        paymentTableBody.appendChild(tr);
        return;
    }

    // Add pay periods to the table
    payPeriods.forEach(period => {
        const tr = document.createElement('tr');
        const statusClass = `payment-status-${period.status.toLowerCase()}`;
        
        tr.innerHTML = `
            <td>${period.period}</td>
            <td>${period.hours}</td>
            <td>$${period.amount}</td>
            <td class="${statusClass}">${period.status}</td>
        `;
        
        paymentTableBody.appendChild(tr);
    });
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
  const totalBudgetEl = document.getElementById("totalBudget");

  const startInput = startInputEl.value;
  const endInput = endInputEl.value;
  const hoursPerWeekInput = hoursPerWeekEl.value;
  const totalHoursInputStr = totalHoursInputEl.value;
  const hourlyRateStr = hourlyRateEl.value;
  const totalBudgetStr = totalBudgetEl.value;

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
      showError('totalHoursInput', 'Please enter a valid non-negative number for total hours.');
      // We don't set isValid = false here, calculations can proceed without optional hours
  }
  // Optional: Validate budget if entered
  if (totalBudgetStr && (isNaN(parseFloat(totalBudgetStr)) || parseFloat(totalBudgetStr) < 0)) {
      showError('totalBudget', 'Please enter a valid non-negative number for total budget.');
      // We don't set isValid = false here, calculations can proceed without budget
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
    document.getElementById("budgetUsed").textContent = '--';
    document.getElementById("budgetRemaining").textContent = '--';
    return;
  }

  // --- Proceed with Calculations (only if core inputs are valid) ---
  const hoursPerWeek = parseFloat(hoursPerWeekInput);
  const totalHoursInputVal = parseFloat(totalHoursInputStr); // May be NaN
  const hourlyRate = parseFloat(hourlyRateStr); // May be NaN
  const totalBudget = parseFloat(totalBudgetStr); // May be NaN

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

  // Calculate and display Amount Paid based on Total Hours I Got Paid
  let amountPaidForTotalHours = '--';
  if (!isNaN(totalHoursInputVal) && totalHoursInputVal > 0 && !isNaN(hourlyRate) && hourlyRate > 0) {
    amountPaidForTotalHours = (totalHoursInputVal * hourlyRate).toFixed(2);
    document.getElementById("confirmedTotal").textContent = `${amountPaidForTotalHours}`;
  } else {
    document.getElementById("confirmedTotal").textContent = '--';
  }

  // Calculate and display Total Amount Paid FROM today
  let amountPaidFromToday = '--';
  if (!isNaN(hourlyRate) && hourlyRate > 0) {
    amountPaidFromToday = (remainingHours * hourlyRate).toFixed(2);
    document.getElementById("amountPaidFromToday").textContent = `${amountPaidFromToday}`;
  } else {
    document.getElementById("amountPaidFromToday").textContent = '--';
  }

  // Calculate and display Budget Used and Budget Remaining
  if (!isNaN(totalBudget) && totalBudget > 0 && !isNaN(totalHoursInputVal) && totalHoursInputVal >= 0 && !isNaN(hourlyRate) && hourlyRate > 0) {
    const budgetUsed = (totalHoursInputVal * hourlyRate).toFixed(2);
    const budgetRemaining = (totalBudget - budgetUsed).toFixed(2);
    
    document.getElementById("budgetUsed").textContent = `${budgetUsed}`;
    document.getElementById("budgetRemaining").textContent = `${budgetRemaining}`;
  } else {
    document.getElementById("budgetUsed").textContent = '--';
    document.getElementById("budgetRemaining").textContent = '--';
  }

  // Update payment schedule
  updatePaymentSchedule();

  // Update other HTML elements
  document.getElementById("weeksPassed").textContent = `${weeksPassed} weeks and ${extraDaysPassed} days`;
  document.getElementById("totalHours").textContent = `${totalHoursWorked.toFixed(2)} hours`;
  document.getElementById("weeksRemaining").textContent = `${weeksRemaining} weeks and ${extraDaysRemaining} days`;
  document.getElementById("remainingHours").textContent = `${remainingHours.toFixed(2)} hours`;
  document.getElementById("remainingHoursUntilToday").textContent = remainingUntilToday;
}

// === Calendar Functions ===
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

// === Navigation Functions for Payment Schedule ===
function prevMonth() {
    if (currentPaymentMonth === 0) {
        currentPaymentMonth = 11;
        currentPaymentYear--;
    } else {
        currentPaymentMonth--;
    }
    updatePaymentSchedule();
}

function nextMonth() {
    if (currentPaymentMonth === 11) {
        currentPaymentMonth = 0;
        currentPaymentYear++;
    } else {
        currentPaymentMonth++;
    }
    updatePaymentSchedule();
}

// === Initialization and Event Listeners ===
window.onload = function() {
  // Initialize calendar
  currentCalendarYear = new Date().getFullYear();
  generateWeeksForYear(currentCalendarYear);

  // Initialize payment schedule
  const today = new Date();
  currentPaymentMonth = today.getMonth();
  currentPaymentYear = today.getFullYear();

  // Add event listeners for year navigation
  document.getElementById('prevYearBtn').addEventListener('click', () => {
      currentCalendarYear--;
      generateWeeksForYear(currentCalendarYear);
  });

  document.getElementById('nextYearBtn').addEventListener('click', () => {
      currentCalendarYear++;
      generateWeeksForYear(currentCalendarYear);
  });

  // Add event listeners for payment month navigation
  document.getElementById('prevMonthBtn').addEventListener('click', prevMonth);
  document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);

  // --- Add listeners to input fields for automatic calculation ---
  const inputIdsToWatch = ['startDate', 'endDate', 'hoursPerWeek', 'hourlyRate', 'totalHoursInput', 'totalBudget'];
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