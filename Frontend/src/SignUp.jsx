
import { useState, useContext } from "react"
import { authContext } from "./AuthContext"
import { apiContext } from "./ApiContext"
import { Link } from "react-router-dom"

import './SignUp.css'


export function SignUp(){

    const {isLoggedIn, handleLogout, handleSignup} = useContext(authContext)

    const [usernameInput, setUsernameInput] = useState('')
    const [passwordInput, setPasswordInput] = useState('')
    const [tags, setTags] = useState([])
    const [tagInput, setTagInput] = useState('')
    const [type, setType] = useState('student')
    const [message, setMessage] = useState('')


    function handleUsernameInput(e){
        e.preventDefault()
        setUsernameInput(e.target.value)
    }

    function handlePasswordInput(e){
        e.preventDefault()
        setPasswordInput(e.target.value)
    }

    function handleTagInput(e){
        e.preventDefault()
        setTagInput(e.target.value)
    }

    function handleTagAddClick(e){
        e.preventDefault()
        setTags(prev => {return [...prev, tagInput]})
        setTagInput('')

    }

    function handleTypeInput(e){
        e.preventDefault()
        setType(e.target.value)
    }

    function handleTagDelete(tag){
        setTags(prev => prev.filter(t => t !== tag))
    }

    async function handleSubmit(){
        const signupSuccess = await handleSignup(usernameInput, passwordInput, tags)
        if (signupSuccess){
            setMessage('Successfully signed up! Now login')
        }
        else{
            setMessage('Failed to sign up')
        }
    }



    if(isLoggedIn){
        return(
            <>
            <div className="content-container">
                <h1>You must logout first!</h1>
                <button onClick = {handleLogout}>Logout</button>
            </div>
            
            </>
        )
    }

    return (
        <>
        <div className="content-container">
            <Link to="/login"><p>Login</p></Link>
            {<p>{message}</p>}
            <h1>Sign up!</h1>
            <p>Username: </p>
            <input onChange={handleUsernameInput} value={usernameInput}></input>
            <p>Password: </p>
            <input onChange={handlePasswordInput} value={passwordInput}></input>
            <p>Interested Skill tags:</p>
            <div className="tag-pills-container">
                {tags.map(t => <div className="tag-pill tag-pill-deletable" onClick={(e) => handleTagDelete(t)}>
                    {t}
                </div>)}
            </div>
            
            <div className="tag-input-container">

                <label>Add tag: </label>
                <input style={{margin: "0 0.5rem"}} onChange={handleTagInput} value={tagInput}></input>
                <a onClick={handleTagAddClick}>Add tag</a>
            </div>
            
            

            <p>Account type:</p>
            <select onChange={handleTypeInput} value={type}>
                <option value = "student" >Student</option>
                <option value = "mentor" >Mentor</option>
            </select>
            <br></br>
            <button onClick={handleSubmit}>Submit</button>

        </div>
        

        </>
    )
}