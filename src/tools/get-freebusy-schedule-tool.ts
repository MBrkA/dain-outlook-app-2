import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import axios from "axios";
import { getTokenStore } from "../token-store";

const getFreeBusyScheduleConfig: ToolConfig = {
  id: "get-freebusy-schedule",
  name: "Get Free/Busy Schedule", 
  description: "Get free/busy availability information for users in a specified time period",
  input: z.object({
    schedules: z.array(z.string()).describe("Email addresses of users to check availability for"),
    startTime: z.string().describe("Start time in ISO format"),
    endTime: z.string().describe("End time in ISO format"),
    availabilityViewInterval: z.number().optional().describe("Duration of time slots in minutes (default: 30)")
  }),
  output: z.object({
    scheduleInfo: z.array(z.any())
  }),
  handler: async ({ schedules, startTime, endTime, availabilityViewInterval = 30 }, agentInfo, { app }) => {
    const tokens = getTokenStore().getToken(agentInfo.id);
    if (!tokens) {
      const authUrl = await app.oauth2?.generateAuthUrl("microsoft", agentInfo.id);
      return {
        text: "Authentication required",
        data: null,
        ui: {
          type: "oauth2",
          uiData: JSON.stringify({
            title: "Microsoft Authentication",
            logo: "https://img.icons8.com/color/48/000000/microsoft.png",
            content: "Please authenticate with Microsoft",
            url: authUrl,
            provider: "microsoft"
          })
        }
      };
    }

    const requestBody = {
      schedules,
      startTime: {
        dateTime: startTime,
        timeZone: "UTC"
      },
      endTime: {
        dateTime: endTime,
        timeZone: "UTC" 
      },
      availabilityViewInterval
    };

    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/users/me/calendar/getSchedule",
      requestBody,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json"
        }
      }
    );

    const scheduleInfo = response.data.value.map((schedule: any) => ({
      scheduleId: schedule.scheduleId,
      availability: schedule.availabilityView,
      workingHours: schedule.workingHours,
      scheduleItems: schedule.scheduleItems?.map((item: any) => ({
        status: item.status,
        start: item.start.dateTime,
        end: item.end.dateTime
      }))
    }));

    return {
      text: `Retrieved availability for ${schedules.length} users`,
      data: { scheduleInfo },
      ui: {
        type: "table",
        uiData: JSON.stringify({
          columns: [
            { key: "scheduleId", header: "User", type: "text" },
            { key: "availability", header: "Availability", type: "text" },
            { key: "workingHours", header: "Working Hours", type: "text" }
          ],
          rows: scheduleInfo.map((info: any) => ({
            scheduleId: info.scheduleId,
            availability: info.availability,
            workingHours: `${info.workingHours?.startTime || 'N/A'} - ${info.workingHours?.endTime || 'N/A'}`
          }))
        })
      }
    };
  }
};

export { getFreeBusyScheduleConfig };
