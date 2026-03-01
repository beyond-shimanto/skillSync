import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import mongoose from 'mongoose';
import {userModel, refreshTokenModel} from './models.js'

const app = express()
app.use(cors())
app.use(express.json())

const port = 5000;
app.listen(port)


//Database related


mongoose.connect(process.env.DATABASE_URL)
const db = mongoose.connection
db.on('error', (error) => console.error(error))
db.once('open', () => console.log('Connected to Database'))


//routes

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

        const userObject = {username: user.username}
        const accessToken = jwt.sign(userObject, process.env.ACCESS_TOKEN_SECRET_KEY, {expiresIn: '1m'})

        res.status(200).json({ accessToken: accessToken })
    })
})


//This following route generates JWT refresh token
app.post('/login', async (req, res) => {
    const username = req.body.username.toLowerCase()
    const password = req.body.password

    if(!await isCredentialsCorrect(username, password)){
        res.status(401).json({error: "Invalid credentials!"})
        return
    }
    
    const userObject = {username: username}
    const refreshToken = jwt.sign(userObject, process.env.REFRESH_TOKEN_SECRET_KEY)

    try{
        await saveRefreshToken(refreshToken)
        res.status(200).json({message: "Successfully logged in!", refreshToken: refreshToken})
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
        res.status(400).json({error: err})
    }
    

    const newUser = new userModel({
        username: username,
        password: password,
        userType: 'student'
    })

    try{
        await newUser.save()
        res.status(200).json({message: "Successfully signed up!"})
    }
    catch(err){
        res.status(400).json({error: err})
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
    const user = await userModel.findOne({username: username})
    if (user == null) {return false}
    if (user.password != password) {return false}

    return true
}

async function doesUserNameExist(username) {
    const user = await userModel.findOne({ username }).select('_id'); 
    return user !== null;
}



function verifyAccessToken(req, res, next){
    const authHeader = req.headers.authorization
    const accessToken = authHeader && authHeader.split(' ')[1] //Removing the Bearer part from auth header
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

app.get('/test', verifyAccessToken, async (req, res) => {
    res.status(200).json({message: "Authenticated", user: req.userObject})
})


