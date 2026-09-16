import { handleAuth, handleLogin } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

type AuthRouteContext = { params: Promise<{ auth0: string[] }> };

export const GET = async (req: NextRequest, { params }: AuthRouteContext) => {
  const resolvedParams = await params;
  
  return handleAuth({
    login: handleLogin({
      authorizationParams: {
        audience: process.env.AUTH0_AUDIENCE,
        // Pedimos los permisos necesarios
        scope: 'openid profile email'
      }
    })
  })(req, { params: resolvedParams });
};

export const POST = async (req: NextRequest, { params }: AuthRouteContext) => {
  const resolvedParams = await params;
  return handleAuth()(req, { params: resolvedParams });
};
