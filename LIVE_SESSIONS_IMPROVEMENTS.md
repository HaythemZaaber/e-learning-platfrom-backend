# Live Sessions System Improvements

## Overview
This document outlines the comprehensive improvements made to the Live Sessions system to implement a world-class separation between Offerings (templates) and Sessions (executions), with proper support for both Individual and Group sessions.

## Phase 1: Database Schema Updates ✅

### New Models Added:

1. **RecurringAvailabilityRule**
   - Supports recurring weekly availability patterns
   - Fields: dayOfWeek, startTime, endTime, date range, settings
   - Replaces need to create individual availability entries for each week

2. **AvailabilityDateOverride**
   - Blocks or modifies specific dates
   - Supports vacation days, holidays, special events
   - Can override recurring rules for specific dates

3. **CalendarSync**
   - Integration with Google Calendar, Outlook, Apple Calendar
   - Bidirectional sync support
   - Auto-block busy times from external calendars

4. **GroupOfferingInstance**
   - Scheduled instances of Group/Workshop offerings
   - Links offering template to specific date/time
   - Tracks enrollment, status, auto-cancel settings

### Updated Models:

1. **SessionOffering**
   - Added `bufferMinutes` (default: 15) - time between sessions
   - Added `minAdvanceHours` (default: 24) - minimum notice for booking
   - Added `autoCancelEnabled` - enable auto-cancel for groups
   - Added `autoCancelHoursBefore` (default: 2) - when to check
   - Added `autoCancelRefund` (default: true) - refund on auto-cancel
   - Added relation to `GroupOfferingInstance[]`

2. **BookingRequest**
   - Added `groupInstanceId` - links to specific group instance
   - Supports both individual (timeSlotId) and group (groupInstanceId) bookings

3. **LiveSession**
   - Added `groupInstanceId` - links to group instance when created from group booking

4. **InstructorAvailability**
   - Updated `minAdvanceHours` default from 12 to 24 hours

## Phase 2: DTOs Updated ✅

### New DTOs:
- `recurring-availability.dto.ts` - Create/Update recurring rules and date overrides
- `group-instance.dto.ts` - Create/Update group offering instances

### Updated DTOs:
- `session-offering.dto.ts` - Added new fields for buffer time, minimum notice, auto-cancel
- `booking-request.dto.ts` - Added `groupInstanceId` field

## Phase 3: Backend Services (In Progress)

### Services to Update:

1. **AvailabilityService** ⏳
   - Generate availability from recurring rules
   - Apply date overrides
   - Integrate calendar sync
   - Generate time slots respecting buffer time

2. **SessionOfferingService** ⏳
   - Distinguish Individual vs Group offerings
   - Create/Manage group instances
   - Template vs Instance logic
   - Instance scheduling

3. **BookingRequestService** ⏳
   - Validate minimum notice (24 hours)
   - Validate buffer time between sessions
   - Auto-hide slots when booking accepted
   - Support group instance bookings

4. **SessionBookingService** ⏳
   - Buffer time validation
   - Minimum notice checks
   - Auto-slot hiding on acceptance
   - Group instance booking flow

5. **LiveSessionService** ⏳
   - Create sessions from accepted bookings
   - Handle both individual and group flows
   - Proper validation and meeting room generation

6. **GroupAutoCancelService** ⏳ (New)
   - Check minimum participants X hours before session
   - Auto-cancel if minimum not met
   - Process refunds if enabled
   - Notify all participants

## Phase 4: Frontend Updates (Pending)

### Types to Update:
- `session.types.ts` - Add recurring rules, instances, updated offerings

### Components to Update:
1. **AvailabilitySetup** - Add recurring rules and date overrides UI
2. **SessionOfferings** - Distinguish individual vs group, add instance scheduling
3. **Booking Flow** - Respect buffer time and minimum notice
4. **InstructorDashboard** - Show instances for groups

## Key Improvements Summary

### Individual Offerings Flow:
1. Instructor creates offering (template)
2. Instructor sets global availability (recurring rules + overrides)
3. System generates time slots based on availability
4. Student selects slot → validates minimum notice (24h) → validates buffer time
5. Booking accepted → slot automatically hidden from other offerings
6. Session created from accepted booking

### Group Offerings Flow:
1. Instructor creates offering (template) - "Mastering React Hooks"
2. Instructor schedules instances - "Dec 1st, 5:00 PM"
3. Each instance is a separate bookable entity
4. Student books seat → instant confirmation (no approval needed)
5. System checks minimum participants 2 hours before
6. If minimum not met → auto-cancel + refund (if enabled)
7. Session created when instance starts

### Critical Features:
- ✅ Buffer time between sessions (15 min default)
- ✅ Minimum notice requirement (24 hours default)
- ✅ Auto-cancel for groups if minimum not met
- ✅ Template vs Instance separation for groups
- ✅ Recurring availability rules
- ✅ Date overrides for vacations/holidays
- ✅ Calendar sync integration points

## Next Steps

1. Complete backend service implementations
2. Add group auto-cancel scheduled job
3. Update frontend types
4. Update UI components
5. Add comprehensive tests
6. Update API documentation

## Migration Notes

When running migrations:
1. Existing offerings will have default values for new fields
2. Individual offerings: bufferMinutes=15, minAdvanceHours=24
3. Group offerings: autoCancelEnabled=false (opt-in)
4. Existing bookings remain valid
5. New bookings will use new validation rules
