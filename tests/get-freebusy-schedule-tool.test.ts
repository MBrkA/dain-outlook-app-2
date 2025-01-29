import axios from "axios";
import { getFreeBusyScheduleConfig } from "../src/tools/get-freebusy-schedule-tool";
import { Hono } from "hono";
import { getTokenStore } from "../src/token-store";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("get-freebusy-schedule-tool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTokenStore().clear();
  });

  it("should return oauth2 UI when not authenticated", async () => {
    const input = {
      schedules: ["user1@example.com"],
      startTime: "2024-01-01T00:00:00Z",
      endTime: "2024-01-02T00:00:00Z"
    };
    
    const app = new Hono();
    app.oauth2 = {
      generateAuthUrl: jest.fn().mockResolvedValue("https://auth-url")
    };

    const response = await getFreeBusyScheduleConfig.handler(
      input,
      { id: "test-agent", agentId: "test-agent", address: "test-address" },
      { app }
    );

    expect(response.ui.type).toBe("oauth2");
    expect(JSON.parse(response.ui.uiData)).toHaveProperty("url", "https://auth-url");
  });

  it("should return schedule information when authenticated", async () => {
    const mockScheduleResponse = {
      value: [
        {
          scheduleId: "user1@example.com",
          availabilityView: "000220000",
          workingHours: {
            startTime: "08:00:00.0000000",
            endTime: "17:00:00.0000000"
          },
          scheduleItems: [
            {
              status: "busy",
              start: { dateTime: "2024-01-01T10:00:00Z" },
              end: { dateTime: "2024-01-01T11:00:00Z" }
            }
          ]
        }
      ]
    };

    mockedAxios.post.mockResolvedValueOnce({ data: mockScheduleResponse });
    
    getTokenStore().setToken("test-agent", {
      accessToken: "test-token",
      refreshToken: "refresh-token", 
      expiresIn: 3600
    });

    const input = {
      schedules: ["user1@example.com"],
      startTime: "2024-01-01T00:00:00Z", 
      endTime: "2024-01-02T00:00:00Z"
    };

    const response = await getFreeBusyScheduleConfig.handler(
      input,
      { id: "test-agent", agentId: "test-agent", address: "test-address" },
      { app: new Hono() }
    );

    expect(mockedAxios.post).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/users/me/calendar/getSchedule",
      expect.any(Object),
      expect.any(Object)
    );

    expect(response.data.scheduleInfo).toHaveLength(1);
    expect(response.ui.type).toBe("table");
  });
});
