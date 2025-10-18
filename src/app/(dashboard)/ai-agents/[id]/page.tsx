"use client"
export const runtime = 'edge';

import ConfigureComponent from "@/component/AgentCreationComponent/ConfigureComponent";
import PhoneNumberComponent from "@/component/AgentCreationComponent/PhoneNumberComponent";
import PromptComponent from "@/component/AgentCreationComponent/PromptComponent";
import Card from "@/component/common/Card";
import { Form, FormControl, FormItem, FormLabel } from "@/component/ui/form";
import { getAgentByIdApiRequest, getCalendarListApiRequest, getKnowledgeBaseDocumentsListApiRequest, updateAgentApiRequest } from "@/network/api";
import { Bot, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { FaBolt, FaCog, FaCommentDots, FaPhoneAlt } from "react-icons/fa";
import { FormField } from "@/component/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Button from "@/component/common/Button";
import SettingsComponent from "@/component/AgentCreationComponent/SettingsComponent";
import ActionsConfigureComponent from "@/component/AgentCreationComponent/ActionsConfigureComponent";
import { toast } from "react-toastify";

const FormSchema = z.object({
  name: z.string().min(1, { message: "Name is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  languages : z.array(z.string()).min(1, { message: "Language is required" }),
  // timezone: z.string().min(1, { message: "Timezone is required" }),
  system_prompt: z.string().min(1, { message: "System Prompt is required" }),
  first_message: z.string().min(1, { message: "First Message is required" }),
  end_call_message: z.string().min(1, { message: "End Call Message is required" }),
  recording_enabled: z.boolean().default(true),
  voice: z.string().optional(),
  detect_caller_number: z.boolean().default(false),
});


export default function CreateAgent() {
  const [voiceRecording, setVoiceRecording] = useState(false);
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("Configure");
  const [agentData, setAgentData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [agentName, setAgentName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [agentDataForSettings, setAgentDataForSettings] = useState<any>(null);
  const [stopVoiceFunction, setStopVoiceFunction] = useState<(() => void) | null>(null);
  const [knowledgeBaseList, setKnowledgeBaseList] = useState<any[]>([]);
  const [calendarList, setCalendarList] = useState<any[]>([]);
  const tabs = [
    { name: "Configure", icon: <FaCog /> },
    { name: "Prompt", icon: <FaCommentDots /> },
    { name: "Phone Number", icon: <FaPhoneAlt /> },
    { name: "Actions", icon: <FaBolt /> },
    { name: "Settings", icon: <FaCog /> },
  ];

  const handleTabChange = (tabName: string) => {
    // Stop voice when changing tabs
    if (stopVoiceFunction) {
      stopVoiceFunction();
    }
    setActiveTab(tabName);
  };

  const form = useForm({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      description: "",
      languages: ["English"],
      system_prompt: "",
      voice: "",
      first_message: "",
      end_call_message: "Thank you for contacting us. If you need anything else, feel free to reach out anytime. Have a great day!",
      recording_enabled: false,
      detect_caller_number: false,
    }
  })

  const onSubmit = async (values: z.infer<typeof FormSchema>) => {
    // Check for required fields and show specific error messages
    const errors = form.formState.errors;
    const missingFields = [];
    
    if (errors.name) {
      missingFields.push("Agent Name");
    }
    if (errors.description) {
      missingFields.push("Agent Role/Nickname");
    }
    if (errors.languages) {
      missingFields.push("Languages");
    }
    if (errors.system_prompt) {
      missingFields.push("System Prompt");
    }
    if (errors.first_message) {
      missingFields.push("First Message");
    }
    if (errors.end_call_message) {
      missingFields.push("End Call Message");
    }

    if (missingFields.length > 0) {
      toast.error(`Please fill in the following required fields: ${missingFields.join(", ")}`);
      return;
    }

    setIsSaving(true);
    const payload = {
      ...agentData,
      ...values,
    }
    try {
       await updateAgentApiRequest(id as string, payload);
      toast.success("Agent updated successfully!",{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
      setAgentName(values.name);
    } catch (error) {
      console.error("Error updating agent:", error);
      toast.error("Error updating agent",{
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const getKnowledgeBase = async () => {
    try {
        const response = await getKnowledgeBaseDocumentsListApiRequest()
        setKnowledgeBaseList(response?.data?.files)
    } catch (error) {
        console.error("Error fetching knowledge base:", error)
    }
}

const listCalendar = async () => {
  try {
      const response = await getCalendarListApiRequest();
      if (response?.data?.calendars) {
          setCalendarList(response.data.calendars);
      }
  } catch (error) {
      console.error("Error fetching calendars:", error);
  }
}

  const getAgentById = async () => {
    try {
      const response = await getAgentByIdApiRequest(id as string);
      setAgentData(response?.data?.assistant);
      if (response?.data?.assistant) {
        setAgentDataForSettings(response?.data?.assistant);
        const assistant = response?.data?.assistant;
        form.setValue("name", assistant?.name || "");
        setAgentName(assistant?.name || "");
        form.setValue("description", assistant?.description || "");
        form.setValue(
          "languages",
          Array.isArray(assistant?.languages) && assistant.languages.length === 0
            ? ["English"]
            : assistant?.languages || ["English"]
        );
        // form.setValue("timezone", assistant?.timezone || "");
        form.setValue("system_prompt", assistant?.system_prompt || "");
        form.setValue("voice", assistant?.voice || "xrNwYO0xeioXswMCcFNF");
        form.setValue("first_message", assistant?.first_message || "");
        form.setValue("end_call_message", assistant?.end_call_message || "Thank you for contacting us. If you need anything else, feel free to reach out anytime. Have a great day!");
        setVoiceRecording(assistant?.recording_enabled);
        form.setValue("detect_caller_number", assistant?.detect_caller_number || false);
      }
    } catch (error) {
      console.error("Error fetching agent:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    getAgentById();
    getKnowledgeBase();
    listCalendar();
  }, [id]);

  console.log("error", form.formState.errors);
  console.log("agentData", agentData);
  console.log("values", form.getValues());
 


  if (isLoading) {
    return (
      <div className="pt-5 min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#6D4AFF]"></div>
      </div>
    );
  }

  return (
    <div className="pt-5 min-h-screen text-gray-800 relative">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {(activeTab === "Configure" || activeTab === "Prompt") && <div className="flex justify-end absolute right-0 top-[21px]">
            <Button 
              disabled={isSaving} 
              type="submit" 
              className="h-12 !bg-[#6D4AFF] transition w-[171px] text-white flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => {
                if (!form.formState.isValid) {
                  const errors = form.formState.errors;
                  const errorMessages = Object.keys(errors).map(key => {
                    const error = errors[key as keyof typeof errors];
                    return error?.message || `${key} is required`;
                  });
                  
                  toast.error(`Please complete all required fields: ${errorMessages.join(', ')}`);
                }
              }}
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
            {!form.formState.isValid && (
              <div className="text-red-500 text-xs mt-1 text-center absolute top-full right-0 w-full">
                Please complete all required fields
              </div>
            )}
          </div>}
          {/* Tabs */}
          <div className="flex w-fit overflow-hidden rounded-tr-xl rounded-tl-xl  border-b-0 border  border-gray-200 ">
            {tabs.map((tab, index) => {
              const isActive = tab.name === activeTab;
              return (
                <button
                  type="button"
                  key={tab.name}
                  onClick={() => handleTabChange(tab.name)}
                  className={`
              flex items-center gap-2 px-5 py-3 text-[12px] font-medium transition w-[171px] hover:bg-[#6D4AFF] hover:text-white justify-center cursor-pointer
              ${isActive ? "bg-[#6D4AFF] text-white" : "text-gray-400"}
              ${index === 0 ? "" : ""}
              ${index === tabs.length - 1 ? "" : ""}
              ${index > 0 ? "border-l border-gray-200" : ""}
            `}
                >
                  <span className="text-base">{tab.icon}</span>
                  {tab.name}
                </button>
              );
            })}
          </div>


          {(activeTab === "Configure" || activeTab === "Prompt") &&
            <Card className="p-6 bg-white/90 backdrop-blur-lg rounded-lg  md:rounded-xl md:p-6 border border-gray-200/50 shadow-md hover:shadow-lg mb-6 transition-all duration-300 relative overflow-visible" style={{ borderTopLeftRadius: "0px", borderTopRightRadius: "0px" }}>



              {/* Header */}
              {(activeTab === "Configure" || activeTab === "Prompt") &&
                <div className="flex items-center space-x-4 mb-6">
                  <div className="bg-gradient-to-r from-[#695FED] to-[#46B6FE] p-3 rounded-xl w-20 h-20 flex items-center justify-center">
                    <span role="img" aria-label="bot" className="text-2xl font-semibold"><Bot className="text-white w-10 h-10" /></span>
                  </div>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col w-[80%]">
                        <FormLabel className="text-gray-500 mb-2 text-sm">Agent Name</FormLabel>
                        <FormControl>
                          <input
                            {...field}
                            className="text-2xl font-semibold border-0 outline-none"
                            placeholder="Agent Name"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>}

              {(activeTab === "Configure" || activeTab === "Prompt") && <div className="border-t border-gray-200 pt-5">
                {activeTab === "Configure" && (
                  <ConfigureComponent
                    voiceRecording={voiceRecording}
                    setVoiceRecording={setVoiceRecording}
                    form={form}
                    onStopVoice={setStopVoiceFunction}
                  />
                )}
                {activeTab === "Prompt" && <PromptComponent form={form} />}

              </div>}
            </Card>}
        </form>
      </Form>

      {activeTab === "Phone Number" && <PhoneNumberComponent agentName={agentName} />}
      {activeTab === "Actions" && <ActionsConfigureComponent agentDataForSettings={agentDataForSettings} setAgentDataForSettings={setAgentDataForSettings} agentName={agentName} />}
      {activeTab === "Settings" && <SettingsComponent agentDataForSettings={agentDataForSettings} getAgentById={getAgentById} getKnowledgeBase={getKnowledgeBase} knowledgeBaseList={knowledgeBaseList} calendarList={calendarList} agentName={agentName} />}
    </div>
  );
}
