import { Link, useNavigate } from "react-router-dom"
import { authContext } from "../AuthContext"
import { useContext, useEffect, useState } from "react"
import { apiContext } from "../ApiContext"

import './StudyGroups.css'

export function StudyGroups(){

    const navigate = useNavigate()

    const {api} = useContext(apiContext)
    const [tags, setTags] = useState([])
    const [message,setMessage] = useState('')

    const [latestGroups, setLatestGroups] = useState([])
    const [ownGroups, setOwnGroups] = useState([])
    const [taggedGroups, setTaggedGroups] = useState([])

    const [invitedGroups, setInvitedGroups] = useState([])

    const [tagInput, setTagInput] = useState('')

    useEffect(() => {
        async function getUserInfo(){
            try{
                const res = await api.get('/get-profile-info')
                setTags(res.data.tags)
            }
            catch(e){
                setMessage('Error occured')
            } 
        }

        getUserInfo()

    },[])

    useEffect(() => {
        async function getLatestGroups(){
            try{
                const res = await api.get('/study-groups', {page: 1, limit: 10})
                setLatestGroups(res.data)
                
            }catch(e){
                setMessage('Something went wrong')
            }
        }

        getLatestGroups()
    }, [])

    useEffect(() => {
        async function getTaggedGroups(){
            if (tags.length == 0){
                setTaggedGroups([])
                return
            }
            try{
                
                const res = await api.get('/study-groups', {tags: tags})
                setTaggedGroups(res.data)
                
            }catch(e){
                setMessage('Something went wrong')
            }
        }

        getTaggedGroups()
    }, [tags])

    useEffect(() => {
        async function getOwnGroups(){
            try{
                const res = await api.get('/study-groups/get-joined-study-groups')
                setOwnGroups(res.data)
                
            }
            catch(e){
                console.log(e.response.data)
                setMessage('Something went wrong')
            }
        }

        getOwnGroups()
    }, [])


    async function getInvitedGroups(){
        try{
            const res = await api.get('/study-groups/get-invitations')
            setInvitedGroups(res.data)

        }
        catch(e){
            
            setMessage('Could not retrieve invited groups')
        }
    }

    useEffect(() => {
        getInvitedGroups()
    }, [])

    function handleInvitationDelete(invitationId){
        api.delete('/study-groups/delete-invitation', {studyGroupInvitationId: invitationId})
        getInvitedGroups()

    }

    function handleInvitationAccept(invitationId){
        api.post('/study-groups/accept-invitation', {studyGroupInvitationId: invitationId})
        getInvitedGroups()
        setMessage('Invitation accepted')
    }

    function handleTagDelete(tag){
        setTags(prev => prev.filter(t => t != tag))
    }

    return (
        <>

            <div className="study-groups-view">

            
                {message && <p>{message}</p>}
                <h1>Study groups!</h1>
                <Link to="/study-groups/create-study-group"><p>Create a group</p></Link>
                <h3>Latest groups:</h3>
                {latestGroups.map(g => {
                    return(
                        <div key={g._id} className="card">
                            <h4>{g.name}</h4>
                            <p>{g.description}</p>
                            <div className="tag-pills-container">
                                {g.tags.map(t => <div className="tag-pill" key={t}> {t} </div>)}
                            </div>
                            <div className="view-button" onClick={() => navigate(`/study-groups/view-group/${g._id}`)} ><ArrowSvg></ArrowSvg></div>


                        </div>
                    )
                })}

                <br></br>
                {ownGroups.length > 0 && <h3>Groups I'm a memebr of: </h3>}
                {ownGroups.map(g => {
                    return(
                        <div key={g._id} className="card">
                            <h4>{g.name}</h4>
                            <p>{g.description}</p>
                            <div className="tag-pills-container">
                                {g.tags.map(t => <div className="tag-pill" key={t}> {t} </div>)}
                            </div>

                            <div className="view-button" onClick={() => navigate(`/study-groups/view-group/${g._id}`)} ><ArrowSvg></ArrowSvg></div>

                        </div>
                    )
                })}

                
                <h3>Search group by tag:</h3>
                <div className="tag-input-container">
                    <input onChange={(e) => setTagInput(e.target.value)} value={tagInput}></input>
                    <a onClick={(e) => {if(!tagInput){return};setTags(prev => [...prev, tagInput]); setTagInput('')}}>Add tag</a>
                </div>
                
                <div className="tag-pills-container">
                    {tags.map(t => {
                    return (
                        <div key={t} className="tag-pill tag-pill-deletable" onClick={() => handleTagDelete(t)}>
                            {t} 
                        </div>
                        )
                    })}
                </div>
                
                {tags.length > 0 && <h3>Groups based on mentioned tags: </h3>}
                {taggedGroups.map(g => {
                    return(
                        <div key={g._id} className="card">
                            <h4>{g.name}</h4>
                            <p>{g.description}</p>
                            <div className="tag-pills-container">
                                {g.tags.map(t => <div className="tag-pill" key={t}> {t} </div>)}
                            </div>
                            <div className="view-button" onClick={() => navigate(`/study-groups/view-group/${g._id}`)} ><ArrowSvg></ArrowSvg></div>

                        </div>
                    )
                })}

                {invitedGroups.length > 0 && <h3>Groups you're invited to:</h3>}

                {invitedGroups.map(g => {
                    return (
                        <div key={g._id} style={{border: "2px solid grey", borderRadius: "1rem", padding: "1rem"}}>
                            <h4>Name: {g.invitationGroupId.name}</h4>
                            <p>Description: {g.invitationGroupId.description}</p>
                            <p>{"tags: "}

                                {g.invitationGroupId.tags.map(t => <span key={t}>{t}, </span>)}

                            </p>
                            <Link to={`/study-groups/view-group/${g.invitationGroupId._id}`}><p>View group</p></Link>
                            <button onClick={(e) => handleInvitationDelete(g._id) }>Delete invitation</button>
                            <button onClick={(e) => handleInvitationAccept(g._id)}>Accept Invitation</button>
                        </div>
                    )
                })}
            
            </div>

        </>
    )
}

const ArrowSvg = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <g id="SVGRepo_bgCarrier" strokeWidth={0} />
    <g
      id="SVGRepo_tracerCarrier"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <g id="SVGRepo_iconCarrier">
      <path
        d="M11 16L15 12M15 12L11 8M15 12H3M4.51555 17C6.13007 19.412 8.87958 21 12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C8.87958 3 6.13007 4.58803 4.51555 7"
        stroke="#000000"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);