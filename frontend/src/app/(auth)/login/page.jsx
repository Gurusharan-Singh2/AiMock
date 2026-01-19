"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [userData,setUserData]=useState({
      email:"",
      password:"",
  })
  const router = useRouter();

  const handleSubmit = (e) => {

    e.preventDefault();
    console.log("Login attempt:", { userData });
    // TODO: call your login API here
  };

  const handleOnChange=(e)=>{
      const { name, value } = e.target;
    setUserData((prevData) => ({
      ...prevData,
      [name]: value
    }));

  }

  return (
    <div className="flex items-center justify-center min-h-screen ">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white shadow-2xl rounded-xl p-8 w-full max-w-md"
      >
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-2xl font-bold text-center text-indigo-700 mb-6"
        >
          Login
        </motion.h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div className="relative">
            <input
              type="email"
              id="email"
              name="email"
              value={userData.email}
              onChange={handleOnChange}
              placeholder=" "
              required
              className="peer w-full px-3 pt-5 pb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label
              htmlFor="email"
              className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-indigo-600"
            >
              Email
            </label>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type="password"
              id="password"
              name="password"
              value={userData.password}
              onChange={handleOnChange}
              placeholder=" "
              required
              className="peer w-full px-3 pt-5 pb-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <label
              htmlFor="password"
              className="absolute left-3 top-2 text-gray-500 text-sm transition-all peer-placeholder-shown:top-5 peer-placeholder-shown:text-gray-400 peer-placeholder-shown:text-base peer-focus:top-2 peer-focus:text-sm peer-focus:text-indigo-600"
            >
              Password
            </label>
          </div>

          {/* Forgot Password */}
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            className="text-sm text-indigo-600 hover:underline"
            onClick={() => router.push("/forget-password")}
          >
            Forgot Password?
          </motion.button>

          {/* Submit Button */}
          <motion.button
            type="submit"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition duration-300"
          >
            Sign In
          </motion.button>
        </form>

        {/* Sign Up Redirect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-6 text-center"
        >
          <p className="text-gray-600 text-sm">Don’t have an account?</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            className="mt-2 text-indigo-600 font-medium hover:underline"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </motion.button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginPage;