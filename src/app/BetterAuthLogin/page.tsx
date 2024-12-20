"use client"
import { authClient } from "@/lib/auth-client";
import React, { useState } from "react";

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const signIn = async () => {
    const { data, error } = await authClient.signIn.email({
      email,
      password,
    }, {
      onRequest: (ctx) => {
        //show loading
      },
      onSuccess: (ctx) => {
        //redirect to the dashboard
      },
      onError: (ctx) => {
        alert(ctx.error.message);
      },
    });
  };

  return (
    <div>
      <input 
        type="email" 
        placeholder="Email"
        value={email} 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        type="password" 
        placeholder="Password"
        value={password} 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <button onClick={signIn}>Sign In</button>
    </div>
  );
}