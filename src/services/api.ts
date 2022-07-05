import axios, { AxiosError } from 'axios'
import { NextPageContext } from 'next';
import { parseCookies } from 'nookies'

import { setTokenAndRefreshToken, signOut } from '../contexts/AuthContext';
import { replaceToken } from './apiClient';
import { AuthTokenError } from './errors/AuthTokenError';

type FailedRequest = {
  onSuccess: (token: string) => void;
  onFailure: (error: AxiosError) => void;
}

type ExpiredTokenResponse = {
  code: string;
  error: boolean;
  message: string;
}


let isRefreshing = false;
let failedRequestQueue = [] as FailedRequest[];


export function setupAPIClient(ctx = undefined as unknown as NextPageContext) {
  let cookies = parseCookies(ctx);

  const api = axios.create({
    baseURL: 'http://localhost:3333',
    headers: {
      Authorization: `Bearer ${cookies['next-auth.token']}`
    }
  });
  
  api.interceptors.response.use(
    response => response,
    (error: AxiosError) => {
      if(error.response?.status === 401) {
        const responseData = error.response.data as ExpiredTokenResponse;
        if(responseData.code === 'token.expired') {
          cookies = parseCookies(ctx);
          const {'next-auth.refreshToken': refreshToken} = cookies;
          const originalConfig = error.config;
          if(!isRefreshing) {
            isRefreshing = true;
            api.post('/refresh', { refreshToken })
              .then(response => {
                const {token: newToken, refreshToken: newRefreshToken} = response.data;
                setTokenAndRefreshToken(ctx, newToken, newRefreshToken);
                replaceToken(newToken);
                failedRequestQueue.forEach(request => request.onSuccess(newToken));
              })
              .catch(err => {
                failedRequestQueue.forEach(request => request.onFailure(err));
                if(process.browser) {
                  signOut();
                }
              })
              .finally(() => {
                failedRequestQueue = [];
                isRefreshing = false;
              });
          }
          return new Promise((resolve, reject) => {
            failedRequestQueue.push({
              onSuccess: (token: string) => {
                originalConfig.headers = { ...originalConfig.headers, Authorization: `Bearer ${token}` };
                resolve(api(originalConfig));
              },
              onFailure: (error: AxiosError) => {
                reject(error);
              }
            })
          })
        } else {
          if(process.browser) {
            signOut();
          } else {
            return Promise.reject(new AuthTokenError());
          }
        }
      }
      return Promise.reject(error);
    }
  )
  return api;
}