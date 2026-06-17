export const onRequest: PagesFunction = async (context) => {
  const request = context.request;
  
  // Retrieve the country from request.cf metadata (injected by Cloudflare)
  // or fallback to the 'cf-ipcountry' header
  const country = request.cf?.country || request.headers.get("cf-ipcountry") || null;

  return new Response(
    JSON.stringify({
      countryCode: country,
    }),
    {
      headers: {
        "content-type": "application/json;charset=UTF-8",
        "cache-control": "private, no-cache, no-store, must-revalidate",
        "access-control-allow-origin": "*",
      },
    }
  );
};
