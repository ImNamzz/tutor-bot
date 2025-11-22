import { ClassEvent, DeadlineEvent, CustomEvent } from '@/app/calendar/types/schedule';

/**
 * Escapes special characters in ICS format
 */
function escapeIcsText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

/**
 * Formats a date to ICS format (YYYYMMDDTHHMMSSZ for UTC or YYYYMMDD for all-day)
 */
function formatIcsDate(date: Date, isAllDay: boolean = false): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  if (isAllDay) {
    return `${year}${month}${day}`;
  }
  
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generates a unique ID for ICS events
 */
function generateUid(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@tutorbot.local`;
}

/**
 * Creates an ICS event string for a class event
 */
function createClassEventIcs(event: ClassEvent): string {
  const uid = generateUid();
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let dtstart = '';
  let dtend = '';
  let rrule = '';
  
  if (event.type === 'one-time' && event.date) {
    // Parse time from string (format: "HH:MM AM/PM" or "HH:MM")
    let startDate = new Date(event.date);
    let endDate = new Date(event.date);
    
    if (event.time) {
      const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const meridiem = timeMatch[3]?.toUpperCase();
        
        if (meridiem === 'PM' && hours !== 12) {
          hours += 12;
        } else if (meridiem === 'AM' && hours === 12) {
          hours = 0;
        }
        
        startDate.setHours(hours, minutes, 0, 0);
        endDate.setHours(hours + 1, minutes, 0, 0); // 1 hour duration
      }
    }
    
    dtstart = formatIcsDate(startDate);
    dtend = formatIcsDate(endDate);
  } else if (event.type === 'recurring' && event.recurringDay !== undefined) {
    // Set to next occurrence
    const today = new Date();
    const daysUntil = (event.recurringDay - today.getDay() + 7) % 7;
    const nextOccurrence = new Date(today);
    nextOccurrence.setDate(today.getDate() + (daysUntil === 0 ? 7 : daysUntil));
    
    if (event.time) {
      const timeMatch = event.time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
      if (timeMatch) {
        let hours = parseInt(timeMatch[1]);
        const minutes = parseInt(timeMatch[2]);
        const meridiem = timeMatch[3]?.toUpperCase();
        
        if (meridiem === 'PM' && hours !== 12) {
          hours += 12;
        } else if (meridiem === 'AM' && hours === 12) {
          hours = 0;
        }
        
        nextOccurrence.setHours(hours, minutes, 0, 0);
      }
    }
    
    dtstart = formatIcsDate(nextOccurrence);
    dtend = formatIcsDate(new Date(nextOccurrence.getTime() + 3600000));
    
    // RRULE for weekly recurrence
    const daysOfWeek = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];
    rrule = `RRULE:FREQ=WEEKLY;BYDAY=${daysOfWeek[event.recurringDay]}`;
  }
  
  let location = '';
  if (event.location) {
    location = `\nLOCATION:${escapeIcsText(event.location)}`;
  }
  
  return `BEGIN:VEVENT
UID:${uid}
DTSTART:${dtstart}
DTEND:${dtend}
${rrule ? rrule + '\n' : ''}CREATED:${now}
LAST-MODIFIED:${now}
SUMMARY:${escapeIcsText(event.course)}
DESCRIPTION:Class${location ? ` at ${event.location}` : ''}
CATEGORIES:Class
END:VEVENT`;
}

/**
 * Creates an ICS event string for a deadline event
 */
function createDeadlineEventIcs(event: DeadlineEvent): string {
  const uid = generateUid();
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Set event 24 hours before deadline
  const alarmDate = new Date(event.dateTime.getTime() - 24 * 60 * 60 * 1000);
  
  const dtstart = formatIcsDate(event.dateTime);
  
  return `BEGIN:VEVENT
UID:${uid}
DTSTART:${dtstart}
CREATED:${now}
LAST-MODIFIED:${now}
SUMMARY:${escapeIcsText(event.name)}
DESCRIPTION:Deadline - Priority: ${event.priority}
CATEGORIES:Deadline,${event.priority}
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapeIcsText(event.name)} is due tomorrow
END:VALARM
END:VEVENT`;
}

/**
 * Creates an ICS event string for a custom event
 */
function createCustomEventIcs(event: CustomEvent): string {
  const uid = generateUid();
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  const dtstart = formatIcsDate(event.dateTime);
  // Default 1 hour duration
  const endTime = new Date(event.dateTime.getTime() + 60 * 60 * 1000);
  const dtend = formatIcsDate(endTime);
  
  let location = '';
  if (event.location) {
    location = `\nLOCATION:${escapeIcsText(event.location)}`;
  }
  
  return `BEGIN:VEVENT
UID:${uid}
DTSTART:${dtstart}
DTEND:${dtend}
CREATED:${now}
LAST-MODIFIED:${now}
SUMMARY:${escapeIcsText(event.name)}
DESCRIPTION:Custom Event${event.time ? ` at ${event.time}` : ''}${event.location ? ` - ${event.location}` : ''}
CATEGORIES:Event${location}
END:VEVENT`;
}

/**
 * Generates a complete ICS calendar file
 */
export function generateIcsCalendar(
  classes: ClassEvent[],
  deadlines: DeadlineEvent[],
  events: CustomEvent[],
  calendarName: string = 'TutorBot Calendar'
): string {
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  let eventsString = '';
  
  // Add class events
  for (const classEvent of classes) {
    eventsString += createClassEventIcs(classEvent) + '\n';
  }
  
  // Add deadline events
  for (const deadline of deadlines) {
    eventsString += createDeadlineEventIcs(deadline) + '\n';
  }
  
  // Add custom events
  for (const event of events) {
    eventsString += createCustomEventIcs(event) + '\n';
  }
  
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//TutorBot//Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:${escapeIcsText(calendarName)}
X-WR-TIMEZONE:UTC
X-WR-CALDESC:Calendar exported from TutorBot
CREATED:${now}
LAST-MODIFIED:${now}
${eventsString}END:VCALENDAR`;

  return icsContent;
}

/**
 * Exports calendar to ICS file and triggers download
 */
export function exportCalendarToIcs(
  classes: ClassEvent[],
  deadlines: DeadlineEvent[],
  events: CustomEvent[],
  fileName: string = 'tutorbot-calendar.ics'
): void {
  const icsContent = generateIcsCalendar(classes, deadlines, events);
  
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Gets ICS content as string (useful for sharing or copying to clipboard)
 */
export function getIcsContent(
  classes: ClassEvent[],
  deadlines: DeadlineEvent[],
  events: CustomEvent[]
): string {
  return generateIcsCalendar(classes, deadlines, events);
}
