const express = require('express');
const cors = require('cors');
const config = require('./config');
const {
  fetchOrders,
  fetchAppointments,
  parseCSV,
  updateAppointments,
  findOrderByNumber,
  findAppointmentByOrderNumber,
  isOrderReady,
  getAllBookedSlots,
  generateTimeSlots,
  lockSlot,
  unlockSlot,
  formatDateForExcel,
  formatTimeForExcel
} = require('./csvHandler');
const emailService = require('./emailService');

const app = express();
const path = require('path');

// Middleware
app.use(cors(config.corsOptions));
app.use(express.json());

// Serve admin page at /admin route
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

app.use(express.static('public'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Admin authentication endpoint
app.post('/api/admin/login', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        message: 'Password is required'
      });
    }
    
    if (password === config.adminPassword) {
      return res.json({
        success: true,
        message: 'Authentication successful'
      });
    } else {
      return res.status(401).json({
        success: false,
        message: 'Incorrect password'
      });
    }
  } catch (error) {
    console.error('Error in admin login:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
});

// Endpoint 1: Validate Order
app.post('/api/validate-order', async (req, res) => {
  try {
    const { orderNumber } = req.body;
    
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required'
      });
    }
    
    // Fetch and parse orders file
    const ordersContent = await fetchOrders();
    const orders = await parseCSV(ordersContent, config.sharepoint.ordersFilePath);
    
    // Fetch appointments file
    const appointmentsContent = await fetchAppointments();
    const appointments = await parseCSV(appointmentsContent, config.sharepoint.appointmentsFilePath);
    
    // Find order in "Ready Order Number" column
    const order = findOrderByNumber(orders, orderNumber);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or not ready for pickup yet. Please check with staff.'
      });
    }
    
    // If found in "Ready Order Number" column, it's ready
    if (!isOrderReady(order)) {
      return res.status(400).json({
        success: false,
        message: 'Order is not ready for pickup yet'
      });
    }
    
    // Check if order has already been picked up
    const storageFeeStatus = order['Storage Fee Start From'];
    const pickupStatus = order['Pick up Status'];
    
    const isPickedUp = (storageFeeStatus && storageFeeStatus.toString().trim().toLowerCase() === 'picked up') ||
                       (pickupStatus && pickupStatus.toString().trim().toLowerCase() === 'fulfilled');
    
    if (isPickedUp) {
      // If there's an existing appointment for this picked-up order, remove it
      const existingAppointment = findAppointmentByOrderNumber(appointments, orderNumber);
      if (existingAppointment) {
        const updatedAppointments = appointments.filter(appt => 
          !appt['OrderNumber'] || appt['OrderNumber'].toString().trim() !== orderNumber.toString().trim()
        );
        await updateAppointments(updatedAppointments);
        console.log(`Removed appointment for fulfilled order ${orderNumber}`);
      }
      
      return res.status(400).json({
        success: false,
        message: 'This order has already been picked up. No appointment needed.'
      });
    }
    
    // Check if already scheduled in appointments file
    const existingAppointment = findAppointmentByOrderNumber(appointments, orderNumber);
    
    if (existingAppointment && existingAppointment['Appointment_Date'] && existingAppointment['Appointment_Time']) {
      // Combine date and time for display
      const combinedDateTime = `${existingAppointment['Appointment_Date']} at ${existingAppointment['Appointment_Time']}`;
      
      return res.json({
        success: true,
        message: `Order already has an appointment scheduled for ${combinedDateTime}`,
        order: {
          orderNumber: order['Ready Order Number'],
          status: order['Pick up Status'] || 'Ready to Pickup',
          readyDate: order['Ready Date'] || '',
          hasAppointment: true,
          appointmentDate: existingAppointment['Appointment_Date'],
          appointmentTime: existingAppointment['Appointment_Time'],
          appointmentDateTime: combinedDateTime
        }
      });
    }
    
    res.json({
      success: true,
      message: 'Order validated and ready for scheduling',
      order: {
        orderNumber: order['Ready Order Number'],
        status: order['Pick up Status'] || 'Ready to Pickup',
        readyDate: order['Ready Date'] || '',
        hasAppointment: false
      }
    });
    
  } catch (error) {
    console.error('Error validating order:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while validating order',
      error: error.message
    });
  }
});

// Endpoint 2: Get Available Slots
app.get('/api/available-slots', async (req, res) => {
  try {
    // Generate all possible time slots
    const allSlots = generateTimeSlots();
    
    // Fetch appointments file to get booked slots
    const appointmentsContent = await fetchAppointments();
    const appointments = await parseCSV(appointmentsContent);
    const bookedSlots = getAllBookedSlots(appointments);
    
    // Filter out booked slots
    const availableSlots = allSlots.filter(slot => !bookedSlots.includes(slot));
    
    res.json({
      success: true,
      slots: availableSlots,
      totalSlots: allSlots.length,
      availableCount: availableSlots.length,
      bookedCount: bookedSlots.length
    });
    
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available slots',
      error: error.message
    });
  }
});

// Endpoint 3: Book Appointment
app.post('/api/book-appointment', async (req, res) => {
  try {
    const { orderNumber, slotTime, customerEmail } = req.body;
    
    if (!orderNumber || !slotTime) {
      return res.status(400).json({
        success: false,
        message: 'Order number and slot time are required'
      });
    }
    
    if (!customerEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }
    
    // Lock the slot
    if (!lockSlot(orderNumber, slotTime)) {
      return res.status(409).json({
        success: false,
        message: 'This time slot is currently being booked by another customer'
      });
    }
    
    try {
      // Fetch orders and appointments files
      const ordersContent = await fetchOrders();
      const orders = await parseCSV(ordersContent);
      
      const appointmentsContent = await fetchAppointments();
      const appointments = await parseCSV(appointmentsContent);
      
      // Find order in "Ready Order Number" column
      const order = findOrderByNumber(orders, orderNumber);
      
      if (!order) {
        unlockSlot(orderNumber, slotTime);
        return res.status(404).json({
          success: false,
          message: 'Order not found or not ready for pickup'
        });
      }
      
      // Validate order is ready (has value in "Ready Order Number")
      if (!isOrderReady(order)) {
        unlockSlot(orderNumber, slotTime);
        return res.status(400).json({
          success: false,
          message: 'Order is not ready for pickup'
        });
      }
      
      // Check if order has already been picked up
      const storageFeeStatus = order['Storage Fee Start From'];
      const pickupStatus = order['Pick up Status'];
      
      const isPickedUp = (storageFeeStatus && storageFeeStatus.toString().trim().toLowerCase() === 'picked up') ||
                         (pickupStatus && pickupStatus.toString().trim().toLowerCase() === 'fulfilled');
      
      if (isPickedUp) {
        unlockSlot(orderNumber, slotTime);
        return res.status(400).json({
          success: false,
          message: 'This order has already been picked up. No appointment needed.'
        });
      }
      
      // Check if order already has an appointment in appointments file
      const existingAppointment = findAppointmentByOrderNumber(appointments, orderNumber);
      
      if (existingAppointment && existingAppointment['Appointment_Date'] && existingAppointment['Appointment_Time']) {
        unlockSlot(orderNumber, slotTime);
        return res.status(400).json({
          success: false,
          message: 'Order already has a scheduled appointment',
          existingAppointment: `${existingAppointment['Appointment_Date']} at ${existingAppointment['Appointment_Time']}`
        });
      }
      
      // Check if slot is still available
      const bookedSlots = getAllBookedSlots(appointments);
      if (bookedSlots.includes(slotTime)) {
        unlockSlot(orderNumber, slotTime);
        return res.status(409).json({
          success: false,
          message: 'This time slot is no longer available'
        });
      }
      
      // Create new appointment entry (matching your Excel columns)
      const newAppointment = {
        'OrderNumber': orderNumber,
        'Appointment_Date': formatDateForExcel(slotTime),
        'Appointment_Time': formatTimeForExcel(slotTime),
        'Created_Time': new Date().toISOString()
      };
      
      // Add to appointments list or update if exists
      if (existingAppointment) {
        const apptIndex = appointments.findIndex(a => 
          a['OrderNumber'] && a['OrderNumber'].toString().trim() === orderNumber.toString().trim()
        );
        appointments[apptIndex] = newAppointment;
      } else {
        appointments.push(newAppointment);
      }
      
      // Save to appointments CSV file (separate from orders file)
      await updateAppointments(appointments);
      
      // Unlock the slot
      unlockSlot(orderNumber, slotTime);
      
      // Send confirmation email
      const emailResult = await emailService.sendConfirmationEmail({
        orderNumber: order['Ready Order Number'],
        pickupTime: slotTime,
        customerEmail: customerEmail
      });
      
      if (!emailResult.success) {
        console.warn('Failed to send confirmation email:', emailResult.message);
        // Note: We still proceed with the booking even if email fails
      }
      
      res.json({
        success: true,
        message: 'Appointment booked successfully',
        appointment: {
          orderNumber: order['Ready Order Number'],
          pickupTime: slotTime
        }
      });
      
    } catch (error) {
      // Unlock on error
      unlockSlot(orderNumber, slotTime);
      throw error;
    }
    
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while booking appointment',
      error: error.message
    });
  }
});

// Admin Endpoint 1: Get All Appointments
app.get('/api/admin/appointments', async (req, res) => {
  try {
    // Fetch both orders and appointments
    const ordersContent = await fetchOrders();
    const orders = await parseCSV(ordersContent, config.sharepoint.ordersFilePath);
    
    const appointmentsContent = await fetchAppointments();
    const appointments = await parseCSV(appointmentsContent, config.sharepoint.appointmentsFilePath);
    
    // Track if we need to update the appointments file
    let needsUpdate = false;
    const cleanedAppointments = [];
    
    // Filter out empty appointments and check pickup status
    for (const appt of appointments) {
      if (!appt['OrderNumber'] || !appt['Appointment_Date'] || !appt['Appointment_Time']) {
        needsUpdate = true;
        continue;
      }
      
      // Find the order in the orders list
      const order = findOrderByNumber(orders, appt['OrderNumber']);
      
      // Check if order is picked up (fulfilled)
      if (order && order['Pick up Status']) {
        const pickupStatus = order['Pick up Status'].toString().trim().toLowerCase();
        if (pickupStatus === 'fulfilled') {
          console.log(`Removing appointment for order ${appt['OrderNumber']} - already picked up (fulfilled)`);
          needsUpdate = true;
          continue;
        }
      }
      
      // Keep this appointment
      cleanedAppointments.push(appt);
    }
    
    // Update appointments file if any were removed
    if (needsUpdate) {
      console.log(`Updating appointments file: removed ${appointments.length - cleanedAppointments.length} fulfilled orders`);
      await updateAppointments(cleanedAppointments);
    }
    
    // Format the response
    const validAppointments = cleanedAppointments.map(appt => ({
      orderNumber: appt['OrderNumber'],
      appointmentDate: appt['Appointment_Date'],
      appointmentTime: appt['Appointment_Time'],
      createdTime: appt['Created_Time'] || ''
    }));
    
    res.json({
      success: true,
      appointments: validAppointments,
      count: validAppointments.length
    });
    
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching appointments',
      error: error.message
    });
  }
});

// Admin Endpoint 2: Cancel Appointment
app.delete('/api/admin/appointments/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    
    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: 'Order number is required'
      });
    }
    
    const appointmentsContent = await fetchAppointments();
    const appointments = await parseCSV(appointmentsContent, config.sharepoint.appointmentsFilePath);
    
    // Find the appointment
    const appointmentIndex = appointments.findIndex(appt => 
      appt['OrderNumber'] && appt['OrderNumber'].toString().trim() === orderNumber.toString().trim()
    );
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Remove the appointment
    appointments.splice(appointmentIndex, 1);
    
    // Update the file
    await updateAppointments(appointments);
    
    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
    
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while cancelling appointment',
      error: error.message
    });
  }
});

// Admin Endpoint 3: Reschedule Appointment
app.put('/api/admin/appointments/:orderNumber', async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const { newSlotTime } = req.body;
    
    if (!orderNumber || !newSlotTime) {
      return res.status(400).json({
        success: false,
        message: 'Order number and new slot time are required'
      });
    }
    
    const appointmentsContent = await fetchAppointments();
    const appointments = await parseCSV(appointmentsContent, config.sharepoint.appointmentsFilePath);
    
    // Find the appointment
    const appointmentIndex = appointments.findIndex(appt => 
      appt['OrderNumber'] && appt['OrderNumber'].toString().trim() === orderNumber.toString().trim()
    );
    
    if (appointmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found'
      });
    }
    
    // Check if new slot is available (excluding current appointment)
    const bookedSlots = getAllBookedSlots(appointments.filter((_, idx) => idx !== appointmentIndex));
    if (bookedSlots.includes(newSlotTime)) {
      return res.status(409).json({
        success: false,
        message: 'The new time slot is not available'
      });
    }
    
    // Update the appointment
    appointments[appointmentIndex] = {
      'OrderNumber': orderNumber,
      'Appointment_Date': formatDateForExcel(newSlotTime),
      'Appointment_Time': formatTimeForExcel(newSlotTime),
      'Created_Time': appointments[appointmentIndex]['Created_Time'] || new Date().toISOString()
    };
    
    // Update the file
    await updateAppointments(appointments);
    
    res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment: {
        orderNumber,
        appointmentDate: formatDateForExcel(newSlotTime),
        appointmentTime: formatTimeForExcel(newSlotTime)
      }
    });
    
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while rescheduling appointment',
      error: error.message
    });
  }
});

// Start server
const PORT = config.port;
app.listen(PORT, () => {
  console.log(`Appointment system server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

