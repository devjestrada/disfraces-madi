# Campañas de Instagram: un carrusel por disfraz con todas sus fotos

## Contexto

La publicación programada de carruseles (spec `publicacion_carruseles_instagram`, v0.15.0) arma las campañas
agrupando **varios disfraces por carrusel** y usando solo la **foto principal** de cada uno. Se quiere una forma de
campaña en la que cada carrusel muestre **un solo disfraz con todas sus fotos**, para presentarlo completo (frente,
espalda, detalles, accesorios), uno por publicación y sin repetir.

Restricción de Instagram que condiciona el diseño: un carrusel admite **de 2 a 10 imágenes**. Un disfraz con una sola
foto no puede publicarse como carrusel, y las publicaciones de una sola imagen siguen fuera de alcance.

## Objetivo

Que un admin pueda crear una campaña en la que cada disfraz con 2 o más fotos tenga su propio carrusel, publicado una
sola vez entre la fecha de inicio y la de fin, y que pueda identificar fácilmente qué disfraces quedaron fuera por tener
una sola foto (o ninguna) para completarlos.

## Alcance

### 1. Nueva forma de campaña: "Un disfraz por carrusel"
- En el asistente de **Nueva campaña**, una opción nueva en "Cómo agrupar": **Un disfraz por carrusel (todas sus fotos)**.
  Con esta opción no aplica "Disfraces por carrusel" (el campo se oculta).
- Cada carrusel contiene **todas las fotos del disfraz** en el orden de la galería: primero la foto principal y luego
  las demás según su orden (`sort_order`).
  - Si el disfraz tiene **más de 10 fotos**, se usan la principal y las 9 siguientes; en la vista previa se indica
    cuántas quedaron fuera.
- Texto alternativo de cada imagen: el de esa foto en el catálogo (editable después en el carrusel).
- El texto del carrusel (IA) habla de **un solo disfraz**: nombre, precios (alquiler, venta cuando aplique y depósito
  reembolsable), invitación a agendar cita por WhatsApp y hashtags, más los hitos (Bando y cuenta regresiva) cuando
  correspondan. Sin dirección exacta.
- **Cada disfraz aparece una sola vez** en la campaña. La opción "Repetir destacados en las fechas que sobren" no
  aplica en este modo (se oculta).
- **Orden de publicación**, a elegir:
  - **Destacados primero** y luego el resto alternando categorías (por defecto).
  - **Alternando categorías** (sin dar prioridad a los destacados).
- Los demás parámetros no cambian: nombre, fechas, días de la semana, hora, filtros (categoría, destacados,
  adulto/niño), exclusión manual, hitos, aprobación previa y escritura de textos con IA.

### 2. Plan y validación
- El plan necesita **una fecha por disfraz**. Si hay más disfraces que fechas, el asistente lo dice y propone
  agregar días de publicación, ampliar la fecha de fin o reducir los disfraces con los filtros. Si sobran fechas, se
  reparten los carruseles de forma pareja en el periodo y se indica cuántas fechas quedan libres.
- La vista previa del plan muestra, por fecha, el disfraz y las miniaturas 4:5 de **todas** sus fotos con el número de
  imágenes del carrusel.

### 3. Disfraces que no entran por fotos
- En el asistente, separados de la lista de incluidos y con su motivo:
  - **"Con una sola foto"**: disfraces disponibles que solo tienen una foto. Se muestra cada uno con un acceso para
    abrirlo en Disfraces y subirle más fotos.
  - **"Sin fotos"**: como hoy.
- En **Resumen → Pendientes**: un aviso "N disfraces con una sola foto: no entran en las campañas de Instagram de un
  disfraz por carrusel", con acción para ver la lista (o abrir el disfraz si es uno solo).
- En **Disfraces** (vista Tabla y Lista): una marca discreta "1 foto" en los disfraces disponibles que solo tienen una
  foto, con el mismo significado, para identificarlos al recorrer el catálogo.

### 4. Disfraces que se completan o se agregan durante la campaña
- Con la opción "Sumar los disfraces nuevos" activa, en este modo la tarea programada:
  - Toma los disfraces que cumplen los filtros y **aún no tienen carrusel en la campaña**: los nuevos y los que pasaron
    a tener 2 o más fotos después de crearla.
  - Crea para cada uno un carrusel nuevo en la **siguiente fecha libre** de la campaña (día y hora de la campaña, al
    menos 3 días después del momento en que se detecta, para poder revisarlo), con el mismo estado inicial que el resto
    (pendiente de aprobación salvo que se haya desactivado).
  - Si no quedan fechas libres antes de la fecha de fin, no lo programa y lo deja registrado; en la campaña se muestra
    "N disfraces sin fecha disponible".
- Un carrusel ya creado conserva las fotos que tenía al crearse; si después se agregan o cambian fotos del disfraz, se
  pueden actualizar editando el carrusel (botón **"Usar las fotos actuales del disfraz"** en el editor).

### 5. Datos
- Migración nueva que permite el valor `por_disfraz` en `instagram_campaigns.grouping` y guarda el orden elegido.

## Fuera de alcance
- Publicaciones de una sola imagen (sigue sin estar en la spec original).
- Cambios en las reglas recurrentes y en las campañas agrupadas existentes (siguen como están).
- Edición de las fotos con IA para los carruseles.

## Consideraciones
- Ejemplo: si de ~46 disfraces disponibles 30 tienen 2 o más fotos, entre el 11 de noviembre de 2026 y el 31 de enero
  de 2027 caben con 3 publicaciones por semana (~35 fechas); con 2 por semana (~23 fechas) no caben y el asistente lo
  avisa.
- Las imágenes se llevan a 4:5 igual que hoy (extensión del fondo de estudio). Fotos de detalle con otro fondo pueden
  verse con bandas de un tono distinto: se revisa en la vista previa y en la aprobación.
- Tono y reglas: `DESIGN.md` §3 y `AGENTS.md` (precios con depósito reembolsable, "Agenda tu visita y prueba tu disfraz
  antes de confirmar", sin dirección exacta, CTA a WhatsApp).

## Criterios de aceptación
- Se puede crear una campaña "Un disfraz por carrusel" desde hoy hasta el 31/01/2027 en la que cada disfraz disponible
  con 2 o más fotos tiene exactamente un carrusel con todas sus fotos (máx. 10), en el orden de la galería, y ninguno se
  repite.
- El asistente lista aparte los disfraces con una sola foto y sin fotos; Resumen y Disfraces permiten identificarlos.
- Si las fechas no alcanzan, el asistente no deja crear la campaña y propone cómo ajustarla.
- Un disfraz que pasa a tener 2 fotos durante la campaña recibe su carrusel en la siguiente fecha libre (si la hay).
- Los carruseles se publican igual que los demás (aprobación, 4:5, texto, textos alternativos).
- `npm run lint` y `npm run build` sin errores; funciones verificadas con `deno check`; checklist de `AGENTS.md` §3.

<!--
Notas de implementación (cierre, 2026-11-10):
- Decisiones abiertas al revisar la spec, resueltas con el comportamiento descrito: con más de 10 fotos se usan
  la principal y las 9 siguientes según el orden de la galería; la marca "1 foto" se muestra en Disfraces (Tabla
  y Lista); las fotos con fondo distinto quedan como riesgo a revisar en la vista previa y la aprobación.
- §1: la opción "Un disfraz por carrusel" quedó como agrupación por defecto del asistente.
- §4: los textos de los carruseles que crea la tarea programada incluyen la cuenta regresiva al Carnaval solo
  si la campaña tenía activados ambos hitos (Bando y cuenta regresiva).
- Verificado por el usuario en el panel: marca "1 foto", aviso en Resumen, asistente, plan y creación de la campaña.
-->
