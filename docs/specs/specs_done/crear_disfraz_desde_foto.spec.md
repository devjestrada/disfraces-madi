# Crear disfraz desde una foto del celular (edición con IA)

## Contexto

Hoy crear un disfraz exige un proceso manual con varias herramientas:

1. Tomar la foto con el celular.
2. Editarla fuera del sitio (AI Studio) con el prompt `docs/prompts/editar foto_catalogo.prompt.md`: fondo de estudio gris, encuadre 3:4 centrado, 800 × 1067 px.
3. Dictar la descripción y convertirla en JSON con `docs/prompts/obtener_info_disfraz_a_partir_de_texto.prompt.md`.
4. Llenar a mano el formulario del panel y subir la foto editada.

## Objetivo

Que desde el panel administrativo, en el celular, se pueda tomar la foto de un disfraz, obtenerla editada por IA con el estilo de catálogo, dictar o escribir su descripción para que se prellene el formulario, revisar todo y guardarlo en Supabase en un solo flujo.

## Decisiones

- **Edición de la foto:** solo con IA (OpenAI), aplicando el prompt de catálogo existente. Se puede aprobar o regenerar; no hay herramientas de edición manual.
- **Datos del disfraz:** la IA los extrae del texto dictado o escrito (no de la imagen). Siempre se revisan antes de guardar.
- **Proveedor de IA:** OpenAI (API de la plataforma de OpenAI; requiere una clave de API con facturación activa, distinta de la suscripción de ChatGPT).
- **La clave de API nunca llega al navegador:** las llamadas a OpenAI se hacen desde Supabase Edge Functions, con la clave guardada como secreto.

## Alcance

### 1. Flujo en el panel: "Nuevo disfraz desde foto"
Nuevo botón en la sección Disfraces y en Resumen (junto a "Nuevo disfraz"). Flujo por pasos, pensado primero para móvil:

1. **Foto.** Dos opciones equivalentes:
   - **Tomar foto:** abre la cámara trasera del celular (`<input type="file" accept="image/*" capture="environment">`).
   - **Elegir de la galería:** abre las fotos guardadas en el celular (`<input type="file" accept="image/jpeg,image/png,image/webp">`, sin `capture`).
   Ambas siguen exactamente el mismo flujo de edición con IA. En computador, "Elegir de la galería" abre el selector de archivos. Antes de enviarla, el navegador reduce la foto (lado mayor ≤ 2048 px, JPG) para acelerar la subida; las fotos HEIC del iPhone se convierten a JPG en ese paso.
2. **Edición con IA.** Se envía a la Edge Function `edit-costume-photo`. Mientras procesa, se muestra un estado de espera con el tono de marca (puede tardar decenas de segundos). Resultado: vista lado a lado o alternable "Original / Editada" y acciones **Usar esta foto** y **Regenerar**. Se pueden hacer hasta 3 regeneraciones por foto; después se sugiere tomar otra foto.
3. **Descripción.** Campo de texto amplio para dictar (con el dictado del teclado del celular) o escribir la descripción libre del disfraz, y botón **Prellenar con IA**, que llama a la Edge Function `extract-costume-data`. Este paso se puede saltar para llenar el formulario a mano.
4. **Revisión.** Se abre el formulario de disfraz existente, prellenado (datos básicos, precios, visibilidad, ficha técnica y tallas), con la foto editada como vista previa y el texto alternativo sugerido. Se resaltan los campos que llenó la IA. Las telas o accesorios que no existan se muestran como "Nuevos — ¿crearlos?" y solo se crean si se confirman.
5. **Guardar.** Reutiliza la lógica actual: `createCostume`, `saveCostumeRelations` y `uploadCostumeImage(costumeId, file, { makePrimary: true, altText })`. Si algo falla después de crear el disfraz, se informa qué parte quedó pendiente (sin duplicar el disfraz al reintentar).

Cancelar en cualquier paso no guarda nada.

### 2. Edge Function `edit-costume-photo` (`supabase/functions/edit-costume-photo/`)
- Requiere un usuario autenticado que sea admin (`public.is_admin()`); si no, responde 403.
- Recibe la imagen (JPG/PNG/WEBP, ≤ 5 MB) y llama al endpoint de edición de imágenes de OpenAI con el prompt de catálogo, en formato vertical.
- El modelo de imagen es configurable por secreto (`OPENAI_IMAGE_MODEL`, por defecto el modelo GPT Image más reciente disponible al implementar).
- Post-proceso para cumplir el prompt: salida final **3:4, 800 × 1067 px, JPG calidad ≥ 90**. Si el modelo devuelve otra proporción, se completa con el color de fondo del prompt en vez de recortar, para no cortar el disfraz.
- No guarda la foto original ni la editada: devuelve la imagen editada al panel. Solo se persiste al guardar el disfraz.
- Límite básico de uso por admin (p. ej. 20 ediciones por hora) para controlar costos.

### 3. Edge Function `extract-costume-data` (`supabase/functions/extract-costume-data/`)
- Misma validación de admin.
- Recibe el texto libre y responde el JSON del prompt de extracción, adaptado al modelo de datos actual:
  - incluye `precio_deposito` (la columna ya existe; hoy el prompt lo manda a notas),
  - incluye `texto_alternativo` sugerido para la foto,
  - recibe las listas actuales de categorías, diseñadoras, telas y accesorios para elegir de ellas y separar las nuevas,
  - tallas limitadas a XS–XXL y 4–16.
- Usa salida estructurada (JSON Schema) para garantizar el formato. Modelo configurable (`OPENAI_TEXT_MODEL`).
- No inventa datos: lo que no se mencione queda vacío.

### 4. Prompts versionados
- Los prompts que usan las funciones viven en el código de cada función (o en un archivo compartido de `supabase/functions/_shared/`), alineados con los de `docs/prompts/`. Cualquier cambio a un prompt se hace en ambos lugares.

### 5. Configuración y documentación
- Secretos de Supabase: `OPENAI_API_KEY`, `OPENAI_IMAGE_MODEL`, `OPENAI_TEXT_MODEL`.
- `docs/SUPABASE_SETUP.md` y `supabase/README.md`: cómo desplegar las funciones (`supabase functions deploy …`) y configurar los secretos.
- `.env.example` no lleva la clave de OpenAI (no se usa en el frontend).

### Fuera de alcance
- Edición manual de la foto (recortar, rotar, filtros).
- Extraer datos del disfraz mirando la imagen.
- Versión 4:5 para Instagram (`docs/prompts/editar_foto_instagram_carrousel.prompt.md`).
- Varias fotos por disfraz en el mismo flujo (las demás se siguen subiendo desde la galería del formulario).
- Re-editar con IA fotos de disfraces ya existentes.
- Grabación y transcripción de audio propia (se usa el dictado del teclado del celular).

## Consideraciones
- **Costo:** cada edición y cada extracción consume créditos de la API de OpenAI; las regeneraciones también. El límite por hora evita gastos accidentales.
- **Privacidad:** las fotos (que pueden incluir personas modelando) se envían a OpenAI solo para editarlas; no se guardan originales en Supabase.
- **Tono:** mensajes de espera y error según `DESIGN.md` §3 (p. ej. "Algo no salió bien al editar la foto. Intenta de nuevo o toma otra.").

## Criterios de aceptación
- Desde un celular, un admin puede tomar una foto o elegirla de la galería del teléfono, obtenerla editada (fondo de estudio, 3:4, 800 × 1067 px), dictar la descripción, revisar el formulario prellenado y guardar; el disfraz queda creado con la foto como principal y su texto alternativo.
- "Regenerar" produce una nueva edición; tras 3 intentos se sugiere tomar otra foto.
- Sin sesión de admin, ambas funciones responden 403.
- La clave de OpenAI no aparece en el bundle del frontend ni en las peticiones del navegador.
- Telas y accesorios nuevos solo se crean si el admin lo confirma.
- Cancelar en cualquier paso no deja disfraces ni imágenes huérfanas.
- El flujo manual actual (Nuevo disfraz) sigue funcionando igual.
- `npm run lint` y `npm run build` sin errores; checklist de `AGENTS.md` §3 (precios con depósito visibles en el formulario, experiencia móvil intacta).
