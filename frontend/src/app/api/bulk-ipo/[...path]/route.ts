import { NextRequest, NextResponse } from "next/server";

const BULK_API = process.env.NEXT_PUBLIC_BULK_IPO_URL || "http://localhost:8000";

async function proxyRequest(req: NextRequest, path: string) {
  const url = `${BULK_API}/api/${path}`;
  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (k !== "host") headers.set(k, v);
  });

  const init: RequestInit = {
    method: req.method,
    headers,
  };

  if (req.method !== "GET" && req.method !== "HEAD") {
    init.body = await req.text();
  }

  try {
    const resp = await fetch(url, init);
    const data = await resp.text();
    return new NextResponse(data, {
      status: resp.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return NextResponse.json(
      { error: "Bulk IPO backend not reachable", url },
      { status: 502 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  return proxyRequest(req, path.join("/"));
}
