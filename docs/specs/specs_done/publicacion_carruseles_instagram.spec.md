# Publicación programada de carruseles en Instagram

## Contexto

Disfraces Madi publica en Instagram de forma manual. Se quiere programar **publicaciones tipo carrusel** desde el
panel administrativo, a partir del catálogo, con tres modos: carruseles puntuales, reglas recurrentes y
**cronogramas personalizados** (por ejemplo, mostrar todo el catálogo antes del Carnaval).

Fechas de referencia de la temporada: Lectura del Bando el **16 de enero de 2027** y Carnaval de Barranquilla del
**sábado 6 al martes 9 de febrero de 2027**.

Restricciones de la API de Instagram (Content Publishing) que condicionan el diseño:
- Funciona con cuentas **profesionales** (Empresa o Creador).
- Un carrusel admite **2 a 10** imágenes o videos (la app permite 20, la API solo 10).
- Un solo texto (*caption*) por carrusel, máx. 2.200 caracteres; texto alternativo por imagen.
- Meta descarga cada imagen desde una **URL pública** al momento de publicar.
- Límite de **100 publicaciones por cuenta cada 24 h** (un carrusel cuenta como una).
- No admite música, stickers ni colaboraciones.

## Objetivo

Que un admin pueda planear, revisar y dejar programados carruseles en un calendario del panel, y que se publiquen
solos en Instagram a la hora indicada, con imágenes del catálogo en formato de feed y textos con el tono de la marca.

## Decisiones

- **Dónde vive:** en esta aplicación (panel admin + Supabase), junto al catálogo, las fotos y las Edge Functions existentes.
- **Conexión:** API de Instagram con **inicio de sesión unificado** (*Unified login*), la configuración que Meta
  recomienda y la única disponible para apps nuevas desde octubre de 2026 (el inicio de sesión de Instagram ya no se
  ofrece y el de Facebook quedó como *legacy*). Detalles:
  - Login con *Facebook Login for Business* y una configuración (`config_id`) de la app de Meta:
    `facebook.com/dialog/oauth` con `client_id` (ID de la app de Meta), `config_id`,
    `override_default_response_type=true`, `response_type=code`, `redirect_uri`, `state` y `prompt=login`.
  - El código se cambia en `graph.facebook.com/oauth/access_token` por un **token de usuario del sistema (SUAT) que
    no vence**.
  - La cuenta de Instagram se obtiene con `/me/assigned_instagram_accounts` (`/me` es el usuario del sistema, no la
    cuenta).
  - Todas las llamadas (contenedores, publicación, límite diario) van a `graph.facebook.com`.
  - Permisos: `instagram_basic` e `instagram_content_publish` (la configuración de Meta agrega otros que no se usan).
  - Requiere portafolio empresarial de Meta; **no** requiere página de Facebook.
  - Una sola cuenta conectada.
- **Formato de imagen:** 4:5, 1080 × 1350 px (criterio de `docs/prompts/editar_foto_instagram_carrousel.prompt.md`).
  Las fotos del catálogo (3:4 con fondo de estudio gris) se llevan a 4:5 **extendiendo el fondo**, sin recortar el
  disfraz y sin IA (proceso determinista y sin costo).
- **Textos:** generados con IA (`OPENAI_TEXT_MODEL`) con el tono de `DESIGN.md` §3 y las reglas de `AGENTS.md`;
  siempre editables.
- **Aprobación:** por defecto todo carrusel generado automáticamente (reglas y cronogramas) queda **pendiente de
  aprobación**; solo se publica si un admin lo aprueba antes de su hora. Se puede activar la publicación sin
  aprobación por regla o cronograma.
- **Zona horaria:** America/Bogota para toda la programación.

## Alcance

### 1. Conexión con Instagram
- Pantalla "Instagram" en el panel: conectar la cuenta (inicio de sesión unificado de Meta), ver la cuenta
  conectada, el estado de la conexión y desconectar.
- Token guardado solo del lado del servidor (no visible para el navegador). Como no vence, no hay renovación
  automática; si Meta lo invalida (por ejemplo, se revoca el acceso desde el portafolio), la conexión queda marcada
  con error, no se intenta publicar y aparece un aviso en Resumen para volver a conectar.
- Guía paso a paso en `docs/` para crear la app en Meta for Developers (caso de uso de Instagram con inicio de
  sesión unificado, configuración, URL de redireccionamiento, evaluador de Instagram) y configurar sus secretos
  (ID y clave secreta de la app de Meta, ID de configuración).

### 2. Carruseles puntuales (manual)
- Crear un carrusel eligiendo de 2 a 10 disfraces del catálogo (usa su foto principal) y/o subiendo imágenes propias.
- Reordenar las imágenes; vista previa en 4:5 como se verá en el feed.
- Texto: escribirlo o "Generar con IA" (nombres, precios de alquiler, venta cuando aplique y **depósito
  reembolsable**, invitación a agendar cita por WhatsApp, hashtags del Carnaval). Nunca la dirección exacta.
- Texto alternativo por imagen, tomado del catálogo y editable.
- Fecha y hora de publicación, o "Publicar ahora".

### 3. Reglas recurrentes
Plantillas que generan carruseles periódicamente a partir del catálogo, con día, hora y número de imágenes:
- **Novedades:** disfraces agregados desde la última publicación de la regla (si hay menos de 2, no se publica).
- **Los más alquilados del mes:** desde el histórico de alquileres (Insights).
- **Categoría de la semana:** rota entre categorías con disfraces disponibles.
Los carruseles se generan con anticipación (p. ej. 3 días antes) para poder revisarlos.

### 4. Cronogramas personalizados (campañas)
Asistente para planear una campaña completa y generar todos sus carruseles de una vez. Caso principal:
**"Todo el catálogo antes del Carnaval 2027"**.

Parámetros:
- Nombre, fecha de inicio y fecha de fin (ej.: hoy → 31 de enero de 2027).
- Días de la semana y hora de publicación (ej.: lunes, miércoles y viernes a las 7:00 p. m.).
- Disfraces incluidos: por defecto **todos los disponibles con foto**; filtros por categoría, destacados y adulto/niño;
  exclusión manual.
- Disfraces por carrusel (2–10) y forma de agrupar: por categoría, mezclados, o destacados primero.
- Hitos opcionales con texto especial: Lectura del Bando (16/01/2027) y cuenta regresiva al Carnaval (6–9/02/2027).

Comportamiento:
- El sistema calcula el plan: cantidad de carruseles necesarios, fechas disponibles y reparto. **Cada disfraz aparece
  al menos una vez** y no se repite hasta haber mostrado todos.
- Valida que el plan cabe: si hay más carruseles que fechas, propone aumentar la frecuencia o las imágenes por carrusel;
  si sobran fechas, propone repetir los destacados o dejar espacios libres.
- Muestra una **vista previa del calendario** con cada carrusel (imágenes y texto) antes de confirmar.
- Al confirmar, crea todos los carruseles (pendientes de aprobación salvo que se indique lo contrario).
- Los disfraces sin foto quedan fuera y se listan como pendientes.
- Disfraces nuevos agregados durante la campaña: opción de sumarlos a los carruseles aún no publicados.
- La campaña se puede pausar, reanudar o cancelar (cancela solo lo no publicado).

Ejemplo de referencia: con ~46 disfraces disponibles y 5 por carrusel se necesitan ~10 carruseles; entre mediados de
noviembre de 2026 y el 31 de enero de 2027 caben con 1 publicación semanal, o con 2–3 por semana usando menos
disfraces por carrusel.

### 5. Calendario
- Vista mensual y de lista con todos los carruseles: origen (manual, regla, campaña), estado y vista previa.
- Estados: **borrador**, **pendiente de aprobación**, **programado**, **publicando**, **publicado** (con enlace al post),
  **fallido** (con motivo y "Reintentar") y **cancelado**.
- Acciones: aprobar (individual o en bloque), editar, cambiar fecha, cancelar.
- Aviso en Resumen: carruseles pendientes de aprobación en las próximas 48 h y fallidos.

### 6. Publicación
- `pg_cron` ejecuta cada 5 minutos la Edge Function `publish-instagram-posts`, que toma los carruseles programados
  cuya hora llegó y, por cada uno: genera/usa las imágenes 4:5 en una ruta pública de Storage, crea los contenedores
  de cada imagen (`is_carousel_item`, `alt_text`), crea el contenedor `CAROUSEL` con el texto, espera a que estén
  listos y publica (`media_publish`). Guarda el id y el enlace del post.
- Reintentos automáticos (hasta 3, con espera creciente) ante errores temporales; los demás quedan como fallidos.
- Respeta el límite diario consultando `content_publishing_limit`.
- Un carrusel nunca se publica dos veces (bloqueo por registro mientras se publica).

### 7. Datos (migración nueva)
Tablas con RLS de solo admin: conexión de Instagram (token solo accesible por la service role), carruseles y sus
imágenes, reglas, campañas y registro de publicaciones/errores.

### Fuera de alcance
- Historias, Reels, publicaciones de una sola imagen y Facebook.
- Música, stickers, colaboraciones y más de 10 imágenes por carrusel.
- Métricas de Instagram (alcance, interacciones).
- Varias cuentas de Instagram.
- Edición de imagen con IA para los carruseles (se usa el relleno de fondo determinista).

## Consideraciones
- **Configuración en Meta:** crear la app en Meta for Developers y conectar la cuenta es un paso del admin.
  Verificado: para publicar en la cuenta propia basta el acceso estándar en modo de desarrollo, con la cuenta de
  Instagram como evaluadora de la app; no se requiere revisión de Meta (App Review).
- **Riesgo del inicio de sesión unificado:** es reciente y la documentación de Meta es escasa. Si tras conectar
  `/me/assigned_instagram_accounts` no devuelve la cuenta, el panel debe mostrarlo con un mensaje claro (revisar que
  la cuenta esté asignada a la app en el portafolio) en vez de dar la conexión por buena.
- **Costo:** la API de Instagram no tiene costo; el texto con IA cuesta fracciones de centavo por carrusel.
- **Riesgo de marca:** por eso la aprobación previa es el comportamiento por defecto.
- **Tono y reglas:** textos según `DESIGN.md` §3 y `AGENTS.md` (precios con depósito reembolsable, "Agenda tu visita y
  prueba tu disfraz antes de confirmar", sin dirección exacta, CTA a WhatsApp).

## Criterios de aceptación
- Un admin conecta la cuenta de Instagram desde el panel con el inicio de sesión unificado y ve la cuenta conectada;
  si el acceso deja de funcionar, se avisa en Resumen.
- Se puede crear y programar un carrusel manual de 2 a 10 disfraces y se publica a la hora indicada, en 4:5, con su
  texto y textos alternativos.
- Las tres reglas recurrentes generan carruseles en sus fechas y respetan la aprobación.
- Se puede crear la campaña **"Todo el catálogo antes del Carnaval 2027"** (hoy → 31/01/2027, días y hora elegidos):
  el plan incluye a todos los disfraces disponibles con foto al menos una vez, se ve en el calendario antes de
  confirmar y, tras aprobar, se publica según lo programado.
- Un carrusel pendiente de aprobación no se publica si nadie lo aprueba.
- Los fallos quedan visibles con su motivo y se pueden reintentar; ningún carrusel se publica dos veces.
- `npm run lint` y `npm run build` sin errores; funciones verificadas con `deno check`; checklist de `AGENTS.md` §3.

## Historial de cambios de la spec
- **2026-11-09:** la conexión pasa del inicio de sesión de Instagram (token de 60 días renovable,
  `graph.instagram.com`) al inicio de sesión unificado (token de usuario del sistema sin vencimiento,
  `graph.facebook.com`), porque Meta ya no ofrece el primero a apps nuevas. Se elimina la renovación automática del
  token.

<!--
Notas de implementación (cierre, 2026-11-09):
- §6 Publicación: la Edge Function se llama `instagram-scheduler` (no `publish-instagram-posts`) porque además de
  publicar comprueba la conexión, genera los carruseles de reglas, suma disfraces nuevos a campañas y prepara las
  imágenes 4:5. La tarea `pg_cron` no va en la migración (necesita la URL del proyecto y `CRON_SECRET`): se crea con
  el SQL de `docs/INSTAGRAM_SETUP.md` §5, usando Vault.
- §1 Conexión: implementada con el inicio de sesión unificado según el cambio registrado en el historial; no hay
  renovación de token (el token de usuario del sistema no vence), sino una comprobación del acceso cada hora.
- Los textos que la IA escribe sin un admin (reglas y campañas desde la tarea programada) no se registran en
  `ai_usage_log`, porque la tabla exige `user_id`; sí se registran los generados desde el panel.
- Verificado en producción por el usuario: conexión de la cuenta, carrusel manual con "Publicar ahora" y tarea
  `pg_cron` respondiendo 200.
-->
