// Admin Portal JavaScript

// Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : '/api';

// State
const adminState = {
    isAuthenticated: false,
    appointments: [],
    filteredAppointments: [],
    appointmentsByDate: {},
    currentMonth: new Date(),
    today: new Date(),
    selectedDate: null,
    availableSlots: [],
    availableSlotsByDate: {},
    rescheduleOrderNumber: null,
    rescheduleCurrentMonth: new Date(),
    rescheduleSelectedSlot: null
};

// DOM Elements
const elements = {
    loginScreen: document.getElementById('loginScreen'),
    adminDashboard: document.getElementById('adminDashboard'),
    passwordInput: document.getElementById('passwordInput'),
    loginBtn: document.getElementById('loginBtn'),
    loginMessage: document.getElementById('loginMessage'),
    logoutBtn: document.getElementById('logoutBtn'),
    
    // Tabs
    tabBtns: document.querySelectorAll('.tab-btn'),
    calendarTab: document.getElementById('calendarTab'),
    listTab: document.getElementById('listTab'),
    
    // Calendar View
    calendarLoading: document.getElementById('calendarLoading'),
    calendarViewContainer: document.getElementById('calendarViewContainer'),
    adminCurrentMonth: document.getElementById('adminCurrentMonth'),
    adminCalendarDays: document.getElementById('adminCalendarDays'),
    adminPrevMonth: document.getElementById('adminPrevMonth'),
    adminNextMonth: document.getElementById('adminNextMonth'),
    dateAppointments: document.getElementById('dateAppointments'),
    
    // List View
    listLoading: document.getElementById('listLoading'),
    appointmentsList: document.getElementById('appointmentsList'),
    searchInput: document.getElementById('searchInput'),
    appointmentCount: document.getElementById('appointmentCount'),
    appointmentsTableBody: document.getElementById('appointmentsTableBody'),
    noAppointments: document.getElementById('noAppointments'),
    
    // Reschedule Modal
    rescheduleModal: document.getElementById('rescheduleModal'),
    rescheduleOrderNumber: document.getElementById('rescheduleOrderNumber'),
    rescheduleCurrentTime: document.getElementById('rescheduleCurrentTime'),
    rescheduleLoading: document.getElementById('rescheduleLoading'),
    rescheduleCalendar: document.getElementById('rescheduleCalendar'),
    rescheduleCurrentMonth: document.getElementById('rescheduleCurrentMonth'),
    rescheduleCalendarDays: document.getElementById('rescheduleCalendarDays'),
    reschedulePrevMonth: document.getElementById('reschedulePrevMonth'),
    rescheduleNextMonth: document.getElementById('rescheduleNextMonth'),
    rescheduleTimeSlots: document.getElementById('rescheduleTimeSlots'),
    rescheduleSelectedDate: document.getElementById('rescheduleSelectedDate'),
    rescheduleTimeSlotsContainer: document.getElementById('rescheduleTimeSlotsContainer'),
    rescheduleMessage: document.getElementById('rescheduleMessage'),
    confirmRescheduleBtn: document.getElementById('confirmRescheduleBtn'),
    cancelRescheduleBtn: document.getElementById('cancelRescheduleBtn'),
    closeRescheduleModal: document.getElementById('closeRescheduleModal')
};

// Utility Functions
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message show ${type}`;
}

function hideMessage(element) {
    element.className = 'message';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const options = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    };
    return date.toLocaleString('en-US', options);
}

function formatTime(timeStr) {
    return timeStr;
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        timeZone: 'UTC'
    };
    return date.toLocaleString('en-US', options);
}

function formatTimeFromISO(isoString) {
    const date = new Date(isoString);
    // Use UTC time directly to avoid timezone conversion
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
}

function combineDateAndTime(dateStr, timeStr) {
    try {
        let year, month, day;
        
        // Handle ISO format (YYYY-MM-DD) or (YYYY-M-D)
        if (dateStr.includes('-')) {
            const parts = dateStr.split('-');
            year = parseInt(parts[0]);
            month = parseInt(parts[1]) - 1;
            day = parseInt(parts[2]);
        }
        // Handle US format (M/D/YYYY) or (MM/DD/YYYY)
        else if (dateStr.includes('/')) {
            const parts = dateStr.split('/');
            month = parseInt(parts[0]) - 1;
            day = parseInt(parts[1]);
            year = parseInt(parts[2]);
            if (year < 100) year += 2000;
        }
        else {
            console.error('Unrecognized date format:', dateStr);
            return null;
        }
        
        // Parse time
        const timeLower = timeStr.toLowerCase();
        const isPM = timeLower.includes('pm');
        const isAM = timeLower.includes('am');
        
        const timeOnly = timeLower.replace(/am|pm/g, '').trim();
        const [hourStr, minuteStr] = timeOnly.split(':');
        let hour = parseInt(hourStr);
        const minute = parseInt(minuteStr) || 0;
        
        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
        
        // Use Date.UTC to create date in UTC timezone directly
        // This prevents timezone conversion issues that cause dates to shift
        const combined = new Date(Date.UTC(year, month, day, hour, minute, 0, 0));
        return combined.toISOString();
    } catch (error) {
        console.error('Error combining date and time:', error, 'dateStr:', dateStr, 'timeStr:', timeStr);
        return null;
    }
}

function groupAppointmentsByDate(appointments) {
    const grouped = {};
    
    appointments.forEach(appt => {
        const isoDateTime = combineDateAndTime(appt.appointmentDate, appt.appointmentTime);
        if (isoDateTime) {
            const dateKey = isoDateTime.split('T')[0];
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push({
                ...appt,
                isoDateTime
            });
        }
    });
    
    return grouped;
}

function isSameDay(date1, date2) {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
}

function groupSlotsByDate(slots) {
    const grouped = {};
    
    slots.forEach(slot => {
        const date = new Date(slot);
        const dateKey = date.toISOString().split('T')[0];
        
        if (!grouped[dateKey]) {
            grouped[dateKey] = [];
        }
        grouped[dateKey].push(slot);
    });
    
    return grouped;
}

// Authentication Functions
function checkAuthentication() {
    const auth = sessionStorage.getItem('adminAuthenticated');
    if (auth === 'true') {
        adminState.isAuthenticated = true;
        showDashboard();
    }
}

async function handleLogin() {
    const password = elements.passwordInput.value;
    
    if (!password) {
        showMessage(elements.loginMessage, 'Please enter a password.', 'error');
        return;
    }
    
    elements.loginBtn.disabled = true;
    elements.loginBtn.textContent = 'Verifying...';
    hideMessage(elements.loginMessage);
    
    try {
        const response = await fetch(`${API_BASE_URL}/admin/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            adminState.isAuthenticated = true;
            sessionStorage.setItem('adminAuthenticated', 'true');
            showDashboard();
        } else {
            showMessage(elements.loginMessage, data.message || 'Incorrect password. Please try again.', 'error');
            elements.passwordInput.value = '';
        }
    } catch (error) {
        console.error('Login error:', error);
        showMessage(elements.loginMessage, 'Connection error. Please try again.', 'error');
    } finally {
        elements.loginBtn.disabled = false;
        elements.loginBtn.textContent = 'Login';
    }
}

function handleLogout() {
    adminState.isAuthenticated = false;
    sessionStorage.removeItem('adminAuthenticated');
    elements.loginScreen.style.display = 'flex';
    elements.adminDashboard.style.display = 'none';
    elements.passwordInput.value = '';
    hideMessage(elements.loginMessage);
}

function showDashboard() {
    elements.loginScreen.style.display = 'none';
    elements.adminDashboard.style.display = 'block';
    loadAppointments();
}

// API Functions
async function fetchAppointments() {
    const response = await fetch(`${API_BASE_URL}/admin/appointments`);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch appointments');
    }
    
    return data.appointments;
}

async function cancelAppointment(orderNumber) {
    const response = await fetch(`${API_BASE_URL}/admin/appointments/${orderNumber}`, {
        method: 'DELETE'
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Failed to cancel appointment');
    }
    
    return data;
}

async function rescheduleAppointment(orderNumber, newSlotTime) {
    const response = await fetch(`${API_BASE_URL}/admin/appointments/${orderNumber}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newSlotTime })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Failed to reschedule appointment');
    }
    
    return data;
}

async function fetchAvailableSlots() {
    const response = await fetch(`${API_BASE_URL}/available-slots`);
    const data = await response.json();
    
    if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch available slots');
    }
    
    return data.slots;
}

// Load and Display Functions
async function loadAppointments() {
    try {
        elements.calendarLoading.style.display = 'block';
        elements.listLoading.style.display = 'block';
        elements.calendarViewContainer.style.display = 'none';
        elements.appointmentsList.style.display = 'none';
        
        const appointments = await fetchAppointments();
        adminState.appointments = appointments;
        adminState.filteredAppointments = appointments;
        adminState.appointmentsByDate = groupAppointmentsByDate(appointments);
        
        renderCalendarView();
        renderListView();
        
        elements.calendarLoading.style.display = 'none';
        elements.listLoading.style.display = 'none';
        elements.calendarViewContainer.style.display = 'block';
        elements.appointmentsList.style.display = 'block';
    } catch (error) {
        console.error('Error loading appointments:', error);
        elements.calendarLoading.style.display = 'none';
        elements.listLoading.style.display = 'none';
        alert('Failed to load appointments: ' + error.message);
    }
}

// Calendar View Functions
function renderCalendarView() {
    const year = adminState.currentMonth.getFullYear();
    const month = adminState.currentMonth.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    elements.adminCurrentMonth.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    elements.adminCalendarDays.innerHTML = '';
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayEl = createCalendarDay(day, true, null, false, false);
        elements.adminCalendarDays.appendChild(dayEl);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        // Create date key in YYYY-MM-DD format without timezone conversion
        const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayAppointments = adminState.appointmentsByDate[dateKey] || [];
        const hasAppointments = dayAppointments.length > 0;
        const isToday = isSameDay(currentDate, adminState.today);
        
        const dayEl = createCalendarDay(day, false, currentDate, hasAppointments, isToday);
        
        if (hasAppointments) {
            const countBadge = document.createElement('span');
            countBadge.className = 'appointment-count';
            countBadge.textContent = dayAppointments.length;
            dayEl.appendChild(countBadge);
        }
        
        elements.adminCalendarDays.appendChild(dayEl);
    }
    
    // Next month days
    const remainingCells = 42 - elements.adminCalendarDays.children.length;
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createCalendarDay(day, true, null, false, false);
        elements.adminCalendarDays.appendChild(dayEl);
    }
}

function createCalendarDay(day, isOtherMonth, date, hasAppointments, isToday) {
    const dayEl = document.createElement('div');
    dayEl.className = 'calendar-day';
    dayEl.textContent = day;
    
    if (isOtherMonth) {
        dayEl.classList.add('other-month');
    }
    
    if (isToday) {
        dayEl.classList.add('today');
    }
    
    if (hasAppointments) {
        dayEl.classList.add('has-appointments');
    }
    
    if (!isOtherMonth && date) {
        dayEl.addEventListener('click', () => selectCalendarDate(date));
    }
    
    return dayEl;
}

function selectCalendarDate(date) {
    adminState.selectedDate = date;
    
    document.querySelectorAll('#adminCalendarDays .calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    showDateAppointments(date);
}

function showDateAppointments(date) {
    // Create date key without timezone conversion
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const appointments = adminState.appointmentsByDate[dateKey] || [];
    
    if (appointments.length === 0) {
        elements.dateAppointments.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No appointments for this date</p>';
        return;
    }
    
    const dateStr = formatDate(date.toISOString());
    let html = `<h3>Appointments for ${dateStr}</h3>`;
    
    appointments.forEach(appt => {
        html += `
            <div class="appointment-item">
                <div class="appointment-info">
                    <p><strong>Order Number:</strong> ${appt.orderNumber}</p>
                    <p><strong>Time:</strong> ${appt.appointmentTime}</p>
                </div>
                <div class="appointment-actions">
                    <button class="btn-small btn-reschedule" onclick="openRescheduleModal('${appt.orderNumber}', '${appt.appointmentDate}', '${appt.appointmentTime}')">
                        Reschedule
                    </button>
                    <button class="btn-small btn-cancel" onclick="handleCancelAppointment('${appt.orderNumber}')">
                        Cancel
                    </button>
                </div>
            </div>
        `;
    });
    
    elements.dateAppointments.innerHTML = html;
}

// List View Functions
function renderListView() {
    updateAppointmentCount();
    renderAppointmentsTable();
}

function updateAppointmentCount() {
    elements.appointmentCount.textContent = `Total: ${adminState.filteredAppointments.length} appointments`;
}

function renderAppointmentsTable() {
    if (adminState.filteredAppointments.length === 0) {
        elements.appointmentsTableBody.innerHTML = '';
        elements.noAppointments.style.display = 'block';
        return;
    }
    
    elements.noAppointments.style.display = 'none';
    
    const sorted = [...adminState.filteredAppointments].sort((a, b) => {
        const dateA = combineDateAndTime(a.appointmentDate, a.appointmentTime);
        const dateB = combineDateAndTime(b.appointmentDate, b.appointmentTime);
        return new Date(dateA) - new Date(dateB);
    });
    
    elements.appointmentsTableBody.innerHTML = sorted.map(appt => `
        <tr>
            <td>${appt.orderNumber}</td>
            <td>${appt.appointmentDate}</td>
            <td>${appt.appointmentTime}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-small btn-reschedule" onclick="openRescheduleModal('${appt.orderNumber}', '${appt.appointmentDate}', '${appt.appointmentTime}')">
                        Reschedule
                    </button>
                    <button class="btn-small btn-cancel" onclick="handleCancelAppointment('${appt.orderNumber}')">
                        Cancel
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

function handleSearch() {
    const searchTerm = elements.searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        adminState.filteredAppointments = adminState.appointments;
    } else {
        adminState.filteredAppointments = adminState.appointments.filter(appt => 
            appt.orderNumber.toLowerCase().includes(searchTerm)
        );
    }
    
    renderListView();
}

// Cancel Appointment
async function handleCancelAppointment(orderNumber) {
    if (!confirm(`Are you sure you want to cancel the appointment for order ${orderNumber}?`)) {
        return;
    }
    
    try {
        // Show loading state immediately
        elements.calendarLoading.style.display = 'block';
        elements.listLoading.style.display = 'block';
        elements.dateAppointments.innerHTML = '';
        
        await cancelAppointment(orderNumber);
        await loadAppointments();
        alert('Appointment cancelled successfully!');
    } catch (error) {
        console.error('Error cancelling appointment:', error);
        elements.calendarLoading.style.display = 'none';
        elements.listLoading.style.display = 'none';
        alert('Failed to cancel appointment: ' + error.message);
    }
}

// Reschedule Modal Functions
async function openRescheduleModal(orderNumber, appointmentDate, appointmentTime) {
    adminState.rescheduleOrderNumber = orderNumber;
    adminState.rescheduleCurrentMonth = new Date();
    adminState.rescheduleSelectedSlot = null;
    
    elements.rescheduleOrderNumber.textContent = orderNumber;
    elements.rescheduleCurrentTime.textContent = `${appointmentDate} at ${appointmentTime}`;
    elements.rescheduleModal.classList.add('show');
    elements.rescheduleLoading.style.display = 'block';
    elements.rescheduleCalendar.style.display = 'none';
    elements.rescheduleTimeSlots.classList.remove('show');
    elements.confirmRescheduleBtn.style.display = 'none';
    elements.confirmRescheduleBtn.disabled = false;
    elements.confirmRescheduleBtn.textContent = 'Confirm Reschedule';
    hideMessage(elements.rescheduleMessage);
    
    try {
        const slots = await fetchAvailableSlots();
        adminState.availableSlots = slots;
        adminState.availableSlotsByDate = groupSlotsByDate(slots);
        
        renderRescheduleCalendar();
        elements.rescheduleLoading.style.display = 'none';
        elements.rescheduleCalendar.style.display = 'block';
    } catch (error) {
        console.error('Error loading available slots:', error);
        elements.rescheduleLoading.style.display = 'none';
        showMessage(elements.rescheduleMessage, 'Failed to load available slots: ' + error.message, 'error');
    }
}

function closeRescheduleModal() {
    elements.rescheduleModal.classList.remove('show');
    adminState.rescheduleOrderNumber = null;
    adminState.rescheduleSelectedSlot = null;
    elements.confirmRescheduleBtn.disabled = false;
    elements.confirmRescheduleBtn.textContent = 'Confirm Reschedule';
    elements.confirmRescheduleBtn.style.display = 'none';
}

function renderRescheduleCalendar() {
    const year = adminState.rescheduleCurrentMonth.getFullYear();
    const month = adminState.rescheduleCurrentMonth.getMonth();
    
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'];
    elements.rescheduleCurrentMonth.textContent = `${monthNames[month]} ${year}`;
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    elements.rescheduleCalendarDays.innerHTML = '';
    
    // Previous month days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        const dayEl = createRescheduleDayElement(day, true, false);
        elements.rescheduleCalendarDays.appendChild(dayEl);
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(year, month, day);
        const dateKey = currentDate.toISOString().split('T')[0];
        const hasSlots = adminState.availableSlotsByDate[dateKey] && adminState.availableSlotsByDate[dateKey].length > 0;
        const isToday = isSameDay(currentDate, adminState.today);
        const isPast = currentDate < adminState.today && !isToday;
        const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
        
        const dayEl = createRescheduleDayElement(day, false, hasSlots, isToday, isPast || isWeekend || !hasSlots, currentDate);
        elements.rescheduleCalendarDays.appendChild(dayEl);
    }
    
    // Next month days
    const remainingCells = 42 - elements.rescheduleCalendarDays.children.length;
    for (let day = 1; day <= remainingCells; day++) {
        const dayEl = createRescheduleDayElement(day, true, false);
        elements.rescheduleCalendarDays.appendChild(dayEl);
    }
}

function createRescheduleDayElement(day, isOtherMonth, hasSlots, isToday = false, isDisabled = false, date = null) {
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
        dayEl.addEventListener('click', () => selectRescheduleDate(date));
    }
    
    return dayEl;
}

function selectRescheduleDate(date) {
    document.querySelectorAll('#rescheduleCalendarDays .calendar-day').forEach(day => {
        day.classList.remove('selected');
    });
    event.target.classList.add('selected');
    
    renderRescheduleTimeSlots(date);
}

function renderRescheduleTimeSlots(date) {
    const dateKey = date.toISOString().split('T')[0];
    const slots = adminState.availableSlotsByDate[dateKey] || [];
    
    if (slots.length === 0) {
        elements.rescheduleTimeSlots.classList.remove('show');
        showMessage(elements.rescheduleMessage, 'No available time slots for this date.', 'error');
        return;
    }
    
    const dateStr = formatDate(date.toISOString());
    elements.rescheduleSelectedDate.textContent = `Available times for ${dateStr}`;
    
    elements.rescheduleTimeSlotsContainer.innerHTML = '';
    slots.forEach(slot => {
        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot';
        slotEl.textContent = formatTimeFromISO(slot);
        slotEl.dataset.slot = slot;
        slotEl.addEventListener('click', () => selectRescheduleSlot(slot, slotEl));
        elements.rescheduleTimeSlotsContainer.appendChild(slotEl);
    });
    
    elements.rescheduleTimeSlots.classList.add('show');
    hideMessage(elements.rescheduleMessage);
}

function selectRescheduleSlot(slot, slotElement) {
    document.querySelectorAll('#rescheduleTimeSlotsContainer .time-slot').forEach(el => {
        el.classList.remove('selected');
    });
    
    slotElement.classList.add('selected');
    adminState.rescheduleSelectedSlot = slot;
    elements.confirmRescheduleBtn.style.display = 'inline-block';
    hideMessage(elements.rescheduleMessage);
}

async function handleConfirmReschedule() {
    if (!adminState.rescheduleSelectedSlot) {
        showMessage(elements.rescheduleMessage, 'Please select a new time slot', 'error');
        return;
    }
    
    elements.confirmRescheduleBtn.disabled = true;
    elements.confirmRescheduleBtn.textContent = 'Rescheduling...';
    
    try {
        await rescheduleAppointment(adminState.rescheduleOrderNumber, adminState.rescheduleSelectedSlot);
        showMessage(elements.rescheduleMessage, 'Appointment rescheduled successfully!', 'success');
        
        // Close modal and refresh immediately
        setTimeout(async () => {
            closeRescheduleModal();
            // Show loading state immediately
            elements.calendarLoading.style.display = 'block';
            elements.listLoading.style.display = 'block';
            elements.dateAppointments.innerHTML = '';
            await loadAppointments();
        }, 800);
    } catch (error) {
        console.error('Error rescheduling appointment:', error);
        showMessage(elements.rescheduleMessage, 'Failed to reschedule: ' + error.message, 'error');
        elements.confirmRescheduleBtn.disabled = false;
        elements.confirmRescheduleBtn.textContent = 'Confirm Reschedule';
    }
}

// Tab Management
function switchTab(tabName) {
    elements.tabBtns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.tab === tabName) {
            btn.classList.add('active');
        }
    });
    
    elements.calendarTab.classList.remove('active');
    elements.listTab.classList.remove('active');
    
    if (tabName === 'calendar') {
        elements.calendarTab.classList.add('active');
    } else if (tabName === 'list') {
        elements.listTab.classList.add('active');
    }
}

// Event Listeners
elements.loginBtn.addEventListener('click', handleLogin);
elements.passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleLogin();
    }
});

elements.logoutBtn.addEventListener('click', handleLogout);

elements.tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

elements.adminPrevMonth.addEventListener('click', () => {
    adminState.currentMonth.setMonth(adminState.currentMonth.getMonth() - 1);
    renderCalendarView();
});

elements.adminNextMonth.addEventListener('click', () => {
    adminState.currentMonth.setMonth(adminState.currentMonth.getMonth() + 1);
    renderCalendarView();
});

elements.searchInput.addEventListener('input', handleSearch);

elements.reschedulePrevMonth.addEventListener('click', () => {
    adminState.rescheduleCurrentMonth.setMonth(adminState.rescheduleCurrentMonth.getMonth() - 1);
    renderRescheduleCalendar();
});

elements.rescheduleNextMonth.addEventListener('click', () => {
    adminState.rescheduleCurrentMonth.setMonth(adminState.rescheduleCurrentMonth.getMonth() + 1);
    renderRescheduleCalendar();
});

elements.confirmRescheduleBtn.addEventListener('click', handleConfirmReschedule);
elements.cancelRescheduleBtn.addEventListener('click', closeRescheduleModal);
elements.closeRescheduleModal.addEventListener('click', closeRescheduleModal);

elements.rescheduleModal.addEventListener('click', (e) => {
    if (e.target === elements.rescheduleModal) {
        closeRescheduleModal();
    }
});

// Make functions available globally for onclick handlers
window.openRescheduleModal = openRescheduleModal;
window.handleCancelAppointment = handleCancelAppointment;

// Initialize
checkAuthentication();
console.log('Admin portal initialized');
console.log('API Base URL:', API_BASE_URL);

