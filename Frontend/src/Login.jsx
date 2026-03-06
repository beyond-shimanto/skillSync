import { Link } from "react-router-dom"
import { authContext } from "./AuthContext"
import { useContext, useState } from "react"
import './Login.css'



export function Login(){


    const {handleLogin, handleLogout, isLoggedIn} = useContext(authContext)
    const [usernameInput, setUsernameInput] = useState('')
    const [passwordInput, setPasswordInput] = useState('')
    const [error, setError] = useState('')
    const [message, setMessage] = useState('')


    const handleUsernameInput = (e) => {
        e.preventDefault()
        setUsernameInput(e.target.value)
    }

    const handlePassworldInput = (e) => {
        e.preventDefault()
        setPasswordInput(e.target.value)
    }


    const handleLoginSubmit = async (e) => {
        e.preventDefault()
        const loginSuccess = await handleLogin(usernameInput, passwordInput)
        if (!loginSuccess){
            setError('Failed to login')
            setMessage('')
        }
        else{
            setError('')
            
        }
        
        
    }

    const handleLogoutSubmit = async (e) => {
        e.preventDefault()
        const logoutSuccess = handleLogout()
        if (logoutSuccess){
            setMessage('Successfully Logged out')
            setError('')
        }
        else{
            setMessage('')
            setError('Failed to logout')
        }
    }

    return (
    <>
    <div className="content-container">
        {error && <p>{error}</p>}
        {message && <p>{message}</p>}
        {isLoggedIn? 
    <>
        <p>You're already logged in!</p>
        <Link to={'/'}>Home</Link>
        <button onClick={handleLogoutSubmit}>Logout</button>    
    </> 
    : 
    <>
        <p>Please login</p>
        <p>Username: </p>
        <input onChange={handleUsernameInput}></input>
        <p>Password: </p>
        <input onChange={handlePassworldInput}></input>
        <br></br>
        <button onClick={handleLoginSubmit}>Login</button>
    </>}
    </div>
    
        
        

    </>
    )
}