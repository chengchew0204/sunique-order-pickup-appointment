const { parse } = require('csv-parse/sync');
const { stringify } = require('csv-stringify/sync');
const XLSX = require('xlsx');
const { getFileContent, uploadFileContent } = require('./graphAuth');
const config = require('./config');

// In-memory lock storage
const locks = new Map();
const LOCK_TIMEOUT = 60000; // 60 seconds

function cleanupExpiredLocks() {
  const now = Date.now();
  for (const [key, lockTime] of locks.entries()) {
    if (now - lockTime > LOCK_TIMEOUT) {
      locks.delete(key);
    }
  }
}

function lockSlot(orderNumber, slotTime) {
  cleanupExpiredLocks();
  const lockKey = `${orderNumber}_${slotTime}`;
  
  if (locks.has(lockKey)) {
    return false; // Already locked
  }
  
  locks.set(lockKey, Date.now());
  return true;
}

function unlockSlot(orderNumber, slotTime) {
  const lockKey = `${orderNumber}_${slotTime}`;
  locks.delete(lockKey);
}

async function fetchOrders() {
  try {
    const content = await getFileContent(
      config.sharepoint.siteUrl,
      config.sharepoint.ordersFilePath
    );
    
    return content;
  } catch (error) {
    console.error('Error fetching orders file:', error);
    throw error;
  }
}

async function fetchAppointments() {
  try {
    const content = await getFileContent(
      config.sharepoint.siteUrl,
      config.sharepoint.appointmentsFilePath
    );
    
    return content;
  } catch (error) {
    // If file doesn't exist yet, return empty structure
    if (error.message.includes('not found') || error.message.includes('could not be found')) {
      console.log('Appointments file not found, will create on first booking');
      
      // Return empty structure based on file type
      if (isExcelFile(config.sharepoint.appointmentsFilePath)) {
        // Create empty Excel file with headers
        const XLSX = require('xlsx');
        const workbook = XLSX.utils.book_new();
        const headers = ['OrderNumber', 'Appointment_Date', 'Appointment_Time', 'Customer_Email', 'Created_Time'];
        const worksheet = XLSX.utils.aoa_to_sheet([headers]);
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Appointments');
        return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      } else {
        // Return CSV headers
        return 'OrderNumber,Appointment_Date,Appointment_Time,Customer_Email,Created_Time\n';
      }
    }
    console.error('Error fetching appointments file:', error);
    throw error;
  }
}

function isExcelFile(filePath) {
  const extension = filePath.toLowerCase().split('.').pop();
  return extension === 'xlsx' || extension === 'xls';
}

function isCsvFile(filePath) {
  const extension = filePath.toLowerCase().split('.').pop();
  return extension === 'csv';
}

async function convertStreamToBuffer(stream) {
  if (Buffer.isBuffer(stream)) {
    return stream;
  }
  
  // If it's a web stream (ReadableStream)
  if (stream && typeof stream.getReader === 'function') {
    const reader = stream.getReader();
    const chunks = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }
    return Buffer.concat(chunks);
  }
  
  // If it's a Node.js stream
  if (stream && typeof stream.pipe === 'function') {
    return new Promise((resolve, reject) => {
      const chunks = [];
      stream.on('data', chunk => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
  
  return stream;
}

async function parseCSV(content, filePath = null) {
  try {
    // Convert stream to buffer if needed
    const buffer = await convertStreamToBuffer(content);
    
    // Determine file type
    const checkPath = filePath || config.sharepoint.ordersFilePath;
    
    // Check if the file is Excel
    if (isExcelFile(checkPath)) {
      return parseExcel(buffer);
    }
    
    // Parse as CSV
    const records = parse(buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    return records;
  } catch (error) {
    console.error('Error parsing file:', error);
    throw new Error('Failed to parse file. Ensure it has the correct format.');
  }
}

function parseExcel(excelBuffer) {
  try {
    // Read the Excel file from buffer
    const workbook = XLSX.read(excelBuffer, { type: 'buffer' });
    
    // Get the first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // First, parse as raw arrays to find the header row
    const rawData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,   // Array of arrays
      defval: '',  // Default value for empty cells
      raw: false   // Format values as strings
    });
    
    // Find the row that contains "Ready Order Number"
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(10, rawData.length); i++) {
      const row = rawData[i];
      if (row && row.some(cell => cell && cell.toString().trim() === 'Ready Order Number')) {
        headerRowIndex = i;
        console.log(`Found header row at row ${i + 1} (index ${i})`);
        break;
      }
    }
    
    // Get the header row
    const headers = rawData[headerRowIndex];
    
    // Parse data rows (starting after header)
    const records = [];
    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
      const row = rawData[i];
      const record = {};
      
      // Map each cell to its header
      headers.forEach((header, colIndex) => {
        if (header && header.trim()) {
          record[header.trim()] = row[colIndex] || '';
        }
      });
      
      // Only add non-empty records
      if (Object.values(record).some(val => val && val.toString().trim() !== '')) {
        records.push(record);
      }
    }
    
    console.log(`Parsed Excel file: ${records.length} data rows from sheet "${sheetName}" (header at row ${headerRowIndex + 1})`);
    
    return records;
  } catch (error) {
    console.error('Error parsing Excel:', error);
    throw new Error('Failed to parse Excel file');
  }
}

function stringifyCSV(records) {
  try {
    // Check if we're working with Excel file
    if (isExcelFile(config.sharepoint.csvFilePath)) {
      return stringifyExcel(records);
    }
    
    // Get all unique column names for CSV
    const columns = new Set();
    records.forEach(record => {
      Object.keys(record).forEach(key => columns.add(key));
    });
    
    const csvString = stringify(records, {
      header: true,
      columns: Array.from(columns)
    });
    
    return csvString;
  } catch (error) {
    console.error('Error stringifying file:', error);
    throw new Error('Failed to generate file content');
  }
}

function stringifyExcel(records) {
  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();
    
    // Define the column headers that should always be present
    const headers = ['OrderNumber', 'Appointment_Date', 'Appointment_Time', 'Customer_Email', 'Created_Time'];
    
    // Convert records to worksheet with explicit headers
    const worksheet = XLSX.utils.json_to_sheet(records, {
      header: headers
    });
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Orders');
    
    // Write to buffer
    const excelBuffer = XLSX.write(workbook, {
      type: 'buffer',
      bookType: 'xlsx'
    });
    
    console.log(`Generated Excel file: ${records.length} rows`);
    
    return excelBuffer;
  } catch (error) {
    console.error('Error stringifying Excel:', error);
    throw new Error('Failed to generate Excel content');
  }
}

async function updateAppointments(appointments) {
  try {
    // Define standard column headers for appointments
    const standardColumns = ['OrderNumber', 'Appointment_Date', 'Appointment_Time', 'Customer_Email', 'Created_Time'];
    
    // Check if appointments file is Excel or CSV
    let fileContent;
    
    if (isExcelFile(config.sharepoint.appointmentsFilePath)) {
      // Write as Excel
      fileContent = stringifyExcel(appointments);
    } else {
      // Write as CSV
      // Ensure we use standard columns even if array is empty
      const columns = appointments.length > 0 
        ? Array.from(new Set(appointments.flatMap(record => Object.keys(record))))
        : standardColumns;
      
      fileContent = stringify(appointments, {
        header: true,
        columns: columns
      });
    }
    
    await uploadFileContent(
      config.sharepoint.siteUrl,
      config.sharepoint.appointmentsFilePath,
      fileContent
    );
    
    const fileType = isExcelFile(config.sharepoint.appointmentsFilePath) ? 'Excel' : 'CSV';
    console.log(`Updated appointments ${fileType} file with ${appointments.length} appointments`);
    
    return true;
  } catch (error) {
    console.error('Error updating appointments file:', error);
    throw error;
  }
}

function findOrderByNumber(records, orderNumber) {
  // Check if order is in "Ready Order Number" column (meaning it's ready)
  return records.find(record => 
    record['Ready Order Number'] && 
    record['Ready Order Number'].toString().trim() === orderNumber.toString().trim()
  );
}

function isOrderReady(record) {
  // If the order has a value in "Ready Order Number" column, it's ready
  return record['Ready Order Number'] && record['Ready Order Number'].toString().trim() !== '';
}

function getAllBookedSlots(appointments) {
  const bookedSlots = [];
  
  appointments.forEach(appointment => {
    // Check for Appointment_Date and Appointment_Time columns
    if (appointment['Appointment_Date'] && appointment['Appointment_Time']) {
      const dateStr = appointment['Appointment_Date'].toString().trim();
      const timeStr = appointment['Appointment_Time'].toString().trim();
      
      if (dateStr && timeStr) {
        // Combine date and time into ISO format for comparison
        try {
          const combinedDateTime = combineDateAndTime(dateStr, timeStr);
          if (combinedDateTime) {
            bookedSlots.push(combinedDateTime);
          }
        } catch (error) {
          console.error('Error parsing booked slot:', error);
        }
      }
    }
  });
  
  return bookedSlots;
}

function findAppointmentByOrderNumber(appointments, orderNumber) {
  return appointments.find(appt => 
    appt['OrderNumber'] && 
    appt['OrderNumber'].toString().trim() === orderNumber.toString().trim()
  );
}

function combineDateAndTime(dateStr, timeStr) {
  try {
    // Parse date (handles formats like "11/13/2025" or "2025-11-13")
    let dateParts;
    if (dateStr.includes('/')) {
      dateParts = dateStr.split('/');
      // Assume MM/DD/YYYY format
      var month = parseInt(dateParts[0]) - 1;
      var day = parseInt(dateParts[1]);
      var year = parseInt(dateParts[2]);
      if (year < 100) year += 2000; // Handle 2-digit years
    } else if (dateStr.includes('-')) {
      const date = new Date(dateStr);
      month = date.getMonth();
      day = date.getDate();
      year = date.getFullYear();
    } else {
      return null;
    }
    
    // Parse time (handles "2:30 PM" or "14:30")
    const timeLower = timeStr.toLowerCase();
    const isPM = timeLower.includes('pm');
    const isAM = timeLower.includes('am');
    
    const timeOnly = timeLower.replace(/am|pm/g, '').trim();
    const [hourStr, minuteStr] = timeOnly.split(':');
    let hour = parseInt(hourStr);
    const minute = parseInt(minuteStr) || 0;
    
    // Convert to 24-hour format
    if (isPM && hour < 12) hour += 12;
    if (isAM && hour === 12) hour = 0;
    
    // Create date object
    const combined = new Date(year, month, day, hour, minute, 0, 0);
    return combined.toISOString();
  } catch (error) {
    console.error('Error combining date and time:', error);
    return null;
  }
}

function formatDateForExcel(isoString) {
  const date = new Date(isoString);
  // Use local time methods to match how slots are generated
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
}

function formatTimeForExcel(isoString) {
  const date = new Date(isoString);
  // Use local time methods to match how slots are generated
  let hour = date.getHours();
  const minute = date.getMinutes().toString().padStart(2, '0');
  const ampm = hour >= 12 ? 'PM' : 'AM';
  
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  
  return `${hour}:${minute} ${ampm}`;
}

function generateTimeSlots() {
  const slots = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let dayOffset = 0; dayOffset < config.timeSlots.daysAhead; dayOffset++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + dayOffset);
    
    // Skip weekends (0 = Sunday, 6 = Saturday)
    const dayOfWeek = currentDate.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue;
    }
    
    // Generate time slots for this day
    // Use UTC methods to avoid timezone conversion issues
    for (let hour = config.timeSlots.startHour; hour < config.timeSlots.endHour; hour++) {
      for (let minute = 0; minute < 60; minute += config.timeSlots.intervalMinutes) {
        const slotDate = new Date(Date.UTC(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          currentDate.getDate(),
          hour,
          minute,
          0,
          0
        ));
        
        // Skip past time slots
        if (slotDate > new Date()) {
          slots.push(slotDate.toISOString());
        }
      }
    }
  }
  
  return slots;
}

module.exports = {
  fetchOrders,
  fetchAppointments,
  parseCSV,
  updateAppointments,
  stringifyCSV,
  findOrderByNumber,
  findAppointmentByOrderNumber,
  isOrderReady,
  getAllBookedSlots,
  generateTimeSlots,
  lockSlot,
  unlockSlot,
  formatDateForExcel,
  formatTimeForExcel
};

