import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import { describe, it } from "vitest";

const provider = new PactV3({
  consumer: "EmployeeLifecycleFrontend",
  provider: "EmployeeLifecycleAPI",
});

describe("Dashboard Contract", () => {
  it("should return dashboard stats", async () => {
    provider
      .given("Dashboard statistics exist")
      .uponReceiving("a request for dashboard stats")
      .withRequest({
        method: "GET",
        path: "/api/v1/dashboard/stats",
      })
      .willRespondWith({
        status: 200,
        body: {
          total_employees: MatchersV3.integer(),
          active_employees: MatchersV3.integer(),
          onboarding_employees: MatchersV3.integer(),
          on_leave_employees: MatchersV3.integer(),
          suspended_employees: MatchersV3.integer(),
          offboarded_employees: MatchersV3.integer(),

          department_distribution: MatchersV3.eachLike({
            department: MatchersV3.string(),
            count: MatchersV3.integer(),
          }),

          recent_activities: MatchersV3.eachLike({
            employee_id: MatchersV3.string(),
            actor_id: MatchersV3.string(),
            action: MatchersV3.string(),
            old_state: MatchersV3.string(),
            new_state: MatchersV3.string(),
            reason: MatchersV3.string(),
            created_at: MatchersV3.string(),
          }),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/api/v1/dashboard/stats`
      );

      const data = await response.json();

      console.log(data);
    });
  });
});