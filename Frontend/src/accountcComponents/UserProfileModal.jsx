import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiContext } from '../ApiContext'
import { authContext } from '../AuthContext'
import './UserProfileModal.css'

export function UserProfileModal({ userId, onClose }) {
    const { api } = useContext(apiContext)
    const { userId: currentUserId } = useContext(authContext)
    const navigate = useNavigate()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        async function fetchProfile() {
            try {
                const res = await api.get(`/account/profile/${userId}`)
                setProfile(res.data)
            } catch {
                setError('Failed to load profile.')
            } finally {
                setLoading(false)
            }
        }
        fetchProfile()
    }, [userId])

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose() }
        document.addEventListener('keydown', handleKey)
        return () => document.removeEventListener('keydown', handleKey)
    }, [onClose])

    async function handleMessageClick() {
        try {
            const res = await api.post('/direct-messages/start-or-get-conversation', { otherUserId: userId })
            onClose()
            navigate(`/direct-messages/${res.data.conversationId}`)
        } catch {
            setError('Could not start conversation.')
        }
    }

    const pictureUrl = profile?.profilePicture
        ? `http://localhost:5000${profile.profilePicture}`
        : null

    const isOwnProfile = userId?.toString() === currentUserId?.toString()

    return (
        <div className="upm-overlay" onClick={onClose}>
            <div className="upm-modal" onClick={(e) => e.stopPropagation()}>
                <button className="upm-close" onClick={onClose}>✕</button>

                {loading && <p className="upm-loading">Loading...</p>}
                {error && <p className="upm-error">{error}</p>}

                {profile && (
                    <>
                        <div className="upm-avatar">
                            {pictureUrl
                                ? <img src={pictureUrl} alt="Profile" />
                                : <div className="upm-avatar-placeholder">{profile.username?.[0]?.toUpperCase() ?? '?'}</div>
                            }
                        </div>
                        <h3 className="upm-username">@{profile.username}</h3>

                        {!isOwnProfile && (
                            <button className="upm-message-btn" onClick={handleMessageClick}>
                                Message
                            </button>
                        )}

                        <div className="upm-section">
                            <span className="upm-label">Bio</span>
                            <p className="upm-bio">
                                {profile.bio || <span className="upm-empty">No bio yet.</span>}
                            </p>
                        </div>

                        {profile.achievements?.length > 0 && (
                            <div className="upm-section">
                                <span className="upm-label">Achievements</span>
                                <ul className="upm-achievements">
                                    {profile.achievements.map((a, i) => (
                                        <li key={i}>{a}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
