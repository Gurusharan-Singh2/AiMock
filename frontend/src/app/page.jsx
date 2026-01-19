"use client"
import Navbar from '@/_component/Navbar';
import useAuthStore from '@/store/authStore'
import { redirect } from 'next/navigation';
import React from 'react'

const page = () => {
  const {isLoggedIn ,sAuthenticated}=useAuthStore();
  // console.log(isLoggedIn());
  // if(!isLoggedIn()){
  //   redirect('/signup')
  // }
  return (
    <div className="min-h-screen bg-[#0f0d1d]">
      <Navbar />

      <main className="container mx-auto px-6 py-10">
        <h1 className="text-2xl text-white font-bold">
          Welcome to AI Mock Interview
        </h1>

        <p className="mt-2 text-white text-muted-foreground">
          Practice interviews with AI and get instant feedback.
        </p>
      </main>
    </div>
  )
}

export default page