import express from 'express'
import { authenticate } from './server.js'
import { userModel, studyGroupModel, studyGroupMembershipModel, studyGroupInvitationModel, studyGroupThreadModel, studyGroupThreadReplyModel, studyGroupChatTextModel, studyGroupResourceModel, studySessionModel, fcmTokenModel } from './models.js'
import admin from './firebase.js'
import {io} from './server.js'

import multer from 'multer'
import  path , {dirname, join} from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'



export const studyGroupRouter = express.Router()

async function isUserMemberOfStudyGroup(userId, studyGroupId){
    const studyGroupMembership = await studyGroupMembershipModel.findOne({userId: userId, studyGroupId: studyGroupId})
    if(!studyGroupMembership){
        return false
    }
    return true
}

studyGroupRouter.get('/', authenticate, async (req,res) => {
    const page = req.query.page?? 1
    const limit = req.query.limit?? 10

    let tags = req.query['tags[]']

    try{
        let groups
        if (!tags){
            groups = await studyGroupModel.find({isGroupPrivate: false}).skip((page - 1)*limit).limit(limit)
        }else{

            if (!(Array.isArray(tags))){
                tags = [tags]
            }

            groups = await studyGroupModel.find({tags: { $in: tags }, isGroupPrivate: false}).skip((page - 1)*limit).limit(limit)
        }
        
        res.status(200).json(groups)
        return
    }
    catch(e){
        res.status(500).json({message: "Server error"})
        return
    }

    
})




studyGroupRouter.get('/get-joined-study-groups',authenticate, async (req, res) => {

    try{
        const userId = req.userObject.userId
        const userStudyGroupMemberships = await studyGroupMembershipModel.find({userId: userId})
        const groupIds = userStudyGroupMemberships.map(c => c.studyGroupId)

        const groups = await studyGroupModel.find({_id: { $in: groupIds }});

        res.status(200).json(groups)
    }catch(e){
        res.status(500).json({error: 'Server error weird error'})
    }
})

studyGroupRouter.post('/create-study-group', authenticate, async (req, res) => {
    const groupName = req.body.groupName
    const groupDesc = req.body.groupDesc
    const tags = req.body.groupTagsArray
    const isGroupPrivate = req.body.isGroupPrivate

    let creator_Id = req.userObject.userId

    
    try {
        const newStudyGroup = new studyGroupModel({name: groupName, description: groupDesc, tags: tags, isGroupPrivate: isGroupPrivate})
        const newStudyGroupDoc = await newStudyGroup.save()

        const newStudyGroup_Id = newStudyGroupDoc._id

        const newStudyGroupMembership = new studyGroupMembershipModel({userId: creator_Id, studyGroupId: newStudyGroup_Id, role: 'admin'})
        await newStudyGroupMembership.save()

        res.status(200).json({message: "Successfully created study group"})
        return
    }
    catch(e){
        console.log(e)
        res.status(500).json({error: 'Server Error'})
        return
    }
    

})

studyGroupRouter.post('/join-study-group', authenticate, async (req, res) => {

    try{
        const groupId = req.body.groupId
        const userId = req.userObject.userId

        const groupDocument = await studyGroupModel.findOne({_id: groupId})
            
        if (!groupDocument){
            
            res.status(400).json({error: "The group does not exist"})
            return
        }
        if (groupDocument.isGroupPrivate == true){
            res.status(400).json({error: "The group is private and invite only"})
            return
        }
        
        const newStudyGroupMembership = new studyGroupMembershipModel({userId: userId, studyGroupId: groupId})
        newStudyGroupMembership.save()

        res.status(200).json({message: "Successfully added to group"})


    }catch(e){
        console.log(e)
        res.status(200).json({error: "server error"})
    }
})

studyGroupRouter.post('/create-invitation', authenticate, async (req, res) => {
    try{

        if(req.body.inviteeUsername == req.userObject.username){
            res.status(400).json({error: "Invitor and invitee same person"})
            return
        }

        const invitorId = req.userObject.userId

        const invitee = req.body.inviteeUsername
        const inviteeDocument = await userModel.findOne({username: invitee})
        if(!inviteeDocument){
            res.status(400).json({error: "Invitee not found"})
            return
        }
        const inviteeId = inviteeDocument._id

        const invitationGroupId = req.body.invitationGroupId

        const newInvitation = new studyGroupInvitationModel({invitorId: invitorId, inviteeId: inviteeId, invitationGroupId: invitationGroupId})
        newInvitation.save()

        res.status(200).json({message: "Successfully created invite"})

    }
    catch(e){
        console.log(e)
        res.status(500).json({error: "server error"})
        return
    }
    



})

studyGroupRouter.get('/get-invitations', authenticate, async (req, res) => {
    try{

        const userId = req.userObject.userId
        
        const invitations = await studyGroupInvitationModel.find({inviteeId: userId}).populate('invitationGroupId')
        res.status(200).json(invitations)

    }catch(e){
        res.status(500).json({error: "server error"})
    }
        
})

studyGroupRouter.delete('/delete-invitation', authenticate, async (req, res) => {
    const studyGroupInvitationId = req.query.studyGroupInvitationId
    try{
        await studyGroupInvitationModel.findOneAndDelete({_id: studyGroupInvitationId})
        res.status(200).json({message: "Successfully deleted"})
        return
    }catch(e){
        res.status(500).json({error: "server error"})
        return
    }
    
})

studyGroupRouter.post('/accept-invitation', authenticate, async (req, res) => {
    const invitationId = req.body.studyGroupInvitationId
    try{
        const invitationDocument = await studyGroupInvitationModel.findOne({_id: invitationId})
        if (invitationDocument.inviteeId != req.userObject.userId){
            res.status(400).json({error: "This invitaiton is not meant for you!"})
            return
        }
        const newStudyGroupMembership = new studyGroupMembershipModel({userId: req.userObject.userId, studyGroupId: invitationDocument.invitationGroupId})
        newStudyGroupMembership.save()
        await studyGroupInvitationModel.findOneAndDelete({_id: invitationId})
        res.status(200).json({message: "Successfully accepted invite"})
    }catch(e){
        console.log(e)
        res.status(500).json({error: "Server error"})
    }
})







studyGroupRouter.get('/:studyGroupId', authenticate, async (req, res) => {

    const studyGroupId = req.params.studyGroupId
    try{
        const group = await studyGroupModel.findOne({_id: studyGroupId})
        res.status(200).json(group)
        return
        
    }
    catch(e){
        res.status(500).json({error: "server error"})
        return
    } 
    
})

async function isThreadMemberOfGroup(threadId, groupId){
    return true
}


studyGroupRouter.post('/:studyGroupId/create-thread', authenticate, async (req, res) => {
    try{
        const studyGroupId = req.params.studyGroupId
        const title = req.body.title
        const description = req.body.description
        const userId = req.userObject.userId
        if(!await isUserMemberOfStudyGroup(userId, studyGroupId)){
            res.status(400).json({error: "The user is not a member of this group!"})
            return
        }


        const newThread = new studyGroupThreadModel({title: title, description: description, authorId: userId, parentStudyGroupId: studyGroupId})
        newThread.save()

        res.status(200).json({message: "successfully added thread"})

    }catch(e){
        res.status(500).json({error: "server error"})
    }
    
    
})

studyGroupRouter.get('/:studyGroupId/:threadId/get-thread', authenticate, async (req, res) => {
    try{
        const studyGroupId = req.params.studyGroupId
        const threadId = req.params.threadId
        const userId = req.userObject.userId

        if(! await isUserMemberOfStudyGroup(userId, studyGroupId)){
            res.status(400).json({error: "User not member of this group"})
            return
        }
        if(! await isThreadMemberOfGroup(threadId, studyGroupId)){
            res.status(400).json({error: "Thread not member of this group"})
            return
        }

        const thread = await studyGroupThreadModel.findOne({_id: threadId}).populate('authorId')
        res.status(200).json(thread)
    }
    catch(e){
        res.status(500).json({error: "Server error"})
    }
})

studyGroupRouter.get('/:studyGroupId/get-threads', authenticate, async (req, res) => {
    try{
        const studyGroupId = req.params.studyGroupId
        const userId = req.userObject.userId

        if(!await isUserMemberOfStudyGroup(userId, studyGroupId)){
            res.status(400).json({error: "User is not a member of this group"})
            return
        }

        const threads = await studyGroupThreadModel.find({parentStudyGroupId: studyGroupId}).populate('authorId')
        res.status(200).json(threads)

    }catch(e){
        console.log(e)
        res.status(500).json({error: "server error"})
    }
})

studyGroupRouter.post('/:studyGroupId/:threadId/create-reply', authenticate, async (req, res) => {
    try{
        const studyGroupId = req.params.studyGroupId
        const threadId = req.params.threadId
        const userId = req.userObject.userId
        const title = req.body.title

        if(! await isUserMemberOfStudyGroup(userId, studyGroupId)){
            res.status(400).json({error: "User not member of this group"})
            return
        }
        if(! await isThreadMemberOfGroup(threadId, studyGroupId)){
            res.status(400).json({error: "Thread not member of this group"})
            return
        }

        const newStudyGroupThreadReply = new studyGroupThreadReplyModel({
            parentThreadId: threadId, title: title, replierId: userId
        })
        newStudyGroupThreadReply.save()
        res.status(200).json({message: "Successfully added reply"})
    }
    catch(e){
        res.status(500).json({error: "Server error"})
    }
})

studyGroupRouter.get('/:studyGroupId/:threadId/get-replies', authenticate, async (req, res) => {
    try{
        const studyGroupId = req.params.studyGroupId
        const threadId = req.params.threadId
        const userId = req.userObject.userId

        if(! await isUserMemberOfStudyGroup(userId, studyGroupId)){
            res.status(400).json({error: "User not member of this group"})
            return
        }
        if(! await isThreadMemberOfGroup(threadId, studyGroupId)){
            res.status(400).json({error: "Thread not member of this group"})
            return
        }

        const result = await studyGroupThreadReplyModel.find({parentThreadId: threadId}).populate('replierId')
        res.status(200).json(result)
    }
    catch(e){
        console.log(e)
        res.status(500).json({error: "Server error"})
    }
})

studyGroupRouter.post('/:studyGroupId/create-chat-text', authenticate, async (req, res) => {
    const userId = req.userObject.userId
    const studyGroupId = req.params.studyGroupId
    const text = req.body.text

    

    try{
        if(! await isUserMemberOfStudyGroup(userId, studyGroupId)){
            res.status(400).json({error: "User not a member of this group"})
            return    
        }
        const newStudyGroupChatText = new studyGroupChatTextModel({
            text: text,
            parentStudyGroupId: studyGroupId,
            texterId: userId
        })

        await newStudyGroupChatText.save()
        io.to(`studyGroupChatRoom_${studyGroupId}`).emit('newText')
        res.status(200).json({message: "Text sent"})
    }
    catch(e){
        res.status(500).json({error: "server error"})
    }
})

studyGroupRouter.get("/:studyGroupId/get-chat-texts", authenticate, async (req, res) => {
    const studyGroupId = req.params.studyGroupId
    const userId = req.userObject.userId

    try{
        if(! await isUserMemberOfStudyGroup(userId, studyGroupId)){
            res.status(400).json({error: "User not a member of this group"})
            return    
        }
        const texts = await  studyGroupChatTextModel.find({parentStudyGroupId: studyGroupId}).populate('texterId')
        res.status(200).json(texts)
    }
    catch(e){
        console.log(e)
        res.status(500).json({error: "server error"})
    }
})


const uploadDir = 'uploads/'

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}



const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + String(req.userObject.userId);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ storage: storage });




studyGroupRouter.post('/:studyGroupId/create-resource', authenticate, upload.single('file'), async (req, res) => {
    
    try{
        const userId = req.userObject.userId
        const groupId = req.params.studyGroupId
        const filePath = req.file?.path
        const title = req.body.title
        const description = req.body.description
        const link = req.body.link?? undefined


        const newStudyGroupResource = new studyGroupResourceModel({
            title: title, filePath: filePath, description: description, link: link, uploaderId: userId, parentGroupId: groupId, isFileAvailable: req.file? true: false
        })

        await newStudyGroupResource.save()

        res.status(200).json({message: "Successfully saved resource"})
        return
    }
    catch(e){
        res.status(500).json({error: "Server error"})
    }
    
})

studyGroupRouter.get('/:studyGroupId/get-resources', authenticate, async (req, res) => {
    try{
        const groupId = req.params.studyGroupId
        const resources = await studyGroupResourceModel.find({parentGroupId: groupId}).populate('uploaderId')
        res.status(200).json(resources)
        return
    }
    catch(e){
        res.status(500).json({error: "Server error"})
    }
})

async function isResourceMemberOfStudyGroup(resourceId, groupId){
    return true
}

const __dirname = dirname(fileURLToPath(import.meta.url));


studyGroupRouter.get('/:studyGroupId/download-resource/:resourceId', authenticate, async (req, res) => {

    const userId = req.userObject.userId
    const groupId = req.params.studyGroupId
    const resourceId = req.params.resourceId

    try{
        if(! await isUserMemberOfStudyGroup(userId, groupId)){
            res.status(400).json({message: "User not a part of this group"})
            return
        }
        if(! await isResourceMemberOfStudyGroup(resourceId, groupId)){
            res.status(400).json({message: "Resource not a part of this group"})
            return
        }
        const resourceDocument = await studyGroupResourceModel.findOne({_id: resourceId})
        const filePath = join(__dirname, resourceDocument.filePath ) 

        console.log(filePath)
        res.download(filePath, (err) => {
            
            if (err){
                console.log(err)
                res.status(404).json({error: "File not found"})
            }
        })

    }
    catch(e){
        console.log(e)
        res.status(500).json({error: "Server error"})
    }
        
})

// Create a session
studyGroupRouter.post('/:studyGroupId/create-session', authenticate, async (req, res) => {
    try {
        const studyGroupId = req.params.studyGroupId
        const userId = req.userObject.userId
        const { title, description, scheduledAt } = req.body

        if (!await isUserMemberOfStudyGroup(userId, studyGroupId)) {
            res.status(400).json({ error: "User is not a member of this group" })
            return
        }

        const newSession = new studySessionModel({
            parentStudyGroupId: studyGroupId,
            title,
            description,
            scheduledAt,
            createdBy: userId
        })

        await newSession.save()
        res.status(200).json({ message: "Successfully created session" })

    } catch (e) {
        console.log(e)
        res.status(500).json({ error: "Server error" })
    }
})

// Get all sessions for a group
studyGroupRouter.get('/:studyGroupId/get-sessions', authenticate, async (req, res) => {
    try {
        const studyGroupId = req.params.studyGroupId
        const userId = req.userObject.userId

        if (!await isUserMemberOfStudyGroup(userId, studyGroupId)) {
            res.status(400).json({ error: "User is not a member of this group" })
            return
        }

        const sessions = await studySessionModel.find({ parentStudyGroupId: studyGroupId })
            .populate('createdBy')
            .sort({ scheduledAt: 1 })

        res.status(200).json(sessions)

    } catch (e) {
        console.log(e)
        res.status(500).json({ error: "Server error" })
    }
})

// Delete a session — only the creator can delete their own session
studyGroupRouter.delete('/:studyGroupId/delete-session/:sessionId', authenticate, async (req, res) => {
    try {
        const studyGroupId = req.params.studyGroupId
        const sessionId = req.params.sessionId
        const userId = req.userObject.userId

        if (!await isUserMemberOfStudyGroup(userId, studyGroupId)) {
            res.status(400).json({ error: "User is not a member of this group" })
            return
        }

        const session = await studySessionModel.findOne({ _id: sessionId, parentStudyGroupId: studyGroupId })
        if (!session) {
            res.status(404).json({ error: "Session not found" })
            return
        }

        if (String(session.createdBy) !== String(userId)) {
            res.status(403).json({ error: "Only the creator can delete this session" })
            return
        }

        await studySessionModel.findOneAndDelete({ _id: sessionId })
        res.status(200).json({ message: "Successfully deleted session" })

    } catch (e) {
        console.log(e)
        res.status(500).json({ error: "Server error" })
    }
})

// Save token — just add it if it doesn't exist for this device
studyGroupRouter.post('/save-fcm-token', authenticate, async (req, res) => {
    try {
        const userId = req.userObject.userId
        const { token } = req.body

        if (!token) {
            res.status(400).json({ error: "No token provided" })
            return
        }

        // upsert based on token itself, not userId
        await fcmTokenModel.findOneAndUpdate(
            { token },
            { userId, token },
            { upsert: true }
        )

        res.status(200).json({ message: "Token saved" })
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: "Server error" })
    }
})

// Disable — delete only this specific device's token
studyGroupRouter.post('/remove-fcm-token', authenticate, async (req, res) => {
    try {
        const { token } = req.body
        await fcmTokenModel.findOneAndDelete({ token })
        res.status(200).json({ message: "Token removed" })
    } catch (e) {
        res.status(500).json({ error: "Server error" })
    }
})

// Check if THIS device is subscribed
studyGroupRouter.post('/get-fcm-status', authenticate, async (req, res) => {
    try {
        const { token } = req.body
        const tokenDoc = await fcmTokenModel.findOne({ token })
        res.status(200).json({ hasToken: !!tokenDoc })
    } catch (e) {
        res.status(500).json({ error: "Server error" })
    }
})

