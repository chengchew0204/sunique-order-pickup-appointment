// Calendar rendering and interaction logic

function renderCalendar() {
  const year = state.currentMonth.getFullYear();
  const month = state.currentMonth.getMonth();
  
  // Update month title
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  document.getElementById('currentMonth').textContent = `${monthNames[month]} ${year}`;
  
  // Get first day of month and number of days
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();
  
  // Get previous month's last days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  
  const calendarDays = document.getElementById('calendarDays');
  calendarDays.innerHTML = '';
  
  // Add previous month's trailing days
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const dayEl = createDayElement(day, true, false);
    calendarDays.appendChild(dayEl);
  }
  
  // Add current month's days
  for (let day = 1; day <= daysInMonth; day++) {
    const currentDate = new Date(year, month, day);
    const dateKey = currentDate.toISOString().split('T')[0];
    const hasSlots = state.availableSlotsByDate[dateKey] && state.availableSlotsByDate[dateKey].length > 0;
    const isToday = isSameDay(currentDate, state.today);
    const isPast = currentDate < state.today && !isToday;
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    
    const dayEl = createDayElement(day, false, hasSlots, isToday, isPast || isWeekend || !hasSlots, currentDate);
    calendarDays.appendChild(dayEl);
  }
  
  // Add next month's leading days
  const remainingCells = 42 - calendarDays.children.length; // 6 rows * 7 days
  for (let day = 1; day <= remainingCells; day++) {
    const dayEl = createDayElement(day, true, false);
    calendarDays.appendChild(dayEl);
  }
}

function createDayElement(day, isOtherMonth, hasSlots, isToday = false, isDisabled = false, date = null) {
  const dayEl = document.createElement('div');
  dayEl.className = 'calendar-day';
  dayEl.textContent = day;
  
  if (isOtherMonth) {
    dayEl.classList.add('other-month');
  }
  
  if (isToday) {
    dayEl.classList.add('today');
  }
  
  if (isDisabled) {
    dayEl.classList.add('disabled');
  }
  
  if (hasSlots) {
    dayEl.classList.add('has-slots');
  }
  
  if (!isOtherMonth && !isDisabled && date) {
    dayEl.addEventListener('click', () => selectDate(date));
  }
  
  return dayEl;
}

function selectDate(date) {
  state.selectedDate = date;
  
  // Update selected state in calendar
  document.querySelectorAll('.calendar-day').forEach(day => {
    day.classList.remove('selected');
  });
  event.target.classList.add('selected');
  
  // Show time slots for this date
  renderTimeSlotsForDate(date);
}

function renderTimeSlotsForDate(date) {
  const dateKey = date.toISOString().split('T')[0];
  const slots = state.availableSlotsByDate[dateKey] || [];
  
  const timeSlotsSection = document.getElementById('timeSlotsSection');
  const timeSlotsContainer = document.getElementById('timeSlotsContainer');
  const selectedDateTitle = document.getElementById('selectedDateTitle');
  
  if (slots.length === 0) {
    timeSlotsSection.classList.remove('show');
    showMessage(elements.selectionMessage, 'No available time slots for this date.', 'error');
    return;
  }
  
  // Format date for display
  const dateStr = formatDate(date.toISOString());
  selectedDateTitle.textContent = `Available times for ${dateStr}`;
  
  // Render time slots
  timeSlotsContainer.innerHTML = '';
  slots.forEach(slot => {
    const slotEl = document.createElement('div');
    slotEl.className = 'time-slot';
    slotEl.textContent = formatTime(slot);
    slotEl.dataset.slot = slot;
    slotEl.addEventListener('click', () => selectTimeSlot(slot));
    timeSlotsContainer.appendChild(slotEl);
  });
  
  timeSlotsSection.classList.add('show');
  hideMessage(elements.selectionMessage);
  
  // Scroll to time slots
  timeSlotsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function setupCalendarNavigation() {
  document.getElementById('prevMonth').addEventListener('click', () => {
    state.currentMonth.setMonth(state.currentMonth.getMonth() - 1);
    renderCalendar();
  });
  
  document.getElementById('nextMonth').addEventListener('click', () => {
    state.currentMonth.setMonth(state.currentMonth.getMonth() + 1);
    renderCalendar();
  });
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

// Make functions available globally
window.renderCalendar = renderCalendar;
window.selectDate = selectDate;
window.setupCalendarNavigation = setupCalendarNavigation;

