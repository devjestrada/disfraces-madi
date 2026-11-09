// Convierte la descripción libre (dictada o escrita) de un disfraz en datos para el formulario del panel.
// Spec: docs/specs/.../crear_disfraz_desde_foto.spec.md
//
// Entrada: JSON { text: string } (máx. 5.000 caracteres).
// Salida: objeto con la forma de EXTRACTION_SCHEMA, validado contra los catálogos actuales.
//
// Secretos: OPENAI_API_KEY y OPENAI_TEXT_MODEL (obligatorios).

import { corsHeaders, errorResponse, jsonResponse } from '../_shared/http.ts';
import { enforceHourlyLimit, logUsage, requireAdmin, safetyIdentifier } from '../_shared/admin.ts';
import {
  ALLOWED_SIZES,
  buildExtractionInstructions,
  EXTRACTION_SCHEMA,
  type ExtractionLookups,
} from '../_shared/prompts.ts';

const MAX_TEXT_LENGTH = 5000;
const MAX_EXTRACTIONS_PER_HOUR = 60;

type Extraction = {
  nombre: string;
  categoria: string;
  disenadora: string;
  precio_alquiler: number | null;
  precio_venta: number | null;
  precio_deposito: number | null;
  descripcion: string;
  detalles_visibles: string[];
  telas_existentes: string[];
  telas_nuevas: string[];
  accesorios_existentes: string[];
  accesorios_nuevos: string[];
  tallas: string[];
  texto_alternativo: string;
  notas_adicionales: string;
};

const normalize = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();

/** Devuelve el valor canónico de la lista que coincide (sin tildes ni mayúsculas), o null. */
function matchCanonical(value: string, options: string[]): string | null {
  const target = normalize(value);
  return options.find((option) => normalize(option) === target) ?? null;
}

function sanitize(raw: Extraction, lookups: ExtractionLookups): Extraction {
  const splitKnown = (values: string[], options: string[], extra: string[]) => {
    const known = new Set<string>();
    const unknown = new Set(extra.map((value) => value.trim()).filter(Boolean));
    values.forEach((value) => {
      const match = matchCanonical(value, options);
      if (match) {
        known.add(match);
      } else if (value.trim()) {
        unknown.add(value.trim());
      }
    });
    // Un "nuevo" que en realidad ya existe se marca como existente.
    Array.from(unknown).forEach((value) => {
      const match = matchCanonical(value, options);
      if (match) {
        unknown.delete(value);
        known.add(match);
      }
    });
    return { known: Array.from(known), unknown: Array.from(unknown) };
  };

  const fabrics = splitKnown(raw.telas_existentes, lookups.fabrics, raw.telas_nuevas);
  const accessories = splitKnown(raw.accesorios_existentes, lookups.accessories, raw.accesorios_nuevos);
  const positiveOrNull = (value: number | null) =>
    typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : null;

  return {
    ...raw,
    nombre: raw.nombre.trim(),
    categoria: matchCanonical(raw.categoria, lookups.categories) ?? '',
    disenadora: matchCanonical(raw.disenadora, lookups.designers) ?? '',
    precio_alquiler: positiveOrNull(raw.precio_alquiler),
    precio_venta: positiveOrNull(raw.precio_venta),
    precio_deposito: positiveOrNull(raw.precio_deposito),
    telas_existentes: fabrics.known,
    telas_nuevas: fabrics.unknown,
    accesorios_existentes: accessories.known,
    accesorios_nuevos: accessories.unknown,
    tallas: Array.from(new Set(raw.tallas.filter((size) => (ALLOWED_SIZES as readonly string[]).includes(size)))),
  };
}

function readOutputText(response: any): string | null {
  for (const item of response?.output ?? []) {
    if (item?.type !== 'message') continue;
    for (const part of item.content ?? []) {
      if (part?.type === 'output_text' && typeof part.text === 'string') {
        return part.text;
      }
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  if (req.method !== 'POST') {
    return errorResponse('Método no permitido.', 405);
  }

  try {
    const ctx = await requireAdmin(req);
    if (ctx instanceof Response) {
      return ctx;
    }

    const apiKey = Deno.env.get('OPENAI_API_KEY');
    const model = Deno.env.get('OPENAI_TEXT_MODEL');
    if (!apiKey || !model) {
      console.error('[extract-costume-data] faltan OPENAI_API_KEY u OPENAI_TEXT_MODEL');
      return errorResponse('El prellenado con IA aún no está configurado. Revisa los secretos de Supabase.', 500);
    }

    let text = '';
    try {
      const body = await req.json();
      text = typeof body?.text === 'string' ? body.text.trim() : '';
    } catch {
      text = '';
    }
    if (!text) {
      return errorResponse('Escribe o dicta la descripción del disfraz antes de prellenar.', 400);
    }
    if (text.length > MAX_TEXT_LENGTH) {
      return errorResponse('La descripción es muy larga. Resúmela un poco e intenta de nuevo.', 400);
    }

    const limited = await enforceHourlyLimit(ctx, 'data_extract', MAX_EXTRACTIONS_PER_HOUR);
    if (limited) {
      return limited;
    }

    const names = async (table: string) => {
      const { data, error } = await ctx.userClient.from(table).select('name').order('name');
      if (error) throw new Error(`${table}: ${error.message}`);
      return (data ?? []).map((row: { name: string }) => row.name);
    };
    const [categories, designers, fabrics, accessories] = await Promise.all([
      names('categories'),
      names('designers'),
      names('fabrics'),
      names('accessories'),
    ]);
    const lookups: ExtractionLookups = { categories, designers, fabrics, accessories };

    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        instructions: buildExtractionInstructions(lookups),
        input: text,
        text: {
          format: {
            type: 'json_schema',
            name: 'disfraz_madi',
            strict: true,
            schema: EXTRACTION_SCHEMA,
          },
        },
        safety_identifier: await safetyIdentifier(ctx.userId),
      }),
    });

    if (!openaiResponse.ok) {
      console.error('[extract-costume-data] OpenAI respondió', openaiResponse.status, await openaiResponse.text());
      return errorResponse('Algo no salió bien al leer la descripción. Intenta de nuevo o llena el formulario a mano.', 502);
    }

    const outputText = readOutputText(await openaiResponse.json());
    let parsed: Extraction;
    try {
      parsed = JSON.parse(outputText ?? '');
    } catch {
      console.error('[extract-costume-data] respuesta no es JSON', outputText?.slice(0, 500));
      return errorResponse('Algo no salió bien al leer la descripción. Intenta de nuevo o llena el formulario a mano.', 502);
    }

    await logUsage(ctx, 'data_extract', model);

    return jsonResponse(sanitize(parsed, lookups));
  } catch (error) {
    console.error('[extract-costume-data] error inesperado', error);
    return errorResponse('Algo no salió bien al leer la descripción. Intenta de nuevo o llena el formulario a mano.', 500);
  }
});
