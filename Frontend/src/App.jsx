import { useState, useContext } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import { Route, Routes } from 'react-router-dom'

import {Login} from './Login'
import { Home } from './Home'

function App() {
  

  return (
    <>
      <Routes>
        <Route path="/" element = {<Home></Home>} />
        <Route path="/login" element = {<Login></Login>} />
      </Routes>
    </>
  )
}

export default App
