import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import { describe, it } from "vitest";

const provider = new PactV3({
  consumer: "EmployeeLifecycleFrontend",
  provider: "EmployeeLifecycleAPI",
});

describe("Transition Contract", () => {
  it("should transition employee state", async () => {
    provider
      .given("Employee exists")
      .uponReceiving("a valid employee transition request")
      .withRequest({
        method: "PATCH",
        path: "/api/v1/employees/123/transition",
        headers: {
          "Content-Type": "application/json",
        },
        body: {
          new_state: "ACTIVE",
          reason: "Contract Test",
        },
      })
      .willRespondWith({
        status: 200,
        body: {
          message: MatchersV3.string(),
          employee_id: MatchersV3.string(),
          new_state: MatchersV3.string(),
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/api/v1/employees/123/transition`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            new_state: "ACTIVE",
            reason: "Contract Test",
          }),
        }
      );

      const data = await response.json();

      console.log(data);
    });
  });
});