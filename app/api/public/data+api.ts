export async function GET(req: Request) {
  return Response.json({
    data: "This is public data!",
  });
}
