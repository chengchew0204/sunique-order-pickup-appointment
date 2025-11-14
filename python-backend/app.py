from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from config import Config
from services.sharepoint_service import SharePointService
from services.email_service import EmailService
from datetime import datetime, timedelta
import os
import traceback

app = Flask(__name__, static_folder='../public', static_url_path='')
app.config.from_object(Config)

# CORS Configuration
CORS(app, origins=app.config.get('CORS_ORIGINS', []), supports_credentials=True)

# Initialize services
sharepoint_service = SharePointService(app.config)
email_service = EmailService(app.config)

# In-memory slot locks
slot_locks = {}
LOCK_TIMEOUT = 60  # seconds

def cleanup_expired_locks():
    """Remove expired locks"""
    import time
    current_time = time.time()
    expired = [key for key, lock_time in slot_locks.items() 
               if current_time - lock_time > LOCK_TIMEOUT]
    for key in expired:
        del slot_locks[key]

def lock_slot(order_number, slot_time):
    """Lock a slot for booking"""
    cleanup_expired_locks()
    import time
    lock_key = f"{order_number}_{slot_time}"
    
    if lock_key in slot_locks:
        return False
    
    slot_locks[lock_key] = time.time()
    return True

def unlock_slot(order_number, slot_time):
    """Unlock a slot"""
    lock_key = f"{order_number}_{slot_time}"
    if lock_key in slot_locks:
        del slot_locks[lock_key]

def find_order_by_number(orders, order_number):
    """Find order in orders list by order number"""
    order_num_str = str(order_number).strip()
    
    for order in orders:
        if 'Ready Order Number' in order:
            ready_num = str(order['Ready Order Number']).strip()
            if ready_num == order_num_str:
                return order
    return None

def find_appointment_by_order_number(appointments, order_number):
    """Find appointment in appointments list by order number"""
    order_num_str = str(order_number).strip()
    
    for appt in appointments:
        if 'OrderNumber' in appt:
            appt_num = str(appt['OrderNumber']).strip()
            if appt_num == order_num_str:
                return appt
    return None

def is_order_ready(order):
    """Check if order is ready for pickup"""
    return bool(order.get('Ready Order Number'))

def is_excel_file(file_path):
    """Check if file is Excel based on extension"""
    return file_path.lower().endswith(('.xlsx', '.xls'))

def parse_appointments_file(file_content, file_path):
    """Parse appointments file (CSV or Excel based on extension)"""
    if is_excel_file(file_path):
        return sharepoint_service.parse_excel_file(file_content)
    else:
        return sharepoint_service.parse_csv_file(file_content)

def save_appointments_file(appointments, file_path, fieldnames):
    """Save appointments to file (CSV or Excel based on extension)"""
    if is_excel_file(file_path):
        file_bytes = sharepoint_service.records_to_excel_bytes(appointments, fieldnames)
    else:
        file_bytes = sharepoint_service.records_to_csv_bytes(appointments, fieldnames)
    sharepoint_service.upload_file_content(file_path, file_bytes)

def generate_time_slots():
    """Generate all available time slots for the next days"""
    slots = []
    # Use UTC time to avoid timezone conversion issues
    today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    
    days_ahead = app.config.get('TIME_SLOT_DAYS_AHEAD', 8)
    start_hour = app.config.get('TIME_SLOT_START_HOUR', 9)
    end_hour = app.config.get('TIME_SLOT_END_HOUR', 17)
    interval_minutes = app.config.get('TIME_SLOT_INTERVAL_MINUTES', 30)
    
    for day_offset in range(days_ahead):
        current_date = today + timedelta(days=day_offset)
        
        # Skip weekends (Saturday=5, Sunday=6)
        if current_date.weekday() >= 5:
            continue
        
        # Generate time slots for this day in UTC
        for hour in range(start_hour, end_hour + 1):
            for minute in range(0, 60, interval_minutes):
                # Skip slots after end_hour (e.g., skip 5:30 PM if end is 5:00 PM)
                if hour == end_hour and minute > 0:
                    continue
                    
                slot_time = current_date.replace(hour=hour, minute=minute)
                # Skip past time slots
                if slot_time > datetime.utcnow():
                    slots.append(slot_time.isoformat() + 'Z')
    
    return slots

def get_all_booked_slots(appointments):
    """Get list of all booked slot times"""
    booked = []
    
    for appt in appointments:
        if appt.get('Appointment_Date') and appt.get('Appointment_Time'):
            try:
                # Combine date and time
                date_str = str(appt['Appointment_Date'])
                time_str = str(appt['Appointment_Time'])
                
                # Parse and combine
                date_part = datetime.strptime(date_str, '%Y-%m-%d')
                time_part = datetime.strptime(time_str, '%I:%M %p')
                
                combined = date_part.replace(
                    hour=time_part.hour,
                    minute=time_part.minute
                )
                
                booked.append(combined.isoformat() + 'Z')
            except:
                pass
    
    return booked

def format_date_for_excel(iso_time):
    """Format ISO datetime to date string for Excel"""
    dt = datetime.fromisoformat(iso_time.replace('Z', '+00:00'))
    return dt.strftime('%Y-%m-%d')

def format_time_for_excel(iso_time):
    """Format ISO datetime to time string for Excel"""
    dt = datetime.fromisoformat(iso_time.replace('Z', '+00:00'))
    return dt.strftime('%I:%M %p')

def combine_date_and_time_to_iso(date_str, time_str):
    """Combine date and time strings back to ISO format"""
    try:
        # Parse date (format: MM/DD/YYYY or YYYY-MM-DD)
        if '/' in date_str:
            parts = date_str.split('/')
            month = int(parts[0])
            day = int(parts[1])
            year = int(parts[2])
        elif '-' in date_str:
            parts = date_str.split('-')
            year = int(parts[0])
            month = int(parts[1])
            day = int(parts[2])
        else:
            raise ValueError(f"Unknown date format: {date_str}")
        
        # Parse time (format: "9:00 AM" or "09:00 AM")
        time_lower = time_str.lower().strip()
        is_pm = 'pm' in time_lower
        is_am = 'am' in time_lower
        
        time_only = time_lower.replace('am', '').replace('pm', '').strip()
        hour, minute = time_only.split(':')
        hour = int(hour)
        minute = int(minute)
        
        if is_pm and hour < 12:
            hour += 12
        if is_am and hour == 12:
            hour = 0
        
        # Create UTC datetime
        dt = datetime(year, month, day, hour, minute, 0, 0)
        return dt.isoformat() + 'Z'
        
    except Exception as e:
        print(f"Error combining date and time: {e}, date: {date_str}, time: {time_str}")
        return datetime.now().isoformat() + 'Z'

# Static file serving
@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/admin')
def serve_admin():
    return send_from_directory(app.static_folder, 'admin.html')

# Health check endpoint
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'OK',
        'message': 'Server is running',
        'version': '1.0.1'
    })

# Admin authentication endpoint
@app.route('/api/admin/login', methods=['POST'])
def admin_login():
    try:
        data = request.get_json()
        password = data.get('password')
        
        if not password:
            return jsonify({
                'success': False,
                'message': 'Password is required'
            }), 400
        
        if password == app.config.get('ADMIN_PASSWORD'):
            return jsonify({
                'success': True,
                'message': 'Authentication successful'
            })
        else:
            return jsonify({
                'success': False,
                'message': 'Incorrect password'
            }), 401
            
    except Exception as e:
        print(f'Error in admin login: {e}')
        return jsonify({
            'success': False,
            'message': 'Server error during authentication'
        }), 500

# Endpoint 1: Validate Order
@app.route('/api/validate-order', methods=['POST'])
def validate_order():
    try:
        data = request.get_json()
        order_number = data.get('orderNumber')
        
        if not order_number:
            return jsonify({
                'success': False,
                'message': 'Order number is required'
            }), 400
        
        # Fetch and parse orders file
        orders_file_path = app.config.get('ORDERS_FILE_PATH')
        orders_content = sharepoint_service.get_file_content(orders_file_path)
        
        if orders_file_path.endswith('.xlsx') or orders_file_path.endswith('.xls'):
            orders = sharepoint_service.parse_excel_file(orders_content)
        else:
            orders = sharepoint_service.parse_csv_file(orders_content)
        
        # Fetch appointments file
        appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
        try:
            appts_content = sharepoint_service.get_file_content(appointments_file_path)
            appointments = parse_appointments_file(appts_content, appointments_file_path)
        except:
            appointments = []
        
        # Find order
        order = find_order_by_number(orders, order_number)
        
        if not order:
            return jsonify({
                'success': False,
                'message': 'Order not found or not ready for pickup yet. Please check with staff.'
            }), 404
        
        if not is_order_ready(order):
            return jsonify({
                'success': False,
                'message': 'Order is not ready for pickup yet'
            }), 400
        
        # Check if already picked up
        storage_fee_status = str(order.get('Storage Fee Start From', '')).strip().lower()
        pickup_status = str(order.get('Pick up Status', '')).strip().lower()
        
        is_picked_up = storage_fee_status == 'picked up' or pickup_status == 'fulfilled'
        
        if is_picked_up:
            # Remove appointment if exists
            existing_appt = find_appointment_by_order_number(appointments, order_number)
            if existing_appt:
                appointments = [a for a in appointments 
                               if str(a.get('OrderNumber', '')).strip() != str(order_number).strip()]
                appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
                save_appointments_file(
                    appointments,
                    appointments_file_path,
                    ['OrderNumber', 'Appointment_Date', 'Appointment_Time', 'Customer_Email', 'Created_Time']
                )
            
            return jsonify({
                'success': False,
                'message': 'This order has already been picked up. No appointment needed.'
            }), 400
        
        # Check if already has appointment
        existing_appt = find_appointment_by_order_number(appointments, order_number)
        
        if existing_appt and existing_appt.get('Appointment_Date') and existing_appt.get('Appointment_Time'):
            combined_datetime = f"{existing_appt['Appointment_Date']} at {existing_appt['Appointment_Time']}"
            
            return jsonify({
                'success': True,
                'message': f"Order already has an appointment scheduled for {combined_datetime}",
                'order': {
                    'orderNumber': order['Ready Order Number'],
                    'status': order.get('Pick up Status', 'Ready to Pickup'),
                    'readyDate': order.get('Ready Date', ''),
                    'hasAppointment': True,
                    'appointmentDate': existing_appt['Appointment_Date'],
                    'appointmentTime': existing_appt['Appointment_Time'],
                    'appointmentDateTime': combined_datetime
                }
            })
        
        return jsonify({
            'success': True,
            'message': 'Order validated and ready for scheduling',
            'order': {
                'orderNumber': order['Ready Order Number'],
                'status': order.get('Pick up Status', 'Ready to Pickup'),
                'readyDate': order.get('Ready Date', ''),
                'hasAppointment': False
            }
        })
        
    except Exception as e:
        print(f'Error validating order: {e}')
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Server error while validating order',
            'error': str(e)
        }), 500

# Endpoint 2: Get Available Slots
@app.route('/api/available-slots', methods=['GET'])
def get_available_slots():
    try:
        # Generate all possible time slots
        all_slots = generate_time_slots()
        
        # Fetch appointments to get booked slots
        appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
        try:
            appts_content = sharepoint_service.get_file_content(appointments_file_path)
            appointments = parse_appointments_file(appts_content, appointments_file_path)
        except:
            appointments = []
        
        booked_slots = get_all_booked_slots(appointments)
        
        # Filter out booked slots
        available_slots = [slot for slot in all_slots if slot not in booked_slots]
        
        return jsonify({
            'success': True,
            'slots': available_slots,
            'totalSlots': len(all_slots),
            'availableCount': len(available_slots),
            'bookedCount': len(booked_slots)
        })
        
    except Exception as e:
        print(f'Error fetching available slots: {e}')
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Server error while fetching available slots',
            'error': str(e)
        }), 500

# Endpoint 3: Book Appointment
@app.route('/api/book-appointment', methods=['POST'])
def book_appointment():
    order_number = None
    slot_time = None
    
    try:
        data = request.get_json()
        order_number = data.get('orderNumber')
        slot_time = data.get('slotTime')
        customer_email = data.get('customerEmail')
        
        if not order_number or not slot_time:
            return jsonify({
                'success': False,
                'message': 'Order number and slot time are required'
            }), 400
        
        if not customer_email:
            return jsonify({
                'success': False,
                'message': 'Email address is required'
            }), 400
        
        # Lock the slot
        if not lock_slot(order_number, slot_time):
            return jsonify({
                'success': False,
                'message': 'This time slot is currently being booked by another customer'
            }), 409
        
        try:
            # Fetch orders
            orders_file_path = app.config.get('ORDERS_FILE_PATH')
            orders_content = sharepoint_service.get_file_content(orders_file_path)
            
            if orders_file_path.endswith('.xlsx') or orders_file_path.endswith('.xls'):
                orders = sharepoint_service.parse_excel_file(orders_content)
            else:
                orders = sharepoint_service.parse_csv_file(orders_content)
            
            # Fetch appointments
            appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
            try:
                appts_content = sharepoint_service.get_file_content(appointments_file_path)
                appointments = parse_appointments_file(appts_content, appointments_file_path)
            except:
                appointments = []
            
            # Find order
            order = find_order_by_number(orders, order_number)
            
            if not order:
                unlock_slot(order_number, slot_time)
                return jsonify({
                    'success': False,
                    'message': 'Order not found or not ready for pickup'
                }), 404
            
            if not is_order_ready(order):
                unlock_slot(order_number, slot_time)
                return jsonify({
                    'success': False,
                    'message': 'Order is not ready for pickup'
                }), 400
            
            # Check if picked up
            storage_fee_status = str(order.get('Storage Fee Start From', '')).strip().lower()
            pickup_status = str(order.get('Pick up Status', '')).strip().lower()
            
            is_picked_up = storage_fee_status == 'picked up' or pickup_status == 'fulfilled'
            
            if is_picked_up:
                unlock_slot(order_number, slot_time)
                return jsonify({
                    'success': False,
                    'message': 'This order has already been picked up. No appointment needed.'
                }), 400
            
            # Check existing appointment
            existing_appt = find_appointment_by_order_number(appointments, order_number)
            
            if existing_appt and existing_appt.get('Appointment_Date') and existing_appt.get('Appointment_Time'):
                unlock_slot(order_number, slot_time)
                return jsonify({
                    'success': False,
                    'message': 'Order already has a scheduled appointment',
                    'existingAppointment': f"{existing_appt['Appointment_Date']} at {existing_appt['Appointment_Time']}"
                }), 400
            
            # Check if slot is still available
            booked_slots = get_all_booked_slots(appointments)
            if slot_time in booked_slots:
                unlock_slot(order_number, slot_time)
                return jsonify({
                    'success': False,
                    'message': 'This time slot is no longer available'
                }), 409
            
            # Create new appointment
            new_appointment = {
                'OrderNumber': order_number,
                'Appointment_Date': format_date_for_excel(slot_time),
                'Appointment_Time': format_time_for_excel(slot_time),
                'Customer_Email': customer_email,
                'Created_Time': datetime.now().isoformat()
            }
            
            # Add or update appointment
            if existing_appt:
                appointments = [a if str(a.get('OrderNumber', '')).strip() != str(order_number).strip() 
                               else new_appointment for a in appointments]
            else:
                appointments.append(new_appointment)
            
            # Save appointments
            appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
            save_appointments_file(
                appointments,
                appointments_file_path,
                ['OrderNumber', 'Appointment_Date', 'Appointment_Time', 'Customer_Email', 'Created_Time']
            )
            
            # Unlock slot
            unlock_slot(order_number, slot_time)
            
            # Send confirmation email
            email_result = email_service.send_confirmation_email(
                order_number,
                slot_time,
                customer_email
            )
            
            if not email_result.get('success'):
                print(f"Failed to send confirmation email: {email_result.get('message')}")
            
            return jsonify({
                'success': True,
                'message': 'Appointment booked successfully',
                'appointment': {
                    'orderNumber': order['Ready Order Number'],
                    'pickupTime': slot_time
                }
            })
            
        except Exception as e:
            if order_number and slot_time:
                unlock_slot(order_number, slot_time)
            raise
        
    except Exception as e:
        print(f'Error booking appointment: {e}')
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Server error while booking appointment',
            'error': str(e)
        }), 500

# Admin Endpoint 1: Get All Appointments
@app.route('/api/admin/appointments', methods=['GET'])
def get_admin_appointments():
    try:
        # Fetch orders
        orders_file_path = app.config.get('ORDERS_FILE_PATH')
        orders_content = sharepoint_service.get_file_content(orders_file_path)
        
        if orders_file_path.endswith('.xlsx') or orders_file_path.endswith('.xls'):
            orders = sharepoint_service.parse_excel_file(orders_content)
        else:
            orders = sharepoint_service.parse_csv_file(orders_content)
        
        # Fetch appointments
        appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
        try:
            appts_content = sharepoint_service.get_file_content(appointments_file_path)
            appointments = parse_appointments_file(appts_content, appointments_file_path)
        except:
            appointments = []
        
        # Clean up appointments
        needs_update = False
        cleaned_appointments = []
        
        for appt in appointments:
            if not appt.get('OrderNumber') or not appt.get('Appointment_Date') or not appt.get('Appointment_Time'):
                needs_update = True
                continue
            
            # Check if picked up
            order = find_order_by_number(orders, appt['OrderNumber'])
            
            if order and order.get('Pick up Status'):
                pickup_status = str(order['Pick up Status']).strip().lower()
                if pickup_status == 'fulfilled':
                    print(f"Removing appointment for order {appt['OrderNumber']} - already picked up")
                    needs_update = True
                    continue
            
            cleaned_appointments.append(appt)
        
        # Update if needed
        if needs_update:
            print(f"Updating appointments file: removed {len(appointments) - len(cleaned_appointments)} fulfilled orders")
            appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
            save_appointments_file(
                cleaned_appointments,
                appointments_file_path,
                ['OrderNumber', 'Appointment_Date', 'Appointment_Time', 'Customer_Email', 'Created_Time']
            )
        
        # Format response
        valid_appointments = [{
            'orderNumber': appt.get('OrderNumber', ''),
            'appointmentDate': appt.get('Appointment_Date', ''),
            'appointmentTime': appt.get('Appointment_Time', ''),
            'customerEmail': appt.get('Customer_Email', ''),
            'createdTime': appt.get('Created_Time', '')
        } for appt in cleaned_appointments]
        
        return jsonify({
            'success': True,
            'appointments': valid_appointments,
            'count': len(valid_appointments)
        })
        
    except Exception as e:
        print(f'Error fetching appointments: {e}')
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Server error while fetching appointments',
            'error': str(e)
        }), 500

# Admin Endpoint 2: Cancel Appointment
@app.route('/api/admin/appointments/<order_number>', methods=['DELETE'])
def cancel_appointment(order_number):
    try:
        if not order_number:
            return jsonify({
                'success': False,
                'message': 'Order number is required'
            }), 400
        
        # Fetch appointments
        try:
            appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
            appts_content = sharepoint_service.get_file_content(appointments_file_path)
            appointments = parse_appointments_file(appts_content, appointments_file_path)
        except:
            appointments = []
        
        # Find appointment
        cancelled_appt = None
        new_appointments = []
        
        for appt in appointments:
            if str(appt.get('OrderNumber', '')).strip() == str(order_number).strip():
                cancelled_appt = appt
            else:
                new_appointments.append(appt)
        
        if not cancelled_appt:
            return jsonify({
                'success': False,
                'message': 'Appointment not found'
            }), 404
        
        # Update file
        appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
        save_appointments_file(
            new_appointments,
            appointments_file_path,
            ['OrderNumber', 'Appointment_Date', 'Appointment_Time', 'Customer_Email', 'Created_Time']
        )
        
        # Send cancellation email
        customer_email = cancelled_appt.get('Customer_Email', '')
        if customer_email:
            try:
                # Reconstruct ISO datetime from date and time
                appt_date = cancelled_appt.get('Appointment_Date', '')
                appt_time = cancelled_appt.get('Appointment_Time', '')
                original_iso_time = combine_date_and_time_to_iso(appt_date, appt_time)
                
                email_result = email_service.send_cancellation_email(
                    order_number,
                    original_iso_time,
                    customer_email
                )
                
                if not email_result.get('success'):
                    print(f"Failed to send cancellation email: {email_result.get('message')}")
            except Exception as e:
                print(f"Error sending cancellation email: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Appointment cancelled successfully'
        })
        
    except Exception as e:
        print(f'Error cancelling appointment: {e}')
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Server error while cancelling appointment',
            'error': str(e)
        }), 500

# Admin Endpoint 3: Reschedule Appointment
@app.route('/api/admin/appointments/<order_number>', methods=['PUT'])
def reschedule_appointment(order_number):
    try:
        data = request.get_json()
        new_slot_time = data.get('newSlotTime')
        
        if not order_number or not new_slot_time:
            return jsonify({
                'success': False,
                'message': 'Order number and new slot time are required'
            }), 400
        
        # Fetch appointments
        try:
            appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
            appts_content = sharepoint_service.get_file_content(appointments_file_path)
            appointments = parse_appointments_file(appts_content, appointments_file_path)
        except:
            appointments = []
        
        # Find appointment
        appt_index = None
        for i, appt in enumerate(appointments):
            if str(appt.get('OrderNumber', '')).strip() == str(order_number).strip():
                appt_index = i
                break
        
        if appt_index is None:
            return jsonify({
                'success': False,
                'message': 'Appointment not found'
            }), 404
        
        # Check if new slot is available (excluding current appointment)
        other_appts = [a for i, a in enumerate(appointments) if i != appt_index]
        booked_slots = get_all_booked_slots(other_appts)
        
        if new_slot_time in booked_slots:
            return jsonify({
                'success': False,
                'message': 'The new time slot is not available'
            }), 409
        
        # Update appointment
        old_appointment = appointments[appt_index]
        customer_email = old_appointment.get('Customer_Email', '')
        
        appointments[appt_index] = {
            'OrderNumber': order_number,
            'Appointment_Date': format_date_for_excel(new_slot_time),
            'Appointment_Time': format_time_for_excel(new_slot_time),
            'Customer_Email': customer_email,
            'Created_Time': old_appointment.get('Created_Time', datetime.now().isoformat())
        }
        
        # Save file
        appointments_file_path = app.config.get('APPOINTMENTS_FILE_PATH')
        save_appointments_file(
            appointments,
            appointments_file_path,
            ['OrderNumber', 'Appointment_Date', 'Appointment_Time', 'Customer_Email', 'Created_Time']
        )
        
        # Send reschedule email
        if customer_email:
            try:
                # Reconstruct old ISO datetime from old appointment
                old_appt_date = old_appointment.get('Appointment_Date', '')
                old_appt_time = old_appointment.get('Appointment_Time', '')
                old_iso_time = combine_date_and_time_to_iso(old_appt_date, old_appt_time)
                
                email_result = email_service.send_reschedule_email(
                    order_number,
                    old_iso_time,
                    new_slot_time,
                    customer_email
                )
                
                if not email_result.get('success'):
                    print(f"Failed to send reschedule email: {email_result.get('message')}")
            except Exception as e:
                print(f"Error sending reschedule email: {e}")
        
        return jsonify({
            'success': True,
            'message': 'Appointment rescheduled successfully',
            'appointment': {
                'orderNumber': order_number,
                'appointmentDate': format_date_for_excel(new_slot_time),
                'appointmentTime': format_time_for_excel(new_slot_time)
            }
        })
        
    except Exception as e:
        print(f'Error rescheduling appointment: {e}')
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': 'Server error while rescheduling appointment',
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = app.config.get('PORT', 3000)
    print(f'Appointment system server running on port {port}')
    print(f'Health check: http://localhost:{port}/api/health')
    app.run(host='0.0.0.0', port=port, debug=False)

