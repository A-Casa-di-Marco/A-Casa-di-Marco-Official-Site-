const CALENDAR_IDS = [
  '588a4f942fe35cbce8f772b0f7f8a222a0e6937a612caf9bcddc54acd20fa15e@group.calendar.google.com',
  '2ej5djp7hrd38ln3d5o999lneqlvo233@import.calendar.google.com',
  'oiu6r63i5qkfoptg487ard36jglc0s4d@import.calendar.google.com'
];

const TIMEZONE = 'Europe/Rome';

function doGet(e) {
  const callback = e && e.parameter && e.parameter.callback ? e.parameter.callback : 'handleAvailability';
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const end = new Date(today);
  end.setMonth(end.getMonth() + 24);

  const occupied = {};

  CALENDAR_IDS.forEach(function(calendarId) {
    const calendar = CalendarApp.getCalendarById(calendarId);
    if (!calendar) return;

    const events = calendar.getEvents(today, end);

    events.forEach(function(event) {
      const start = new Date(event.getStartTime());
      const finish = new Date(event.getEndTime());

      start.setHours(0, 0, 0, 0);
      finish.setHours(0, 0, 0, 0);

      if (finish <= start) {
        finish.setDate(start.getDate() + 1);
      }

      for (let d = new Date(start); d < finish; d.setDate(d.getDate() + 1)) {
        occupied[Utilities.formatDate(d, TIMEZONE, 'yyyy-MM-dd')] = true;
      }
    });
  });

  const data = {
    updatedAt: Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd'T'HH:mm:ss"),
    occupied: Object.keys(occupied).sort()
  };

  return ContentService
    .createTextOutput(callback + '(' + JSON.stringify(data) + ');')
    .setMimeType(ContentService.MimeType.JAVASCRIPT);
}