import { useState, useContext, useRef } from 'react'
import { useEffect } from 'react'
import {useParams} from 'react-router-dom'
import { apiContext } from '../ApiContext'
import { useNavigate,Link } from 'react-router-dom'
import { authContext } from '../AuthContext'
import './GroupView.css'

export function GroupView(){


    const {api} = useContext(apiContext)
    const {handleLogout, username, userId} = useContext(authContext)
    const {groupId} = useParams()
    const [message, setMessage] = useState('')
    const [groupInfo, setGroupInfo] = useState({})
    const [tags, setTags] = useState([])
    const [isMember, setIsMember] = useState(true)

    const [threadTitleInput, setThreadTitleInput] = useState('')
    const [threadDescriptionInput, setThreadDescriptionInput] = useState('')

    const [resourcesTitleInput, setResourcesTitleInput] = useState('')
    const [resourcesDescriptionInput, setResourcesDescriptionInput] = useState('')
    const [resourcesLinkInput, setResourcesLinkInput] = useState('')
    const [resourcesFileInput, setResourcesFileInput] = useState(undefined)
    const resourcesFileInputElemRef = useRef(null)

    const [threads, setThreads] = useState([])

    const [resources, setResources] = useState([])

    const navigate = useNavigate()

    const [inviteUsernameInput, setInviteUsernameInput] = useState('')

    const [openTab, setOpenTab] = useState('threads')

    async function getGroupInfo(){
        try{
            const res = await api.get(`study-groups/${groupId}`)
            setGroupInfo(res.data)
            setTags(res.data.tags)
        }catch(e){
            
            setMessage('Something went wrong')
        }
    }

    useEffect(() => {
        

        getGroupInfo()
    }, [])



    async function getThreads(){
        try{
            const res = await api.get(`/study-groups/${groupId}/get-threads`)
            setThreads(res.data)
        }
        catch(e){
            setIsMember(false)
        }
    }

    useEffect(() => {
        getThreads()
    }, [])

    async function getResources(){
        try{
            const res = await api.get(`/study-groups/${groupId}/get-resources`)
            setResources(res.data)

        }
        catch(e){
            setMessage('Something went wrong')
        }
    }

    useEffect(() => {
        getResources()
    }, [])

    async function handleInviteClick(e){
        e.preventDefault()
        try {
            await api.post('/study-groups/create-invitation', {inviteeUsername: inviteUsernameInput, invitationGroupId: groupId})
            setMessage('Successfully invited')
            setTimeout(() => {
                setMessage('')
            }, 3000)
        }catch(e){
            setMessage('Could not invite')
            setTimeout(() => {
                setMessage('')
            }, 3000)
        }

        
    }

    function handleJoin(){
        try{
            api.post('/study-groups/join-study-group', {groupId: groupId})
            setTimeout(() => navigate(0), 250)
        }catch(e){
            setMessage('Something went wrong')
        }
        
        
    }

    async function handleThreadSubmit(e){
        e.preventDefault()
        if(!threadTitleInput){
            setMessage('Title cannot be empty')
            return
        }
        if(!threadDescriptionInput){
            setMessage('Description cannot be empty')
            return
        }
        try{
            await api.post(`/study-groups/${groupId}/create-thread`, {title: threadTitleInput, description: threadDescriptionInput, studyGroupId: groupId, })
            setMessage('Created Thread')
        }catch(e){
            setMessage('Something is wrong')
        }
        
    }

    function handleClearFileSelection(e){
        setResourcesFileInput(undefined)

        if (resourcesFileInputElemRef.current){
            resourcesFileInputElemRef.current.value = ""
        }
    }

    async function handleResourcesSubmit(e){
        if(!resourcesTitleInput){
            setMessage('Please provide title')
            return
        }
        e.preventDefault()
        const formData = new FormData()
        formData.append('title',resourcesTitleInput)
        formData.append('description', resourcesDescriptionInput)
        formData.append('link', resourcesLinkInput)
        if(resourcesFileInput){
            formData.append('file', resourcesFileInput)
        }

        try{
            await api.postFormData(`study-groups/${groupId}/create-resource`, formData)

            setTimeout(() => {
                navigate(0)
            }, 800)
            
        }
        catch(e){
            setMessage('Something went wrong')
        }

    }

    async function handleDownloadResource(resource_id){
        try{
            api.getDownload(`/study-groups/${groupId}/download-resource/${resource_id}`)
        }
        catch(e){
            setMessage('something went wrong')
        }
    }


    if(!isMember){
        return(
            <>
                <div className="content-container">
                    <h3>You are not a part of this group!</h3>
                    <button onClick={handleJoin}>Join</button>
                </div>
                
            </>
        )
    }



    return(
        
        <>
        <div className="group-view">

            <div className="top-bar">
                <div className="logo">
                    <h2 onClick={() => navigate('/')} >SkillSync</h2>
                </div>
            
                <button onClick={handleLogout}>Logout</button>
            </div>

            <div className="content-container">
                {message && <p>{message}</p>}
                <h1>{groupInfo.name}</h1>
                <p>{groupInfo.description}</p>

                <div className="tag-pills-container">
                    {tags.map(t => {
                        return (
                            <div className="tag-pill">{t}</div>
                        )
                    })}
                </div>
                
                <Link to={`/study-groups/view-chat/${groupId}`}><p>View chat</p></Link>
                
                <div className="tab-selectors-container">
                    
                    <div className={openTab == 'threads'? 'tab-selector selected': 'tab-selector'} onClick={() => setOpenTab('threads')}>Threads</div>
                    <div className={openTab == 'resources'? 'tab-selector selected': 'tab-selector'} onClick={() => setOpenTab('resources')}>Resources</div>
                    <div className={openTab == 'invitation'? 'tab-selector selected': 'tab-selector'} onClick={() => setOpenTab('invitation')}>Invite</div>
                    
                </div>


                <div className="invitation-container" style={{display: openTab == 'invitation'? 'flex': 'none'}}>

                    <p>Invite a user(put username): </p>
                    <input onChange={(e) => setInviteUsernameInput(e.target.value)} value={inviteUsernameInput}></input>
                    <a onClick={handleInviteClick}>Invite</a>

                </div>

                
                <div className="threads-container" style={{display: openTab == 'threads'? 'flex': 'none'}}>
                    <h4>Create a new thread!</h4>
                    <p>Ttile: </p>
                    <input onChange={(e) => setThreadTitleInput(e.target.value)} value={threadTitleInput}></input>
                    <p>Description: </p>
                    <input onChange={(e) => setThreadDescriptionInput(e.target.value)} value={threadDescriptionInput}></input>
                    <br></br>
                    <button onClick={handleThreadSubmit}>Submit</button>

                    {threads.length > 0 && <h3>Threads: </h3>}
                    {threads.map(t => {
                        return(
                            <div key={t._id} className='card'>
                                <h4>{t.title}</h4>
                                <p>Made by: {t.authorId.username}</p>
                                <p>{t.description}</p>
                                <div className="view-button" onClick={() => navigate(`/study-groups/view-thread/${groupId}/${t._id}`)}>
                                    <ArrowSvg></ArrowSvg>
                                </div>
                            </div>
                            

                        )
                    })}
                </div>
                

                <div className="resources-container" style={{display: openTab == 'resources'? 'flex': 'none'}} >


                    <h3>Create a resource</h3>
                    <p>Title: </p>
                    <input onChange={(e) => setResourcesTitleInput(e.target.value)} value={resourcesTitleInput}></input>
                    <p>Description: </p>
                    <input onChange={(e) => setResourcesDescriptionInput(e.target.value)} value={resourcesDescriptionInput}></input>
                    <p>Link: </p>
                    <input onChange={(e) => setResourcesLinkInput(e.target.value)} value={resourcesLinkInput}></input>
                    <p>File:</p>
                    <div className="file-input-container">
                        <input onChange={(e) => setResourcesFileInput(e.target.files[0])} type='file' ref={resourcesFileInputElemRef} ></input>
                        <a onClick={ (e) =>  handleClearFileSelection(e)} >Remove file</a>
                    </div>
                    
                    
                    <button onClick={handleResourcesSubmit} >Submit</button>
                    <h3>Resources:</h3>
                    {resources.map(m => {
                        return(
                            <div key={m._id} className='card' >
                                <h4>{m.title}</h4>
                                <p>{m.description}</p>
                                {m.link && <a href={m.link}>{m.link}</a>}
                                <p>by: {m.uploaderId.username}</p>
                                {m.isFileAvailable && <div className='view-button' onClick={(e) => handleDownloadResource(m._id)}><ArrowSvg></ArrowSvg></div>}
                                {m.isFileAvailable && <p>File download is availabe</p>}
                            </div>
                        )
                    })}

                </div>

                
            </div>

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