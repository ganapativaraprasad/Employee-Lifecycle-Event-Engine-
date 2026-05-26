import { Navigate } from "react-router-dom"

type Props = {
	allowedRoles?: string[]
	children: React.ReactNode
}

function ProtectedRoute({
	allowedRoles,
	children
}: Props) {

	const token = localStorage.getItem(
		"access_token"
	)

	const role = localStorage.getItem(
		"user_role"
	)

	if (!token) {
		return <Navigate to="/" />
	}

	if (
		allowedRoles &&
		(!role || !allowedRoles.includes(role))
	) {
		return <Navigate to="/dashboard" />
	}

	return <>{children}</>
}

export default ProtectedRoute
