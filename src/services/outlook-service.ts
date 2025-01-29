import { createOAuth2Tool, defineDAINService } from "@dainprotocol/service-sdk";
import { getTokenStore } from "../token-store";
import { getCalendarEventsConfig } from "../tools/get-calendar-events-tool";
import { createCalendarEventConfig } from "../tools/create-calendar-event-tool";
import { getCalendarViewConfig } from "../tools/get-calendar-view-tool";
import { outlookCalendarToolbox } from "../toolboxes/outlook-calendar-toolbox";

const dainService = defineDAINService({
  metadata: {
    title: "Outlook Calendar Service",
    description: "A DAIN service for managing Outlook Calendar events",
    version: "1.0.0",
    author: "DAIN Developer",
    tags: ["calendar", "outlook", "microsoft"],
  },
  identity: {
    apiKey: process.env.DAIN_API_KEY,
  },
  tools: [
    createOAuth2Tool("microsoft"),
    getCalendarEventsConfig,
    createCalendarEventConfig,
    getCalendarViewConfig,
  ],
  toolboxes: [outlookCalendarToolbox],
  oauth2: {
    baseUrl: process.env.TUNNEL_URL || "http://localhost:2022",
    providers: {
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID as string,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET as string,
        authorizationUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
        tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
        scopes: [
          "Calendars.ReadWrite",
          "User.Read",
        ],
        onSuccess: async (agentId, tokens) => {
          console.log("Completed OAuth flow for agent", agentId);
          getTokenStore().setToken(agentId, tokens);
          console.log(`Stored tokens for agent ${agentId}`);
        },
      },
    },
  },
});

export { dainService };
