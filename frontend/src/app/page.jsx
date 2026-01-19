"use client"
import useAuthStore from '../store/authStore'
import { redirect } from 'next/navigation';
import React from 'react'

const page = () => {
  const {isLoggedIn ,sAuthenticated}=useAuthStore();
  console.log(isLoggedIn());
  if(!isLoggedIn()){
    redirect('/signup')
  }
  return (
    <div className=''>page</div>
  )
}

export default page