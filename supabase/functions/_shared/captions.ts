// Textos (caption) de carruseles con IA, con el tono de DESIGN.md §3 y las reglas de AGENTS.md.
import type { SupabaseClient } from 'npm:@supabase/supabase-js@2';

export const MAX_CAPTION_LENGTH = 2200;

export interface CaptionCostume {
  name: string;
  category: string | null;
  rental_price: number | null;
  sale_price: number | null;
  deposit_price: number | null;
  description: string | null;
}

const cop = (value: number | null) =>
  value === null ? null : `$${new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(value)}`;

export async function loadCaptionCostumes(client: SupabaseClient, costumeIds: string[]): Promise<CaptionCostume[]> {
  if (!costumeIds.length) return [];
  const { data, error } = await client
    .from('costumes')
    .select('id, name, rental_price, sale_price, deposit_price, description, categories(name)')
    .in('id', costumeIds);
  if (error) throw new Error(error.message);
  const byId = new Map((data ?? []).map((row: any) => [row.id, row]));
  return costumeIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((row: any) => ({
      name: row.name,
      category: row.categories?.name ?? null,
      rental_price: row.rental_price !== null ? Number(row.rental_price) : null,
      sale_price: row.sale_price !== null ? Number(row.sale_price) : null,
      deposit_price: row.deposit_price !== null ? Number(row.deposit_price) : null,
      description: row.description ? String(row.description).slice(0, 300) : null,
    }));
}

const INSTRUCTIONS = `Escribes el texto (caption) de un carrusel de Instagram para Disfraces Madi, boutique de alquiler y
venta de disfraces del Carnaval de Barranquilla.

Voz de marca: como una vecina experta del Carnaval: cercana, festiva y confiable. Frases cortas, con ritmo.
Trata al lector de "tú". Usa los nombres propios del Carnaval (Marimonda, Garabato, Congo, Cumbia...) con naturalidad.
Nunca ironía. Emojis con moderación (máximo 4).

Reglas obligatorias:
- Menciona cada disfraz del carrusel por su nombre, en el mismo orden.
- Publica los precios tal como vienen: "Alquiler: $X", "Venta: $Y" (solo si existe) y "Depósito reembolsable: $Z"
  (solo si existe). Usa exactamente los valores dados, no los redondees ni inventes. Si un disfraz no tiene precio de
  alquiler, no lo menciones para ese disfraz.
- Cierra invitando a agendar la cita por WhatsApp, por ejemplo: "Agenda tu visita y prueba tu disfraz antes de
  confirmar. Escríbenos por WhatsApp 💬".
- Nunca menciones una dirección exacta. Si hace falta ubicar, solo "Barranquilla, Atlántico" y
  "Visitas exclusivas con cita previa".
- Termina con 5 a 8 hashtags relevantes, incluyendo #CarnavalDeBarranquilla y #DisfracesMadi.
- Máximo 1.800 caracteres en total.
- Responde solo con el texto del caption, sin comillas ni explicaciones.`;

function readOutputText(response: any): string | null {
  for (const item of response?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const part of item.content ?? []) {
      if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
    }
  }
  return null;
}

export async function generateCaption(options: {
  costumes: CaptionCostume[];
  theme?: string | null;
  extraInstructions?: string | null;
  safetyIdentifier?: string;
}): Promise<{ caption: string; model: string }> {
  const apiKey = Deno.env.get('OPENAI_API_KEY');
  const model = Deno.env.get('OPENAI_TEXT_MODEL');
  if (!apiKey || !model) {
    throw new Error('Faltan OPENAI_API_KEY u OPENAI_TEXT_MODEL');
  }

  const facts = options.costumes
    .map((costume, index) =>
      [
        `${index + 1}. ${costume.name}${costume.category ? ` (${costume.category})` : ''}`,
        cop(costume.rental_price) ? `   Alquiler: ${cop(costume.rental_price)}` : null,
        cop(costume.sale_price) ? `   Venta: ${cop(costume.sale_price)}` : null,
        cop(costume.deposit_price) ? `   Depósito reembolsable: ${cop(costume.deposit_price)}` : null,
        costume.description ? `   Descripción: ${costume.description}` : null,
      ]
        .filter(Boolean)
        .join('\n')
    )
    .join('\n');

  const input = [
    options.theme ? `Tema del carrusel: ${options.theme}` : null,
    facts ? `Disfraces del carrusel:\n${facts}` : 'El carrusel no muestra disfraces específicos del catálogo.',
    options.extraInstructions ? `Indicaciones adicionales: ${options.extraInstructions}` : null,
  ]
    .filter(Boolean)
    .join('\n\n');

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      instructions: INSTRUCTIONS,
      input,
      ...(options.safetyIdentifier ? { safety_identifier: options.safetyIdentifier } : {}),
    }),
  });
  if (!response.ok) {
    throw new Error(`OpenAI respondió ${response.status}: ${(await response.text()).slice(0, 300)}`);
  }
  const text = readOutputText(await response.json())?.trim();
  if (!text) throw new Error('OpenAI no devolvió texto');
  return { caption: text.slice(0, MAX_CAPTION_LENGTH), model };
}
