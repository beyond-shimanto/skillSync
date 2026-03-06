import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'
import {userModel, refreshTokenModel, userAuthModel} from './models.js'
import { Server } from 'socket.io';
import {createServer} from 'http';

import { studyGroupRouter } from './studyGroupRouter.js';

const app = express()


const server = createServer(app)
export const io = new Server(server, {cors: {origin: "http://localhost:5173"}})

io.on("connection", (socket) => {
  socket.on("joinStudyGroupChat", (studyGroupId) => {
    socket.join(`studyGroupChatRoom_${studyGroupId}`)
  })

})

app.use(cors({exposedHeaders: ['Content-Disposition']}))
app.use(express.json())

app.use('/study-groups', studyGroupRouter)

const port = 5000;
server.listen(port)


//Database related


mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))




//auth routes

app.get('/', async (req, res) => {
    res.json({message: 'Currently under implementation!'})
})


app.post('/get-access-token', async (req, res) => {
    const authHeader = req.headers.authorization
    const refreshToken = authHeader && authHeader.split(' ')[1]

    if (refreshToken == null){
        res.status(401).json({error: "Unauthorized"})
        console.log('here')
        return
    }

    if (! await doesRefreshTokenExist(refreshToken)){
        res.status(401).json({error: "Unauthorized"})
        return
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET_KEY, (err, user) => {
        if (err) {
            res.status(401).json({error: "Unauthorized"})
            return
        }

        const userObject = {username: user.username, userId: user.userId}
        const accessToken = jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET_KEY, {expiresIn: '1m'})

        res.status(200).json({ accessToken: accessToken })
    })
})



app.post('/login', async (req, res) => {
    const username = req.body.username.toLowerCase()
    const password = req.body.password

    if(!await isCredentialsCorrect(username, password)){
        res.status(401).json({error: "Invalid credentials!"})
        return
    }
    

    const userDocument = await userModel.findOne({username: username})
    if(!userDocument){
        res.status(500).json({message: "Something went wrong"})
        return
    }
    const userId = userDocument._id
    const userObject = {username: username, userId: userId}
    const refreshToken = jwt.sign(userObject, process.env.REFRESH_TOKEN_SECRET_KEY)

    try{
        await saveRefreshToken(refreshToken)
        res.status(200).json({message: "Successfully logged in!", refreshToken: refreshToken, username: username, userId: userId})
    }
    catch(error){
        res.status(400).json({error: 'Login failed'})
    }
    
    
})

app.post('/logout', async (req, res) => {
    const authHeader = req.headers.authorization
    const refreshToken = authHeader && authHeader.split(' ')[1]
    try {
        await deleteRefreshToken(refreshToken)
        res.status(200).json({message: 'succesfully logged out'})
    }catch(err){
        res.status(400).json({error: err})
    }
})

app.post('/signup', async (req, res) => {
    const username = req.body.username ?? undefined
    const password = req.body.password ?? undefined
    const tags = req.body.tags ?? []
    if(!username){
        res.status(400).json({error: "No username provided"})
        return
    }
    if(!password){
        res.status(400).json({error: "No password provided"})
        return
    }

    try{
        if(await doesUserNameExist(username)){
            res.status(400).json({error: "Username already exists"})
            return
        }
    }
    catch(err){
        res.status(500).json({error: "server error"})
    }
    
    const hashedPassword = await bcrypt.hash(req.body.password, 10)

    const newUserAuth = new userAuthModel({
        username: username,
        password: hashedPassword
    })

    const newUser = new userModel({
        username: username,
        userType: 'student',
        tags: tags
    })

    try{
        await newUserAuth.save()
        await newUser.save()
        res.status(200).json({message: "Successfully signed up!"})
    }
    catch(err){
        res.status(500).json({error: "server error"})
    }
    

})

async function saveRefreshToken(refreshToken){
    const newRefreshTokenDocument = new refreshTokenModel({
        token: refreshToken
    })    
    await newRefreshTokenDocument.save()
}

async function doesRefreshTokenExist(refreshToken){
    const refreshTokenDocument = await refreshTokenModel.findOne({token: refreshToken})
    if (refreshTokenDocument == null)
    {
        return false
    }
    return true
}

async function deleteRefreshToken(refreshToken){
    await refreshTokenModel.deleteOne({token: refreshToken})
}

async function isCredentialsCorrect(username, password){
    const user = await userAuthModel.findOne({username: username})
    if (user == null) {return false}
    if (!(await bcrypt.compare(password, user.password))) {return false}

    return true
}

async function doesUserNameExist(username) {
    const user = await userModel.findOne({ username }).select('_id');
    if (user) {return true}
    const userAuth = await userAuthModel.findOne({username}).select('_id')
    if (userAuth){return true}
    return false
}



export function authenticate(req, res, next){
    const authHeader = req.headers.authorization
    const accessToken = authHeader && authHeader.split(' ')[1] 
    if (accessToken == null){
        res.status(401).json({error: 'Unauthorized'})

        return
    }
    
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET_KEY, (error, userObject) => {
        if (error) {
            
            res.status(401).json({error: 'Unauthorized'})
            return
        }
        req.userObject = userObject
        next()
    })
    

}

app.get('/test', authenticate, async (req, res) => {
    res.status(200).json({message: "Authenticated", user: req.userObject})
})


app.get('/get-profile-info', authenticate, async (req, res) => {
    const username = req.userObject.username


    try{
        const user = await userModel.findOne({username: username})
        const resObject = {
            username: user.username,
            userType: user.userType,
            tags: user.tags
        }

        res.status(200).json(resObject)
    }
    catch(e){
        res.status(500).json({error: "Server error"})
    }
})