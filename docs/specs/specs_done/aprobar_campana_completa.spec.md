# Aprobar todos los carruseles pendientes de una campaña

## Contexto

Las campañas de Instagram (specs `publicacion_carruseles_instagram` y `campanas_carrusel_por_disfraz`) crean sus
carruseles **pendientes de aprobación** por defecto. Hoy la aprobación en bloque solo existe en **Calendario → Lista**,
mes por mes, y selecciona los pendientes de todo el mes sin distinguir el origen (campañas, reglas o manuales). Una
campaña de noviembre a enero obliga a aprobar en tres pasadas y con cuidado de no aprobar carruseles de otros orígenes.

## Objetivo

Aprobar de una vez todos los carruseles pendientes de **una** campaña, desde su tarjeta, sin tocar los de otras
campañas o reglas.

## Alcance

### 1. Botón en la tarjeta de la campaña
- En **Instagram → Campañas**, cada campaña activa o en pausa con carruseles pendientes de aprobación muestra el botón
  **"Aprobar todos los pendientes (N)"**, donde N es la cantidad que se aprobaría.
- Solo cuenta los carruseles de esa campaña en estado **pendiente de aprobación** y con fecha de publicación
  **futura**.

### 2. Confirmación
- Antes de aprobar, un diálogo de confirmación indica:
  - cuántos carruseles se aprueban y entre qué fechas (primera y última publicación);
  - que se publicarán solos a su hora y que se recomienda haber revisado los textos;
  - si la campaña está **en pausa**, que quedan aprobados pero no se publican hasta reanudarla.
- Al confirmar, se aprueban (pasan a **programado**, con fecha y autor de la aprobación, igual que la aprobación
  individual) y se muestra un mensaje con la cantidad aprobada. La tarjeta y el calendario se actualizan.

### 3. Lo que no se aprueba
- **Borradores** (sin texto): no se aprueban en bloque. Si la campaña tiene borradores, la tarjeta muestra
  "N borradores sin texto: complétalos en el calendario".
- **Pendientes vencidos** (su hora ya pasó): no se aprueban, porque se publicarían de inmediato. Si los hay, la tarjeta
  muestra "N pendientes vencidos: cámbiales la fecha en el calendario".
- Carruseles de otras campañas, reglas o manuales: nunca.

## Fuera de alcance
- Cambios en la aprobación por mes del Calendario (sigue igual).
- Desaprobar en bloque (un carrusel aprobado se puede cancelar o editar uno por uno, como hoy).

## Criterios de aceptación
- Con una campaña de noviembre a enero con carruseles pendientes, un solo clic (más la confirmación) aprueba todos sus
  pendientes futuros y ninguno de otros orígenes.
- Los borradores y los pendientes vencidos de la campaña no se aprueban y quedan señalados en la tarjeta.
- El conteo del botón coincide con los carruseles aprobados.
- `npm run lint` y `npm run build` sin errores; checklist de `AGENTS.md` §3.

<!--
Notas de implementación (cierre, 2026-11-11):
- Todos los puntos aplicados tal como están descritos; sin excepciones.
- Verificado por el usuario en el panel: botón con el conteo, confirmación, aprobación y actualización del calendario.
-->
