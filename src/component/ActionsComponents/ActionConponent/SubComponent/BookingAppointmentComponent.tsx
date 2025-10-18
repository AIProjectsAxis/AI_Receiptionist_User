import React, { useState, useEffect } from 'react'
import { FaUserAlt } from 'react-icons/fa';
import { createActionApiRequest, getActionByIdApiRequest, updateActionApiRequest } from '@/network/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';

type Props = {
  isEdit: boolean;
  setViewEditActionId: (value: string) => void;
  setShowBookingAppointmentForm: (value: boolean) => void;
  getAllActionList: () => void;
  setShowSubActions: (value: boolean) => void;
  viewEditActionId: string;
  folderList: any[];
}

const BookingAppointmentComponent = ({
  isEdit,
  setViewEditActionId,
  setShowBookingAppointmentForm,
  getAllActionList,
  setShowSubActions,
  viewEditActionId,
  folderList
}: Props) => {
  const router = useRouter()
  const [nameBookingAppointment, setNameBookingAppointment] = useState("")
  const [editActionData, setEditActionData] = useState<any>(null)
  const [showComponent, setShowComponent] = useState(false)
  const [btnLoader, setBtnLoader] = useState(false)
  const [emailSelected, setEmailSelected] = useState(false);
  const [firstNameSelected, setFirstNameSelected] = useState(false);
  const [lastNameSelected, setLastNameSelected] = useState(false);
  const [phoneNumberSelected, setPhoneNumberSelected] = useState(false);
  console.log("folderList---", folderList)

  // Error state for required field
  const [nameError, setNameError] = useState<string | null>(null);

  // New: Track if user has touched the name field
  const [nameTouched, setNameTouched] = useState(false);

  // Global variables selection state
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isEdit && editActionData?.name) {
      setNameBookingAppointment(editActionData.name)

      // Set button states based on available properties
      if (editActionData?.function?.parameters?.properties) {
        const properties = editActionData.function.parameters.properties;
        setEmailSelected(!!properties.email);
        setFirstNameSelected(!!properties.first_name);
        setLastNameSelected(!!properties.last_name);
        setPhoneNumberSelected(!!properties.phone_number);
      }
    }
  }, [isEdit, editActionData])

  // Handle folder selection
  const handleFolderSelect = (folder: any) => {
    // If clicking on the same folder, do nothing (already selected)
    if (selectedFolder?.id === folder.id) {
      return;
    }
    
    // If clicking on a different folder, switch to it
    setSelectedFolder(folder);
    setSelectedProperties(new Set()); // Reset selected properties when switching folders
  };

  // Handle folder expand/collapse
  const toggleFolderExpansion = (folderId: string) => {
    const newExpandedFolders = new Set(expandedFolders);
    if (newExpandedFolders.has(folderId)) {
      newExpandedFolders.delete(folderId);
    } else {
      newExpandedFolders.add(folderId);
    }
    setExpandedFolders(newExpandedFolders);
  };

  // Handle property selection
  const toggleProperty = (propertyName: string) => {
    const newSelectedProperties = new Set(selectedProperties);
    if (newSelectedProperties.has(propertyName)) {
      newSelectedProperties.delete(propertyName);
    } else {
      newSelectedProperties.add(propertyName);
    }
    setSelectedProperties(newSelectedProperties);
  };

  // Handle removing a variable
  const removeVariable = (propertyName: string) => {
    const newSelectedProperties = new Set(selectedProperties);
    newSelectedProperties.delete(propertyName);
    setSelectedProperties(newSelectedProperties);
  };





  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validate required fields
    if (!nameBookingAppointment.trim()) {
      setNameError("Name is required");
      setNameTouched(true);
      return;
    }

    if (!selectedFolder) {
      toast.error("Please select a variable group" , {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    if (selectedProperties.size === 0) {
      toast.error("Please select at least one property from the variable group" , {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      return;
    }

    setBtnLoader(true)
    try {
      // Build properties object dynamically based on selected global variables
      const properties: any = {
        "start_time": {
          "type": "string",
          "description": "Start time in ISO 8601 format including the assistant's local time zone. Do NOT use UTC unless that's the assistant's zone.\n\nExamples:\n- For IST (India Standard Time): 2025-05-26T14:30:00+05:30\n- For Toronto (Eastern Time): 2025-05-26T09:00:00-04:00"
        },
        "calendar_id": {
          "type": "string",
          "description": "Unique identifier for the calendar where the appointment will be scheduled."
        },
        "end_time": {
          "type": "string",
          "description": "End time in ISO 8601 format including the assistant's local time zone. Do NOT use UTC unless that's the assistant's zone.\n\nExamples:\n- For IST: 2025-05-26T15:00:00+05:30\n- For Toronto: 2025-05-26T09:30:00-04:00"
        }
      };

      // Add selected global variables to properties
      if (selectedFolder && selectedProperties.size > 0) {
        selectedProperties.forEach(propertyName => {
          if (selectedFolder.properties[propertyName]) {
            properties[propertyName] = selectedFolder.properties[propertyName];
          }
        });
      }

      // Build required array dynamically based on selected global variables
      const required = ["start_time", "end_time", "calendar_id"];

      // Add selected properties to required array
      if (selectedProperties.size > 0) {
        selectedProperties.forEach(propertyName => {
          required.push(propertyName);
        });
      }

      const payload = {
        "type": "function",
        "name": nameBookingAppointment,
        "async_": null,
        "folder_id": selectedFolder?.id,
        "messages": [
          {
            "contents": null,
            "content": "Alright, I'm booking your appointment",
            "conditions": null,
            "type": "request-start",
            "blocking": true
          },
          {
            "contents": null,
            "content": "Sorry, we couldn't find book your appointment ",
            "conditions": null,
            "type": "request-failed",
            "end_call_after_spoken_enabled": true
          }
        ],
        "function": {
          "name": "calendar_booking_appointment",
          "description": "Use this function for booking in a calendar system. Ensure that start_time and end_time include time zone (in ISO 8601 format). All required fields must be provided when calling this function to avoid errors.",
          "parameters": {
            "type": "object",
            "properties": properties,
            "required": required
          },
          "strict": false
        },
        "server": {
          "url": "https://xeads-voice-assistant-922834411130.asia-south2.run.app/actionCall/calendar/booking",
          "timeout_seconds": null,
          "secret": null,
          "headers": null,
          "backoff_plan": null
        },
        "destinations": null,
        "knowledge_bases": null,
        "function_type": "booking_appointment",
        "notification": null,
        "async": false
      }
      if (viewEditActionId) {
        await updateActionApiRequest(viewEditActionId, payload,)
        toast.success("Booking appointment updated successfully")
      }
      if (!viewEditActionId) {
        await createActionApiRequest(payload)
        setShowBookingAppointmentForm(false)
        getAllActionList()
        setShowSubActions(false)
        setNameBookingAppointment("")
        setEmailSelected(false)
        setFirstNameSelected(false)
        setLastNameSelected(false)
        setPhoneNumberSelected(false)
      }

    } catch (error) {
      console.log(error);
    } finally {
      setShowBookingAppointmentForm(false)
      getAllActionList()
      setShowSubActions(false)
      setBtnLoader(false)
      setNameBookingAppointment("")
      setEmailSelected(false)
      setFirstNameSelected(false)
      setLastNameSelected(false)
      setPhoneNumberSelected(false)
    }
  }

  const handleClose = () => {
    setShowBookingAppointmentForm(false);
    setViewEditActionId("");
    setNameBookingAppointment("");
    setEmailSelected(false);
    setFirstNameSelected(false);
    setLastNameSelected(false);
    setPhoneNumberSelected(false);
    setNameError(null);
    setSelectedFolder(null);
    setSelectedProperties(new Set());
  };

  const getActionById = async () => {
    try {
      const response = await getActionByIdApiRequest(viewEditActionId as string)
      console.log("response---", response?.data?.action)
      setEditActionData(response?.data?.action)
      setNameBookingAppointment(response?.data?.action?.name)

      // For backward compatibility, still set the old button states
      setEmailSelected(!!response?.data?.action?.function?.parameters?.properties?.email)
      setFirstNameSelected(!!response?.data?.action?.function?.parameters?.properties?.first_name)
      setLastNameSelected(!!response?.data?.action?.function?.parameters?.properties?.last_name)
      setPhoneNumberSelected(!!response?.data?.action?.function?.parameters?.properties?.phone_number)
      setSelectedFolder(response?.data?.action?.folder_id)

      // Map existing properties to selected properties for editing
      const existingProperties = response?.data?.action?.function?.parameters?.properties || {};
      const existingPropertyNames = Object.keys(existingProperties).filter(key =>
        !['start_time', 'end_time', 'calendar_id'].includes(key)
      );

      // Find the folder that contains these properties (for editing mode)
      const matchingFolder = folderList.find(folder => {
        const folderProperties = Object.keys(folder.properties || {});
        return existingPropertyNames.every(prop => folderProperties.includes(prop));
      });

      if (matchingFolder) {
        setSelectedFolder(matchingFolder);
        setSelectedProperties(new Set(existingPropertyNames));
      }
    } catch (error) {
      console.error('Error fetching action by id:', error);
    }
  }

  useEffect(() => {
    if (viewEditActionId) {
      getActionById()
    }
  }, [viewEditActionId])

  console.log("editActionData", editActionData)

  return (
    <form onSubmit={handleSubmit}>
      <div className="bg-white rounded-lg w-full ">
        <div className='flex items-center justify-between mt-2 pb-4  border-b border-gray-200'>
          <h2 className="text-xl font-semibold mb-4">Booking Appointment</h2>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-2 rounded-xl border-2 border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors duration-200 flex items-center gap-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={btnLoader}
              className="px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:opacity-90 transition-opacity duration-200 flex items-center gap-2 shadow-lg shadow-indigo-200"
            >
              {btnLoader && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
              {viewEditActionId ? "Update" : "Create"}
            </button>
          </div>
        </div>
        <div className="space-y-4 mt-6 px-1">
          <div className=" gap-4">
            <div className='w-full'>
              <label htmlFor="booking-name" className={`text-sm font-medium mb-2 flex items-center gap-2 ${nameError && nameTouched ? 'text-red-500' : ''}`}>
                <FaUserAlt className="text-indigo-600" />
                Name *
              </label>
              <input
                id="booking-name"
                type="text"
                value={nameBookingAppointment}
                onChange={(e) => {
                  setNameBookingAppointment(e.target.value);
                  if (!nameTouched) setNameTouched(true);
                  if (nameError && e.target.value.trim()) {
                    setNameError(null);
                  }
                }}
                onBlur={() => setNameTouched(true)}
                placeholder="Enter name"
                className="w-full rounded-lg border-2 px-4 py-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
              />
              {(nameError && nameTouched) && (
                <div className="text-red-500 text-xs mt-1">{nameError}</div>
              )}
            </div>
          </div>

          {/* Variable Selection */}
          <div className="space-y-4 mt-6">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">Select Variables</h3>
            </div>

            {/* Quick Info */}
            <div className="flex items-center gap-2 text-sm text-gray-600 bg-blue-50 p-2 rounded-lg">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Choose one variable group and select the variables you need</span>
            </div>

            {/* Folder Selection */}
            <div className="space-y-2">
              {folderList.map((folder) => (
                <div
                  key={folder.id}
                  className={`border-2 rounded-lg transition-all duration-200 hover:shadow-md ${
                    selectedFolder?.id === folder.id
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Folder Header */}
                  <div
                    className="p-3 cursor-pointer"
                    onClick={() => {
                      handleFolderSelect(folder);
                      toggleFolderExpansion(folder.id);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          selectedFolder?.id === folder.id 
                            ? 'bg-indigo-600 text-white' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {folder.is_default ? 'Default Variables' : folder.name}
                          </h4>
                          <p className="text-xs text-gray-500">
                            {Object.keys(folder.properties || {}).length} variables
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedFolder?.id === folder.id && (
                          <div className="w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center">
                            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFolderExpansion(folder.id);
                          }}
                          className="p-1 rounded hover:bg-gray-100 transition-colors"
                        >
                          <svg
                            className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${
                              expandedFolders.has(folder.id) ? 'rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Variables List */}
                  {expandedFolders.has(folder.id) && (
                    <div className="border-t border-gray-200 bg-gray-50 rounded-b-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Select variables:</span>
                        {selectedFolder?.id === folder.id && selectedProperties.size > 0 && (
                          <span className="text-sm text-green-600 font-medium">
                            {selectedProperties.size} selected
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {Object.entries(folder.properties || {}).map(([propertyName, propertyData]: [string, any]) => (
                          <div
                            key={propertyName}
                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm ${
                              selectedProperties.has(propertyName)
                                ? 'border-green-500 bg-green-50 shadow-sm'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                            onClick={() => toggleProperty(propertyName)}
                          >
                            <div className="flex items-start gap-3">
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center mt-0.5 ${
                                selectedProperties.has(propertyName)
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h6 className="text-sm font-medium text-gray-900 capitalize">
                                    {propertyName.replace(/_/g, ' ')}
                                  </h6>
                                  <span className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                                    propertyData.type === 'string'
                                      ? 'bg-blue-100 text-blue-700'
                                      : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {propertyData.type}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  {propertyData.description}
                                </p>
                              </div>
                              {selectedProperties.has(propertyName) && (
                                <div className="w-5 h-5 bg-green-600 rounded-full flex items-center justify-center">
                                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {!selectedFolder && folderList.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  <span className="text-sm text-orange-800">Please select a variable group</span>
                </div>
              </div>
            )}
          </div>


        </div>
      </div>
    </form>
  )
}

export default BookingAppointmentComponent