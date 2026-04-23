import { useEffect, useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiContext } from '../ApiContext'
import './InboxView.css'

export function InboxView() {
    const { api } = useContext(apiContext)
    const navigate = useNavigate()
    const [conversations, setConversations] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function fetchInbox() {
            try {
                const res = await api.get('/direct-messages/inbox')
                setConversations(res.data)
            } catch {
                setError('Could not load inbox.')
            } finally {
                setLoading(false)
            }
        }
        fetchInbox()
    }, [])

    const pictureUrl = (path) => path ? `http://localhost:5000${path}` : null

    return (
        <div className="inbox-page">
            <div className="inbox-header">
                <button className="inbox-back-btn" onClick={() => navigate('/account')}>
                    ← Back
                </button>
                <h2>Inbox</h2>
            </div>

            {loading && <p className="inbox-status">Loading...</p>}
            {error && <p className="inbox-status inbox-error">{error}</p>}

            {!loading && !error && conversations.length === 0 && (
                <p className="inbox-status inbox-empty">No messages yet.</p>
            )}

            <div className="inbox-list">
                {conversations.map((conv) => {
                    const pic = pictureUrl(conv.otherUser.profilePicture)
                    return (
                        <button
                            key={conv.conversationId}
                            className="inbox-item"
                            onClick={() => navigate(`/direct-messages/${conv.conversationId}`)}
                        >
                            <div className="inbox-avatar">
                                {pic
                                    ? <img src={pic} alt={conv.otherUser.username} />
                                    : <span>{conv.otherUser.username?.[0]?.toUpperCase() ?? '?'}</span>
                                }
                            </div>
                            <div className="inbox-info">
                                <span className="inbox-username">@{conv.otherUser.username}</span>
                                <span className="inbox-preview">
                                    {conv.lastMessage ? conv.lastMessage.text : 'No messages yet'}
                                </span>
                            </div>
                        </button>
                    )
                })}
            </div>
        </div>
    )
}
