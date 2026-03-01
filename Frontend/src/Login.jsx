import { accessTokenContext } from "./AuthContext"
import { useContext, useState } from "react"








export function Login(){


    const {handleLogin, handleLogout, isLoggedIn} = useContext(accessTokenContext)
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
            setMessage('Sucessfully logged in!')
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
    {error && <p>{error}</p>}
    {message && <p>{message}</p>}
    {isLoggedIn? 
    <>
        <p>You're already logged in!</p>
        <button onClick={handleLogoutSubmit}>Logout</button>    
    </> 
    : 
    <>
        <p>Username: </p>
        <input onChange={handleUsernameInput}></input>
        <p>Password: </p>
        <input onChange={handlePassworldInput}></input>
    
        <button onClick={handleLoginSubmit}>Login</button>
    </>}
        
        

    </>
    )
}