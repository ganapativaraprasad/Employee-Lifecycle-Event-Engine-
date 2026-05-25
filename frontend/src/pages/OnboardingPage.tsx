function OnboardingPage() {

  return (

    <div>

      <div className="mb-8">

        <h1 className="text-5xl font-bold text-gray-800">

          Onboarding

        </h1>

        <p className="text-gray-500 mt-3 text-lg">

          Manage onboarding employees

        </p>

      </div>

      <div className="bg-white rounded-2xl shadow-md p-10">

        <h2 className="text-2xl font-semibold mb-4">

          Employee Onboarding Workflow

        </h2>

        <div className="space-y-4">

          <div className="p-5 bg-blue-50 rounded-xl border border-blue-200">

            <h3 className="font-semibold text-lg text-blue-700">

              Step 1 — HR Verification

            </h3>

            <p className="text-gray-600 mt-1">

              Verify employee documents and details.

            </p>

          </div>

          <div className="p-5 bg-yellow-50 rounded-xl border border-yellow-200">

            <h3 className="font-semibold text-lg text-yellow-700">

              Step 2 — Manager Approval

            </h3>

            <p className="text-gray-600 mt-1">

              Manager reviews and approves onboarding.

            </p>

          </div>

          <div className="p-5 bg-green-50 rounded-xl border border-green-200">

            <h3 className="font-semibold text-lg text-green-700">

              Step 3 — Employee Activation

            </h3>

            <p className="text-gray-600 mt-1">

              Employee becomes ACTIVE in the system.

            </p>

          </div>

        </div>

      </div>

    </div>
  )
}

export default OnboardingPage