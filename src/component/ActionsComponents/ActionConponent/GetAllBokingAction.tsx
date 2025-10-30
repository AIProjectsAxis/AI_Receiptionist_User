import React, { useState, useEffect } from 'react'
import { FaPhone } from 'react-icons/fa';
import { createActionApiRequest, getActionByIdApiRequest, updateActionApiRequest } from '@/network/api';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import Card from '../../common/Card';

type Props = {
  isEdit: boolean;
  setViewEditActionId?: (value: string) => void;
  setShowGetAllBookingForm: (value: boolean) => void;
  getAllActionList: () => void;
  setShowSubActions: (value: boolean) => void;
  viewEditActionId: string;
  handleClose: () => void;
}

const GetAllBokingAction = ({ isEdit, setViewEditActionId, setShowGetAllBookingForm, getAllActionList, setShowSubActions, viewEditActionId, handleClose }: Props) => {
  const router = useRouter()
  const [nameGetAllBooking, setNameGetAllBooking] = useState("")
  const [editActionData, setEditActionData] = useState<any>(null)
  const [btnLoader, setBtnLoader] = useState(false)

  useEffect(() => {
    if (isEdit && editActionData?.name) {
      setNameGetAllBooking(editActionData.name)
    }
  }, [isEdit, editActionData])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBtnLoader(true)
    try {
      const payload = {
        "type": "function",
        "name": "Get All Booking",
        "async_": null,
        "messages": [
          {
            "contents": null,
            "content": "Alreight i am getting your booking appointment",
            "conditions": null,
            "type": "request-start",
            "blocking": true
          },
          {
            "contents": null,
            "content": "Sorry, I couldn't find your booking appointment. Please check your phone number and try again.",
            "conditions": null,
            "type": "request-failed",
            "end_call_after_spoken_enabled": true
          }
        ],
        "function": {
          "name": "calendar_booking_appointment",
          "description": "use this funtion for getting phone number from user and then get all the booking in a calendar system",
          "parameters": {
            "type": "object",
            "properties": {
              "phone_number": {
                "type": "string",
                "description": "Ask user during the call with which number he has done the booking"
              }
            },
            "required": ["phone_number"]
          },
          "strict": false
        },
        "function_type": "booking_lookup",
        "notification": null,
        "async": false
      }

      if (viewEditActionId) {
        await updateActionApiRequest(viewEditActionId, payload)
        toast.success("Get All Booking action updated successfully",{
          position: "top-right",
          autoClose: 3000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        })
      } else {
        await createActionApiRequest(payload)
        setShowGetAllBookingForm(false)
        getAllActionList()
        setShowSubActions(false)
        setNameGetAllBooking("")
      }

    } catch (error) {
      console.log(error);
      toast.error("Something went wrong. Please try again.",{
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      })
    } finally {
      setShowGetAllBookingForm(false)
      getAllActionList()
      setShowSubActions(false)
      setBtnLoader(false)
      setNameGetAllBooking("")
    }
  }

  const getActionById = async () => {
    try {
      const response = await getActionByIdApiRequest(viewEditActionId as string)
      setEditActionData(response?.data?.action)
      setNameGetAllBooking(response?.data?.action?.name)
    } catch (error) {
      console.error('Error fetching action by id:', error);
    }
  }

  useEffect(() => {
    if (viewEditActionId) {
      getActionById()
    }
  }, [viewEditActionId])

  return (
    <form onSubmit={handleSubmit}>
      <Card className="rounded-lg !p-0 w-full !border-none !shadow-none">
        <div className='flex justify-between items-center mt-2 pb-4  border-b border-gray-200'>
          <div className=''>
            <h2 className="text-xl font-semibold ">Get All Booking Action</h2>

          </div>
          <div className="flex justify-end space-x-3 ">
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
              {btnLoader && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> }
              {viewEditActionId ? "Update" : "Create"}
            </button>
          </div>
        </div>
        <div className="space-y-4 mt-6 px-1">
          {/* <div className="gap-4">
              <div className='w-full'>
                <label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <FaPhone className="text-indigo-600" />
                  Action Name *
                </label>
                <input
                  type="text"
                  required
                  value={nameGetAllBooking}
                  onChange={(e) => setNameGetAllBooking(e.target.value)}
                  placeholder="Enter action name"
                  className="w-full rounded-lg border-2 px-4 py-3 border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-all duration-200"
                />
              </div>
            </div> */}

          {/* Information about the action */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Action Details</h3>
            <p className="text-sm text-blue-700">
              This action will retrieve all bookings for a user based on their phone number.
              The system will ask the user for their phone number during the call to look up their bookings.
            </p>
          </div>


        </div>
      </Card>
    </form>
  )
}

export default GetAllBokingAction