import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import { describe, it } from "vitest";

const provider = new PactV3({
  consumer: "EmployeeLifecycleFrontend",
  provider: "EmployeeLifecycleAPI",
});

describe("Employees Contract", () => {
  it("should return employee list", async () => {
    provider
      .given("Employees exist")
      .uponReceiving("a request for employees")
      .withRequest({
        method: "GET",
        path: "/api/v1/employees",
        query: {
          page: "1",
          limit: "5",
        },
      })
      .willRespondWith({
        status: 200,
        body: {
          items: MatchersV3.eachLike({
            id: MatchersV3.string(),
            employee_code: MatchersV3.string(),
            first_name: MatchersV3.string(),
            last_name: MatchersV3.string(),
            email: MatchersV3.string(),
            department: MatchersV3.string(),
            designation: MatchersV3.string(),
            current_state: MatchersV3.string(),
            created_at: MatchersV3.string(),
          }),
          total: MatchersV3.integer(),
          page: MatchersV3.integer(),
          limit: MatchersV3.integer(),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/api/v1/employees?page=1&limit=5`
      );

      const data = await response.json();

      console.log(data);
    });
  });
});