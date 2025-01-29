import { ToolConfig } from "@dainprotocol/service-sdk";
import { z } from "zod";
import axios from "axios";
import { getTokenStore } from "../token-store";

const createCalendarEventConfig: ToolConfig = {
  id: "create-calendar-event",
  name: "Create Calendar Event",
  description: "Create a new event in Outlook Calendar",
  input: z.object({
    subject: z.string().describe("Subject of the event"),
    start: z.string().describe("Start time in ISO format"),
    end: z.string().describe("End time in ISO format"),
    location: z.string().optional().describe("Location of the event"),
    description: z.string().optional().describe("Description of the event"),
  }),
  output: z.object({
    event: z.any(),
  }),
  handler: async (input, agentInfo, { app }) => {
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

    const eventData = {
      subject: input.subject,
      start: {
        dateTime: input.start,
        timeZone: "UTC",
      },
      end: {
        dateTime: input.end,
        timeZone: "UTC",
      },
      location: input.location ? {
        displayName: input.location,
      } : null,
      body: input.description ? {
        contentType: "text",
        content: input.description,
      } : null,
    };

    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/calendar/events",
      eventData,
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return {
      text: `Created calendar event: ${input.subject}`,
      data: { event: response.data },
      ui: {
        type: "card",
        uiData: JSON.stringify({
          title: "Event Created",
          content: `Successfully created event "${input.subject}"`,
          fields: [
            { label: "Start", value: input.start },
            { label: "End", value: input.end },
            { label: "Location", value: input.location || "No location" },
          ],
        }),
      },
    };
  },
};

export { createCalendarEventConfig };
