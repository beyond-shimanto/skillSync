import { useEffect, useState, useContext, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'
import { apiContext } from '../ApiContext'
import { authContext } from '../AuthContext'
import { UserProfileModal } from '../accountcComponents/UserProfileModal'
import './DirectMessageView.css'

export function DirectMessageView() {
    const { conversationId } = useParams()
    const { api } = useContext(apiContext)
    const { username } = useContext(authContext)
    const [messages, setMessages] = useState([])
    const [inputText, setInputText] = useState('')
    const [error, setError] = useState('')
    const [viewingUserId, setViewingUserId] = useState(null)
    const bottomRef = useRef(null)

    useEffect(() => {
        const socket = io('http://localhost:5000/')
        socket.on('connect', () => {
            socket.emit('joinDirectMessageRoom', conversationId)
            socket.on('newDirectMessage', fetchMessages)
        })
        return () => socket.disconnect()
    }, [conversationId])

    async function fetchMessages() {
        try {
            const res = await api.get(`/direct-messages/${conversationId}/messages`)
            setMessages(res.data)
        } catch {
            setError('Could not load messages.')
        }
    }

    useEffect(() => {
        fetchMessages()
    }, [conversationId])

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    async function handleSend(e) {
        e.preventDefault()
        if (!inputText.trim()) return
        try {
            await api.post(`/direct-messages/${conversationId}/send-message`, { text: inputText })
            setInputText('')
        } catch {
            setError('Failed to send message.')
        }
    }

    return (
        <>
            <div className="dm-view">
                <div className="dm-messages">
                    {error && <p className="dm-error">{error}</p>}
                    {messages.map(m => (
                        <div
                            key={m._id}
                            className={m.senderId.username === username ? 'dm-bubble own' : 'dm-bubble'}
                        >
                            <span
                                className="dm-username-link"
                                onClick={() => setViewingUserId(m.senderId._id)}
                            >
                                {m.senderId.username}
                            </span>
                            {': '}{m.text}
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                <form className="dm-input-area" onSubmit={handleSend}>
                    <input
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Type a message..."
                    />
                    <button type="submit">Send</button>
                </form>
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
