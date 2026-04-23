import cron from 'node-cron'
import { studySessionModel, studyGroupMembershipModel, fcmTokenModel } from './models.js'
import admin from './firebase.js'

export function startNotificationJob() {
    // runs every minute
    cron.schedule('* * * * *', async () => {
        try {
            const now = new Date()
            const in4min = new Date(now.getTime() + 4 * 60 * 1000)
            const in5min = new Date(now.getTime() + 5 * 60 * 1000)

            // find sessions starting in the next 4-5 minutes
            const upcomingSessions = await studySessionModel.find({
                scheduledAt: { $gte: in4min, $lte: in5min }
            })

            for (const session of upcomingSessions) {
                // get all members of this group
                const memberships = await studyGroupMembershipModel.find({
                    studyGroupId: session.parentStudyGroupId
                })

                const memberIds = memberships.map(m => m.userId)

                // get their FCM tokens
                const tokenDocs = await fcmTokenModel.find({
                    userId: { $in: memberIds }
                })

                const tokens = tokenDocs.map(t => t.token).filter(t => t != null)

                if (tokens.length === 0) continue

                console.log('Tokens found:', tokens)
                    console.log('Session:', session.title)

                    const result = await admin.messaging().sendEachForMulticast({
                        tokens,
                        notification: {
                            title: '📚 Study Session Starting Soon!',
                            body: `"${session.title}" starts in 5 minutes`
                        }
                    })

                    console.log('Success count:', result.successCount)
                    console.log('Failure count:', result.failureCount)
                    console.log('Responses:', JSON.stringify(result.responses))
            }
        } catch (e) {
            console.log('Notification job error:', e)
        }
    })
}