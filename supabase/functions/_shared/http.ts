export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

/** Mensaje de error para el panel, con el tono de DESIGN.md §3 (directo, humano, sin tecnicismos). */
export function errorResponse(message: string, status: number): Response {
  return jsonResponse({ error: message }, status);
}
