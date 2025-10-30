"use client";
export const runtime = 'edge';

import { useEffect, useState } from "react";
import { FaCode } from "react-icons/fa";
import { ArrowLeftIcon, EyeIcon, TrashIcon } from "lucide-react";
import Card from "../common/Card";
import { deleteActionApiRequest, getActionByIdApiRequest, getActionListApiRequest, getFolderListApiRequest } from "@/network/api";
import Button from "../common/Button";
import { useRouter } from "next/navigation";
import NotificationSubComponent from "./ActionConponent/NotificationSubComponent";
import BookingAppointmentComponent from "./ActionConponent/SubComponent/BookingAppointmentComponent";
import AvailabilityFormComponent from "./ActionConponent/SubComponent/AvailabilityFormComponent";
import TransferCallComponent from "./ActionConponent/TransferCallComponent";
import CalcleAppointmentComponent from "./ActionConponent/SubComponent/CalcleAppointmentComponent";
import QueryToolComponent from "./ActionConponent/QueryToolComponent";
import EndCallComponent from "./ActionConponent/EndCallComponent";
import ApiRequestActionComponent from "./ActionConponent/ApiRequestActionComponent";
import ActionsSidebar from "./ActionsSidebar";
import ZohoActionComponent from "./ActionConponent/ZohoActionComponent";
import GetAllBokingAction from "./ActionConponent/GetAllBokingAction";
import GlobalVariable from "./GlobalVariable";

export default function ActionsComponent() {
  const router = useRouter();
  const [isActionsSidebarOpen, setIsActionsSidebarOpen] = useState(true);
  const [selectedActionId, setSelectedActionId] = useState<string>("");
  const [actionList, setActionList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  // New state to track which form is open in main content
  const [activeForm, setActiveForm] = useState<{
    type: string;
    isEdit: boolean;
    actionId?: string;
  } | null>(null);
  // New state to track selected action type from sidebar
  const [selectedActionType, setSelectedActionType] = useState<string | null>(null);
  const [folderList, setFolderList] = useState<any[]>([]);
  const getAllActionList = async () => {
    try {
      setIsLoading(true);
      const response = await getActionListApiRequest();
      console.log("response---", response?.data?.actions)
      const data = response?.data?.actions;
      setActionList(data);
    } catch (error) {
      console.error('Error fetching action list:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getFolderList = async () => {
    const response = await getFolderListApiRequest();
    const data = response?.data?.folders;
    setFolderList(data);
  }

  const handleConfirmDelete = async () => {
    try {
      setDeleteLoading(true);
      const response = await deleteActionApiRequest(selectedActionId);
      getAllActionList();
      setShowDeleteConfirm(false);
      setSelectedActionId('');
    } catch (error) {
      console.error('Error deleting action:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Handle selecting a new action from the sidebar (show list for that type)
  const handleActionSelect = (actionType: string) => {
    console.log("actionType---", actionType)
    setSelectedActionType(actionType);
    setActiveForm(null);
  };

  // Handle editing an existing action
  const handleEditAction = (action: any) => {
    // Determine type for edit
    let type = action.function_type || action.function?.name || action.type;
    // Normalize for special cases
    if (action.type === "zoho") type = "zoho_action";
    if (action.function?.name === "calendar_booking_lookup") return;
    setActiveForm({ type, isEdit: true, actionId: action.id });
  };

  // Handle closing the form and returning to the list
  const handleCloseForm = () => {
    setActiveForm(null);
  };

  useEffect(() => {
    getAllActionList();
    getFolderList();
  }, []);

  // Helper to render the correct form in main content
  const renderActiveForm = () => {
    if (!activeForm) return null;
    const commonProps = {
      isEdit: activeForm.isEdit,
      viewEditActionId: activeForm.actionId || "",
      setViewEditActionId: () => { },
      getAllActionList,
    };
    switch (activeForm.type) {
      case "check_availability":
        return <AvailabilityFormComponent {...commonProps} setShowAvailabilityForm={handleCloseForm} setShowSubActions={() => { }} />;
      case "booking_appointment":
        return <BookingAppointmentComponent {...commonProps} setShowBookingAppointmentForm={handleCloseForm} setShowSubActions={() => { }} folderList={folderList} />;
      case "cancel_appointment":
        return <CalcleAppointmentComponent {...commonProps} setShowCancelAppointmentForm={handleCloseForm} />;
      case "notification":
        return <NotificationSubComponent {...commonProps} setShowNotificationForm={handleCloseForm} folderList={folderList} />;
      case "api_request":
      case "api_request_tool":
        return <ApiRequestActionComponent isOpen={true} {...commonProps} onClose={handleCloseForm} setShowApiRequestForm={handleCloseForm} />;
      case "transfer_call":
      case "transfer_call_tool":
        return <TransferCallComponent {...commonProps} setShowTransferCallForm={handleCloseForm} />;
      case "query_tool":
        return <QueryToolComponent {...commonProps} setShowQueryToolForm={handleCloseForm} />;
      case "end_call":
      case "end_call_tool":
        return <EndCallComponent {...commonProps} setShowEndCallForm={handleCloseForm} />;
      case "zoho_action":
        return <ZohoActionComponent {...commonProps} setShowZohoActionForm={handleCloseForm} />;
      case "booking_lookup":
        return <GetAllBokingAction {...commonProps} setShowGetAllBookingForm={handleCloseForm} setShowSubActions={() => { }} handleClose={handleCloseForm} />;
      default:
        return <div>Unknown action type</div>;
    }
  };

  // Filter actions by selected type if set
  const filteredActions = selectedActionType
    ? actionList.filter((action: any) => {
      // Normalize for special cases
      let type = action.function_type || action.function?.name || action.type;
      if (action.type === "zoho") type = "zoho_action";
      return type === selectedActionType;
    })
    : actionList.filter((action: any) => {
      // Hide specific action types from display
      const hiddenTypes = ['booking_lookup', 'reschedule_appointment', 'cancel_appointment', 'booking_appointment', 'check_availability'];
      return !hiddenTypes.includes(action.function_type);
    });

  return (
    <>
      <div className="flex relative">
        {/* Actions Sidebar */}
        <div className="w-[350px] h-full">
          <ActionsSidebar
            isOpen={isActionsSidebarOpen}
            onActionSelect={handleActionSelect}
            activeActionType={activeForm?.type || selectedActionType || undefined}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 px-5 pt-20">
          {activeForm ? (
            <Card className="p-6  w-full h-full">
              {/* <Button variant="secondary" onClick={handleCloseForm} className="mb-4 !absolute  right-6">Back to Actions List</Button> */}
              {renderActiveForm()}
            </Card>
          ) : selectedActionType === "global_variable" ? (
            <div className="p-6 w-full h-full bg-white rounded-lg min-h-[500px]">
              <GlobalVariable  getFolderListData={getFolderList} />
            </div>
            
          ) : selectedActionType ? (
            <Card className="p-6" title={null}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    className="px-4 py-2"
                    onClick={() => setSelectedActionType(null)}
                  >
                    <ArrowLeftIcon className="w-4 h-4" />
                  </Button>
                  <h2 className="text-xl font-semibold ml-4">{filteredActions.length > 0 ? `Actions (${filteredActions.length})` : "No Actions Created"}</h2>
                </div>
                <Button
                  variant="primary"
                  className="bg-[#6D4AFF] text-white px-6 py-2 rounded-lg shadow hover:bg-[#5a3ce0]"
                  onClick={() => setActiveForm({ type: selectedActionType, isEdit: false })}
                >
                  + Create Action
                </Button>
              </div>
              <div className="space-y-6 min-h-[500px]">
                {isLoading && (<div className="flex items-center !mt-20 justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6D4AFF]"></div>
                </div>)}
                {filteredActions.length > 0 && !isLoading && filteredActions.map((action: any) => (
                  <div
                    key={action.id}
                    className={`relative rounded-md border p-4 mt-2`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FaCode className="text-[#6D4AFF]" />
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{action.name}</div>
                          <span className="text-xs text-white bg-gray-400 px-2 py-0.5 rounded">
                            {action.function_type ? action.function_type : action.function?.name || action.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <button
                          onClick={() => {
                            setSelectedActionId(action.id);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <TrashIcon className="text-red-500 h-[24px] w-[24px]" />
                        </button>
                        <button
                          type="button"
                          disabled={action.function?.name === "calendar_booking_lookup"}
                          onClick={() => handleEditAction(action)}
                        >
                          <EyeIcon className={` h-[24px] w-[24px] ${action.function?.name === "calendar_booking_lookup" ? "text-gray-400" : "text-[#6D4AFF]"}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Empty State */}
                {filteredActions.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FaCode className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Actions Created</h3>
                    <p className="text-gray-600 mb-6">Click the Create Action button to add your first action of this type.</p>
                  </div>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6" title={`Actions (${filteredActions.length})`}>
              <div className="space-y-6 min-h-[500px]">
                {/* Action List */}
                {isLoading && (<div className="flex items-center !mt-20 justify-center h-full">
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6D4AFF]"></div>
                </div>)}
                {filteredActions.length > 0 && !isLoading && filteredActions.map((action: any) => (
                  
                  <div
                    key={action.id}
                    className={`relative rounded-md border p-4 mt-2`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FaCode className="text-[#6D4AFF]" />
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{action.name}</div>
                          <span className="text-xs text-white bg-gray-400 px-2 py-0.5 rounded">
                            {action.function_type ? action.function_type : action.function?.name || action.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <button
                          onClick={() => {
                            setSelectedActionId(action.id);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <TrashIcon className="text-red-500 h-[24px] w-[24px]" />
                        </button>
                        <button
                          type="button"
                          disabled={action.function?.name === "calendar_booking_lookup"}
                          onClick={() => handleEditAction(action)}
                        >
                          <EyeIcon className={` h-[24px] w-[24px] ${action.function?.name === "calendar_booking_lookup" ? "text-gray-400" : "text-[#6D4AFF]"}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {/* Empty State */}
                {actionList.length === 0 && !isLoading && (
                  <div className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FaCode className="h-16 w-16 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Actions Created</h3>
                    <p className="text-gray-600 mb-6">Get started by creating your first action using the actions panel on the left.</p>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirm Modal (unchanged) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[2000]  bg-black/50 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white border border-gray-200 rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">Are you sure you want to delete this agent? This action cannot be undone.</p>
            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setSelectedActionId('');
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                className="bg-red-600 hover:bg-red-700"
                onClick={handleConfirmDelete}
                disabled={deleteLoading}
              >
                {deleteLoading && <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>}
                {deleteLoading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
