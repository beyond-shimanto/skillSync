
import { useState,useEffect, useContext } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { apiContext } from "../ApiContext"
import './ThreadView.css'

export function ThreadView(){

    const [replyTitleInput, setReplyTitleInput] = useState('')
    const [replies, setReplies] = useState([])
    const [thread, setThread] = useState(undefined)
    const {groupId, threadId} = useParams()
    const [message, setMessage] = useState('')
    const {api} = useContext(apiContext)

    const navigate = useNavigate()


    async function handleReplySubmit(e){
       try{
        await api.post(`study-groups/${groupId}/${threadId}/create-reply`, {title: replyTitleInput})
        setReplyTitleInput('')
        navigate(0)
       }
       catch(e){
        setMessage('Something went wrong')
       }
    }

    useEffect(() => {
        async function getThread(){
            try{
                const res = await api.get(`study-groups/${groupId}/${threadId}/get-thread`)
                setThread(res.data)
                
            }
            catch(e){
                setMessage('Something went wrong')
            }
        }

        getThread()
    }, [])

    useEffect(() => {

        async function getReplies(){
            
            try{
                const res = await api.get(`study-groups/${groupId}/${threadId}/get-replies`)
                setReplies(res.data)
            }
            catch(e){
                setMessage('Something went wrong')
            }

        }

        getReplies()
    }, [])

    return(
        <>

        <div className="thread-view">

        
            <div className="reply-input-container">
                <input onChange={(e) => setReplyTitleInput(e.target.value)} value={replyTitleInput}></input>
                <button onClick={handleReplySubmit} >Submit</button>
            </div>
            <h3>Main Thread:</h3>
            {thread && 
            <div className="card">
                <h4>{thread.title}</h4>
                <p>{thread.description}</p>
                <p>Made by: {thread.authorId.username}</p>
            </div>
            }
            
            <h3>Replies:</h3>
            <div className="replies-container">

                {replies.map(r => {

                return(

                        <div key={r._id} className="card" >
                            <h4>text: {r.title}</h4>
                            <p>by: {r.replierId.username}</p>
                            
                        </div>
                    )
                })}

            </div>
            
            

        </div>
        </>
    )
}