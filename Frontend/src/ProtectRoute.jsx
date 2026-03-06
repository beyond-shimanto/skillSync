import { useContext } from "react"
import { authContext } from "./AuthContext"
import { useNavigate, Navigate } from "react-router-dom"

export function ProtectedRoute({children}){

    const {isLoggedIn, isAuthLoading} = useContext(authContext)

    if(isAuthLoading){
        return <div>Loading...</div>
    }
    if(!isLoggedIn){
        return <Navigate to="/login" replace/>
    }

    return(
        children
    )
}