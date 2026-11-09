// Prompts usados por las Edge Functions de IA.
// Mantener alineados con docs/prompts/: cualquier cambio de criterio se hace en ambos lugares.

/**
 * Basado en docs/prompts/editar foto_catalogo.prompt.md.
 * La sección "Entregables" se adapta: la API devuelve una sola imagen 3:4 y el panel
 * genera el tamaño final de 800 × 1067 px.
 */
export const CATALOG_PHOTO_PROMPT = `Editar la fotografía del disfraz manteniendo intacta a la persona, el disfraz,
el peinado y los accesorios tal como aparecen en la imagen original (sin alterar
poses, colores, texturas ni proporciones del disfraz).

## Fondo
Fondo de estudio tipo ciclorama infinito, gris neutro muy claro (#E8E8E8), con
degradado vertical extremadamente sutil desde #ECECEC en la parte superior hasta
#DCDCDC en la base. Sin línea de horizonte visible entre pared y piso. Superficie
completamente lisa, sin texturas, manchas ni ruido. Iluminación uniforme con
softboxes frontales de 5500 K, contraste medio-bajo y sombras muy suaves.
Únicamente una sombra de contacto difusa bajo el sujeto para aportar sensación
de apoyo sobre el piso. Estilo de fotografía comercial de catálogo de moda de
alta gama, limpio, minimalista y consistente en todas las imágenes.

- Eliminar por completo el fondo original (calle, malecón, jardín, casa, etc.)
  y reemplazarlo por el fondo descrito arriba.
- El fondo debe ser EXACTAMENTE el mismo (mismos códigos de color, mismo
  degradado, misma temperatura de luz) en todas las fotos del catálogo, para
  mantener consistencia visual absoluta entre imágenes.
- Sin objetos, sombras duras, texturas ni elementos distractores en el fondo.

## Iluminación y sombra
- Iluminación uniforme, suave, tipo softbox frontal-difusa a 5500 K, sin
  sombras marcadas detrás ni al costado del sujeto.
- Contraste medio-bajo, look limpio y minimalista de estudio comercial.
- Agregar una sombra de contacto suave, difusa y sutil bajo los pies/calzado,
  solo para dar sensación de apoyo en el piso, sin que la persona luzca
  "flotando" ni con sombra dura.

## Encuadre y composición
- Una vez eliminado el fondo original, el sujeto (persona + disfraz completo)
  debe quedar centrado tanto vertical como horizontalmente dentro del
  nuevo lienzo, con márgenes equilibrados y simétricos a ambos lados y
  espacio proporcional arriba (sobre la cabeza/tocado) y abajo (bajo los pies).
- Recentrar/reencuadrar si es necesario para lograr ese centrado exacto,
  conservando la proporción original del sujeto (sin deformar ni estirar).
- Proporción vertical 3:4 (retrato).
- No recortar partes del disfraz, tocado ni calzado al centrar o reencuadrar.

## Color y acabado
- Corrección de color natural, piel con tono realista, sin sobre-saturar.
- Nitidez media-alta, aspecto profesional de catálogo (no efecto "plástico"
  ni sobreprocesado).

## Consistencia entre fotos
- Usar exactamente los mismos códigos de color del fondo (#ECECEC → #DCDCDC),
  la misma intensidad de sombra, la misma temperatura de luz (5500 K) y el
  mismo criterio de centrado (vertical y horizontal) en todas las imágenes
  de la colección, para que luzcan como una serie unificada de catálogo de
  moda de alta gama.`;

export const ALLOWED_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '4', '6', '8', '10', '12', '14', '16'] as const;

export interface ExtractionLookups {
  categories: string[];
  designers: string[];
  fabrics: string[];
  accessories: string[];
}

const list = (values: string[]) => (values.length ? values.map((value) => `- ${value}`).join('\n') : '- (ninguna)');

/** Basado en docs/prompts/obtener_info_disfraz_a_partir_de_texto.prompt.md, adaptado al modelo de datos actual. */
export function buildExtractionInstructions(lookups: ExtractionLookups): string {
  return `Eres un asistente que convierte descripciones libres de disfraces del Carnaval de Barranquilla
(escritas por dictado o texto informal) en datos estructurados para el inventario de Disfraces Madi.

## Instrucciones
1. Lee el texto de la usuaria, que describe un disfraz de forma libre y desordenada.
2. Corrige errores obvios de dictado o transcripción (ej. "vetuario" → "vestuario", "cumbio" → "cumbia")
   solo para tu interpretación interna, conservando el sentido original.
3. Extrae únicamente la información de los campos del esquema. Si un dato no aparece explícitamente,
   deja el texto vacío (""), el número en null o la lista vacía ([]). No inventes información.
4. "categoria" y "disenadora" deben ser EXACTAMENTE uno de los valores de las listas de abajo, o "" si no hay
   coincidencia clara.
5. "telas_existentes" y "accesorios_existentes" solo pueden contener valores EXACTOS de las listas de abajo.
   Lo que se mencione y no esté en la lista va en "telas_nuevas" o "accesorios_nuevos", con un nombre corto.
6. "tallas" solo admite: ${ALLOWED_SIZES.join(', ')} (las numéricas son tallas de niño).
7. Precios en pesos colombianos como números enteros, sin símbolos ni separadores
   (ej. "ciento veinte mil" → 120000). "precio_deposito" es el depósito reembolsable.
8. "descripcion": 2 a 4 frases en español, tono cálido y cercano de la marca, sobre lo que hace especial al
   disfraz y lo que incluye, basadas solo en el texto.
9. "detalles_visibles": frases cortas con lo que incluye o destaca el disfraz (ej. "Incluye sombrero y bastón").
10. "texto_alternativo": una frase que describa la foto del disfraz para lectores de pantalla y SEO
    (ej. "Disfraz de Garabato con capa de flores y sombrero, vista de frente").
11. Lo que se mencione y no corresponda a ningún campo va en "notas_adicionales".

## Categorías
${list(lookups.categories)}

## Diseñadoras
${list(lookups.designers)}

## Telas existentes
${list(lookups.fabrics)}

## Accesorios existentes
${list(lookups.accessories)}`;
}

/** JSON Schema estricto de la respuesta de extracción (Structured Outputs). */
export const EXTRACTION_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    nombre: { type: 'string' },
    categoria: { type: 'string' },
    disenadora: { type: 'string' },
    precio_alquiler: { type: ['integer', 'null'] },
    precio_venta: { type: ['integer', 'null'] },
    precio_deposito: { type: ['integer', 'null'] },
    descripcion: { type: 'string' },
    detalles_visibles: { type: 'array', items: { type: 'string' } },
    telas_existentes: { type: 'array', items: { type: 'string' } },
    telas_nuevas: { type: 'array', items: { type: 'string' } },
    accesorios_existentes: { type: 'array', items: { type: 'string' } },
    accesorios_nuevos: { type: 'array', items: { type: 'string' } },
    tallas: { type: 'array', items: { type: 'string', enum: [...ALLOWED_SIZES] } },
    texto_alternativo: { type: 'string' },
    notas_adicionales: { type: 'string' },
  },
  required: [
    'nombre',
    'categoria',
    'disenadora',
    'precio_alquiler',
    'precio_venta',
    'precio_deposito',
    'descripcion',
    'detalles_visibles',
    'telas_existentes',
    'telas_nuevas',
    'accesorios_existentes',
    'accesorios_nuevos',
    'tallas',
    'texto_alternativo',
    'notas_adicionales',
  ],
} as const;
