import { useState, useContext } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { Route, Routes } from 'react-router-dom'
import {Login} from './Login'
import { Home } from './Home'
import { SignUp } from './SignUp'
import { ProtectedRoute } from './ProtectRoute'
import {StudyGroups} from './StudyGroupComponents/StudyGroups'
import {CreateStudyGroup} from './StudyGroupComponents/CreateStudyGroup'
import {GroupView} from './StudyGroupComponents/GroupView'
import { ThreadView } from './StudyGroupComponents/ThreadView'
import { ChatView } from './StudyGroupComponents/ChatView'

function App() {
  

  return (
    <>
      <Routes>
        <Route path="/" element = {<Home></Home>} />
        <Route path="/login" element = {<Login></Login>} />
        <Route path="/signup" element = {<SignUp></SignUp>} />
        <Route path="/study-groups" element = {<ProtectedRoute><StudyGroups/></ProtectedRoute>} />
        <Route path="/study-groups/create-study-group" element = {<ProtectedRoute><CreateStudyGroup/></ProtectedRoute>} />
        <Route path="/study-groups/view-group/:groupId" element={<ProtectedRoute><GroupView></GroupView></ProtectedRoute>}></Route>
        <Route path='/study-groups/view-thread/:groupId/:threadId' element={<ProtectedRoute><ThreadView></ThreadView></ProtectedRoute>}></Route>
        <Route path='/study-groups/view-chat/:groupId' element={<ProtectedRoute><ChatView></ChatView></ProtectedRoute>}></Route>

      </Routes>
    </>
  )
}

export default App
