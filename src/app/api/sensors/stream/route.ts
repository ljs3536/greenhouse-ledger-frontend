export async function GET() {
  const upstream = await fetch("http://127.0.0.1:8080/api/sensors/stream", {
    cache: "no-store",
    headers: { Accept: "text/event-stream" },
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
