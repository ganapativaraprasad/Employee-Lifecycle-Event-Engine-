import { PactV3, MatchersV3 } from "@pact-foundation/pact";
import { describe, it } from "vitest";

const provider = new PactV3({
  consumer: "EmployeeLifecycleFrontend",
  provider: "EmployeeLifecycleAPI",
});

describe("Auth Contract", () => {
  it("should login successfully", async () => {
    provider
      .given("Valid user exists")
      .uponReceiving("a login request")
      .withRequest({
        method: "POST",
        path: "/api/v1/auth/login",
      })
      .willRespondWith({
        status: 200,
        body: {
          access_token: MatchersV3.string(),
          refresh_token: MatchersV3.string(),
          token_type: MatchersV3.string("bearer"),
          user: {
            id: MatchersV3.string(),
            username: MatchersV3.string(),
            email: MatchersV3.string(),
            role: MatchersV3.string(),
          },
        },
      });

    await provider.executeTest(async (mockServer) => {
      const response = await fetch(
        `${mockServer.url}/api/v1/auth/login`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      console.log(data);
    });
  });
});