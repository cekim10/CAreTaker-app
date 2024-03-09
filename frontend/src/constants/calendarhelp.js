// addToIosCalendar.js
import { Linking } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import CalendarEvents from 'react-native-calendar-events';
import moment from 'moment';

export const addToIosCalendar = async (
 title,
 startDate,
 endDate,
 location,
 url
) => {
   // iOS: Requires # of seconds from January 1 2001 of the date you want to open calendar on
   const referenceDate = moment.utc('2001-01-01');
   const secondsSinceRefDateiOS = startDate - referenceDate.unix();
     try {
        await CalendarEvents.requestPermissions(false);
        await CalendarEvents.checkPermissions(true);
        await CalendarEvents.saveEvent(title, {
             startDate: startDate.toISOString(),
             endDate: endDate.toISOString(),
             location: location,
             notes: title,
             url: url,
             alarms: [
                  {date: startDate.toISOString() - 6000},
               ],
      });
    Linking.openURL(`calshow:${secondsSinceRefDateiOS}`);
   } catch (error) {
      showMessage("calendarIosFail");
      return null;
   }
};
