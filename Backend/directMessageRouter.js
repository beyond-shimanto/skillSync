import express from 'express'
import { authenticate } from './server.js'
import { directConversationModel, directMessageModel } from './models.js'
import { io } from './server.js'

const router = express.Router()

router.get('/inbox', authenticate, async (req, res) => {
    const currentUserId = req.userObject.userId

    try {
        const conversations = await directConversationModel
            .find({ participants: currentUserId })
            .populate('participants', 'username profilePicture')
            .sort({ updatedAt: -1 })

        const result = await Promise.all(conversations.map(async (conv) => {
            const otherUser = conv.participants.find(p => p._id.toString() !== currentUserId.toString())
            const lastMessage = await directMessageModel
                .findOne({ conversationId: conv._id })
                .sort({ createdAt: -1 })
                .select('text createdAt')

            return {
                conversationId: conv._id,
                otherUser: {
                    _id: otherUser._id,
                    username: otherUser.username,
                    profilePicture: otherUser.profilePicture
                },
                lastMessage: lastMessage ? { text: lastMessage.text, createdAt: lastMessage.createdAt } : null
            }
        }))

        res.status(200).json(result)
    } catch {
        res.status(500).json({ error: 'Server error' })
    }
})

router.post('/start-or-get-conversation', authenticate, async (req, res) => {
    const currentUserId = req.userObject.userId
    const { otherUserId } = req.body

    if (!otherUserId) return res.status(400).json({ error: 'otherUserId required' })
    if (currentUserId.toString() === otherUserId.toString()) {
        return res.status(400).json({ error: 'Cannot message yourself' })
    }

    try {
        let conversation = await directConversationModel.findOne({
            participants: { $all: [currentUserId, otherUserId], $size: 2 }
        })

        if (!conversation) {
            conversation = new directConversationModel({ participants: [currentUserId, otherUserId] })
            await conversation.save()
        }

        res.status(200).json({ conversationId: conversation._id })
    } catch {
        res.status(500).json({ error: 'Server error' })
    }
})

router.get('/:conversationId/messages', authenticate, async (req, res) => {
    const currentUserId = req.userObject.userId
    const { conversationId } = req.params

    try {
        const conversation = await directConversationModel.findById(conversationId)
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

        const isParticipant = conversation.participants.some(p => p.toString() === currentUserId.toString())
        if (!isParticipant) return res.status(403).json({ error: 'Forbidden' })

        const messages = await directMessageModel
            .find({ conversationId })
            .populate('senderId', 'username profilePicture')
            .sort({ createdAt: 1 })

        res.status(200).json(messages)
    } catch {
        res.status(500).json({ error: 'Server error' })
    }
})

router.post('/:conversationId/send-message', authenticate, async (req, res) => {
    const currentUserId = req.userObject.userId
    const { conversationId } = req.params
    const { text } = req.body

    if (!text?.trim()) return res.status(400).json({ error: 'Message text required' })

    try {
        const conversation = await directConversationModel.findById(conversationId)
        if (!conversation) return res.status(404).json({ error: 'Conversation not found' })

        const isParticipant = conversation.participants.some(p => p.toString() === currentUserId.toString())
        if (!isParticipant) return res.status(403).json({ error: 'Forbidden' })

        const message = new directMessageModel({
            conversationId,
            senderId: currentUserId,
            text: text.trim()
        })
        await message.save()

        io.to(`dmRoom_${conversationId}`).emit('newDirectMessage')

        res.status(200).json({ message: 'Message sent' })
    } catch {
        res.status(500).json({ error: 'Server error' })
    }
})

export { router as directMessageRouter }
