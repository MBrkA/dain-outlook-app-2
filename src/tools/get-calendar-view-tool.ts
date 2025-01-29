import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import axios from "axios";
import { getTokenStore } from "../token-store";

const getCalendarViewConfig: ToolConfig = {
  id: "get-calendar-view",
  name: "Get Calendar View",
  description: "Get calendar events within a specific time range",
  input: z.object({
    startTime: z.string().describe("Start time in ISO format"),
    endTime: z.string().describe("End time in ISO format"),
  }),
  output: z.object({
    events: z.array(z.any()),
  }),
  handler: async ({ startTime, endTime }, agentInfo, { app }) => {
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
            provider: "microsoft",
          }),
        },
      };
    }

    const response = await axios.get(
      `https://graph.microsoft.com/v1.0/me/calendar/calendarView?startDateTime=${startTime}&endDateTime=${endTime}`,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      }
    );

    const events = response.data.value.map((event: any) => ({
      id: event.id,
      subject: event.subject,
      start: event.start.dateTime,
      end: event.end.dateTime,
      location: event.location?.displayName || "No location",
      status: event.showAs,
    }));

    return {
      text: `Found ${events.length} events in the specified time range`,
      data: { events },
      ui: {
        type: "table",
        uiData: JSON.stringify({
          columns: [
            { key: "subject", header: "Subject", type: "text" },
            { key: "start", header: "Start Time", type: "text" },
            { key: "end", header: "End Time", type: "text" },
            { key: "location", header: "Location", type: "text" },
            { key: "status", header: "Status", type: "text" },
          ],
          rows: events,
        }),
      },
    };
  },
};

export { getCalendarViewConfig };
