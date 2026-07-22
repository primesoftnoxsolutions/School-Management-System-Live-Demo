/**
 * Proxies /api/* from Vercel to the Railway backend.
 * Set BACKEND_URL in Vercel → Settings → Environment Variables
 * Example: https://your-service.up.railway.app
 * (no trailing slash, no /api suffix)
 */
export const config = {
  matcher: ["/api/:path*"],
};

export default async function middleware(request) {
  const backend = String(process.env.BACKEND_URL || process.env.API_ORIGIN || "")
    .trim()
    .replace(/\/$/, "");

  if (!backend) {
    return Response.json(
      {
        success: false,
        message:
          "BACKEND_URL is not set on Vercel. Add your Railway URL (https://….up.railway.app) in Vercel → Settings → Environment Variables, then Redeploy.",
      },
      { status: 503 }
    );
  }

  if (!/^https?:\/\//i.test(backend)) {
    return Response.json(
      {
        success: false,
        message: "BACKEND_URL must start with https:// (your Railway public URL).",
      },
      { status: 503 }
    );
  }

  const incoming = new URL(request.url);
  const target = `${backend}${incoming.pathname}${incoming.search}`;

  const headers = new Headers(request.headers);
  try {
    headers.set("host", new URL(backend).host);
  } catch {
    return Response.json({ success: false, message: "Invalid BACKEND_URL" }, { status: 503 });
  }

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const init = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (hasBody) {
    init.body = request.body;
    init.duplex = "half";
  }

  const upstream = await fetch(target, init);
  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}
