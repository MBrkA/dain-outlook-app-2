import axios from "axios";
import { getCalendarEventsConfig } from "../src/tools/get-calendar-events-tool";
import { Hono } from "hono";
import { getTokenStore } from "../src/token-store";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("get-calendar-events-tool", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getTokenStore().clear();
  });

  it("should return oauth2 UI when not authenticated", async () => {
    const input = { top: 10 };
    const app = new Hono();
    app.oauth2 = {
      generateAuthUrl: jest.fn().mockResolvedValue("https://auth-url"),
    };

    const response = await getCalendarEventsConfig.handler(
      input,
      { id: "test-agent", agentId: "test-agent", address: "test-address" },
      { app }
    );

    expect(response.ui.type).toBe("oauth2");
    expect(JSON.parse(response.ui.uiData)).toHaveProperty("url", "https://auth-url");
  });

  it("should return calendar events when authenticated", async () => {
    const mockEvents = {
      value: [
        {
          id: "1",
          subject: "Test Event",
          start: { dateTime: "2024-01-01T10:00:00Z" },
          end: { dateTime: "2024-01-01T11:00:00Z" },
          location: { displayName: "Test Location" },
        },
      ],
    };

    mockedAxios.get.mockResolvedValueOnce({ data: mockEvents });
    
    getTokenStore().setToken("test-agent", {
      accessToken: "test-token",
      refreshToken: "refresh-token",
      expiresIn: 3600,
    });

    const input = { top: 10 };
    const response = await getCalendarEventsConfig.handler(
      input,
      { id: "test-agent", agentId: "test-agent", address: "test-address" },
      { app: new Hono() }
    );

    expect(mockedAxios.get).toHaveBeenCalledWith(
      "https://graph.microsoft.com/v1.0/me/calendar/events?$top=10",
      {
        headers: {
          Authorization: "Bearer test-token",
        },
      }
    );

    expect(response.data.events).toHaveLength(1);
    expect(response.ui.type).toBe("table");
  });
});
