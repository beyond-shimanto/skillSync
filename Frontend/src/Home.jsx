import { useContext, useEffect, useState } from "react"
import { Link,useNavigate } from "react-router-dom"
import { authContext } from "./AuthContext"
import { apiContext } from "./ApiContext"
import './Home.css'


export function Home(){

    const {isLoggedIn, username, handleLogout, userId} = useContext(authContext)
    const {api} = useContext(apiContext )
    const navigate = useNavigate()
    const [ownGroups, setOwnGroups] = useState([])

    useEffect(() => {
        async function getOwnGroups(){
            try{
                const res = await api.get('/study-groups/get-joined-study-groups')
                setOwnGroups(res.data.slice(0, 3))
                
            }
            catch(e){
                
            }
        }

        getOwnGroups()
    }, [])


    if(!isLoggedIn){
        return (
            <>

            <div className="home" style={{display: "flex", alignItems: "center", justifyContent: "center"}}>
                <div className="top-bar" style={{position: "absolute", top: "0", left: "0"}}>
                    <div className="logo">
                        <h2 onClick={() => navigate('/')} >SkillSync</h2>
                        
                    </div>
                
                    <button onClick={(e) => navigate('/login')}>Login</button>
                </div>
                <div className="content-container" style={{alignItems: "center", justifyContent: "center", gap: "1rem"}}>
                    <h1 >Wecome to SkillSync</h1>
                    <p style={{fontSize: "1.25rem", maxWidth: "70%"}}>SkillSync — Where learners connect, grow, and get guided. Build skills with study groups, expert mentors, AI-powered tools, and a community designed to accelerate your career.</p>
                    <button onClick={() => navigate('/signup')}>Get started!</button>
                </div>

             </div>
            
            </>
        )

    }

    return (
        <>
        <div className="home">
             <div className="top-bar">
                <div className="logo">
                    <h2 onClick={() => navigate('/')} >SkillSync</h2>
                    <p>Welcome back, {username}!</p>
                </div>
                
                <button onClick={(e) => handleLogout()}>Logout</button>
             </div>
             <div className="content-container">

                {ownGroups.length > 0? 
                
                    <div className="groups-view">
                        <h2>Your Groups:</h2>
                        {ownGroups.map(g => {
                            return(
                                <div key={g._id} className="card">
                                    <h4 onClick={() => navigate(`/study-groups/view-group/${g._id}`)}>{g.name}</h4>
                                    <p>{g.description}</p>
                                    
                                    <div className="tag-pills-container">
                                        {g.tags.map(t => <div key={t} className="tag-pill">{t}</div>)}
                                    </div>
                                    

                                    
                                    <div className="view-button" onClick={() => navigate(`/study-groups/view-group/${g._id}`)}>
                                        <ArrowSvg></ArrowSvg>
                                    </div>
                                    

                                </div>
                            )
                        })}

                    </div>
            
                
                :
                <h3>You are not a member of any groups</h3>
                }
                <div className="additional-links">
                    <Link to='/study-groups'>Browse Study Groups</Link>
                    <Link to='/portfolios'>View Portfolios</Link>
                    <Link to='/portfolios/my'>My Portfolios</Link>
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