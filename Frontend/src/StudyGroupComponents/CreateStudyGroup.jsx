
import { useState, useContext } from "react"
import { apiContext } from "../ApiContext"
import { useNavigate } from "react-router-dom"

import './CreateStudyGroup.css'

export function CreateStudyGroup(){

    const {api} = useContext(apiContext)

    const [groupName, setGroupName] = useState('')
    const [groupDesc, setGroupDesc] = useState('')
    const [tags, setTags] = useState([])
    const [tagInput, setTagInput] = useState('')
    const [message, setMessage] = useState('')
    const [groupVisibilityInput, setGroupVisibilityInput] = useState('public')

    const navigate = useNavigate()

    function handleGroupNameInput(e){
        e.preventDefault()
        setGroupName(e.target.value)
    }

    function handleGroupDescInput(e){
        e.preventDefault()
        setGroupDesc(e.target.value)
    }

    function handleTagInput(e){
        e.preventDefault()
        setTagInput(e.target.value)
    }

    function handleTagAddClick(e){
        e.preventDefault()
        setTags(prev => [...prev, tagInput])
        setTagInput('')

    }

    function handleTagDelete(tag){
        setTags(prev => prev.filter(t => t!==tag))
    }

    async function handleSubmit(e){
        e.preventDefault()
        if(!groupName){
            setMessage('Group name cannot be empty!')
            return
        }

        const isGroupPrivate = groupVisibilityInput === 'public' ? false: true

        try{
            await api.post('/study-groups/create-study-group', {groupName: groupName, groupDesc: groupDesc, groupTagsArray: tags, isGroupPrivate: isGroupPrivate})
            setMessage('Group Created!')

            setTimeout(() => {
                navigate('/study-groups')
            }, 1000)

        }catch(e){
            setMessage('something went wrong')
        }

    }

    return (
        <>

            <div className="create-study-group-view">

            
                {message && <p>{message}</p>}
                <h3>Crete a group!</h3>
                <p>Name: </p>
                <input value={groupName} onChange={handleGroupNameInput}></input>
                <p>Description: </p>
                <textarea value={groupDesc} onChange={handleGroupDescInput}></textarea>
                <p>Group visibility:</p>
                
                <select onChange={(e) => setGroupVisibilityInput(e.target.value)} >
                    <option value = 'public'>public</option>
                    <option value = 'private'>private</option>
                </select>


                <p>Tags:</p>
                <div className="tag-pills-container">
                    {tags.map(t => <div className="tag-pill tag-pill-deletable" onClick={() => handleTagDelete(t)} key={t}>{t}</div>)}
                </div>
                
                <div className="tag-input-container">
                    <input value={tagInput} onChange={handleTagInput}></input>
                    <a onClick={handleTagAddClick}>Add tag</a>
                </div>
                
                <br></br>
                <button onClick={handleSubmit}>Create!</button>

            </div>
            
        </>
    )
}