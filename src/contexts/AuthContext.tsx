import Router from "next/router"
import { createContext, ReactNode, useEffect, useState } from "react"
import { setCookie, parseCookies, destroyCookie } from 'nookies'

import { api, replaceToken } from "../services/apiClient"
import { NextPageContext } from "next"

type User = {
  email: string;
  permissions: string[];
  roles: string[];
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signOut: () => void;
  user: User;
  isAuthenticated: boolean;
}

interface AuthContextProviderProps {
  children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData);

let authChannel: BroadcastChannel;

export function signOut(postAuthChannel: boolean = true) {
  destroyCookie(undefined, 'next-auth.token');
  destroyCookie(undefined, 'next-auth.refreshToken');
  if(postAuthChannel)
    authChannel.postMessage('signOut');
  Router.push('/');
}

export function setTokenAndRefreshToken(ctx = undefined as unknown as NextPageContext, token: string, refreshToken: string) {
  setCookie(ctx, 'next-auth.token', token, {
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/'
  });
  setCookie(ctx, 'next-auth.refreshToken', refreshToken, {
    maxAge: 60 * 60 * 24 * 30, // 30 dias
    path: '/'
  });
}

export function AuthProvider({children}: AuthContextProviderProps) {
  const [user, setUser] = useState({} as User);
  const isAuthenticated = !!user;

  useEffect(() => {
    authChannel = new BroadcastChannel('auth');
  }, [])

  useEffect(() => {
    authChannel.onmessage = (message) => {
      if(message.data === 'signOut')
        signOut(false);
      if(message.data === 'signIn')
        window.location.reload();
    }
  }, [])

  useEffect(() => {
    const {'next-auth.token': token} = parseCookies();
    if(token) {
      api.get('me')
        .then(res => {
          const { email, permissions, roles } = res.data;
          setUser({ email, permissions, roles });
        })
        .catch(() => {
          signOut();
        })
    }
  }, []);

  async function signIn({email, password}: SignInCredentials) {
    try {
      const { token, refreshToken, permissions, roles } = (await api.post('sessions', {email, password})).data;
      setTokenAndRefreshToken(undefined, token, refreshToken);
      setUser({ email, permissions, roles });
      replaceToken(token);
      authChannel.postMessage('signIn');
      Router.push('/dashboard');
    } catch(error) {
      console.log(error);
    }
  }

  return (
    <AuthContext.Provider value={{signIn, signOut, user, isAuthenticated}}>
      {children}
    </AuthContext.Provider>
  )
}