import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  Users, Briefcase, BookOpen, Bot,
  Map, Bookmark, Inbox, User, ChevronLeft, GraduationCap,
  FolderOpen, MessageSquare, PlusSquare, LayoutGrid
} from 'lucide-react'
import { useContext } from 'react'
import { authContext } from './AuthContext'
import { apiContext } from './ApiContext'


const navSections = [
  {
    label: 'Community',
    items: [
      { to: '/study-groups', icon: LayoutGrid, label: 'Study groups' },
      { to: '/portfolios', icon: FolderOpen, label: 'Portfolios' },
      { to: '/portfolios/my', icon: FolderOpen, label: 'My portfolios' },
      { to: '/jobs', icon: Briefcase, label: 'Jobs' },
    ]
  },
  {
    label: 'Tools',
    items: [
      { to: '/chatbot', icon: Bot, label: 'AI chatbot' },
      { to: '/roadmap', icon: Map, label: 'Roadmap' },
      { to: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
    ]
  },
  {
    label: 'Mentorship',
    items: [
      { to: '/mentors', icon: GraduationCap, label: 'Mentors' },
      { to: '/mentors/sessions', icon: GraduationCap, label: 'My sessions' },
      
    ]
  }
]

const bottomItems = [
  { to: '/inbox', icon: Inbox, label: 'Inbox' },    
  { to: '/account', icon: User, label: 'Account' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)

  const [userType, setUserType] = useState('')

  const {isLoggedIn, username, handleLogout, userId, isAuthLoading} = useContext(authContext)
  const {api} = useContext(apiContext )

    useEffect(() => {
        if (isAuthLoading || !isLoggedIn) return

        async function getProfileInfo(){
            try{
                const res = await api.get('/get-profile-info')
                setUserType(res.data.userType ?? '')
            }
            catch(e){
                setUserType('')
            }
        }
        getProfileInfo()
    }, [isAuthLoading, isLoggedIn])

    if(!isLoggedIn){
        return(
            <></>
        )
    }

  return (
    <aside
      className="sidebar"
      style={{ width: collapsed ? 52 : 220 }}
    >
      <div className="sidebar-header">
        {!collapsed && <span className="sidebar-logo">SkillSync</span>}
        <button
          className="sidebar-toggle"
          onClick={() => setCollapsed(c => !c)}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <h4 style={{
              transform: collapsed ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.22s ease'
            }}>{"<<"}</h4>
        </button>
      </div>

      <nav className="sidebar-nav">
        {navSections.map(section => (
          <div key={section.label} className="sidebar-section">
            {!collapsed && (
              <p className="sidebar-section-label">{section.label}</p>
            )}
            {section.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  `sidebar-item${isActive ? ' active' : ''}`
                }
                title={collapsed ? label : undefined}
              >
                <Icon size={16} className="sidebar-item-icon" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-bottom">
        {bottomItems.map(({ to, icon: Icon, label, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `sidebar-item${isActive ? ' active' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={16} className="sidebar-item-icon" />
            {!collapsed && <span>{label}</span>}
            {!collapsed && badge && (
              <span className="sidebar-badge">{badge}</span>
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  )
}