// What the deploy script and the container health check ask for. Answers as
// soon as the Node server is up; there is nothing else for this site to wait on.
export const dynamic = "force-static";

export function GET() {
  return new Response("ok", { headers: { "content-type": "text/plain" } });
}
