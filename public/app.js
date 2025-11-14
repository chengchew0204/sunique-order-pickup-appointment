// Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api'
    : '/api'; // Proxied through Netlify to Railway backend

// State
const state = {
    currentOrder: null,
    selectedSlot: null,
    selectedDate: null,
    availableSlots: [],
    availableSlotsByDate: {},
    currentMonth: new Date(),
    today: new Date()
};

// DOM Elements
const elements = {
    // Step 1
    stepValidation: document.getElementById('step-validation'),
    orderNumberInput: document.getElementById('orderNumber'),
    validateBtn: document.getElementById('validateBtn'),
    validationMessage: document.getElementById('validationMessage'),
    
    // Step 2
    stepSlots: document.getElementById('step-slots'),
    orderInfo: document.getElementById('orderInfo'),
    slotsLoading: document.getElementById('slotsLoading'),
    slotsContainer: document.getElementById('slotsContainer'),
    backToValidationBtn: document.getElementById('backToValidationBtn'),
    selectionMessage: document.getElementById('selectionMessage'),
    
    // Step 3
    stepConfirmation: document.getElementById('step-confirmation'),
    confirmationDetails: document.getElementById('confirmationDetails'),
    newAppointmentBtn: document.getElementById('newAppointmentBtn')
};

// Utility Functions
function showMessage(element, message, type) {
    element.textContent = message;
    element.className = `message show ${type}`;
}

function hideMessage(element) {
    element.className = 'message';
}

function showStep(step) {
    document.querySelectorAll('.step').forEach(s => s.classList.remove('active'));
    step.classList.add('active');
}

function formatDateTime(isoString) {
    const date = new Date(isoString);
    // Use UTC methods to avoid timezone conversion
    const options = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
    };
    const dateStr = date.toLocaleString('en-US', options);
    const timeStr = formatTime(isoString);
    return `${dateStr} at ${timeStr}`;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const options = {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
    };
    return date.toLocaleString('en-US', options);
}

function formatTime(isoString) {
    const date = new Date(isoString);
    // Use UTC time directly to avoid timezone conversion
    // This ensures times display consistently as business hours (9AM-5PM)
    const hours = date.getUTCHours();
    const minutes = date.getUTCMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, '0');
    return `${displayHours}:${displayMinutes} ${ampm}`;
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

// API Functions
async function validateOrder(orderNumber) {
    try {
        const response = await fetch(`${API_BASE_URL}/validate-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderNumber })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to validate order');
        }
        
        return data;
    } catch (error) {
        console.error('Error validating order:', error);
        throw error;
    }
}

async function loadAvailableSlots() {
    try {
        const response = await fetch(`${API_BASE_URL}/available-slots`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to load available slots');
        }
        
        return data.slots;
    } catch (error) {
        console.error('Error loading slots:', error);
        throw error;
    }
}

async function bookAppointment(orderNumber, slotTime, customerEmail) {
    try {
        const response = await fetch(`${API_BASE_URL}/book-appointment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ orderNumber, slotTime, customerEmail })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Failed to book appointment');
        }
        
        return data;
    } catch (error) {
        console.error('Error booking appointment:', error);
        throw error;
    }
}

// Event Handlers
async function handleValidateOrder() {
    const orderNumber = elements.orderNumberInput.value.trim();
    
    if (!orderNumber) {
        showMessage(elements.validationMessage, 'Please enter an order number', 'error');
        return;
    }
    
    elements.validateBtn.disabled = true;
    elements.validateBtn.textContent = 'Validating...';
    hideMessage(elements.validationMessage);
    
    try {
        const result = await validateOrder(orderNumber);
        
        if (result.success) {
            state.currentOrder = result.order;
            
            if (result.order.hasAppointment) {
                // Use the formatted appointment date/time from server
                const appointmentDisplay = result.order.appointmentDateTime || 
                    `${result.order.appointmentDate} at ${result.order.appointmentTime}`;
                    
                showMessage(elements.validationMessage, 
                    `This order already has an appointment scheduled for ${appointmentDisplay}`, 
                    'info');
                elements.validateBtn.disabled = false;
                elements.validateBtn.textContent = 'Validate Order';
            } else {
                showMessage(elements.validationMessage, 'Order validated successfully!', 'success');
                setTimeout(() => {
                    showSlotSelectionStep();
                }, 1000);
            }
        }
    } catch (error) {
        showMessage(elements.validationMessage, error.message, 'error');
        elements.validateBtn.disabled = false;
        elements.validateBtn.textContent = 'Validate Order';
    }
}

async function showSlotSelectionStep() {
    showStep(elements.stepSlots);
    
    // Show order info
    elements.orderInfo.innerHTML = `
        <p><strong>Order Number:</strong> ${state.currentOrder.orderNumber}</p>
        <p><strong>Status:</strong> ${state.currentOrder.status}</p>
    `;
    
    // Show loading
    elements.slotsLoading.style.display = 'block';
    document.getElementById('calendarContainer').classList.remove('show');
    document.getElementById('timeSlotsSection').classList.remove('show');
    hideMessage(elements.selectionMessage);
    
    try {
        const slots = await loadAvailableSlots();
        state.availableSlots = slots;
        
        if (slots.length === 0) {
            elements.slotsLoading.style.display = 'none';
            showMessage(elements.selectionMessage, 'No available time slots at the moment. Please try again later.', 'error');
            return;
        }
        
        // Group slots by date
        state.availableSlotsByDate = groupSlotsByDate(slots);
        
        // Render calendar
        renderCalendar();
        elements.slotsLoading.style.display = 'none';
        document.getElementById('calendarContainer').classList.add('show');
        
        // Set up calendar navigation
        setupCalendarNavigation();
    } catch (error) {
        elements.slotsLoading.style.display = 'none';
        showMessage(elements.selectionMessage, `Error loading time slots: ${error.message}`, 'error');
    }
}

// renderTimeSlots function removed - replaced with calendar view

function selectTimeSlot(slotTime) {
    // Remove previous selection
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
    });
    
    // Add selection to clicked slot
    const selectedElement = document.querySelector(`[data-slot="${slotTime}"]`);
    if (selectedElement) {
        selectedElement.classList.add('selected');
        state.selectedSlot = slotTime;
        
        // Show email input section
        const emailSection = document.getElementById('emailInputSection');
        if (emailSection) {
            emailSection.style.display = 'block';
        }
        
        // Show confirmation button if not already present
        if (!document.getElementById('confirmBookingBtn')) {
            const actionsDiv = document.querySelector('#step-slots .actions');
            const confirmBtn = document.createElement('button');
            confirmBtn.id = 'confirmBookingBtn';
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.textContent = 'Confirm Booking';
            confirmBtn.onclick = handleConfirmBooking;
            actionsDiv.appendChild(confirmBtn);
        }
        
        hideMessage(elements.selectionMessage);
        showMessage(elements.selectionMessage, 
            `Selected: ${formatDateTime(slotTime)}. Click "Confirm Booking" to proceed.`, 
            'info');
    }
}

// Make function available globally
window.selectTimeSlot = selectTimeSlot;

async function handleConfirmBooking() {
    if (!state.selectedSlot) {
        showMessage(elements.selectionMessage, 'Please select a time slot', 'error');
        return;
    }
    
    // Get customer email - now required
    const emailInput = document.getElementById('customerEmail');
    const customerEmail = emailInput ? emailInput.value.trim() : '';
    
    // Email is now mandatory
    if (!customerEmail) {
        showMessage(elements.selectionMessage, 'Please enter your email address', 'error');
        return;
    }
    
    // Validate email format
    if (!isValidEmail(customerEmail)) {
        showMessage(elements.selectionMessage, 'Please enter a valid email address', 'error');
        return;
    }
    
    const confirmBtn = document.getElementById('confirmBookingBtn');
    confirmBtn.disabled = true;
    confirmBtn.textContent = 'Booking...';
    
    try {
        const result = await bookAppointment(state.currentOrder.orderNumber, state.selectedSlot, customerEmail);
        
        if (result.success) {
            showConfirmationStep(result.appointment, customerEmail);
        }
    } catch (error) {
        showMessage(elements.selectionMessage, error.message, 'error');
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Confirm Booking';
    }
}

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function showConfirmationStep(appointment, customerEmail) {
    showStep(elements.stepConfirmation);
    
    elements.confirmationDetails.innerHTML = `
        <p><strong>Order Number:</strong> ${appointment.orderNumber}</p>
        <p><strong>Pickup Time:</strong></p>
        <p class="pickup-time">${formatDateTime(appointment.pickupTime)}</p>
        <p><strong>Confirmation Email:</strong> Sent to ${customerEmail}</p>
        
        <p style="margin-top: 24px; font-weight: 600;">Important Instructions:</p>
        <ol style="text-align: left; line-height: 1.8; margin-left: 20px;">
            <li>Please screenshot this confirmation for your reference and prepare it when picking up.</li>
            <li>To cancel or modify your appointment, please contact Sunique at (972) 245-3309.</li>
            <li>The appointment is reserved for 10 minutes. If you are delayed more than 10 minutes, the appointment will be void.</li>
            <li>We reserve the right to adjust the time. We will do our best to get your order loaded, but we do not guarantee it will be ready at the exact scheduled time.</li>
        </ol>
    `;
}

function handleBackToValidation() {
    showStep(elements.stepValidation);
    elements.orderNumberInput.value = '';
    state.currentOrder = null;
    state.selectedSlot = null;
    state.selectedDate = null;
    state.availableSlots = [];
    state.availableSlotsByDate = {};
    hideMessage(elements.validationMessage);
    elements.validateBtn.disabled = false;
    elements.validateBtn.textContent = 'Validate Order';
    
    // Clean up confirm button if exists
    const confirmBtn = document.getElementById('confirmBookingBtn');
    if (confirmBtn) {
        confirmBtn.remove();
    }
    
    // Hide and clear email input section
    const emailSection = document.getElementById('emailInputSection');
    const emailInput = document.getElementById('customerEmail');
    if (emailSection) {
        emailSection.style.display = 'none';
    }
    if (emailInput) {
        emailInput.value = '';
    }
}

function handleNewAppointment() {
    handleBackToValidation();
}

// Event Listeners
elements.validateBtn.addEventListener('click', handleValidateOrder);
elements.orderNumberInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleValidateOrder();
    }
});
elements.backToValidationBtn.addEventListener('click', handleBackToValidation);
elements.newAppointmentBtn.addEventListener('click', handleNewAppointment);

// Initialize
console.log('Appointment system initialized');
console.log('API Base URL:', API_BASE_URL);