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
    },
    bio: {
        type: String,
        default: ''
    },
    profilePicture: {
        type: String,
        default: ''
    },
    achievements: {
        type: [{ type: String, trim: true }],
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

const mentorProfileSchema = new mongoose.Schema({
    mentorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    bio: {
        type: String,
        default: ''
    },
    expertiseTags: {
        type: [{ type: String, trim: true, lowercase: true }],
        default: []
    },
    yearsOfExperience: {
        type: Number,
        default: 0
    },
    hourlyRate: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0
    },
    reviewCount: {
        type: Number,
        default: 0
    }
}, { timestamps: true })

mentorProfileSchema.index({ expertiseTags: 1 })
mentorProfileSchema.index({ hourlyRate: 1 })

export const mentorProfileModel = mongoose.model('MentorProfile', mentorProfileSchema)

const mentorPackageSchema = new mongoose.Schema({
    mentorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    durationMinutes: {
        type: Number,
        required: true,
        min: 1
    },
    priceCents: {
        type: Number,
        required: true,
        min: 0
    },
    currency: {
        type: String,
        default: 'usd',
        lowercase: true,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true })

mentorPackageSchema.index({ mentorUserId: 1, isActive: 1 })

export const mentorPackageModel = mongoose.model('MentorPackage', mentorPackageSchema)

const mentorSessionSchema = new mongoose.Schema({
    mentorUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    studentUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    topic: {
        type: String,
        default: 'Mentor session'
    },
    mentorPackageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MentorPackage'
    },
    scheduledAt: {
        type: Date
    },
    packageTitleSnapshot: {
        type: String,
        default: ''
    },
    packageDescriptionSnapshot: {
        type: String,
        default: ''
    },
    packageDurationMinutesSnapshot: {
        type: Number,
        default: 0
    },
    packagePriceCentsSnapshot: {
        type: Number,
        default: 0
    },
    currencySnapshot: {
        type: String,
        default: 'usd'
    },
    hourlyRateSnapshot: {
        type: Number,
        default: 0
    },
    amountCents: {
        type: Number,
        default: 0
    },
    currency: {
        type: String,
        default: 'usd'
    },
    bookingStatus: {
        type: String,
        enum: ['pending_payment', 'booked', 'cancelled'],
        default: 'booked'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    stripeCheckoutSessionId: {
        type: String,
        default: ''
    },
    stripePaymentIntentId: {
        type: String,
        default: ''
    },
    attendanceStatus: {
        type: String,
        enum: ['pending', 'attended', 'no-show'],
        default: 'pending'
    },
    notes: {
        type: String,
        default: ''
    },
    attendanceMarkedAt: {
        type: Date
    }
}, { timestamps: true })

mentorSessionSchema.index({ mentorUserId: 1, scheduledAt: -1 })
mentorSessionSchema.index({ studentUserId: 1, scheduledAt: -1 })

export const mentorSessionModel = mongoose.model('MentorSession', mentorSessionSchema)

const studySessionSchema = new mongoose.Schema({
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
        type: String,
        default: ''
    },
    scheduledAt: {
        type: Date,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, { timestamps: true })

studySessionSchema.index({ parentStudyGroupId: 1 })

export const studySessionModel = mongoose.model('StudySession', studySessionSchema)

const fcmTokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true
    }
})

export const fcmTokenModel = mongoose.model('FcmToken', fcmTokenSchema)

const directConversationSchema = new mongoose.Schema({
    participants: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        validate: [arr => arr.length === 2, 'Must have exactly 2 participants']
    }
}, { timestamps: true })

directConversationSchema.index({ participants: 1 })

export const directConversationModel = mongoose.model('DirectConversation', directConversationSchema)

const directMessageSchema = new mongoose.Schema({
    conversationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DirectConversation',
        required: true
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    }
}, { timestamps: true })

directMessageSchema.index({ conversationId: 1, createdAt: 1 })

export const directMessageModel = mongoose.model('DirectMessage', directMessageSchema)
