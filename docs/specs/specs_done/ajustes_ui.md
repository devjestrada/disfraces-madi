# Spec de Modificaciones — Ajustes UI (Inicio y Admin)

## Contexto y alcance

Esta spec convierte en requisitos accionables los apuntes originales del usuario sobre dos áreas: la sección "Categorías Destacadas" de Inicio, y dos ajustes puntuales del panel Admin (altura del listado de Disfraces al buscar, y visibilidad del detalle de disfraces asociados en Telas y Accesorios).

Instrucciones generales para el agente que implemente esta spec:
- Los números de línea citados corresponden al estado del código en `src/views/Inicio.tsx`, `src/views/Admin.tsx` y `src/types.ts` al momento de redactar esta spec (2026-07-26). Si el código cambió antes de implementarla, ubicar el bloque equivalente por el nombre de función/variable citado en vez de por el número de línea exacto.
- Mantener el resto del diseño, estilos y sistema documentado en `DESIGN.md` sin alteraciones salvo que se indique lo contrario.
- Si algún punto no puede aplicarse tal cual (p. ej. el bloque de código citado ya no existe igual), aplicar el cambio al equivalente más cercano y reportarlo al final de este documento antes de moverlo a `specs_done`.

---

## 1. Inicio (`src/views/Inicio.tsx`)

### 1.1 Categorías Destacadas dinámicas, con foto real de un disfraz `featured`

- **Actual:** la sección "Categorías Destacadas" usa un array `categories` hardcodeado de 4 elementos fijos (Cumbia, Fantasía, Mapalé, Garabato; `Inicio.tsx:12-47`), con imágenes estáticas importadas desde `ASSETS.categoria_*` (`src/data.ts:4-16`), completamente desconectadas del catálogo real de disfraces. Se renderiza en `Inicio.tsx:162-196` (`#categories-grid`).
- **Hallazgo:** ya existe un campo `featured?: boolean` en el modelo público `Costume` (`src/types.ts:21`) y `featured: boolean` en `AdminCostume`/`AdminCostumePayload` (`src/types.ts:111,136`), gestionable desde Admin. Sin embargo, hoy Inicio no lo usa. El catálogo público usa el union type fijo de 9 categorías definido en `Costume.category` (`src/types.ts:7`), que no coincide con las 4 tarjetas actuales de Inicio (incluye, entre otras, Marimonda, Negrita Puloy, Congo, Monocuco y Muerte, ausentes hoy en Inicio).
- **Decisiones confirmadas:**
  1. La sección deja de mostrar 4 tarjetas fijas y pasa a mostrar **una tarjeta por cada una de las 9 categorías** del union type `Costume.category`, siempre que esa categoría tenga al menos un disfraz marcado como `featured`.
  2. Si una categoría **no tiene** ningún disfraz `featured`, su tarjeta **no se muestra** (no hay fallback a imagen genérica ni placeholder).
  3. La foto de cada tarjeta se elige **al azar entre los disfraces `featured`** de esa categoría, recalculándose **en cada carga de página** (no es una rotación programada ni persistente entre visitas).
- **Acción:**
  1. En `Inicio.tsx`, reemplazar el array `categories` hardcodeado (líneas 12-47) por un cálculo derivado del catálogo de disfraces disponible en el contexto/servicio de datos públicos (mismo origen que usa `Catalogo.tsx`), agrupando por `category` y filtrando `featured === true`.
  2. Para cada categoría con al menos un disfraz `featured`, seleccionar aleatoriamente uno de ellos para usar su imagen principal como foto de la tarjeta. La selección aleatoria debe ejecutarse en cada carga/render inicial de la página (por ejemplo, dentro de un `useMemo` sin dependencias que lo recalculen en cada re-render, pero sí en cada montaje del componente).
  3. Omitir del grid cualquier categoría sin disfraces `featured`.
  4. Mantener el resto de la estructura visual de la tarjeta (nombre de categoría, estilos, animaciones) tal como está hoy en `#categories-grid` (`Inicio.tsx:162-196`), cambiando únicamente el origen de los datos (categoría + imagen) por el cálculo dinámico descrito arriba.
- **Criterio de aceptación:** la sección "Categorías Destacadas" de Inicio muestra dinámicamente una tarjeta por cada categoría del catálogo que tenga disfraces marcados como destacados en Admin, con una foto real de uno de esos disfraces elegida al azar en cada carga de página; las categorías sin disfraces destacados no aparecen.

---

## 2. Admin (`src/views/Admin.tsx`)

### 2.1 El contenedor de Lista/Galería no debe mantener altura fija al buscar con pocos resultados

- **Actual:** la columna izquierda "Disfraces" (que contiene las vistas Tabla/Lista/Galería y el buscador) tiene su altura fijada dinámicamente para igualar la de la columna derecha (el formulario), vía `style={{ height: disfracesLeftColumnHeight }}` (`Admin.tsx:1085-1091`), calculada en un `useLayoutEffect` con `ResizeObserver` sobre `disfracesRightColumnRef` (`Admin.tsx:406-444`). El grid/lista interno usa `flex-1 overflow-y-auto`. El buscador filtra `filteredAdminCostumes` (`Admin.tsx:180-191`) sin afectar la altura del formulario de la derecha, por lo que, al buscar con pocos resultados, el contenedor de disfraces mantiene la altura del formulario y queda un hueco vacío debajo de las cards — percibido como si el "alto" del bloque no respondiera al contenido filtrado.
- **Decisión confirmada:** el contenedor de disfraces debe **ajustarse al contenido filtrado** en vez de mantenerse siempre igualado a la altura del formulario. Al buscar y obtener pocos resultados, el contenedor debe encogerse (dentro de un máximo razonable), sin dejar espacio vacío bajo las cards.
- **Acción:** ajustar la lógica de sincronización de altura (`Admin.tsx:406-444` y su aplicación en `Admin.tsx:1085-1091`) para que el alto del contenedor de disfraces sea el menor valor entre la altura del formulario (columna derecha) y la altura real que ocupa el contenido filtrado actual (Tabla/Lista/Galería con el resultado de `filteredAdminCostumes`). Esto aplica a las tres vistas (Tabla, Lista, Galería) por igual, ya que las tres comparten el mismo contenedor con altura sincronizada.
- **Criterio de aceptación:** al escribir en el buscador de Disfraces y reducir el número de resultados, el contenedor de la columna "Disfraces" se encoge para ajustarse al contenido visible, sin dejar un área vacía fija igualada a la altura del formulario de la derecha; al limpiar la búsqueda, vuelve a comportarse como hoy (sincronizado con el formulario cuando hay suficiente contenido).

### 2.2 Telas y Accesorios: mostrar cantidad y detalle de disfraces asociados

- **Actual:** la sección `activeSection === 'telas-accesorios'` (`Admin.tsx:1734-1892+`) renderiza Telas y Accesorios como listas (`<ul>`, no `<table>` HTML) mostrando solo el nombre de cada elemento, con acciones Editar y Eliminar. No se muestra ningún conteo ni detalle de disfraces asociados en la UI.
- **Hallazgo:** ya existe relación en base de datos vía las tablas puente `costume_fabrics` y `costume_accessories`. `adminService.ts` (`deleteFabric`/`deleteAccessory`, líneas ~414-472) ya calcula internamente cuántos disfraces usan cada tela/accesorio para **bloquear el borrado**, mostrando el mensaje `"No se puede eliminar: N disfraz(ces) usan esta tela/accesorio."`. Sin embargo, no existe hoy ninguna consulta ni UI que exponga el **detalle** (nombres de esos disfraces) de forma visible en la tabla; solo se usa el conteo para la validación de borrado.
- **Decisión confirmada:** junto a las acciones Editar/Eliminar de cada tela/accesorio, se debe mostrar la **cantidad** de disfraces asociados, y un **tooltip/popover al hacer hover** sobre ese número que despliegue el **detalle** (nombres) de los disfraces asociados.
- **Acción:**
  1. **`src/services/adminService.ts`:** agregar una función (o extender `fetchFabrics`/`fetchAccessories`/equivalente) que traiga, para cada tela y cada accesorio, el conteo y la lista de nombres de disfraces asociados (join sobre `costume_fabrics`/`costume_accessories` → `costumes`), reutilizando la misma consulta que hoy alimenta la validación de borrado en `deleteFabric`/`deleteAccessory` en vez de duplicar lógica.
  2. **`src/views/Admin.tsx`:** en las listas de Telas (líneas ~1736-1800) y Accesorios (líneas ~1802-1892), agregar junto a cada nombre un indicador con la cantidad de disfraces asociados (ej. "3 disfraces").
  3. Al hacer hover sobre ese indicador, mostrar un tooltip/popover con la lista de nombres de los disfraces asociados a esa tela/accesorio. Si no se usa aún ningún componente de tooltip en el proyecto, implementar uno simple y reutilizable siguiendo el sistema de diseño de `DESIGN.md` (sin agregar dependencias nuevas).
  4. Si una tela/accesorio no tiene disfraces asociados, mostrar el conteo en 0 sin tooltip (o con un tooltip indicando "Sin disfraces asociados").
- **Criterio de aceptación:** en la sección "Telas y Accesorios" del Admin, cada fila muestra la cantidad de disfraces que usan esa tela/accesorio, y al pasar el mouse sobre ese número se despliega el detalle con los nombres de esos disfraces.

---

## Notas de la redacción

Al convertir los apuntes crudos originales en esta spec, se documentan las siguientes decisiones y hallazgos que no estaban explícitos en las notas:

- **1.1 (Categorías Destacadas):** se confirmó con el usuario que el cambio no es cosmético (solo cambiar la imagen de 4 tarjetas fijas), sino que la sección pasa a ser completamente dinámica: una tarjeta por cada una de las 9 categorías del catálogo que tenga disfraces `featured`, ocultando las que no tengan ninguno, con selección aleatoria de foto en cada carga de página. Esto implica que las 4 categorías actuales (Cumbia, Fantasía, Mapalé, Garabato) dejan de ser una lista fija y pasan a depender de qué categorías tengan disfraces marcados como destacados en Admin.
- **2.1 (altura del contenedor en Admin):** se confirmó que el comportamiento esperado es que el contenedor se ajuste al contenido filtrado (encogerse con pocos resultados), no mantener siempre la altura del formulario como ocurre hoy.
- **2.2 (Telas y Accesorios):** se confirmó que el detalle de disfraces asociados se muestra mediante tooltip/popover al hover sobre el conteo, en vez de un modal o una fila expandible.
