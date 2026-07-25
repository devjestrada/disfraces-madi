# Spec de Modificaciones — Catálogo, Ficha Individual y Admin de Disfraces

## Contexto y alcance

Esta spec convierte en requisitos accionables los apuntes originales del usuario sobre tres áreas: el Catálogo público, la Ficha individual de disfraz, y el panel Admin de Disfraces. El hilo común es mejorar la transparencia y usabilidad del catálogo (tallas correctas, sin funciones muertas, URLs legibles) y la productividad del panel administrativo (mejor aprovechamiento del espacio, menos fricción al cargar disfraces, y gestión propia de Telas/Accesorios como catálogos independientes).

Instrucciones generales para el agente que implemente esta spec:
- Los cambios de texto/código a eliminar o modificar son literales cuando se cita "Actual": buscar el fragmento indicado y aplicar el cambio tal como se describe.
- Los números de línea citados corresponden al estado del código en `src/views/Catalogo.tsx`, `src/views/CatalogoDetail.tsx`, `src/App.tsx`, `src/views/Admin.tsx`, `src/services/adminService.ts` y `src/types.ts` al momento de redactar esta spec (2026-07-25). Si el código cambió antes de implementarla, ubicar el bloque equivalente por el nombre de función/variable citado en vez de por el número de línea exacto.
- Mantener el resto del diseño, estilos y sistema documentado en `DESIGN.md` sin alteraciones salvo que se indique lo contrario.
- Todo cambio de esquema de base de datos debe ir acompañado de su migración SQL correspondiente en `supabase/` (numerada después de la última migración existente) y debe reflejarse en `docs/SUPABASE_SETUP.md` (sección "4. Orden de migraciones SQL").
- Si algún punto no puede aplicarse tal cual (p. ej. el bloque de código citado ya no existe igual), aplicar el cambio al equivalente más cercano y reportarlo al final de este documento antes de moverlo a `specs_done`.

---

## 1. Catálogo (`src/views/Catalogo.tsx`)

### 1.1 Agregar tallas de niño (4, 6, 8, 10, 12, 14, 16)
- **Actual:** el campo de tallas es un union type fijo `('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL')[]` (`src/types.ts:11`, repetido en `AdminCostumeRelations.sizes`, `src/types.ts:151`), respaldado por un enum de Postgres `costume_size_enum` (`supabase/001_init.sql:5`). En Admin, las opciones se listan en `SIZE_OPTIONS` (`src/views/Admin.tsx:83`) y se seleccionan como botones toggle en la sección "Ficha técnica" (líneas ~1493-1506).
- **Decisión confirmada:** las tallas de niño **coexisten** con las de adulto en el mismo campo (no se crea un sistema de tallas separado por categoría de disfraz). Cada disfraz sigue teniendo un solo array `sizes`, y el admin elige libremente cualquier combinación de valores de adulto y/o de niño según aplique.
- **Acción:**
  1. **Supabase:** nueva migración que ejecute `ALTER TYPE costume_size_enum ADD VALUE '4'; ALTER TYPE costume_size_enum ADD VALUE '6';` (y así para `8, 10, 12, 14, 16`). **Nota importante:** Postgres no permite usar un valor de enum recién agregado dentro de la misma transacción en la que se agregó — si el flujo de migraciones se ejecuta transaccionalmente, esta migración debe quedar aislada (confirmar patrón ya usado en migraciones previas de `supabase/`).
  2. **`src/types.ts`:** ampliar la unión de `Costume.sizes` (línea 11) y `AdminCostumeRelations.sizes` (línea 151) a `('XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL' | '4' | '6' | '8' | '10' | '12' | '14' | '16')[]`.
  3. **`src/views/Admin.tsx`:** ampliar `SIZE_OPTIONS` (línea 83) con los 7 valores numéricos nuevos, en el mismo orden en que aparecen en los apuntes originales (4, 6, 8, 10, 12, 14, 16), después de las tallas de adulto.
- **Criterio de aceptación:** en la sección "Ficha técnica" del Admin, el selector de tallas ofrece tanto las tallas de adulto (XS-XXL) como las de niño (4-16), y ambas pueden combinarse libremente para un mismo disfraz.

### 1.2 Quitar la funcionalidad "Ordenar Por"
- **Actual:**
  - Tipo `SortOption` (`Catalogo.tsx:13`): `'default' | 'price-asc' | 'price-desc' | 'rating-desc'`.
  - Estado `sortBy` (línea 28).
  - Lógica de ordenamiento dentro del `useMemo` de `filteredCostumes` (líneas 100-107).
  - UI del dropdown "Ordenar Por" (líneas 279-292).
  - Reset del valor en `handleClearFilters` (línea 146) y en las dependencias del `useMemo` (línea 110).
- **Acción:** eliminar por completo el tipo `SortOption`, el estado `sortBy`, el bloque de lógica de sorting, el bloque de UI del `<select>` "Ordenar Por", y sus referencias en `handleClearFilters` y en las dependencias del `useMemo`. El catálogo debe conservar su orden por defecto (el orden en que llegan los datos, sin ordenamiento adicional).
- **Criterio de aceptación:** el panel de filtros del catálogo ya no muestra la sección "Ordenar Por"; no quedan referencias muertas a `SortOption`/`sortBy` en el código.

### 1.3 Tallas no aparecen en las cards del catálogo — aclaración, sin cambio de código
- **Hallazgo:** el texto de tallas **sí se renderiza** en cada card (`Catalogo.tsx:382-384`, `Tallas: {costume.sizes.join(', ')}`). El problema no es de renderizado sino de datos: el array `sizes` de un disfraz solo se completa a través del botón "Guardar ficha" en la sección "Ficha técnica" del Admin (`handleSaveRelations`, `Admin.tsx:436-461`), que es un paso de guardado **separado** del formulario principal "Guardar disfraz". Si un disfraz se crea o edita sin entrar a esa sección aparte, `sizes` queda vacío y la línea "Tallas:" se ve en blanco en su card.
- **Decisión confirmada:** no se modifica el flujo de guardado (no se fusiona "Guardar ficha" con "Guardar disfraz") ni se realiza limpieza de datos de disfraces existentes como parte de esta spec. Este punto queda documentado como comportamiento esperado del flujo actual, no como un defecto a corregir en código.
- **Criterio de aceptación:** no aplica cambio de código para este punto; queda como nota operativa para quien administra el catálogo (completar siempre la "Ficha técnica" al crear/editar un disfraz para que sus tallas se vean en el catálogo).

---

## 2. Ficha individual (`src/views/CatalogoDetail.tsx`, `src/App.tsx`, `src/views/Catalogo.tsx`)

### 2.1 Reemplazar el uuid por el slug en la URL de la ficha
- **Actual:** la ruta pública es `/catalogo/:costumeId` (`App.tsx:76-78`) y se resuelve buscando por `costume.id` — el uuid — tanto en `App.tsx:52-53` (`costumes.find((c) => c.id === selectedCostumeId)`) como al navegar desde el catálogo (`Catalogo.tsx:406`, `navigate(`/catalogo/${costume.id}`)`). La spec `routing.spec.md` (ya implementada) dejó esto explícitamente fuera de alcance en su punto 2.2, señalando que el modelo público `Costume` no tenía `slug` en ese momento.
- **Hallazgo:** el campo `slug` **ya existe** en la base de datos (`costumes.slug`, `supabase/001_init.sql:24`, único y `not null`) y ya se expone en la vista `costumes_full` (`supabase/003_views.sql:6`). También ya está tipado y en uso en el modelo **admin** (`AdminCostume.slug`, `AdminCostume.Payload.slug` — `types.ts:97,124`), con generación automática al crear un disfraz nuevo (`slugify`, `Admin.tsx:100-109` y su uso en línea 524-526). Lo único que falta es tipar `slug` en la interfaz pública `Costume` (`types.ts:1-20`, hoy no lo declara) y usarlo para el routing en vez del `id`.
- **Acción:**
  1. **`src/types.ts`:** agregar `slug: string;` a la interfaz pública `Costume`.
  2. **`src/App.tsx`:** cambiar la resolución de `activeCostume` (líneas ~52-53) para buscar por `c.slug === selectedCostumeId` en vez de `c.id`. Renombrar la variable de params si conviene para claridad (`costumeSlug` en vez de `costumeId`), manteniendo el patrón `/catalogo/:costumeSlug`.
  3. **`src/views/Catalogo.tsx`:** cambiar la navegación (línea 406) a `navigate(`/catalogo/${costume.slug}`)`.
  4. Revisar cualquier otro lugar que arme el link hacia la ficha individual (por ejemplo dentro de `CatalogoDetail.tsx`, si hubiera links relacionados o de "disfraces similares") para que use `slug` consistentemente.
- **Compatibilidad (recomendación abierta, sujeta a validación del usuario):** se sugiere que si alguien entra con una URL antigua `/catalogo/<uuid>` (por ejemplo un link ya compartido), la app redirija automáticamente al slug correspondiente en vez de mostrar "no encontrado", para no romper enlaces existentes. Esta es una propuesta del redactor, no una decisión de negocio confirmada.
- **Criterio de aceptación:** la URL de cada ficha individual usa el slug legible (ej. `/catalogo/marimonda-real`) en vez del uuid, y sigue resolviendo el disfraz correcto al navegar desde el catálogo o al entrar directo a la URL.

---

## 3. Admin - Disfraces (`src/views/Admin.tsx`)

### 3.1 Aprovechar el ancho completo en la versión web (layout de 2 columnas)
- **Actual:** todas las secciones del panel (Disfraces/listado, Nuevo/Editar, Galería de imágenes, Ficha técnica) están apiladas verticalmente en una sola columna, en ese orden: listado (líneas 902-1106), formulario Nuevo/Editar (1108-1256), Galería de imágenes (1258-1389), Ficha técnica (1391-1512+).
- **Acción:** reestructurar el layout en desktop (`lg:` o el breakpoint que ya use el resto del panel) a un grid de 2 columnas:
  - **Columna izquierda:** sección "Disfraces" (listado), con su altura ajustada para acompañar visualmente a la columna derecha (hoy ya tiene `max-h-[764px] overflow-y-auto` en la vista Lista, revisar que siga funcionando bien en la nueva proporción de columna).
  - **Columna derecha:** de arriba hacia abajo, en este orden: "Nuevo/Editar disfraz", "Galería de imágenes", "Ficha técnica del disfraz".
  - En mobile/tablet (por debajo del breakpoint elegido), mantener el apilado vertical actual en el mismo orden (listado → Nuevo/Editar → Galería → Ficha técnica).
- **Criterio de aceptación:** en viewport de escritorio no queda una columna angosta con espacio horizontal desaprovechado; en mobile la experiencia sigue siendo utilizable con el mismo orden de secciones que hoy.

### 3.2 Máscara de formato en los campos de moneda
- **Actual:** `rental_price`, `sale_price` y `deposit_price` se manejan como strings en el estado del formulario (`Admin.tsx:63-65,76-78`) y se renderizan como `<input type="number" min="0" step="1000" />` sin ninguna máscara visual (líneas ~1181-1216); se convierten a número recién al guardar (líneas 543-545). El formato de moneda (`formatCOP`) solo existe hoy en las vistas públicas (`Catalogo.tsx`/`CatalogoDetail.tsx` vía `src/utils/format.ts`), no se usa en Admin.
- **Decisión confirmada:** el formato visual del input mientras se escribe debe ser con símbolo `$` y separador de miles (ej. `$ 150.000`).
- **Acción:** aplicar una máscara en vivo sobre los tres inputs de moneda, usando `Intl.NumberFormat('es-CO')` (mismo criterio que `formatCOP`) sobre los dígitos que el usuario escribe, sin agregar dependencias nuevas al proyecto. El valor mostrado en el input es la representación formateada (`$ 150.000`); el valor numérico real (sin formato) es el que se guarda en el estado y se envía en el payload al guardar, igual que hoy.
- **Criterio de aceptación:** al escribir en cualquiera de los tres campos de moneda, el input muestra el símbolo `$` y separadores de miles en tiempo real, y el guardado del disfraz sigue funcionando con el valor numérico correcto (sin símbolos ni puntos que rompan la conversión a `number`).

### 3.3 Quitar la obligatoriedad del precio de alquiler y de la descripción
- **Actual:**
  - `rental_price` tiene el atributo HTML `required` (línea ~1190) y una validación JS adicional que lanza error si `Number.isNaN(payload.rental_price)` (líneas 554-556).
  - `description` tiene el atributo HTML `required` (línea ~1224) y forma parte de la validación conjunta en línea 550: `if (!payload.name || !payload.slug || !payload.category_id || !payload.description) throw new Error('Completa nombre, slug, categoria y descripcion.')`.
- **Acción:**
  1. Quitar el atributo `required` del input de `rental_price` y del textarea de `description`.
  2. En la validación de línea 550, quitar `!payload.description` de la condición (dejando `name`, `slug` y `category_id` como obligatorios) y actualizar el mensaje de error para que ya no mencione "descripcion".
  3. Quitar o ajustar el throw de `Number.isNaN(payload.rental_price)` (líneas 554-556) para que solo valide formato numérico **si el campo tiene contenido** (permitir vacío/`null`, igual que ya ocurre hoy con `sale_price` y `deposit_price`).
- **Criterio de aceptación:** se puede crear o editar un disfraz dejando vacíos el precio de alquiler y la descripción, sin que el formulario bloquee el guardado por esos dos campos.

### 3.4 La vista "Lista" debe mostrar 3 disfraces por fila
- **Actual:** la vista "Lista" (`viewMode === 'lista'`, líneas 940-987) es de una sola columna (`space-y-3`), a diferencia de la vista "Galería" que sí es un grid (`sm:grid-cols-2 xl:grid-cols-3`, línea 1049 en adelante).
- **Acción:** cambiar el contenedor de la vista Lista a un grid con 3 columnas en desktop (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`), conservando el contenido de cada `<article>` (nombre, slug, categoría) tal como está hoy.
- **Criterio de aceptación:** en viewport de escritorio, la vista "Lista" del listado de disfraces muestra 3 disfraces por fila.
- **Nota:** el primer pase de implementación usó 4 columnas (`lg:grid-cols-4`, según el pedido original); el usuario pidió el ajuste a 3 columnas durante la revisión, ya reflejado arriba y en el código.

### 3.5 Autocompletar "Texto alternativo" con el nombre del disfraz al cargar imágenes
- **Actual:** cada imagen de la galería tiene un input de "Texto alternativo" (líneas ~1338-1345) controlado por el estado `altDrafts`, que arranca vacío (`Admin.tsx:312`, `initialDrafts[item.id] = item.alt_text ?? '';`) — no hay ninguna lógica que lo derive del nombre del disfraz o del archivo.
- **Acción:** al subir una imagen nueva (dentro del flujo de la cola de subida, líneas ~1280-1306), precargar su `alt_text`/draft con el nombre del disfraz actualmente seleccionado (`form.name` o el campo equivalente), en vez de dejarlo vacío. El admin debe poder seguir editando ese texto libremente antes o después de guardarlo, como ya ocurre hoy.
- **Criterio de aceptación:** al subir una o varias imágenes nuevas a un disfraz, el campo "Texto alternativo" de cada una llega ya prellenado con el nombre del disfraz, sin necesidad de escribirlo manualmente (aunque se puede editar).

### 3.6 Ficha técnica: incorporar tallas de niño y mostrar Telas/Accesorios seleccionados como tags
- **Actual:** la sección "Ficha técnica" (líneas 1391-1512+) tiene: "Detalles visibles" (textarea, 1408-1417), "Telas" (checkboxes sobre `fabrics`, 1419-1451), "Accesorios" (checkboxes sobre `accessories`, 1453-1488) y "Tallas disponibles" (botones toggle sobre `SIZE_OPTIONS`, 1490-1508). Los elementos seleccionados de Telas/Accesorios no tienen ninguna representación visual fuera de su propia lista de checkboxes.
- **Acción:**
  1. El selector de tallas debe ofrecer también las tallas de niño agregadas en el punto 1.1 (mismo `SIZE_OPTIONS` ampliado, ya cubierto por ese punto — no se requiere trabajo adicional aquí más que confirmar que la UI de "Tallas disponibles" usa el `SIZE_OPTIONS` actualizado).
  2. Debajo de la lista de checkboxes de "Telas" (por fuera del bloque scrolleable/lista, líneas ~1419-1451) agregar un bloque de tags/chips que muestre únicamente las telas actualmente seleccionadas para ese disfraz.
  3. Debajo de la lista de checkboxes de "Accesorios" (líneas ~1453-1488), agregar el mismo tipo de bloque de tags/chips con los accesorios actualmente seleccionados.
  4. Los tags deben actualizarse en vivo al marcar/desmarcar checkboxes (misma fuente de estado que ya controla los checkboxes, sin duplicar lógica).
- **Criterio de aceptación:** al seleccionar o quitar una tela o accesorio en sus respectivas listas de checkboxes, el cambio se refleja inmediatamente como un tag debajo de la lista correspondiente; el selector de tallas incluye las tallas de niño.

### 3.7 Nueva sección de Admin para gestionar Telas y Accesorios (CRUD completo)
- **Actual:** "Telas" y "Accesorios" son catálogos reales en Supabase (tablas `fabrics` y `accessories`, `supabase/001_init.sql`), relacionados con disfraces mediante tablas puente (`costume_fabrics`, `costume_accessories`). Hoy solo se gestionan de forma embebida dentro de la Ficha técnica de cada disfraz: `fetchRelationLookups` (`adminService.ts:334-353`) trae ambos catálogos completos, y `createFabric`/`createAccessory` (líneas 355-391) permiten **solo crear** nuevas entradas desde ahí. No existen `updateFabric`, `deleteFabric`, `updateAccessory` ni `deleteAccessory`, y no hay ninguna vista de administración dedicada a estas dos entidades como listado independiente.
- **Decisión confirmada:** la nueva sección debe ser una **pestaña propia de nivel superior** (junto a "Disfraces", "Insights" y "Configuración" en `activeSection`, `Admin.tsx:127`), no una subsección dentro de la pestaña Disfraces.
- **Acción:**
  1. **`src/services/adminService.ts`:** agregar `updateFabric(id, name)`, `deleteFabric(id)`, `updateAccessory(id, name)`, `deleteAccessory(id)`, siguiendo el mismo patrón que `updateCostume`/`deleteCostume` ya usan para Disfraces.
  2. **`src/views/Admin.tsx`:** agregar `'telas-accesorios'` (o nombre equivalente) a los valores posibles de `activeSection` (línea 127) y su tab correspondiente en la navegación del panel.
  3. Construir la UI de la nueva pestaña replicando el patrón ya usado para Disfraces: listado (tabla o lista simple, dado que solo son nombre + id), formulario de crear/editar, botón de eliminar con confirmación reutilizando el componente `ConfirmDialog` (`src/components/ConfirmDialog.tsx`) ya usado en el resto del panel, y feedback mediante el mismo patrón de toasts existente (nunca `alert()`). No requiere galería de imágenes ni ficha técnica propia — son solo entidades de nombre.
  4. **Manejo de borrado en uso (pregunta abierta, ver Notas de la redacción):** se recomienda bloquear el borrado de una tela/accesorio que esté actualmente asociada a algún disfraz (mostrando un mensaje claro de cuántos disfraces la usan), en vez de eliminar silenciosamente la relación en `costume_fabrics`/`costume_accessories`. Confirmar este comportamiento con el usuario antes de implementar.
- **Criterio de aceptación:** desde la nueva pestaña "Telas y Accesorios" se pueden crear, editar (renombrar) y eliminar telas y accesorios de forma independiente, sin necesidad de entrar a la ficha de un disfraz específico; los cambios se reflejan en los checkboxes de la Ficha técnica de cualquier disfraz.

---

## Notas de la redacción

Al convertir los apuntes crudos originales en esta spec, se documentan las siguientes decisiones y hallazgos que no estaban explícitos en las notas:

- **1.1 (tallas de niño):** se confirmó con el usuario que las tallas de niño (4-16) **coexisten** con las de adulto (XS-XXL) en el mismo campo `sizes`, ampliando el enum existente, en vez de crear un sistema de tallas separado por tipo de disfraz.
- **1.3 (tallas vacías en las cards):** la causa raíz identificada es que el guardado de la "Ficha técnica" (que incluye `sizes`) es un paso separado del guardado principal del disfraz. Se consultó al usuario si convenía fusionar ambos guardados o hacer limpieza de datos existentes; la decisión explícita fue **no hacer ningún cambio de código** — se documenta como comportamiento esperado del flujo actual, no como un bug a corregir.
- **3.2 (máscara de moneda):** se confirmó el formato con símbolo `$` + separador de miles (ej. `$ 150.000`), en vez de una alternativa sin símbolo.
- **3.7 (Telas y Accesorios):** se confirmó que la nueva sección debe ser una pestaña propia de nivel superior en el panel Admin, no una subsección dentro de "Disfraces".
- **2.1 (slug en la URL):** este punto retoma explícitamente algo que la spec `routing.spec.md` (ya implementada, ver `docs/specs/specs_done/routing.spec.md`, punto 2.2) había dejado fuera de alcance por falta del campo `slug` en el modelo público — ese campo ya existe hoy en la base de datos y en el modelo admin, por lo que esta spec solo necesita exponerlo en el modelo público y cambiar el routing para usarlo.
- **Pregunta abierta pendiente de confirmar antes de implementar 3.7:** ¿se debe bloquear el borrado de una tela/accesorio que esté en uso por algún disfraz, o permitir el borrado y limpiar automáticamente la relación en `costume_fabrics`/`costume_accessories`? Esta spec recomienda bloquear el borrado, pero queda sujeto a confirmación del usuario.
- **2.1 (compatibilidad con URLs antiguas de uuid):** la recomendación de redirigir automáticamente desde una URL antigua `/catalogo/<uuid>` hacia el slug correspondiente es una propuesta del redactor, no una decisión de negocio confirmada; validar con el usuario si es necesaria o si se puede omitir.

## Notas de cierre (implementación)

Todos los puntos de esta spec fueron implementados y confirmados por el usuario en PR #24 (rama `feature/ajustes`, mergeada a `main`). Decisiones/hallazgos adicionales surgidos durante la implementación y revisión, no cubiertos en la redacción original:

- **3.3 (rental_price opcional):** además de quitar el `required` del formulario, se detectó que la columna `costumes.rental_price` era `NOT NULL` en Supabase — se agregó `ALTER TABLE costumes ALTER COLUMN rental_price DROP NOT NULL;` a la migración `011_child_sizes_and_optional_rental.sql`, y `Costume.rentalPrice`/`AdminCostume.rental_price` pasaron a ser opcionales/nullable, con render condicional en catálogo y ficha (mismo patrón que `salePrice`).
- **3.4 (Lista):** el usuario pidió ajustar de 4 a **3 disfraces por fila** tras ver el resultado inicial; ya reflejado en el punto 3.4 arriba y en el código (`lg:grid-cols-3`).
- **Ajuste no solicitado originalmente — tags "Disponible"/"Normal" en Lista:** al pasar a grid de varias columnas, esos badges se solapaban en tarjetas angostas; se cambiaron a apilarse verticalmente (`flex-col`) en la vista Lista.
- **Ajuste no solicitado originalmente — ocultar slug:** el usuario pidió no mostrar el slug del disfraz en las vistas Tabla y Lista del listado de Disfraces (sí se sigue editando en el formulario Nuevo/Editar).
- **Ajuste no solicitado originalmente — búsqueda rápida:** el usuario pidió agregar búsqueda rápida (filtro en vivo por texto) en las vistas Tabla/Lista/Galería de Disfraces (por nombre, slug o categoría) y en las listas de Telas y Accesorios de la nueva pestaña (por nombre).
- **3.1 (layout 2 columnas) — refinamiento de altura:** además del layout de 2 columnas, el usuario pidió que el card "Disfraces" (izquierda) termine exactamente donde termina el card "Ficha técnica del disfraz" (derecha). Un enfoque puramente CSS (grid `align-items: stretch`) no fue suficiente porque el contenido de ambas columnas es de alto variable e independiente; se implementó sincronización de altura vía JavaScript (`ResizeObserver` + `useLayoutEffect` con dependencias en los datos que afectan la altura de la columna derecha: costume seleccionado, cantidad de imágenes, cola de subida, telas/accesorios), aplicada solo en viewport de escritorio (`≥1024px`).
