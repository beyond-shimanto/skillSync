import { createContext, useState, useEffect } from "react";
import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/'
})

export const authContext = createContext()

export function AuthProvider({children}){

    const [accessToken, setAccessToken] = useState('')
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [userId, setUserId] = useState('')
    const [username, setUsername] = useState('')

    function setUsernameAndUserId(username, userId){
        localStorage.setItem('username', username)
        localStorage.setItem('userId', userId)
    }

    function getUsernameAndUserId(){
        const username = localStorage.getItem('username')
        const userId = localStorage.getItem('userId')

        return {username: username, userId: userId}
    }

    function deleteUsernameAndUserId(){
        localStorage.removeItem('username')
        localStorage.removeItem('userId')
    }

    function getRefreshToken(){
        return localStorage.getItem('refreshToken')
    }


    

    function setRefreshToken(refreshToken){
        
        localStorage.setItem('refreshToken', refreshToken)
    }

    function deleteRefreshToken(){
        localStorage.removeItem('refreshToken')
    }

    async function handleLogin(username, password){
        try{
            const res = await axiosInstance.post('/login', { username, password });
            setRefreshToken(res.data.refreshToken);

            fetchAndSetAccessToken()

            setIsLoggedIn(true);
            setUsernameAndUserId(res.data.username, res.data.userId)
            setUsername(res.data.username)
            setUserId(res.data.userId)
            return true;
        } catch(e){
            return false;
        }
    }

    async function fetchAndSetAccessToken(){
        
        const refreshToken = getRefreshToken()
        const tokenRes = await axiosInstance.post(
        '/get-access-token', {}, { headers: { Authorization: `Bearer ${refreshToken}` } });
        setAccessToken(tokenRes.data.accessToken);

        return tokenRes.data.accessToken
        

    }

    async function handleLogout(){
        try{
            const refreshToken = getRefreshToken();
            await axiosInstance.post('/logout',{},{headers: refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {}});
            setIsLoggedIn(false);
            setAccessToken("");
            deleteRefreshToken();
            setUserId('')
            setUsername('')
            deleteUsernameAndUserId()
            return true;
        } catch(e){
            return false;
        }
    }

    async function handleSignup(username, password, tagsArray, type){
        try{
            await axiosInstance.post('/signup', {username: username, password: password, tags: tagsArray, type: type})
            return true
        }
        catch(e){
            return false
        }
    }

    useEffect(() => {
        async function restoreSession() {
            const refreshToken = getRefreshToken();
            if (!refreshToken){
                setIsAuthLoading(false)
                return
            };

            try {
                const res = await axiosInstance.post('/get-access-token', {}, {headers: { Authorization: `Bearer ${refreshToken}`}});

                setAccessToken(res.data.accessToken);
                setIsLoggedIn(true);
                setUsername(getUsernameAndUserId().username)
                setUserId(getUsernameAndUserId().userId)
                

            } catch (e) {

                deleteRefreshToken();
                setAccessToken("");
                setIsLoggedIn(false);
                handleLogout()
            }
            finally{
                setIsAuthLoading(false)
            }
        }

        restoreSession();
    }, []);


    return (
        <authContext.Provider value = {{handleLogin, handleLogout, handleSignup, isLoggedIn, isAuthLoading, accessToken, setAccessToken, getRefreshToken, fetchAndSetAccessToken, username, userId}}>
            {children}
        </authContext.Provider>
    )
}