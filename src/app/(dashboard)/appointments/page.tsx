"use client";
export const runtime = 'edge';

import React, { useState, useEffect, useRef } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import Card from '@/component/common/Card';
import Button from '@/component/common/Button';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/component/common/Dialog';
import { Label } from '@/component/ui/label';
import { getCalendarEventsApiRequest, getCalendarListApiRequest } from '@/network/api';
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from '@/component/common/select';
import { formatDateForAPI } from '@/_utils/general';
import Link from 'next/link';

const localizer = momentLocalizer(require('moment'));

interface Booking {
  id: string;
  event_id: string;
  calendar_id: string;
  company_id: string;
  assistant_id: string;
  email: string;
  name: string;
  phone_number: string;
  start_time: string;
  end_time: string;
  summary: string;
  location: string;
  description: string;
  created_at: string;
  updated_at: string;
  status: string;
  metadata: {
    phone_number: string;
    email_address: string;
    first_name: string;
    last_name: string;
    reason_for_visit?: string;
  };
  reschedule_history: any;
}

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description: string;
  location: string;
  email: string;
  phone: string;
  name: string;
  status: string;
  summary: string;
  metadata?: {
    phone_number: string;
    email_address: string;
    first_name: string;
    last_name: string;
    reason_for_visit?: string;
  };
  created_at?: string;
  updated_at?: string;
  reschedule_history?: any;
}

const Appointments: React.FC = () => {
  const singleTimeReload = useRef(true);
  const [appointments, setAppointments] = useState<CalendarEvent[]>([]);
  const [viewCalendarList, setViewCalendarList] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<CalendarEvent | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<View>('month');
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string>('');



  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
    } else if (view === 'week') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
    } else if (view === 'day') {
      newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
    }
    handleCalendarChange(newDate, view);
  };

  const goToToday = () => {
    handleCalendarChange(new Date(), view);
  };

  const openAppointment = (appointment: CalendarEvent) => {
    setSelectedAppointment(appointment);
    setIsViewModalOpen(true);
  };

  const closeAppointment = () => {
    setSelectedAppointment(null);
    setIsViewModalOpen(false);
  };

  const fetchAppointments = async () => {
    const response = await getCalendarListApiRequest();
    if (response?.data) {
      setViewCalendarList(response?.data?.calendars);

      // Set the first calendar as default if available
      if (response?.data?.calendars) {
        const firstCalendar = response.data.calendars[0];
        setSelectedCalendarId(firstCalendar.id);

        // Fetch data for the first calendar
        const { start, end } = getDateRangeForView(currentDate, view);
        fetchCalendarDataById(firstCalendar.id, start, end);
      }
    }
  };

  const fetchCalendarDataById = async (Id: string, startDate: Date, endDate: Date) => {

    const startDateStr = formatDateForAPI(startDate);
    const endDateStr = formatDateForAPI(endDate);
    console.log("startDateStr----", 123456);

    try {
      const response = await getCalendarEventsApiRequest(Id, startDateStr, endDateStr);
      console.log("response fetchCalendarDataById----", response.data.bookings);
      if (response?.data?.bookings) {
        const formattedEvents = response.data.bookings.map((booking: Booking) => ({
          id: booking.id,
          title: booking.summary,
          summary: booking.summary,
          start: new Date(booking.start_time),
          end: new Date(booking.end_time),
          description: booking.description,
          location: booking.location,
          email: booking.email || booking.metadata?.email_address || '',
          phone: booking.phone_number,
          name: booking.name,
          status: booking.status,
          metadata: booking.metadata,
          created_at: booking.created_at,
          updated_at: booking.updated_at,
          reschedule_history: booking.reschedule_history
        }));
        setAppointments(formattedEvents);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
    }
  };

  const getDateRangeForView = (date: Date, view: View) => {
    const start = new Date(date);
    const end = new Date(date);

    switch (view) {
      case 'month':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'week':
        const day = start.getDay();
        start.setDate(start.getDate() - day);
        end.setDate(start.getDate() + 6);
        break;
      case 'day':
        end.setDate(start.getDate() + 1);
        break;
      default:
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
    }

    return { start, end };
  };

  const handleCalendarChange = (date: Date, view: View) => {
    setCurrentDate(date);
    setView(view);

    if (selectedCalendarId) {
      const { start, end } = getDateRangeForView(date, view);
      fetchCalendarDataById(selectedCalendarId, start, end);
    }
  };

  const handleCalendarSelect = (calendarId: string) => {
    setSelectedCalendarId(calendarId);
    const { start, end } = getDateRangeForView(currentDate, view);
    fetchCalendarDataById(calendarId, start, end);
  };

  useEffect(() => {
    if (singleTimeReload.current) {
      fetchAppointments();
      singleTimeReload.current = false;
    }
  }, []);

  return (
    <div className='pt-5'>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendar</h1>
          <p className="text-base md:text-lg text-gray-500 mt-1">Manage your schedule with Calendar</p>
        </div>
        {
          viewCalendarList?.length > 0 && (
            <div className="mt-4 md:mt-0 flex gap-4">
              <Link
                href={`integrations/synced-calendars`}
                className="flex items-center border border-gray-200 rounded-md px-4 py-2 bg-blue-500 text-white"
              >
                <CalendarIcon className="w-4 h-4 mr-2" />
                Connect Calendar
              </Link>
            </div>
          )
        }
      </div>
      {
        viewCalendarList?.length === 0 && (
          <Card className='pb-14 !max-w-full relative h-40 flex items-center justify-center   bg-white shadow-lg rounded-lg overflow-hidden'>
            <div className="mt-4 md:mt-0 flex justify-center gap-4">
              <Link
                href={`integrations/synced-calendars`}
                className="flex items-center border border-gray-200 rounded-md px-4 py-2 bg-blue-500 text-white"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="mr-2">
                  <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
                </svg>
                Connect Google Calendar
              </Link>
            </div>
          </Card>
        )
      }

      {
        viewCalendarList?.length > 0 && (
          <Card className=" pb-14 !max-w-full relative bg-white shadow-lg rounded-lg overflow-hidden">
            <div className="py-4 border-b flex items-center justify-between bg-white">
              <div className="space-y-2 w-1/2">
                <p className='text-sm text-gray-500'>Select Calendar</p>
                <Select onValueChange={handleCalendarSelect} value={selectedCalendarId}>
                  <SelectTrigger className='bg-white w-full max-w-[300px]'>
                    <SelectValue placeholder="Select Calendar" />
                  </SelectTrigger>
                  <SelectContent className='max-h-[200px] overflow-y-auto bg-white'>
                    {viewCalendarList?.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-lg font-medium">
                  {currentDate.toLocaleDateString('en-US', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  })}
                </span>
                <div className="flex space-x-1">
                  <Button
                    variant="ghost"
                    className="bg-indigo-100 hover:bg-indigo-200"
                    onClick={() => navigateWeek('prev')}
                  >
                    <ChevronLeft className="w-4 h-4 text-indigo-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    className="bg-indigo-100 hover:bg-indigo-200"
                    onClick={() => navigateWeek('next')}
                  >
                    <ChevronRight className="w-4 h-4 text-indigo-600" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div style={{ height: 600 }}>
                <Calendar
                  localizer={localizer}
                  events={appointments}
                  startAccessor="start"
                  endAccessor="end"
                  titleAccessor="title"
                  style={{ height: 600 }}
                  views={['month', 'week', 'day', 'agenda']}
                  step={30}
                  date={currentDate}
                  view={view}
                  onView={(newView: View) => handleCalendarChange(currentDate, newView)}
                  onNavigate={(date: Date) => handleCalendarChange(date, view)}
                  onSelectEvent={openAppointment}
                  eventPropGetter={(event: any) => ({
                    style: {
                      // backgroundColor: '#4f46e5',
                      color: '#fff',
                      padding: '5px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      textAlign: 'center',
                      ...(event.status === "confirmed" || event.status === "booked" ? { backgroundColor: '#4f46e5' } : { backgroundColor: '#8583CC' })

                    }
                  })}
                />
              </div>
            </div>
          </Card>)
      }

      {/* View Appointment Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>

            <DialogTitle className="text-xl font-semibold flex items-center justify-between">
              <span className="text-gray-900">{selectedAppointment?.name}</span>
              <div className="mt-1">
                {selectedAppointment?.status && (
                  <span
                    className={`
                        text-xs font-semibold rounded-full px-3 py-1
                        ${selectedAppointment.status === "confirmed" || selectedAppointment.status === "booked"
                        ? "bg-green-100 text-green-700"
                        : selectedAppointment.status === "reschedule" || selectedAppointment.status === "rescheduled"
                          ? "bg-yellow-100 text-yellow-700"
                          : selectedAppointment.status === "canceled" || selectedAppointment.status === "cancelled"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-200 text-gray-700"
                      }
                      `}
                  >
                    {selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}
                  </span>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-gray-600">{selectedAppointment?.description}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Email</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedAppointment?.email || 'Not provided'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Phone Number</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedAppointment?.phone}</p>
              </div>
            </div>

            {/* Summary */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Summary</Label>
              <p className="text-sm text-gray-900 mt-1">{selectedAppointment?.summary}</p>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Description</Label>
              <p className="text-sm text-gray-900 mt-1">{selectedAppointment?.description}</p>
            </div>

            {/* Appointment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Location</Label>
                <p className="text-sm text-gray-900 mt-1">{selectedAppointment?.location}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Reason for Visit</Label>
                <p className="text-sm text-gray-900 mt-1">
                  {selectedAppointment?.metadata?.reason_for_visit || 'Not specified'}
                </p>
              </div>
            </div>

            {/* Time Information */}
            <div>
              <Label className="text-sm font-medium text-gray-700">Appointment Time</Label>
              <div className="mt-1 space-y-1">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">Start:</span> {selectedAppointment?.start?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-900">
                  <span className="font-medium">End:</span> {selectedAppointment?.end?.toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Duration:</span> {
                    selectedAppointment?.start && selectedAppointment?.end
                      ? `${Math.round((selectedAppointment.end.getTime() - selectedAppointment.start.getTime()) / (1000 * 60))} minutes`
                      : 'N/A'
                  }
                </p>
              </div>
            </div>

            {/* Metadata Information */}




            {/* Reschedule History */}
            {selectedAppointment?.reschedule_history && (
              <div>
                <Label className="text-sm font-medium text-gray-700">Reschedule History</Label>
                <div className="mt-1">
                  <p className="text-sm text-gray-600">
                    {selectedAppointment.reschedule_history ? 'Has been rescheduled' : 'No reschedule history'}
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-4 border-t">
              <Button variant="outline" onClick={closeAppointment}>Close</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Appointments;