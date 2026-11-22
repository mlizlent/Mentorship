import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { queryClient } from './services/query-client'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

import Layout from './components/layout/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import MentorsPage from './pages/MentorsPage'
import MentorDetailPage from './pages/MentorDetailPage'
import MentorshipsPage from './pages/MentorshipsPage'
import MessagesPage from './pages/MessagesPage'
import ChatPage from './pages/ChatPage'
import ProfilePage from './pages/ProfilePage'
import DesignPage from './pages/DesignPage'
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <ToastContainer />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/mentorships" element={<MentorshipsPage />} />
          <Route element={<Layout />}>
            <Route path="/home" element={<HomePage />} />
            <Route path="/mentors" element={<MentorsPage />} />
            <Route path="/mentors/:id" element={<MentorDetailPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:conversationId" element={<ChatPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/design" element={<DesignPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
