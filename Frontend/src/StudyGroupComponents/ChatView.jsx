
import { useEffect } from "react"
import { useParams } from "react-router-dom"
import {io} from 'socket.io-client'
import { apiContext } from "../ApiContext"
import { useContext } from "react"
import { useState } from "react"
import { authContext } from "../AuthContext"
import './ChatView.css'

export function ChatView(){

    const {groupId} = useParams()
    const {api} = useContext(apiContext)
    const [texts, setTexts] = useState([])
    const [message, setMessage] = useState('')
    const [newTextInput, setNewTextInput] = useState('')
    const {username} = useContext(authContext)

    useEffect(() => {
        const newSocket = io('http://localhost:5000/')

        newSocket.on('connect', () => {
            newSocket.emit('joinStudyGroupChat', groupId)
            newSocket.on('newText', getTexts)
        })

        return () => newSocket.disconnect()
    }, [])

    async function getTexts(){
        try{
            const ress = await api.get(`study-groups/${groupId}/get-chat-texts`)
            setTexts(ress.data)
        }catch(e){
            setMessage('something went wrong')
        }
        
    }

    useEffect(() => {
        getTexts()
    }, [])

    async function handleNewTextSubmit(e){
        e.preventDefault()
        try{
            const res = await api.post(`study-groups/${groupId}/create-chat-text`, {text: newTextInput})
            setNewTextInput('')
        }
        catch(e){
            console.log(e)
            setMessage('Something went wrong')
        }
    }

    return (
        <>
            
            <div className="chat-view">
                <div className="texts-container">
                    {texts.map(t => {
                    return (
                        <div className={t.texterId.username == username? 'text own': 'text'}>
                            <p>{t.texterId.username} : {t.text}</p>
                            
                        </div>
                    )
                })}
                </div>

                
                <div className="text-reply-input-container">
                    
                    <input onChange={(e) => setNewTextInput(e.target.value)} value={newTextInput}></input>
                    <button onClick={handleNewTextSubmit} >Send</button>
                </div>
            
            </div>
            
            
            
        </>
        

    )
}