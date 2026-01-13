# Testing Guide: "Ask from User During Call" → Send Email/SMS

This guide explains how to test the notification action that collects information during a phone call and sends notifications based on that information.

## Overview

When you select **"Ask from User During Call"**, the AI agent will:
1. Ask the caller for required information (email, phone number, and any custom variables)
2. Extract that information from the call transcript
3. Use it to populate email/SMS templates dynamically
4. Send the notifications automatically

---

## Step-by-Step Testing Process

### **Step 1: Create the Notification Action**

1. Navigate to **Actions Management** → **Create New Action** → Select **Notification**
2. Fill in the basic information:
   - **Action Title**: e.g., "Send Appointment Confirmation"
   - **Action Description**: e.g., "Send email and SMS confirmation after booking"

### **Step 2: Configure Notification Group**

1. **Notification Group Name**: Enter a name (e.g., "Customer Confirmation")

2. **Select Contact Method**: 
   - ✅ **Select "Ask from User During Call"** (This is the key setting!)
   - ⚠️ Do NOT select "Use Custom Contact Info" for this test

3. **Enable Notification Channels**:
   - Toggle ON **"Send Email"**
   - Toggle ON **"Send SMS"** (optional, for testing SMS)

### **Step 3: Create Email Template with Variables**

In the **Email Subject** field:
```
Appointment Confirmed for {full_name}
```

In the **Email Content** field, use variables wrapped in curly braces `{}`:
```
Hi {full_name},

Thank you for booking your appointment!

Appointment Details:
- Date: {appointment_date}
- Time: {appointment_time}
- Phone: {phone_number}
- Email: {email}

We look forward to seeing you!

Best regards,
[Your Company Name]
```

**Key Variables Used:**
- `{email}` - Will be collected from user during call
- `{phone_number}` - Will be collected from user during call
- `{full_name}` - Custom variable (must be in your Global Variables/Folders)
- `{appointment_date}` - Custom variable
- `{appointment_time}` - Custom variable

### **Step 4: Create SMS Template with Variables**

In the **SMS Message** field:
```
Hi {full_name}, your appointment on {appointment_date} at {appointment_time} is confirmed. Email: {email}, Phone: {phone_number}. See you then!
```

### **Step 5: Configure Variables (Global Variables/Folders)**

**IMPORTANT**: Before the action can ask for custom variables, they must exist in your Global Variables:

1. Go to **Actions Management** → **Global Variables**
2. Ensure these variables exist with proper descriptions:
   - `full_name`: Description: "Ask for the customer's full name"
   - `appointment_date`: Description: "Ask for the appointment date"
   - `appointment_time`: Description: "Ask for the appointment time"

**Note**: `email` and `phone_number` are automatically included and don't need to be in Global Variables.

### **Step 6: Add the Action to Your AI Agent**

1. Go to **AI Agents** → Select/Edit an agent
2. Navigate to the **Actions** configuration section
3. Add the notification action you just created
4. Save the agent configuration

### **Step 7: Make a Test Phone Call**

1. **Initiate a call** to your AI agent's phone number
2. **During the call**, the AI should ask for:
   - "What is your full name?" → You answer: "John Doe"
   - "What is your email address?" → You answer: "john.doe@example.com"
   - "What is your phone number?" → You answer: "+1234567890"
   - "What date would you like to schedule?" → You answer: "December 15th"
   - "What time works for you?" → You answer: "2:00 PM"

3. **Trigger the notification action**:
   - The AI should say: *"Alright, I'm sending you a quick message now with all the details. Just give me a moment."*
   - Then: *"Got it! I've sent the message—please check your phone."*

### **Step 8: Verify the Results**

**Check Email Sent:**
- The email should be sent to: `john.doe@example.com`
- Subject: "Appointment Confirmed for John Doe"
- Content should have all variables replaced:
  ```
  Hi John Doe,
  
  Thank you for booking your appointment!
  
  Appointment Details:
  - Date: December 15th
  - Time: 2:00 PM
  - Phone: +1234567890
  - Email: john.doe@example.com
  ...
  ```

**Check SMS Sent:**
- SMS should be sent to: `+1234567890`
- Message should have variables replaced with actual values

---

## How It Works (Technical Flow)

### 1. **Action Creation**
```javascript
// When "Ask from User During Call" is selected:
is_user_group: true  // Line 214 in NotificationSubComponent.tsx
email: null          // Line 221 - no email set (will be asked)
phone_number: null   // Line 222 - no phone set (will be asked)
```

### 2. **Parameters Extraction**
The system scans your email/SMS templates for variables like `{variable_name}`:
- Always includes: `email`, `phone_number`
- Adds any custom variables found: `{full_name}`, `{appointment_date}`, etc.
- Creates a parameters object that tells the AI what to ask for

### 3. **During the Call**
- AI agent sees the action is available
- AI asks for each required parameter based on the descriptions
- Information is collected from the call transcript
- Variables are stored in memory

### 4. **Action Execution**
- AI calls the webhook: `https://api.eccentricai.ca/api/v1/webhook/tool/notification/...`
- Webhook receives:
  ```json
  {
    "email": "john.doe@example.com",
    "phone_number": "+1234567890",
    "full_name": "John Doe",
    "appointment_date": "December 15th",
    "appointment_time": "2:00 PM"
  }
  ```

### 5. **Template Rendering**
- Backend replaces `{variable_name}` with actual values
- Sends email to collected email address
- Sends SMS to collected phone number

---

## Troubleshooting

### ❌ **Problem: AI doesn't ask for information**

**Check:**
1. Is the action added to the AI agent's actions list?
2. Are the variable descriptions clear in Global Variables?
3. Is `strict: false` set? (Should be false for flexible collection)

### ❌ **Problem: Email/SMS not sent**

**Check:**
1. Verify webhook URL is accessible: `https://api.eccentricai.ca/api/v1/webhook/tool/notification/...`
2. Check backend logs for errors
3. Verify email/SMS service is configured on backend
4. Check if all required parameters were collected

### ❌ **Problem: Variables not replaced in email**

**Check:**
1. Variable names must match exactly (case-sensitive)
2. Variables must be wrapped in single curly braces: `{variable_name}`
3. All variables used must be in the `required` array of parameters

### ❌ **Problem: Wrong email/phone used**

**Check:**
1. Verify "Ask from User During Call" is selected (not "Custom")
2. If custom is selected, it uses the hardcoded email/phone from the form

---

## Testing Checklist

- [ ] Created notification action with "Ask from User During Call"
- [ ] Added variables to Global Variables with clear descriptions
- [ ] Created email template with `{email}`, `{phone_number}`, and custom variables
- [ ] Created SMS template with variables
- [ ] Added action to AI agent
- [ ] Made test call and provided all required information
- [ ] Verified email received with correct content
- [ ] Verified SMS received with correct content
- [ ] Checked that all variables were replaced correctly
- [ ] Tested with different variable combinations
- [ ] Verified error handling when information is missing

---

## Example Test Scenarios

### **Scenario 1: Simple Confirmation**
- **Variables**: `{email}`, `{phone_number}`, `{full_name}`
- **Test**: User provides all three during call
- **Expected**: Email and SMS sent with name populated

### **Scenario 2: Appointment Booking**
- **Variables**: `{email}`, `{phone_number}`, `{appointment_date}`, `{appointment_time}`, `{service_type}`
- **Test**: User books an appointment
- **Expected**: Confirmation email with all appointment details

### **Scenario 3: Missing Information**
- **Variables**: `{email}`, `{phone_number}`, `{full_name}`
- **Test**: User doesn't provide email
- **Expected**: AI keeps asking until email is provided (since it's required)

---

## Key Code Locations

- **Component**: `src/component/ActionsComponents/ActionConponent/NotificationSubComponent.tsx`
- **Parameter Building**: Lines 583-636 (`buildParametersObject`)
- **Variable Extraction**: Lines 547-580 (`extractVariablesFromContent`, `getAllVariablesFromContent`)
- **Action Submission**: Lines 207-340 (`onSubmit`)
- **Contact Method Toggle**: Line 342-344 (`handleContactChange`)

---

## Notes

- The AI agent uses the `description` field from parameters to know how to ask for each variable
- Variables are extracted using regex: `/\{([^}]+)\}/g` (matches `{variable_name}`)
- All variables are automatically added to the `required` array, so the AI must collect them all
- The action is "blocking" (line 238), meaning the AI waits for completion before continuing



