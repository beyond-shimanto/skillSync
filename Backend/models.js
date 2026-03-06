import mongoose from "mongoose";

const userAuthSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

export const userAuthModel = mongoose.model('UserAuth', userAuthSchema)

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    userType: {
        type: String,
        required: true
    },
    joiningDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    tags: {
        type:  [{type: String, trim: true, lowercase: true}],
        default: []
    }


})

export const userModel = mongoose.model('User', userSchema)

const refreshTokenSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true
    }
})

export const refreshTokenModel = mongoose.model('RefreshToken', refreshTokenSchema)


const studyGroupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    tags: {
        type: [{type: String, trim: true, lowercase: true}],
        default: []
    },
    description: {
        type: String,
        default: ''

    },
    isGroupPrivate:{
        type: Boolean,
        default: false
    }
})

studyGroupSchema.index({ tags: 1 });
userSchema.index({ tags: 1 }); 

export const studyGroupModel = mongoose.model('StudyGroup', studyGroupSchema)

const studyGroupMembershipSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studyGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyGroup',
        required: true
    },
    role: {
        type: String,
        default: 'general'
    },
    joiningDate : {
        type: Date,
        default: Date.now
    }
})



export const studyGroupMembershipModel = mongoose.model('StudyGroupMembership', studyGroupMembershipSchema)

const studyGroupInvitationSchema = new mongoose.Schema({
    invitorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    inviteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    invitationGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyGroup',
        required: true
    }
})

studyGroupInvitationSchema.index({invitorId: 1, inviteeId: 1, invitationGroupId:1}, {unique: true})

export const studyGroupInvitationModel = mongoose.model('StudyGroupInvitation', studyGroupInvitationSchema)

const studyGroupThreadSchema = new mongoose.Schema({
    parentStudyGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'StudyGroup',
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})

export const studyGroupThreadModel = mongoose.model('StudyGroupThread', studyGroupThreadSchema)

const studyGroupThreadReplySchema = new mongoose.Schema({
    parentThreadId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'StudyGroupThread'
    },
    title: {
        type: String,
        required: true
    },
    replierId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

export const studyGroupThreadReplyModel = mongoose.model('StudyGroupThreadReply', studyGroupThreadReplySchema)

const studyGroupChatTextSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    parentStudyGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'StudyGroup'
    },
    texterId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    }
})

export const studyGroupChatTextModel = mongoose.model('StudyGroupChatText', studyGroupChatTextSchema)

const studyGroupResourceSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    link: {
        type: String
    },
    filePath: {
        type: String
    },
    isFileAvailable: {
        type: Boolean,
        required: true
    },
    uploaderId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    parentGroupId: {
        type:mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'StudyGroup'
    }
})

export const studyGroupResourceModel = mongoose.model('StudyGroupResource', studyGroupResourceSchema)
