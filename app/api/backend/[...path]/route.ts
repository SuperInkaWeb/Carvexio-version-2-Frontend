import { getAccessToken } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext = { params: Promise<{ path: string[] }> };
function isPublicRequest(method: string, path: string): boolean {
  if (method === 'GET' && path === 'business/public') return true;
  if (method === 'GET' && path.startsWith('business/public/')) return true;
  if (method === 'GET' && path.startsWith('services/public/')) return true;
  if (method === 'GET' && path.startsWith('products/public/')) return true;
  if (method === 'GET' && path === 'plans') return true;
  if (method === 'POST' && path === 'reclamaciones') return true;
  return false;
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  return handleRequest(req, params, 'GET');
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  return handleRequest(req, params, 'POST');
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  return handleRequest(req, params, 'PUT');
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  return handleRequest(req, params, 'DELETE');
}

async function handleRequest(req: NextRequest, paramsPromise: Promise<{ path: string[] }>, method: string) {
  let accessToken: string | undefined;

  try {
    const params = await paramsPromise;
    const pathSegments = Array.isArray(params.path) ? params.path : [];
    if (pathSegments.length === 0 || pathSegments.some((segment: string) => segment === '.' || segment === '..' || segment.includes('\\'))) {
      return NextResponse.json({ error: 'Ruta no válida' }, { status: 400 });
    }

    const path = pathSegments.join('/');
    const publicRequest = isPublicRequest(method, path);

    try {
      const res = new NextResponse();
      const tokenResult = await getAccessToken(req, res);
      accessToken = tokenResult.accessToken;
    } catch {
      if (!publicRequest) {
        console.error('TOKEN ERROR: no se pudo obtener el token de acceso');
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
      }
    }

    const searchParams = req.nextUrl.search;

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8080';
    const url = `${backendUrl}/api/${path}${searchParams}`;

    const contentType = req.headers.get('Content-Type') || '';
    
    // Preparar el payload del body
    let bodyPayload: BodyInit | undefined;
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      if (contentType.includes('multipart/form-data')) {
        bodyPayload = await req.formData();
      } else {
        bodyPayload = await req.text();
      }
    }

    const headers: Record<string, string> = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    // Solo poner Content-Type si hay texto. Si es FormData, fetch pone el boundary automÃ¡ticamente.
    if (bodyPayload && typeof bodyPayload === 'string') {
      headers['Content-Type'] = contentType || 'application/json';
    }

    const response = await fetch(url, {
      method,
      headers,
      body: bodyPayload || undefined,
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const responseText = await response.text();

    // Log en consola del servidor para debug
    if (!response.ok) {
      console.error(`Backend Error [${method} /api/${path}]: ${response.status}`);
    }

    return new NextResponse(responseText, {
      status: response.status,
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'application/json',
      },
    });
  } catch {
    console.error('Proxy Error: fallo al comunicar con el backend');
    return NextResponse.json(
      { error: 'Error de conexiÃ³n con el servidor backend' },
      { status: 502 }
    );
  }
}
