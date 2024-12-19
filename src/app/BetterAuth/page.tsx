"use client"
import { authClient } from "@/lib/auth-client"; //import the auth client
import React from "react";
import { useState } from 'react';

export default function NewSignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const signUp = async () => {
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
      // email: 'hi',
      // password: 'there',
      // name: 'stan',
      // image: image ? convertImageToBase64(image) : undefined, 
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
      <input type="name" value={name} onChange={(e) => setName(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
      {/* <input type="file" onChange={(e) => setImage(e.target.files?.[0])} /> */}
      <button onClick={signUp}>Sign Up</button>
    </div>
  );
}

function convertImageToBase64(image: File) {
  throw new Error("Function not implemented.");
}
