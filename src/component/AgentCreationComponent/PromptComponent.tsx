"use client"
export const runtime = 'edge';

import { FormControl, FormField, FormItem, FormLabel } from "@/component/ui/form";
import { Input } from "@/component/ui/input";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";
import dynamic from "next/dynamic";
import { useState } from "react";
import { toast } from 'react-toastify';

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });


type Props = {
  form: any
}

const PromptComponent = ({ form }: Props) => {
  const [endCallMessage, setEndCallMessage] = useState(
    "Thank you for contacting us. If you need anything else, feel free to reach out anytime. Have a great day!"
  );
  return (
    <div className="space-y-6">
      {/* First Message */}
      <div>
        <FormField
          control={form.control}
          name="first_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Message</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:border-[#6D4AFF] mt-2 focus:ring-[#6D4AFF]"
                  placeholder="First Message"
                  onBlur={() => {
                    if (!field.value || field.value.trim() === '') {
                      toast.error("First Message is required");
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />

      </div>

      {/* System Prompt */}
      <div>
        <FormField
          control={form.control}
          name="system_prompt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>System Prompt</FormLabel>
              <FormControl>
                <MDEditor  
                  className="w-full" 
                  data-color-mode="light" 
                  value={field.value} 
                  onChange={(value) => {
                    field.onChange(value);
                    // Check if system prompt is empty when user finishes editing
                    if (!value || value.trim() === '') {
                      toast.error("System Prompt is required");
                    }
                  }} 
                />
              </FormControl>
              <p className="mt-1 text-xs text-gray-400">
                This is the main instruction set that guides how your assistant behaves and responds.
              </p>
            </FormItem>
          )}
        />
      </div>

      {/* End Call Message */}
      <div>
        <FormField
          control={form.control}
          name="end_call_message"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Call Message</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm shadow-sm focus:ring-[#6D4AFF] mt-2 focus:ring-[#6D4AFF]"
                  placeholder="End Call Message"
                  onBlur={() => {
                    if (!field.value || field.value.trim() === '') {
                      toast.error("End Call Message is required");
                    }
                  }}
                />
              </FormControl>
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

export default PromptComponent