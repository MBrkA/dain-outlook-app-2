import { dainService } from "./services/outlook-service";

/**
 * Start the DAIN Service for Outlook Calendar
 */
(async () => {
  await dainService.startNode({ port: 2022 });
  console.log("Outlook Calendar Service started on port 2022");
})();
