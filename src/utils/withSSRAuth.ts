import { GetServerSideProps, GetServerSidePropsContext } from "next";
import { destroyCookie, parseCookies } from 'nookies'
import decode from 'jwt-decode'

import { AuthTokenError } from "../services/errors/AuthTokenError";
import { validatePermissions } from "./validatePermissions";

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth(fn: GetServerSideProps, options?: WithSSRAuthOptions) {
  return async (ctx: GetServerSidePropsContext) => {
    const cookies = parseCookies(ctx);
    const token = cookies['next-auth.token'];
    if(!token) {
      return {
        redirect: {
          destination: '/',
          permanent: false
        }
      }
    }
    
    if(options) {
      const user = decode<{ permissions: string[], roles: string[] }>(token);
      const permissions = options?.permissions;
      const roles = options?.roles;
      const hasPermissions = validatePermissions({ user, permissions, roles });

      if(!hasPermissions) {
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false
          }
        }
      }
    }
    
    try {
      return await fn(ctx);
    } catch (err) {
      if(err instanceof AuthTokenError) {
        destroyCookie(ctx, 'next-auth.token');
        destroyCookie(ctx, 'next-auth.refreshToken');
        return {
          redirect: {
            destination: '/',
            permanent: false
          }
        }
      }
    }
  }
}