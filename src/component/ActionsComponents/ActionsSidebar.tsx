"use client";
export const runtime = 'edge';

import { useState } from "react";
import { LuCalendarArrowUp } from "react-icons/lu";
import { GrInProgress } from "react-icons/gr";
import { FaBuilding, FaRegCalendarCheck } from "react-icons/fa";
import { IoIosNotificationsOutline } from "react-icons/io";
import { BiTransferAlt } from "react-icons/bi";
import { FcEndCall } from "react-icons/fc";
import { Search, Globe, XIcon, Settings } from "lucide-react";

interface ActionsSidebarProps {
  isOpen: boolean;
  onActionSelect: (actionType: string) => void;
  activeActionType?: string;
}

interface ActionItem {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  category: string;
}

const actionItems: ActionItem[] = [

  // {
  //   id: "check_availability",
  //   name: "Check Availability",
  //   icon: <GrInProgress className="text-[#6D4AFF] h-5 w-5" />,
  //   description: "Check available booking slots.",
  //   category: "Booking"
  // },
  // {
  //   id: "booking_appointment",
  //   name: "Book Appointment",
  //   icon: <FaRegCalendarCheck className="text-[#6D4AFF] h-5 w-5" />,
  //   description: "Schedule a new appointment",
  //   category: "Booking"
  // },
  // {
  //   id: "cancel_appointment",
  //   name: "Cancel Appointment",
  //   icon: <XIcon className="text-[#6D4AFF] h-5 w-5" />,
  //   description: "Cancel an existing appointment",
  //   category: "Booking"
  // },
  {
    id: "notification",
    name: "Send Notification",
    icon: <IoIosNotificationsOutline className="text-[#6D4AFF] h-5 w-5" />,
    description: "Send notifications to users",
    category: "Communication"
  },
  {
    id: "api_request_tool",
    name: "API Request",
    icon: <Globe className="text-[#6D4AFF] h-5 w-5" />,
    description: "Make external API calls",
    category: "Integration"
  },
  {
    id: "transfer_call_tool",
    name: "Transfer Call",
    icon: <BiTransferAlt className="text-[#6D4AFF] h-5 w-5" />,
    description: "Transfer call to another agent or department",
    category: "Communication"
  },
  {
    id: "query_tool",
    name: "Query Tool",
    icon: <Search className="text-[#6D4AFF] h-5 w-5" />,
    description: "Search and query information",
    category: "Tools"
  },
  {
    id: "end_call_tool",
    name: "End Call",
    icon: <FcEndCall className="text-[#6D4AFF] h-5 w-5" />,
    description: "End the current call",
    category: "Communication"
  },
  {
    id: "zoho_action",
    name: "After Call Zoho Action",
    icon: <FaBuilding className="text-[#6D4AFF] h-5 w-5" />,
    description: "Zoho Action",
    category: "Integration"
  },
  // {
  //   id: "booking_lookup",
  //   name: "Get All Booking",
  //   icon: <FaRegCalendarCheck className="text-[#6D4AFF] h-5 w-5" />,
  //   description: "Get All Booking",
  //   category: "Booking"
  // }
];

export default function ActionsSidebar({ isOpen, onActionSelect, activeActionType }: ActionsSidebarProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(actionItems.map(item => item.category)))];

  const filteredActions = selectedCategory === "All"
    ? actionItems
    : actionItems.filter(item => item.category === selectedCategory);

  return (
    <div
      className={`
        fixed top-16 left-[80px]
        bg-white border-r border-gray-200 
        h-[calc(100vh-4rem)]
        flex flex-col 
        z-40 
        w-[350px]
        overflow-y-auto
        shadow-lg
      `}
    >
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 ">Create Action</h2>
          <p className="text-sm text-gray-600">Select an action type to configure</p>
        </div>

        <div>
          <div
            onClick={() => onActionSelect("global_variable")}
            className={`p-4 mb-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#6D4AFF]/30 bg-white
                  ${true ? 'bg-[#6D4AFF]/10 border-[#6D4AFF] font-bold text-[#6D4AFF]' : 'border-gray-200'}
                `}>
            <div className="flex items-start gap-3">
              <div className="">
                <Settings className="text-[#6D4AFF] h-5 w-5" />
              </div>
              <h4 className={`text-sm font-medium mb-1 ${true ? 'text-[#6D4AFF]' : 'text-gray-900'}`}>
                Global Variable
              </h4>
            </div>
          </div>


        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Categories</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`
                  px-3 py-1.5 text-xs font-medium rounded-full transition-colors
                  ${selectedCategory === category
                    ? 'bg-[#6D4AFF] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Actions List */}
        <div className="space-y-3">
          {filteredActions.map((action) => {
            const isActive = action.id === activeActionType;
            return (
              <div
                key={action.id}
                onClick={() => onActionSelect(action.id)}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 hover:shadow-md hover:border-[#6D4AFF]/30 bg-white
                  ${isActive ? 'bg-[#6D4AFF]/10 border-[#6D4AFF] font-bold text-[#6D4AFF]' : 'border-gray-200'}
                `}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {action.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`text-sm font-medium mb-1 ${isActive ? 'text-[#6D4AFF]' : 'text-gray-900'}`}>
                      {action.name}
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                    <div className="mt-2">
                      <span className="inline-block px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                        {action.category}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredActions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 mb-2">
              <LuCalendarArrowUp className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-sm text-gray-500">No actions found in this category</p>
          </div>
        )}
      </div>

      {/* Footer
      <div className="p-4 border-t border-gray-200">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-700">
            <strong>Tip:</strong> Actions are reusable components that can be configured once and used across multiple AI agents.
          </p>
        </div>
      </div> */}
    </div>
  );
} 