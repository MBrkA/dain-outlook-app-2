import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import axios from "axios";
import { getTokenStore } from "../token-store";

const getCalendarEventsConfig: ToolConfig = {
  id: "get-calendar-events",
  name: "Get Calendar Events",
  description: "Retrieve events from Outlook Calendar",
  input: z.object({
    top: z.number().optional().describe("Number of events to retrieve (max 50)"),
  }),
  output: z.object({
    events: z.array(z.any()),
  }),
  handler: async ({ top = 10 }, agentInfo, { app }) => {
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
      `https://graph.microsoft.com/v1.0/me/calendar/events?$top=${top}`,
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
    }));

    return {
      text: `Retrieved ${events.length} calendar events`,
      data: { events },
      ui: {
        type: "table",
        uiData: JSON.stringify({
          columns: [
            { key: "subject", header: "Subject", type: "text" },
            { key: "start", header: "Start Time", type: "text" },
            { key: "end", header: "End Time", type: "text" },
            { key: "location", header: "Location", type: "text" },
          ],
          rows: events,
        }),
      },
    };
  },
};

export { getCalendarEventsConfig };
