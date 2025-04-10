// Global variables to track current display state
let currentCalendarYear;
let currentPaymentMonth;
let currentPaymentYear;

// Shows error message for a specific input field
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

// Clears error message for a specific input field
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

// Clears all error messages at once
function clearAllErrors() {
    clearError('startDate');
    clearError('endDate');
    clearError('hoursPerWeek');
    clearError('hourlyRate');
    clearError('totalHoursInput');
    clearError('totalBudget');
}

// Formats date to show day of week, month, and day
function formatDate(date) {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    if (date instanceof Date && !isNaN(date)) {
        return date.toLocaleDateString('en-US', options);
    }
    return 'Invalid Date';
}

// Formats date to show full month name and year
function formatMonthYear(date) {
    const options = { month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Gets pay periods for a specific month based on contract data (Mon-Fri only)
function getPayPeriodsForMonth(year, month, startDate, endDate, hoursPerWeek, hourlyRate) {
    const payPeriods = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // First pay period (5th to 19th, paid on 19th)
    const firstPayDay = new Date(year, month, 19);
    const firstPeriodStart = new Date(year, month, 5);
    const firstPeriodEnd = new Date(year, month, 19);

    // Second pay period (20th to 4th of next month, paid on 4th of next month)
    const secondPayDay = new Date(year, month + 1, 4);
    const secondPeriodStart = new Date(year, month, 20);
    const secondPeriodEnd = new Date(year, month + 1, 4);

    // Check if periods overlap with contract dates
    const contractStart = new Date(startDate);
    const contractEnd = new Date(endDate);
    contractStart.setHours(0, 0, 0, 0);
    contractEnd.setHours(0, 0, 0, 0);

    // Skip this month completely if it ends before contract starts or starts after contract ends
    if (secondPeriodEnd < contractStart || firstPeriodStart > contractEnd) {
        return payPeriods;
    }

    // Calculate hours for first period (5th-19th)
    if (firstPeriodEnd >= contractStart && firstPeriodStart <= contractEnd) {
        // Ensure we don't count days before the contract start date
        const actualStart = new Date(Math.max(firstPeriodStart.getTime(), contractStart.getTime()));
        const actualEnd = new Date(Math.min(firstPeriodEnd.getTime(), contractEnd.getTime()));
        
        // Count only weekdays (Monday to Friday)
        let workdays = 0;
        const currentDate = new Date(actualStart);
        while (currentDate <= actualEnd) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Saturday (6) or Sunday (0)
                workdays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Only add to payment periods if there are actual workdays in this period
        if (workdays > 0) {
            // Calculate hours based on weekdays (hoursPerWeek distributed over 5 days)
            const hours = workdays * (hoursPerWeek / 5);
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
    }

    // Calculate hours for second period (20th-4th)
    if (secondPeriodEnd >= contractStart && secondPeriodStart <= contractEnd) {
        // Ensure we don't count days before the contract start date
        const actualStart = new Date(Math.max(secondPeriodStart.getTime(), contractStart.getTime()));
        const actualEnd = new Date(Math.min(secondPeriodEnd.getTime(), contractEnd.getTime()));
        
        // Count only weekdays (Monday to Friday)
        let workdays = 0;
        const currentDate = new Date(actualStart);
        while (currentDate <= actualEnd) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Saturday (6) or Sunday (0)
                workdays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Only add to payment periods if there are actual workdays in this period
        if (workdays > 0) {
            // Calculate hours based on weekdays (hoursPerWeek distributed over 5 days)
            const hours = workdays * (hoursPerWeek / 5);
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
    }

    return payPeriods;
}

// Update payment schedule based on current inputs
function updatePaymentSchedule() {
    const startDateInput = document.getElementById('startDate').value;
    const endDateInput = document.getElementById('endDate').value;
    const hoursPerWeekInput = document.getElementById('hoursPerWeek').value;
    const hourlyRateInput = document.getElementById('hourlyRate').value;

    if (!startDateInput || !endDateInput || !hoursPerWeekInput || !hourlyRateInput) {
        return;
    }

    const startDate = new Date(startDateInput);
    const endDate = new Date(endDateInput);
    const hoursPerWeek = parseFloat(hoursPerWeekInput);
    const hourlyRate = parseFloat(hourlyRateInput);

    if (isNaN(startDate) || isNaN(endDate) || isNaN(hoursPerWeek) || isNaN(hourlyRate)) {
        return;
    }

    const paymentTableBody = document.getElementById('paymentTableBody');
    paymentTableBody.innerHTML = '';

    // Update month-year display
    document.getElementById('currentMonthYear').textContent = formatMonthYear(new Date(currentPaymentYear, currentPaymentMonth));

    // Get pay periods for current month
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

    // Add pay periods to table
    payPeriods.forEach(period => {
        const tr = document.createElement('tr');
        const statusClass = `payment-status-${period.status.toLowerCase()}`;
        
        tr.innerHTML = `
            <td>${period.period}</td>
            <td>${period.hours}</td>
            <td>${period.amount}</td>
            <td class="${statusClass}">${period.status}</td>
        `;
        
        paymentTableBody.appendChild(tr);
    });
    
    // After updating the current month view, make sure we also check the month
    // when the contract starts to ensure it's visible initially
    if (currentPaymentYear !== startDate.getFullYear() || currentPaymentMonth !== startDate.getMonth()) {
        // Store current view
        const prevMonth = currentPaymentMonth;
        const prevYear = currentPaymentYear;
        
        // Temporarily switch to contract start month to check if it has payment periods
        currentPaymentMonth = startDate.getMonth();
        currentPaymentYear = startDate.getFullYear();
        
        const startMonthPeriods = getPayPeriodsForMonth(
            currentPaymentYear,
            currentPaymentMonth,
            startDate,
            endDate,
            hoursPerWeek,
            hourlyRate
        );
        
        // If the contract start month has payment periods and this is the first load,
        // stay on that month. Otherwise, revert to the previously selected month.
        if (startMonthPeriods.length === 0 || window.paymentViewInitialized) {
            currentPaymentMonth = prevMonth;
            currentPaymentYear = prevYear;
            // Re-render with the original month
            updatePaymentSchedule();
        } else {
            // Mark that we've initialized the payment view
            window.paymentViewInitialized = true;
            // Re-render with the new month (we're already on the right month)
            updatePaymentSchedule();
        }
    }
}

// Main function that calculates all values based on user inputs
function calculateTotalHours() {
  let isValid = true;

  // Get input elements and values
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

  // Clear previous errors
  clearAllErrors();

  // Validate essential inputs
  if (!startInput) {
    showError('startDate', 'Start date is required.');
    isValid = false;
  }
  if (!endInput) {
    showError('endDate', 'End date is required.');
    isValid = false;
  }
  if (!hoursPerWeekInput || isNaN(parseFloat(hoursPerWeekInput)) || parseFloat(hoursPerWeekInput) <= 0) {
      if (hoursPerWeekInput) {
         showError('hoursPerWeek', 'Please enter a valid positive number for hours per week.');
      }
      isValid = false;
  }

  // Validate optional inputs if provided
  if (hourlyRateStr && (isNaN(parseFloat(hourlyRateStr)) || parseFloat(hourlyRateStr) <= 0)) {
      showError('hourlyRate', 'Please enter a valid positive number for hourly rate.');
  }
  if (totalHoursInputStr && (isNaN(parseFloat(totalHoursInputStr)) || parseFloat(totalHoursInputStr) < 0)) {
      showError('totalHoursInput', 'Please enter a valid non-negative number for total hours.');
  }
  if (totalBudgetStr && (isNaN(parseFloat(totalBudgetStr)) || parseFloat(totalBudgetStr) < 0)) {
      showError('totalBudget', 'Please enter a valid non-negative number for total budget.');
  }

  // Validate dates
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

  // Stop if essential inputs are invalid
  if (!isValid) {
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

  // Process valid inputs
  const hoursPerWeek = parseFloat(hoursPerWeekInput);
  const totalHoursInputVal = parseFloat(totalHoursInputStr); 
  const hourlyRate = parseFloat(hourlyRateStr);
  const totalBudget = parseFloat(totalBudgetStr);

  const today = new Date();
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);

  const msPerDay = 1000 * 60 * 60 * 24;

  // Calculate time passed so far (weekdays only)
  const daysPassed = Math.max(0, Math.floor((today - startDate) / msPerDay) + 1);
  
  // Count weekdays passed
  let workdaysPassed = 0;
  const tempDate = new Date(startDate);
  while (tempDate <= today) {
    const dayOfWeek = tempDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Saturday (6) or Sunday (0)
      workdaysPassed++;
    }
    tempDate.setDate(tempDate.getDate() + 1);
  }
  
  const weeksPassed = Math.floor(workdaysPassed / 5);
  const extraDaysPassed = workdaysPassed % 5;
  const totalHoursWorked = (weeksPassed * hoursPerWeek) + ((extraDaysPassed / 5) * hoursPerWeek);

  // Calculate time remaining (weekdays only)
  const daysRemaining = Math.max(0, Math.floor((endDate - today) / msPerDay));
  
  // Count weekdays remaining
  let workdaysRemaining = 0;
  const tempEndDate = new Date(today);
  tempEndDate.setDate(tempEndDate.getDate() + 1); // Start from tomorrow
  while (tempEndDate <= endDate) {
    const dayOfWeek = tempEndDate.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not Saturday (6) or Sunday (0)
      workdaysRemaining++;
    }
    tempEndDate.setDate(tempEndDate.getDate() + 1);
  }
  
  const weeksRemaining = Math.floor(workdaysRemaining / 5);
  const extraDaysRemaining = workdaysRemaining % 5;
  const remainingHours = (weeksRemaining * hoursPerWeek) + ((extraDaysRemaining / 5) * hoursPerWeek);

  // Calculate remaining hours until today (if target provided)
  let remainingUntilToday = '--';
  if (!isNaN(totalHoursInputVal) && totalHoursInputVal >= 0) {
    remainingUntilToday = (totalHoursInputVal - totalHoursWorked).toFixed(2) + " hours";
  } else {
    remainingUntilToday = 'N/A';
  }

  // Calculate payment for confirmed hours
  let amountPaidForTotalHours = '--';
  if (!isNaN(totalHoursInputVal) && totalHoursInputVal > 0 && !isNaN(hourlyRate) && hourlyRate > 0) {
    amountPaidForTotalHours = (totalHoursInputVal * hourlyRate).toFixed(2);
    document.getElementById("confirmedTotal").textContent = `${amountPaidForTotalHours}`;
  } else {
    document.getElementById("confirmedTotal").textContent = '--';
  }

  // Calculate payment from today onward
  let amountPaidFromToday = '--';
  if (!isNaN(hourlyRate) && hourlyRate > 0) {
    amountPaidFromToday = (remainingHours * hourlyRate).toFixed(2);
    document.getElementById("amountPaidFromToday").textContent = `${amountPaidFromToday}`;
  } else {
    document.getElementById("amountPaidFromToday").textContent = '--';
  }

  // Calculate budget status
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

  // Update results display
  document.getElementById("weeksPassed").textContent = `${weeksPassed} weeks and ${extraDaysPassed} days`;
  document.getElementById("totalHours").textContent = `${totalHoursWorked.toFixed(2)} hours`;
  document.getElementById("weeksRemaining").textContent = `${weeksRemaining} weeks and ${extraDaysRemaining} days`;
  document.getElementById("remainingHours").textContent = `${remainingHours.toFixed(2)} hours`;
  document.getElementById("remainingHoursUntilToday").textContent = remainingUntilToday;
}

// Gets start and end dates for a specific week number
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

// Creates the weekly calendar for the selected year
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

// Gets ISO week number for a date
function getWeekNumber(d) {
    if (!(d instanceof Date && !isNaN(d))) return NaN;
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return weekNo;
}

// Move to previous month in payment schedule
function prevMonth() {
    if (currentPaymentMonth === 0) {
        currentPaymentMonth = 11;
        currentPaymentYear--;
    } else {
        currentPaymentMonth--;
    }
    updatePaymentSchedule();
}

// Move to next month in payment schedule
function nextMonth() {
    if (currentPaymentMonth === 11) {
        currentPaymentMonth = 0;
        currentPaymentYear++;
    } else {
        currentPaymentMonth++;
    }
    updatePaymentSchedule();
}

// Initialize everything when page loads
window.onload = function() {
  // Initialize flag for payment view
  window.paymentViewInitialized = false;
  
  // Set up current year calendar
  currentCalendarYear = new Date().getFullYear();
  generateWeeksForYear(currentCalendarYear);

  // Set up payment schedule for current month
  const today = new Date();
  currentPaymentMonth = today.getMonth();
  currentPaymentYear = today.getFullYear();

  // Add calendar navigation listeners
  document.getElementById('prevYearBtn').addEventListener('click', () => {
      currentCalendarYear--;
      generateWeeksForYear(currentCalendarYear);
  });

  document.getElementById('nextYearBtn').addEventListener('click', () => {
      currentCalendarYear++;
      generateWeeksForYear(currentCalendarYear);
  });

  // Add payment schedule navigation listeners
  document.getElementById('prevMonthBtn').addEventListener('click', prevMonth);
  document.getElementById('nextMonthBtn').addEventListener('click', nextMonth);

  // Add listeners to all input fields
  const inputIdsToWatch = ['startDate', 'endDate', 'hoursPerWeek', 'hourlyRate', 'totalHoursInput', 'totalBudget'];
  inputIdsToWatch.forEach(id => {
      const inputElement = document.getElementById(id);
      if (inputElement) {
          inputElement.addEventListener('input', calculateTotalHours);
      }
  });

  // Add listener to calculate button
  const calculateButton = document.getElementById('calculateButton');
  if (calculateButton) {
      calculateButton.addEventListener('click', calculateTotalHours);
  }
};