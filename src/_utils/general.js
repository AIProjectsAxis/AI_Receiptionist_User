import { DateTime } from 'luxon';
import { format } from 'date-fns';



export function formatDateTime(dateTimeStr, formatType = 'both') {
  const date = new Date(dateTimeStr);
  const now = new Date();

  // Helper function to format time with AM/PM
  const formatTime = (d) => {
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const amPm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12; // Convert 0 to 12 for 12-hour format
    return `${hours}:${minutes} ${amPm}`;
  };

  // Helper function to format date in 'DD-MMM YYYY' format
  const formatDate = (d) => {
    const day = d.getDate().toString().padStart(2, '0');
    const month = d.toLocaleString('default', { month: 'short' });
    const year = d.getFullYear();
    return `${day}-${month} ${year}`;
  };

  const today = new Date(now.setHours(0, 0, 0, 0));
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(today.getDate() - 2);

  if (formatType.toLowerCase() === 'time') {
    return formatTime(date);
  } else if (formatType.toLowerCase() === 'date') {
    return formatDate(date);
  } else { // Default case: 'both'
    if (date.toDateString() === today.toDateString()) {
      return `${formatTime(date)}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `${formatTime(date)} gestern`;
    } else if (date.toDateString() === dayBeforeYesterday.toDateString()) {
      return `${formatTime(date)} vorgestern`;
    } else {
      return `${formatDate(date)} ${formatTime(date)}`;
    }
  }
}


// export function convertToISO(dateString) {
//   // Create a Date object from the input string
//   const date = new Date(dateString);
//   date.setUTCHours(0, 0, 0, 0);
//   // Get the date in ISO format (UTC)
//   const isoDate = date.toISOString().split('T')[0];
//   const dateWithTime = `${isoDate}T00:00:00Z`;

//   return dateWithTime;
// }
// export function convertToISO(dateString, timeString) {
//   // Create a Date object from the input date string
//   const date = new Date(dateString);

//   if (timeString) {
//     // Split the time string (assuming it's in HH:MM format)
//     const [hours, minutes] = timeString.split(':');

//     // Set the time (hours and minutes) for the date object
//     date.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);

//     // Get the ISO string in UTC format
//     const isoDateTime = date.toISOString();

//     return isoDateTime;
//   } else {
//     // Get the ISO string in UTC format
//     const isoDateTime = date.toISOString();

//     return isoDateTime;
//   }

// }
export function convertToZuluFormat(dateString, timeString) {
  // Parse the date string
  const date = new Date(dateString);

  // Extract hours and minutes from the time string (format: HH:MM)
  const [hours, minutes] = timeString.split(':').map(Number);

  // Set the hours and minutes on the parsed date
  date.setHours(hours);
  date.setMinutes(minutes);

  // Convert the date to UTC (Zulu time)
  const zuluFormat = date.toISOString(); // Returns the date in ISO 8601 format (UTC)

  return zuluFormat;
}
export function convertToZuluFormatForCalander(dateString, timeString) {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

  const [hours, minutes] = timeString.split(':').map(Number);

  date.setUTCHours(hours, minutes, 0, 0);

  return date.toISOString();
}


export const getCurrentTime = (date) => {
  const hours = date?.getHours().toString().padStart(2, '0');
  const minutes = date?.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

export const getEndTime = (date) => {
  const endDate = new Date(date);
  endDate.setMinutes(endDate.getMinutes() + 30); // Add 30 minutes
  return getCurrentTime(endDate);
};

export function addMinutesToTime(time, minutesToAdd) {
  // Split the time string into hours and minutes
  let [hours, minutes] = time.split(':').map(Number);

  // Create a new Date object with today's date and the given time
  let date = new Date();
  date.setHours(hours, minutes);

  // Add the minutes to the date
  date.setMinutes(date.getMinutes() + minutesToAdd);

  // Format the result to HH:MM in 24-hour format
  let newHours = date.getHours().toString().padStart(2, '0');
  let newMinutes = date.getMinutes().toString().padStart(2, '0');

  return `${newHours}:${newMinutes}`;
}

export const getTimeFromDate=(isoString)=>{
    const date = new Date(isoString);
    const hours = String(date.getUTCHours()).padStart(2, '0'); // Get hours and pad with 0 if needed
    const minutes = String(date.getUTCMinutes()).padStart(2, '0'); // Get minutes and pad with 0 if needed
    return `${hours}:${minutes}`;
}


export function convertToBerlinTimezone(utcDateString) {
  const berlinTime = DateTime.fromISO(utcDateString, { zone: 'utc' }).setZone('Europe/Berlin');
  return berlinTime.toISO();
}
// export function convertToBerlinTimezone(utcDateString) {
//   const dateTime = DateTime.fromISO(utcDateString);
//   return dateTime.setZone('Europe/Berlin').toISO();
// }

export function formatDate(dateString) {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, "dd-MMM yyyy HH:mm");
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
}

export function formatCampaignDate(dateString) {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleString('default', { month: 'short' });
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}-${month} ${year} ${hours}:${minutes}`;
  } catch (error) {
    console.error('Error formatting campaign date:', error);
    return 'Invalid Date';
  }
}

export function formatBillingDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Invalid date';
    }
    
    return format(date, "dd-MMM yyyy HH:mm");
  } catch (error) {
    console.error('Error formatting billing date:', error);
    return 'Invalid date';
  }
}

export function convertUnixTimestamp(timestamp) {

  const date = new Date(timestamp * 1000); // Convert the Unix timestamp to a Date object

  const now = new Date();
  const diffInMilliseconds = now - date;
  
  const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
  
  // Check if the date is today
  if (diffInMilliseconds < oneDayInMilliseconds) {
    return `${("today")} ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`; // Show "Today" and the time
  }

  // Check if the date is yesterday
  if (diffInMilliseconds < 2 * oneDayInMilliseconds) {
    return `${("yesterday")} ${date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}`; // Show "Yesterday" and the time
  }

  // For any date older than yesterday, show the full formatted date and time
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,  // If you want to use 12-hour format (AM/PM)
  });
}


export function getInitials(name) {
  // Return AI for null, undefined, or empty string
  if (!name || typeof name !== 'string' || name=='undefined undefined') return "AI";

  // Clean the string and split
  const cleanName = name.trim();
  if (cleanName === '') return "AI";

  const nameParts = cleanName.split(" ");
  
  // Take only first two parts and map them to initials
  const initials = nameParts
    .slice(0, 2) // Only take first two parts
    .map(part => part.charAt(0).toUpperCase())
    .join("");

  return initials || "AI"; // Return AI if initials is empty string
}


export function convertToUTC(date) {
  if (!date) return null;
  
  try {
    // Convert input to Date object
    const dateObj = date instanceof Date ? date : new Date(date);
    
    // Check for invalid date
    if (isNaN(dateObj.getTime())) {
      return null;
    }
    
    // Convert to UTC string format with 'Z'
    return dateObj.toISOString().replace(/\.\d{3}Z$/, "Z"); // Removing milliseconds
  } catch (error) {
    console.error("Error converting date to UTC:", error);
    return null;
  }
}

// Format duration in minutes:seconds
export const formatDuration = (ms) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

// Format date for API
export const formatDateForAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Get timezone offset in format +05:30 or -05:30
  const offset = date.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60));
  const offsetMinutes = Math.abs(offset % 60);
  const offsetSign = offset <= 0 ? '+' : '-';
  const offsetStr = `${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;
  
  // URL encode the + to %2B
  const encodedOffset = offsetStr.replace('+', '%2B');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${encodedOffset}`;
};