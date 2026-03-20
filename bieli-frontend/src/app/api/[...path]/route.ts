import { NextRequest, NextResponse } from 'next/server';

const BACKEND = 'https://mes-projet-production.up.railway.app';

async function proxy(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const path = params.path.join('/');
  const search = request.nextUrl.search;
  const target = `${BACKEND}/api/${path}${search}`;

  const headers = new Headers();
  const auth = request.headers.get('authorization');
  const ct = request.headers.get('content-type');
  if (auth) headers.set('authorization', auth);
  if (ct) headers.set('content-type', ct);

  const isBodyless = ['GET', 'HEAD'].includes(request.method);
  const body = isBodyless ? undefined : await request.text();

  const res = await fetch(target, {
    method: request.method,
    headers,
    body: body || undefined,
    redirect: 'manual',
  });

  // Forward HTTP redirects (e.g. Google OAuth 302) directly to the browser
  if (res.status >= 300 && res.status < 400) {
    const location = res.headers.get('location');
    if (location) {
      return NextResponse.redirect(location, { status: res.status });
    }
  }

  const data = await res.text();
  return new NextResponse(data, {
    status: res.status,
    headers: { 'content-type': res.headers.get('content-type') || 'application/json' },
  });
}

export const GET    = proxy;
export const POST   = proxy;
export const PUT    = proxy;
export const PATCH  = proxy;
export const DELETE = proxy;
