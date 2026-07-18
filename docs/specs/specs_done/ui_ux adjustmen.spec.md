# SPEC — Ajustes de UI/UX (Catálogo de Disfraces)

## Contexto
Conjunto de correcciones y mejoras funcionales sobre el catálogo público, la ficha individual de producto, el panel de administración y elementos transversales de la aplicación.

---

## 1. Catálogo

### 1.1 Responsive — Cards verticales en móvil
- **Objetivo:** mejorar la visualización de los disfraces en dispositivos móviles.
- **Requisito:** en breakpoint móvil, las imagenes de los cards deben verse completa, actualmente se están cortando.
- **Criterio de aceptación:** en viewport ≤ 768px (ajustar según breakpoints del proyecto), las cards se renderizan verticalmente sin recortar ni deformar la imagen del disfraz.

---

## 2. Ficha individual de producto

### 2.1 Bug — Estado "RESERVADO / NO DISPONIBLE" incorrecto
- **Problema:** la ficha muestra "RESERVADO / NO DISPONIBLE" aunque el disfraz figura como **disponible** en la base de datos.
- **Requisito:** corregir la lógica que determina el estado de disponibilidad para que refleje fielmente el valor almacenado en la BD.
- **Criterio de aceptación:** el estado mostrado en UI coincide 1:1 con el campo de disponibilidad en BD para todos los casos de prueba (disponible, reservado, no disponible).

### 2.2 Copy — Selector de talla
- Cambiar el texto **"ESCOGE TU TALLA"** → **"TALLAS DISPONIBLES"**.

### 2.3 Copy — Ajuste por sastre
- Cambiar el texto **"AJUSTABLE POR SASTRE"** → **"PREGUNTA EN TU VISITA SI ES POSIBLE AJUSTAR POR SASTRE"**.
  > Nota: revisar si el apunte original decía "VISTA" o "VISITA" (posible typo) antes de implementar.

### 2.4 Eliminar botón "CONSULTAR POR WHATSAPP"
- Quitar completamente el botón y su lógica asociada (link/click handler) de la ficha individual.

---

## 3. Panel de administración

### 3.1 Mensajería al usuario vía DOM (prohibido `alert`)
- **Requisito:** todos los mensajes de feedback al usuario (éxito, error, confirmación, advertencia) deben implementarse mediante componentes DOM propios (toast, modal, banner inline, etc.), **nunca** usando `alert()`, `confirm()` ni `prompt()` nativos del navegador.
- **Acción adicional:** actualizar `PROMPT.md` y/o `DESIGN.md` documentando este estándar como regla obligatoria del proyecto, incluyendo el componente/patrón a utilizar.

### 3.2 Submenú de administración con secciones condicionales
- **Requisito general:** diseñar un submenú de administración donde cada sección se renderice **únicamente** cuando el usuario la seleccione (no todas visibles a la vez).

#### 3.2.1 Sección "Disfraces" (CRUD) — **prioritaria**
- Permite **crear, editar y eliminar** disfraces.
- Debe ofrecer **3 tipos de vista**, seleccionables una a la vez (toggle/tabs), todas con **scroll**:
  1. **Vista Tabla**
  2. **Vista Lista con resumen**
  3. **Vista Galería**

##### 3.2.1.a Panel derecho (modos Crear / Editar)
Al crear o editar un disfraz, mostrar un panel lateral derecho con dos bloques, en este orden:

1. **Galería de imágenes** (bloque superior)
   - Visualizar imágenes actuales del disfraz.
   - Editar imágenes actuales.
   - Eliminar imágenes actuales.
   - Cargar nuevas imágenes.

2. **Características** (bloque inferior) — organizado en subsecciones claramente separadas:
   - **Detalles visibles**
   - **Telas**
   - **Accesorios**

#### 3.2.2 Sección "Configuración del sitio"
- Sección independiente dentro del mismo submenú, para parámetros generales del sitio.
  > Nota: en el documento original este ítem aparece numerado como "3.2.2", duplicando el número de la sección de Disfraces. Se sugiere renumerar como **3.2.3** para evitar ambigüedad.

---

## 4. Nuestra historia

### 4.1 Copy — Botón de exploración
- Cambiar el texto **"EXPLORAR CATÁLOGO DE COSTURA"** → **"EXPLORAR"**.

---

## 5. Transversal

### 5.1 Eliminar botón de corazón (favoritos)
- Quitar el botón de corazón (ícono de favorito/wishlist) en **toda la aplicación**, incluyendo su lógica, estado asociado y cualquier referencia en catálogo, ficha individual u otras vistas.

---

## Notas para el agente de implementación
- Priorizar **3.2.1** (CRUD de disfraces) según lo indicado en el documento original.
- Validar con el equipo de producto los dos puntos marcados como posible ambigüedad/typo (2.3 y numeración de 3.2.2).
- Verificar cobertura de pruebas para 2.1 (bug de disponibilidad), dado que es una corrección de datos, no solo de UI.

---

## Notas de implementación (post-mortem)

Spec implementada al 100% en la rama `feature/ui-ux-adjustment` (versión `0.3.0`). Aclaraciones confirmadas con el usuario durante la implementación:

- **2.3:** se confirmó "VISITA" (no "VISTA"): el texto final quedó como *"Pregunta en tu visita si es posible ajustar por sastre"*.
- **Numeración 3.2.2 duplicada:** la sección "Configuración del sitio" se implementó como su propia sección condicional del submenú admin, independiente de "Disfraces"; no fue necesario renombrar el ítem ya que no afectaba al código, solo a la numeración del documento.
- **1.1 (bug de disponibilidad):** la causa raíz no era de UI sino de mapeo de datos — `src/services/dataService.ts` no traducía los campos snake_case de Supabase (`is_available`, `rental_price`, `sale_price`, `reviews_count`) a camelCase. Corregido en `normalizeCostumeRecord`.
- Ajustes adicionales solicitados tras la primera entrega (alturas de imagen y límites de filas/scroll en las vistas Tabla/Lista/Galería del panel admin, y en la galería de imágenes por disfraz) fueron incorporados en la misma rama antes de abrir el PR.