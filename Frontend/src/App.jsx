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

import { PortfolioList } from './PortfolioComponents/PortfolioList'
import { UploadPortfolio } from './PortfolioComponents/UploadPortfolio'
import { MyPortfolios } from './PortfolioComponents/MyPortfolios'

import {AIChatbot} from './aicomponent/AIChatbot'
import { RoadmapGenerator } from './aicomponent/RoadmapGenerator'
import { MentorDirectory } from './MentorComponents/MentorDirectory'
import { MentorProfileView } from './MentorComponents/MentorProfileView'
import { MentorProfileEditor } from './MentorComponents/MentorProfileEditor'
import { MyMentorSessions } from './MentorComponents/MyMentorSessions'

import JobTracker from "./JobTracker";
import { AccountPage } from './accountcComponents/AccountPage';
import { DirectMessageView } from './DirectMessageComponents/DirectMessageView';
import { InboxView } from './DirectMessageComponents/InboxView';
import { BookmarksPage } from './BookmarkComponents/BookmarksPage';

import Layout from './Layout';


function App() {

  return (
    <>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
        </Route>
        
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/study-groups" element={<StudyGroups />} />
          <Route path="/study-groups/create-study-group" element={<CreateStudyGroup />} />
          <Route path="/study-groups/view-group/:groupId" element={<GroupView />} />
          <Route path="/study-groups/view-thread/:groupId/:threadId" element={<ThreadView />} />
          <Route path="/study-groups/view-chat/:groupId" element={<ChatView />} />
          <Route path="/portfolios" element={<PortfolioList />} />
          <Route path="/portfolios/upload" element={<UploadPortfolio />} />
          <Route path="/portfolios/my" element={<MyPortfolios />} />
          <Route path="/jobs" element={<JobTracker />} />
          <Route path="/chatbot" element={<AIChatbot />} />
          <Route path="/mentors" element={<MentorDirectory />} />
          <Route path="/mentors/sessions" element={<MyMentorSessions />} />
          <Route path="/mentors/:mentorUserId" element={<MentorProfileView />} />
          <Route path="/mentors/profile/edit" element={<MentorProfileEditor />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/direct-messages/:conversationId" element={<DirectMessageView />} />
          <Route path="/inbox" element={<InboxView />} />
          <Route path="/roadmap" element={<RoadmapGenerator />} />
          <Route path="/bookmarks" element={<BookmarksPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App