export async function onRequest(context) {
  const { request } = context;
  const VM_IP = "136.118.195.126.nip.io";
  const VM_PORT = "3000";

  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/")) {
    return context.next();
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": request.headers.get("Origin") ?? "*",
        "Access-Control-Allow-Methods": "GET, HEAD, PUT, PATCH, POST, DELETE",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Credentials": "true",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const targetUrl = `http://${VM_IP}:${VM_PORT}${url.pathname}${url.search}`;

  const response = await fetch(targetUrl, {
    method: request.method,
    headers: request.headers,
    body:
      request.method !== "GET" && request.method !== "HEAD"
        ? request.body
        : undefined,
    redirect: "follow",
  });

  const newHeaders = new Headers(response.headers);
  newHeaders.set(
    "Access-Control-Allow-Origin",
    request.headers.get("Origin") ?? "*",
  );
  newHeaders.set("Access-Control-Allow-Credentials", "true");
  return new Response(response.body, {
    status: response.status,
    headers: newHeaders,
  });
}
