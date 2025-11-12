Now i would like to develop an appointment system for the customer and staff to schedule a time to pick up orders.

Currently,  customers don't need a reservation to come pick up orders at Sunique. However, sometimes more than one customers come at the same time, and they need to wait, which cause the customers' insatisification. Therefore, im designing this web-based appointment system.

We have a online csv file records all the status of the orders, so the user would enter their order number, and then the system would check if the order's status is ready to pickup from my csv file(Columns include Order number, Status). And if it's ready, the user can then select the time slot on the calendar. The time slot would be every weekday/9AM to 5PM, each time slot would be 30 minutes. And when scheduled, it should also write back the scheduled time into the status csv file.

Goal
Design a responsive web-based appointment system that allows customers and staff to schedule pickup times for orders, preventing multiple customers from arriving at the same time.

Background
Currently at Sunique, customers can pick up orders without reservations. When several customers arrive simultaneously, this creates waiting time and dissatisfaction. To improve the process, we will build an online scheduling system integrated with our existing order-status CSV file.

Data Source
We have an online CSV file that stores order status.
Columns:

Order_Number

Status

Statuses include values such as “Ready to Pickup”.

Core Features to Plan & Implement

1. Order Validation

When a user enters an order number:

The system loads the online CSV file.

It searches for the row that matches Order_Number.

If status == “Ready to Pickup”, the customer can proceed to schedule.

Otherwise, show a message that the order is not yet ready.

2. Calendar & Time Slot System

Only weekdays (Mon–Fri).

Booking window: 9:00 AM – 5:00 PM.

Each time slot = 30 minutes.

Once a slot is booked by a customer, that time slot becomes unavailable for others.

3. Booking Confirmation

When user confirms the appointment:

The system writes the scheduled datetime back to the CSV.

A new column (Pickup_Time) may be created if not already present.

Append or update the row associated with Order_Number.


4. Technology & Integration (planning)

Plan how to handle:

Fetching the CSV remotely (URL / Sharepoint)

Locking time slots to prevent double-booking

Writing back updates safely

Basic UI workflow and state management

6. User Flow

Customer enters order number

System validates order status

Calendar displays available slots

Customer selects a slot

System saves selection to CSV

Confirmation screen shown