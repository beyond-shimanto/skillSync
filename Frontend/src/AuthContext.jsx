import { createContext, useState, useEffect } from "react";
import axios from 'axios'

const axiosInstance = axios.create({
    baseURL: 'http://localhost:5000/'
})

export const accessTokenContext = createContext()

export function AuthProvider({children}){

    const [accessToken, setAccessToken] = useState('')
    const [isLoggedIn, setIsLoggedIn] = useState(false)

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

            const tokenRes = await axiosInstance.post(
            '/get-access-token', {}, { headers: { Authorization: `Bearer ${res.data.refreshToken}` } });
            setAccessToken(tokenRes.data.accessToken);

            setIsLoggedIn(true);
            return true;
        } catch(e){
            return false;
        }
        }

    async function handleLogout(){
        try{
            const refreshToken = getRefreshToken();
            await axiosInstance.post('/logout',{},{headers: refreshToken ? { Authorization: `Bearer ${refreshToken}` } : {}});
            setIsLoggedIn(false);
            setAccessToken("");
            deleteRefreshToken();
            return true;
        } catch(e){
            return false;
        }
    }

    useEffect(() => {
        async function restoreSession() {
            const refreshToken = getRefreshToken();
            if (!refreshToken) return;

            try {
                const res = await axiosInstance.post('/get-access-token', {}, {headers: { Authorization: `Bearer ${refreshToken}`}});

                setAccessToken(res.data.accessToken);
                setIsLoggedIn(true);
            } catch (e) {

                deleteRefreshToken();
                setAccessToken("");
                setIsLoggedIn(false);
            }
        }

        restoreSession();
    }, []);


    return (
        <accessTokenContext.Provider value = {{handleLogin, handleLogout, isLoggedIn, accessToken, setAccessToken, getRefreshToken}}>
            {children}
        </accessTokenContext.Provider>
    )
}