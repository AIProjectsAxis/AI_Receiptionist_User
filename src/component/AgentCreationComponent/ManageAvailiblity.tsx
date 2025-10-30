import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/component/common/Dialog";
import Button from "../common/Button";
import { Switch } from "../common/Switch";

import { Plus, Trash2, Clock, X } from "lucide-react";
import { Label } from "../common/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "../common/select";

type TimeSlot = {
    id: string;
    startTime: string;
    endTime: string;
};

type DayAvailability = {
    enabled: boolean;
    timeSlots: TimeSlot[];
};

type WeekAvailability = {
    [key: string]: DayAvailability;
};

type FormattedAvailability = {
    [key: string]: Array<{
        start_time: string;
        end_time: string;
    }>;
};

const ManageAvailability = ({
    isOpen,
    onClose,
    calendarId,
    onSave,
    initialAvailability
}: {
    isOpen: boolean;
    onClose: () => void;
    calendarId: string;
    onSave?: (availability: FormattedAvailability) => void;
    initialAvailability?: WeekAvailability;
}) => {
    const daysOfWeek = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    const timeOptions = [
        "12:00 AM", "12:30 AM", "1:00 AM", "1:30 AM", "2:00 AM", "2:30 AM",
        "3:00 AM", "3:30 AM", "4:00 AM", "4:30 AM", "5:00 AM", "5:30 AM",
        "6:00 AM", "6:30 AM", "7:00 AM", "7:30 AM", "8:00 AM", "8:30 AM",
        "9:00 AM", "9:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
        "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
        "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM",
        "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM",
        "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM", "11:00 PM", "11:30 PM"
    ];

    const getDefaultAvailability = (): WeekAvailability => {
        const defaultAvailability: WeekAvailability = {};
        daysOfWeek.forEach(day => {
            defaultAvailability[day] = {
                enabled: day !== "Saturday" && day !== "Sunday",
                timeSlots: day !== "Saturday" && day !== "Sunday" ? [
                    { id: `${day}-1`, startTime: "9:00 AM", endTime: "5:00 PM" }
                ] : []
            };
        });
        return defaultAvailability;
    };

    const [availability, setAvailability] = useState<WeekAvailability>(() =>
        initialAvailability || getDefaultAvailability()
    );

    const toggleDayEnabled = (day: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                enabled: !prev[day].enabled,
                timeSlots: !prev[day].enabled && prev[day].timeSlots.length === 0
                    ? [{ id: `${day}-${Date.now()}`, startTime: "9:00 AM", endTime: "5:00 PM" }]
                    : prev[day].timeSlots
            }
        }));
    };

    const addTimeSlot = (day: string) => {
        const existingSlots = availability[day].timeSlots;

        let newSlot = {
            id: `${day}-${Date.now()}`,
            startTime: "9:00 AM",
            endTime: "5:00 PM"
        };

        if (existingSlots.length > 0) {
            const timeToIndex = (time: string) => timeOptions.indexOf(time);

            const usedTimeRanges: [number, number][] = existingSlots.map(slot =>
                [timeToIndex(slot.startTime), timeToIndex(slot.endTime)]
            );

            for (let startIdx = 0; startIdx < timeOptions.length - 1; startIdx++) {
                for (let endIdx = startIdx + 1; endIdx < timeOptions.length; endIdx++) {

                    const isOverlapping = usedTimeRanges.some(([usedStart, usedEnd]) => {
                        return !(endIdx <= usedStart || startIdx >= usedEnd);
                    });

                    if (!isOverlapping) {
                        newSlot = {
                            id: `${day}-${Date.now()}`,
                            startTime: timeOptions[startIdx],
                            endTime: timeOptions[endIdx]
                        };
                        break;
                    }
                }

                if (newSlot.startTime !== "9:00 AM" || newSlot.endTime !== "5:00 PM") {
                    break;
                }
            }
        }

        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeSlots: [...prev[day].timeSlots, newSlot]
            }
        }));
    };

    const removeTimeSlot = (day: string, slotId: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeSlots: prev[day].timeSlots.filter(slot => slot.id !== slotId)
            }
        }));
    };

    const updateTimeSlot = (day: string, slotId: string, field: 'startTime' | 'endTime', value: string) => {
        setAvailability(prev => ({
            ...prev,
            [day]: {
                ...prev[day],
                timeSlots: prev[day].timeSlots.map(slot =>
                    slot.id === slotId ? { ...slot, [field]: value } : slot
                )
            }
        }));
    };

    const formatTimeForAPI = (timeString: string): string => {
        const [time, period] = timeString.split(' ');
        let [hours, minutes] = time.split(':').map(Number);

        if (period === 'PM' && hours !== 12) {
            hours += 12;
        } else if (period === 'AM' && hours === 12) {
            hours = 0;
        }

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    const formatAvailabilityForAPI = (): FormattedAvailability => {
        const formattedAvailability: FormattedAvailability = {};

        daysOfWeek.forEach(day => {
            const dayLowerCase = day.toLowerCase();

            if (availability[day].enabled && availability[day].timeSlots.length > 0) {
                formattedAvailability[dayLowerCase] = availability[day].timeSlots.map(slot => ({
                    start_time: formatTimeForAPI(slot.startTime),
                    end_time: formatTimeForAPI(slot.endTime)
                }));
            } else {
                formattedAvailability[dayLowerCase] = [];
            }
        });

        return formattedAvailability;
    };

    const saveAvailability = () => {
        const formattedAvailability = formatAvailabilityForAPI();

        if (onSave) {
            onSave(formattedAvailability);
        }

        if (onClose) {
            onClose();
        }
    };

    const isTimeDisabled = (day: string, time: string, currentSlotId: string, isStartTime: boolean) => {
        const timeIndex = timeOptions.indexOf(time);
        if (timeIndex === -1) return false;

        return availability[day].timeSlots.some(slot => {
            if (slot.id === currentSlotId) return false;

            const slotStartIndex = timeOptions.indexOf(slot.startTime);
            const slotEndIndex = timeOptions.indexOf(slot.endTime);

            if (isStartTime) {
                return timeIndex >= slotStartIndex && timeIndex < slotEndIndex;
            }
            else {
                return timeIndex > slotStartIndex && timeIndex <= slotEndIndex;
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl w-full max-h-[80vh] overflow-hidden !p-0 flex flex-col z-[10000]">
                <DialogHeader className="sticky top-0 p-4 z-10 bg-white pb-4 border-b">
                    <div className="flex items-center justify-between w-full">
                        <DialogTitle className="text-xl font-semibold text-gray-800 flex items-center">
                            <Clock className="mr-2 h-5 w-5 text-indigo-600" />
                            Manage Availability
                        </DialogTitle>
                        <div className="flex items-center gap-2">
                            
                            <Button
                                onClick={saveAvailability}
                                className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 mr-2"
                            >
                                Save Availability
                            </Button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="cursor-pointer !bg-red-500 px-3 py-1.5 rounded-md border-gray-200 text-white hover:bg-red-600 active:scale-105 transition-all duration-300"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>

                </DialogHeader>

                <div className="py-4 overflow-y-auto p-4">
                    <div className="space-y-6">
                        {daysOfWeek.map(day => (
                            <div key={day} className="border rounded-lg p-4 bg-white shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <Switch
                                            checked={availability[day].enabled}
                                            onCheckedChange={() => toggleDayEnabled(day)}
                                            className="mr-3 active:scale-105 transition-all duration-300 data-[state=unchecked]:bg-gray-200"
                                        />
                                        <h3 className={`font-medium text-lg ${availability[day].enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                                            {day}
                                        </h3>
                                    </div>

                                    {availability[day].enabled && (
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => addTimeSlot(day)}
                                            className="flex items-center text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add Time Slot
                                        </Button>
                                    )}
                                </div>

                                {availability[day].enabled && (
                                    <div className="space-y-3">
                                        {availability[day].timeSlots.length === 0 ? (
                                            <p className="text-gray-500 text-sm italic">No time slots added</p>
                                        ) : (
                                            availability[day].timeSlots.map((slot, index) => (
                                                <div key={slot.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-md">
                                                    <div className="flex-1 grid grid-cols-2 gap-4">
                                                        <div>
                                                            <Label htmlFor={`${slot.id}-start`} className="text-xs text-gray-500 mb-1 block">
                                                                Start Time
                                                            </Label>
                                                            <Select
                                                                value={slot.startTime}
                                                                onValueChange={(value: string) => updateTimeSlot(day, slot.id, 'startTime', value)}
                                                            >
                                                                <SelectTrigger id={`${slot.id}-start`} className="w-full">
                                                                    <SelectValue placeholder="Select start time" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white z-[1000000]">
                                                                    {timeOptions.map(time => (
                                                                        <SelectItem
                                                                            key={`start-${time}`}
                                                                            value={time}
                                                                            disabled={isTimeDisabled(day, time, slot.id, true)}
                                                                        >
                                                                            {time}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>

                                                        <div>
                                                            <Label htmlFor={`${slot.id}-end`} className="text-xs text-gray-500 mb-1 block">
                                                                End Time
                                                            </Label>
                                                            <Select
                                                                value={slot.endTime}
                                                                onValueChange={(value: string) => updateTimeSlot(day, slot.id, 'endTime', value)}
                                                            >
                                                                <SelectTrigger id={`${slot.id}-end`} className="w-full">
                                                                    <SelectValue placeholder="Select end time" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white z-[1000000]">
                                                                    {timeOptions.map(time => (
                                                                        <SelectItem
                                                                            key={`end-${time}`}
                                                                            value={time}

                                                                            disabled={isTimeDisabled(day, time, slot.id, false) ||
                                                                                timeOptions.indexOf(time) <= timeOptions.indexOf(slot.startTime)}
                                                                        >
                                                                            {time}
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeTimeSlot(day, slot.id)}
                                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ManageAvailability;