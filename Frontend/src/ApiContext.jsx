import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { authContext } from "./AuthContext";

export const apiContext = createContext(null);

const axiosApiInstance = axios.create({
    baseURL: 'http://localhost:5000/'
})

export function ApiProvider({children}){
  const {accessToken, fetchAndSetAccessToken, handleLogout} = useContext(authContext)



  const makePostRequest = async (route, data) => {
    try{
      const res = await axiosApiInstance.post(route, data, {headers: {'Authorization': `Bearer ${accessToken}`}})
      return res
    }catch(e){
      if (e.response?.status !== 401){
        throw e
      }
    }

    let newAccessToken = ''
    try{
      newAccessToken = await fetchAndSetAccessToken()
    }catch(e){
      await handleLogout()
      return
    }
    
    try{
      const res = await axiosApiInstance.post(route, data, {headers: {'Authorization': `Bearer ${newAccessToken}`}})
      return res
    }catch(e){
      throw e
    }
   
  }
  



  const makePutRequest = async (route, data) => {
     try{
      const res = await axiosApiInstance.put(route, data, {headers: {'Authorization': `Bearer ${accessToken}`}})
      return res
    }catch(e){
      if (e.response?.status !== 401){
        throw e
      }
    }

    let newAccessToken = ''
    try{
      newAccessToken = await fetchAndSetAccessToken()
    }catch(e){
      await handleLogout()
      return
    }
    
    try{
      const res = await axiosApiInstance.put(route, data, {headers: {'Authorization': `Bearer ${newAccessToken}`}})
      return res
    }catch(e){
      throw e
    }
  }


  const makeGetRequest = async (route, params = {}) => {
     try{
      const res = await axiosApiInstance.get(route, {params: params, headers: {'Authorization': `Bearer ${accessToken}`}})
      return res
    }catch(e){
      if (e.response?.status !== 401){
        throw e
      }
    }

    let newAccessToken = ''
    try{
      newAccessToken = await fetchAndSetAccessToken()
    }catch(e){
      await handleLogout()
      return
    }
    
    try{
      const res = await axiosApiInstance.get(route, {params: params, headers: {'Authorization': `Bearer ${newAccessToken}`}})
      return res
    }catch(e){
      throw e
    }
  }
  const makeDeleteRequest = async (route, params) => {
     try{
      const res = await axiosApiInstance.delete(route,  {params: params, headers: {'Authorization': `Bearer ${accessToken}`}})
      return res
    }catch(e){
      if (e.response?.status !== 401){
        throw e
      }
    }

    let newAccessToken = ''
    try{
      newAccessToken = await fetchAndSetAccessToken()
    }catch(e){
      await handleLogout()
      return
    }
    
    try{
      const res = await axiosApiInstance.delete(route, {params: params, headers: {'Authorization': `Bearer ${newAccessToken}`}})
      return res
    }catch(e){
      throw e
    }
  }



  const makePostFormDataRequest = async (route, formData) => {
    try{
      const res = await axiosApiInstance.post(route, formData, {headers: {'Authorization': `Bearer ${accessToken}`, 'Content-Type' : 'multipart/form-data'}})
      return res
    }catch(e){
      if (e.response?.status !== 401){
        throw e
      }
    }

    let newAccessToken = ''
    try{
      newAccessToken = await fetchAndSetAccessToken()
    }catch(e){
      await handleLogout()
      return
    }
    
    try{
      const res = await axiosApiInstance.post(route, formData, {headers: {'Authorization': `Bearer ${accessToken}`, 'Content-Type' : 'multipart/form-data'}})
      return res
    }catch(e){
      throw e
    }
   
  }

    const makeGetDownloadRequest = async (route, params = {}) => {
     try{
      const res = await axiosApiInstance.get(route, {params: params, responseType: 'blob',headers: {'Authorization': `Bearer ${accessToken}`}})
      const contentDisposition = res.headers['content-disposition'];
      let fileName = 'resource-file';
        
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch && fileNameMatch[1]) {
              fileName = fileNameMatch[1].replace(/['"]/g, '');
            }
        }



      const url = window.URL.createObjectURL(new Blob([res.data]));
      
      const link = document.createElement('a');
      link.href = url;
      
      link.setAttribute('download', fileName); 
      
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

        return
    }catch(e){
      if (e.response?.status !== 401){
        throw e
      }
    }

    let newAccessToken = ''
    try{
      newAccessToken = await fetchAndSetAccessToken()
    }catch(e){
      await handleLogout()
      return
    }
    
    try{
      
      const res = await axiosApiInstance.get(route, {params: params, responseType: 'blob',headers: {'Authorization': `Bearer ${accessToken}`}})
      const contentDisposition = res.headers['content-disposition'];
      let fileName = 'resource-file';
        
        if (contentDisposition) {
            const fileNameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (fileNameMatch && fileNameMatch[1]) {
              fileName = fileNameMatch[1].replace(/['"]/g, '');
            }
        }

      

      const url = window.URL.createObjectURL(new Blob([res.data]));

      const link = document.createElement('a');
      link.href = url;

      link.setAttribute('download', fileName); 

      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);



    }catch(e){
      throw e
    }
  }





  const api = {
    post: makePostRequest,
    put: makePutRequest,
    get: makeGetRequest,
    delete: makeDeleteRequest,
    postFormData: makePostFormDataRequest,
    getDownload: makeGetDownloadRequest

  }

  return <apiContext.Provider value={{api}} >{children}</apiContext.Provider>

}