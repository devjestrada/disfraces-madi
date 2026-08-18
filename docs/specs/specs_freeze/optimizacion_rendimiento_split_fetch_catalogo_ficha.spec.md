# SPEC (congelada) — Separar el fetch de catálogo del fetch de ficha de detalle

## Origen

Este documento nace de la sección "3.2 Acotar columnas en `costumes_full`" de
[docs/specs/specs_backlog/optimizacion_rendimiento.spec.md](../specs_backlog/optimizacion_rendimiento.spec.md)
(o, si esa spec ya fue movida a `specs_done`, ver ahí el histórico). Se
congela en lugar de implementarse en esa iteración porque el esfuerzo real es
mayor al previsto originalmente y el ahorro medido no lo justifica todavía.

## Contexto y alcance

`fetchCostumesFull()` (`src/services/dataService.ts:53-73`) hace
`supabase.from('costumes_full').select('*')` y **un único resultado se
reutiliza para dos propósitos distintos**:

- La grilla de `/catalogo` (`src/views/Catalogo.tsx`), que solo necesita
  nombre, categoría, imagen principal, precios y flags de disponibilidad/
  destacado.
- La ficha de `/catalogo/:costumeSlug` (`src/views/CatalogoDetail.tsx`), que
  necesita además galería completa, descripción, telas, accesorios, tallas,
  etc.

Esto ocurre porque `App.tsx:39` llama `useCostumes(activeCatalogCategory)`
**una sola vez** y pasa el mismo array `costumes` tanto a `<Catalogo
costumes={costumes} />` como a `<CatalogoDetail costumeProp={activeCostume}
.../>` (`activeCostume` se resuelve con `costumes.find(...)` por slug en
`App.tsx:52-54`, sin un segundo fetch).

Recortar el `select` a las columnas de grilla (idea original de la sección
3.2) rompería la ficha de detalle si no se separa también el fetch. Hacerlo
bien implica:

1. Un fetch liviano para `/catalogo` (columnas de grilla únicamente).
2. Un fetch específico por slug/id para `/catalogo/:costumeSlug` (todas las
   columnas), disparado solo al entrar a esa ruta — hoy `CatalogoDetail`
   depende de que el array completo ya haya llegado vía `App.tsx`.
3. Ajustar `App.tsx` para dejar de resolver `activeCostume` por `find()` sobre
   el array de la grilla, y en su lugar cargarlo de forma independiente.
4. Revisar la navegación de "disfraces relacionados"/enlaces internos que hoy
   puedan asumir que todo el catálogo ya está en memoria.

## Por qué se congela (no se descarta)

- El payload medido de `costumes_full` en el diagnóstico original era de
  ~1.5kB para 2 disfraces — pequeño. El cuello de botella medido en
  `/catalogo` era la **latencia por petición** (~700ms, ver sección 4 de la
  spec activa), no el tamaño del payload. Achicar el `select` no resuelve
  ese cuello de botella.
- El ahorro de payload crecería con el tamaño real del catálogo (más
  disfraces = más diferencia entre columnas de grilla vs. columnas
  completas), así que vale la pena retomarlo si el catálogo crece
  significativamente o si un diagnóstico futuro muestra que el tamaño del
  payload (y no la latencia) es el cuello de botella dominante.

## Condición de reactivación sugerida

Retomar esta spec (moverla de vuelta a `specs_backlog`) si:

- El catálogo supera un volumen de disfraces donde el payload de
  `costumes_full` empieza a pesar de forma perceptible (ej. >50-100kB), o
- Se detecta en un diagnóstico de rendimiento que el tamaño del payload de
  `costumes_full`, y no la latencia de red, es el factor dominante.

Mientras eso no ocurra, esta spec permanece en `specs_freeze` sin fecha de
retoma, según el proceso de `AGENTS.md`.
