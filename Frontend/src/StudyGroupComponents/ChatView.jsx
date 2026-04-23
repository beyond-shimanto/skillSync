
import { useEffect, useState, useContext } from "react"
import { useParams } from "react-router-dom"
import {io} from 'socket.io-client'
import { apiContext } from "../ApiContext"
import { authContext } from "../AuthContext"
import { UserProfileModal } from "../accountcComponents/UserProfileModal"
import './ChatView.css'

export function ChatView(){

    const {groupId} = useParams()
    const {api} = useContext(apiContext)
    const [texts, setTexts] = useState([])
    const [message, setMessage] = useState('')
    const [newTextInput, setNewTextInput] = useState('')
    const {username} = useContext(authContext)
    const [viewingUserId, setViewingUserId] = useState(null)

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
                        <div key={t._id} className={t.texterId.username == username? 'text own': 'text'}>
                            <p>
                                <span
                                    className="chat-username-link"
                                    onClick={() => setViewingUserId(t.texterId._id)}
                                >
                                    {t.texterId.username}
                                </span>
                                {' '}: {t.text}
                            </p>
                        </div>
                    )
                })}
                </div>


                <div className="text-reply-input-container">

                    <input onChange={(e) => setNewTextInput(e.target.value)} value={newTextInput}></input>
                    <button onClick={handleNewTextSubmit} >Send</button>
                </div>

            </div>

            {viewingUserId && (
                <UserProfileModal
                    userId={viewingUserId}
                    onClose={() => setViewingUserId(null)}
                />
            )}

        </>


    )
}