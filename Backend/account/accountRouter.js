import express from 'express'
import multer from 'multer'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import { authenticate } from '../server.js'
import { userModel } from '../models.js'

export const accountRouter = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const uploadsDir = path.join(__dirname, '..', 'uploads', 'profile-pictures')
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadsDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname)
        cb(null, `profile-${req.userObject.userId}${ext}`)
    }
})

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) cb(null, true)
        else cb(new Error('Only image files are allowed'))
    }
})

accountRouter.get('/profile', authenticate, async (req, res) => {
    try {
        const user = await userModel.findById(req.userObject.userId)
        if (!user) return res.status(404).json({ error: 'User not found' })

        res.status(200).json({
            username: user.username,
            bio: user.bio,
            profilePicture: user.profilePicture,
            achievements: user.achievements
        })
    } catch (e) {
        res.status(500).json({ error: 'Server error' })
    }
})

accountRouter.put('/profile', authenticate, async (req, res) => {
    const { bio, achievements } = req.body

    try {
        const user = await userModel.findByIdAndUpdate(
            req.userObject.userId,
            {
                ...(bio !== undefined && { bio }),
                ...(achievements !== undefined && { achievements })
            },
            { new: true }
        )
        if (!user) return res.status(404).json({ error: 'User not found' })

        res.status(200).json({
            username: user.username,
            bio: user.bio,
            profilePicture: user.profilePicture,
            achievements: user.achievements
        })
    } catch (e) {
        res.status(500).json({ error: 'Server error' })
    }
})

accountRouter.post('/profile/picture', authenticate, upload.single('profilePicture'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' })

    const picturePath = `/uploads/profile-pictures/${req.file.filename}`

    try {
        const user = await userModel.findByIdAndUpdate(
            req.userObject.userId,
            { profilePicture: picturePath },
            { new: true }
        )
        if (!user) return res.status(404).json({ error: 'User not found' })

        res.status(200).json({ profilePicture: user.profilePicture })
    } catch (e) {
        res.status(500).json({ error: 'Server error' })
    }
})
