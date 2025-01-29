import { ToolboxConfig } from "@dainprotocol/service-sdk";
import { getCalendarEventsConfig } from "../tools/get-calendar-events-tool";
import { createCalendarEventConfig } from "../tools/create-calendar-event-tool";
import { getCalendarViewConfig } from "../tools/get-calendar-view-tool";

const outlookCalendarToolbox: ToolboxConfig = {
  id: "outlook-calendar-toolbox",
  name: "Outlook Calendar Toolbox",
  description: "A collection of tools for managing Outlook Calendar events",
  tools: [
    getCalendarEventsConfig.id,
    createCalendarEventConfig.id,
    getCalendarViewConfig.id,
  ],
  metadata: {
    complexity: "Medium",
    applicableFields: ["Calendar", "Scheduling", "Time Management"],
  },
  recommendedPrompt: `Use this toolbox to manage your Outlook Calendar events. You can:
- Get a list of upcoming events
- Create new calendar events
- View events within a specific time range`,
};

export { outlookCalendarToolbox };
