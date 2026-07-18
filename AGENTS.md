# Instrucciones para Agentes de Desarrollo - Atelier Madi v2

Este archivo contiene reglas críticas de negocio, diseño y desarrollo que deben respetarse rigurosamente en cualquier modificación futura de la aplicación.

---

## 0. Objetivo del proyecto

El sitio debe seguir proyectando un tono cercano, exclusivo, artesanal y orientado a conversión por visita presencial. La experiencia debe sentirse humana, elegante y confiable, sin perder la esencia del Carnaval de Barranquilla.

---

## 1. Directrices de Reglas de Negocio (¡MANDATORIO!)

### ✅ Publicación de Precios (Venta, Alquiler y Depósito)
* **REGLA:** Se deben publicar los precios de **venta**, **alquiler** y **depósito** de cada disfraz en la aplicación (catálogo, ficha de detalle, inicio, formularios, etc.).
* **Razón:** El negocio reconsideró la estrategia comercial y ahora prioriza la transparencia desde el primer contacto, para que la clienta conozca el valor antes de agendar su visita.
* **Formato recomendado:**
  * Mostrar los tres valores de forma clara, en pesos colombianos (COP): precio de alquiler, precio de venta (cuando aplique) y depósito.
  * El depósito debe indicarse explícitamente como reembolsable, ej. *"Depósito reembolsable: $100.000"*.
* **Mensajes complementarios (mantener el tono cercano, no reemplazan el precio):**
  * *"Agenda tu visita y prueba tu disfraz antes de confirmar"*
  * *"Consulta disponibilidad y agenda tu cita"*
* **Nota de implementación:** el modelo de datos actual (`src/types.ts`) solo contempla `rentalPrice` y `salePrice`; falta agregar un campo de depósito (ej. `depositPrice`) antes de poder mostrarlo en la UI. Ese cambio de datos/UI es funcional y debe hacerse en una rama de código separada de esta actualización de documentación.

### 🚫 Prohibición de Direcciones Físicas Exactas e Integraciones de Mapas
* **REGLA:** **NO** integres Google Maps, mapas interactivos vectoriales, ni reveles la dirección de calle exacta abiertamente en el sitio público.
* **Razón:** La tienda opera bajo un modelo exclusivo de **visitas por cita previa** para dar atención personalizada y evitar aglomeraciones o ingresos sin registrar.
* **Mensajes Autorizados:**
  * *"Visitas exclusivas con cita previa"*
  * *"Barranquilla, Atlántico, Colombia"*

### 🎯 Tono y contenido
* Mantener un tono cálido, festivo, cercano y profesional.
* Evitar un lenguaje demasiado corporativo, frío o genérico.
* Respetar la identidad local del Carnaval de Barranquilla sin caer en clichés vacíos.

---

## 2. Pautas del Botón Flotante de WhatsApp

* **REGLA:** El botón de WhatsApp es el canal principal de conversión del sitio y debe permanecer visible, flotante y accesible desde todas las pantallas del aplicativo.
* **Limitación de Opciones de Flujo:**
  * No vuelvas a habilitar opciones genéricas dispersas como *"Cotizar un vestido a medida"* o *"Consultar disponibilidad"* en los botones preestablecidos del chat flotante. El flujo de preseleccionados se reduce estrictamente a **"🗓️ Agendar cita para probarme un disfraz"**, lo cual centraliza y simplifica las conversiones de manera limpia.
  * Mantener el icono oficial de WhatsApp (diseño SVG limpio) en el botón de envío y botones de CTA de WhatsApp en vez de iconos genéricos de mensajería (como `Send` o `MessageSquare`), fortaleciendo la confianza en el destino del enlace.

---

## 3. Checklist de Validación Antes de Finalizar un Cambio

Cada modificación debe revisarse con esta lista mínima:

- [ ] Los precios de alquiler, venta (cuando aplique) y depósito están visibles y correctamente formateados en catálogo, ficha, inicio y formularios relevantes.
- [ ] No se expone una dirección exacta ni se integra un mapa interactivo.
- [ ] El botón de WhatsApp sigue visible, flotante y accesible.
- [ ] El flujo de conversión sigue centrado en agendar cita para probarse un disfraz.
- [ ] El contenido conserva el tono cercano y artesanal de la marca.
- [ ] No se introducen cambios que rompan la navegación o la experiencia móvil.

---

## 4. Arquitectura y Estructura de Código

* **Estructura de Datos:** Las propiedades `rentalPrice` y `salePrice` en `src/types.ts` y `src/data.ts` **sí deben inyectarse en el renderizado de la UI** (catálogo, ficha de detalle, etc.). Falta incorporar un campo de depósito (ej. `depositPrice`) al modelo de datos para completar la publicación de los tres valores.
* **Propiedad `designer`:** Cada disfraz cuenta con un campo `designer` que debe desplegarse elegantemente en la ficha técnica (`CatalogoDetail.tsx`) para rendir tributo a la confección del Atelier.
* **Stack tecnológico actual:**
  * Frontend: `React 19` + `TypeScript 5.8` + `Vite 6` para la aplicación SPA.
  * Estilos: `Tailwind CSS 4` con el plugin oficial de Vite para diseño visual.
  * UI y animación: `lucide-react` para iconos y `motion/react` para transiciones suaves.
  * Servicios auxiliares: `Express`, `dotenv` y `@google/genai` cuando sea necesario soportar integraciones o automatizaciones.
  * Validación local: usar `npm run dev`, `npm run build` y `npm run lint` como comandos de referencia para desarrollo y verificación.
* **Convención:** mantener el stack actual y añadir nuevas dependencias solo cuando aporten un beneficio claro y estén alineadas con la experiencia del negocio.

### Archivos de referencia clave
* `src/types.ts` y `src/data.ts`: modelo de datos y estructura histórica.
* `src/views/CatalogoDetail.tsx`: detalle del disfraz, mensaje de alquiler personalizado y exhibición del `designer`.
* `src/components/WhatsAppButton.tsx`: canal principal de conversión y flujo del botón flotante.
* `src/views/BookingsManager.tsx`: reserva y agendamiento de visitas.

---

## 5. Reglas de Implementación

* Priorizar la claridad del flujo de conversión sobre la incorporación de nuevas funciones secundarias.
* Si un cambio introduce copy comercial nueva, debe alinearse con los mensajes aprobados en este documento.
* Cuando exista duda entre “mejorar la experiencia” y “preservar la identidad del negocio”, siempre prevalece la identidad del negocio.
* Mantener el código limpio, legible y alineado con el stack actual del proyecto.
* Toda modificación en la UI debe respetar obligatoriamente el sistema de diseño documentado en `DESIGN.md`; no se deben introducir colores, tipografías, iconos, espaciados ni patrones visuales fuera de esa guía.

---

## 6. Ejemplos de Correcto vs Incorrecto

### Correcto
* “Alquiler: $150.000”
* “Venta: $280.000”
* “Depósito reembolsable: $100.000”
* “Agenda tu visita y prueba tu disfraz antes de confirmar”
* “Visitas exclusivas con cita previa”

### Incorrecto
* “Precio: consultar” (ya no aplica: el precio debe mostrarse)
* “Dirección: Calle X #Y-Z”
* botones de WhatsApp genéricos o múltiples flujos dispersos

---

## Versionado y Changelog

Este proyecto sigue **Semantic Versioning (SemVer)** y el formato **Keep a Changelog**.

### Reglas de versionado (`package.json`)

- **NUNCA** edites manualmente el campo `"version"` en `package.json`.
- Usa siempre el comando `npm version` para actualizar la versión:
```bash
  npm version patch   # correcciones de bugs (1.0.0 -> 1.0.1)
  npm version minor   # nuevas funcionalidades compatibles (1.0.0 -> 1.1.0)
  npm version major   # breaking changes (1.0.0 -> 2.0.0)
```
- Criterio para elegir el tipo de bump:
  - `patch`: corrección de bugs, ajustes internos sin impacto en la API pública.
  - `minor`: nueva funcionalidad que no rompe compatibilidad.
  - `major`: cualquier cambio que rompa compatibilidad hacia atrás.
- Si se necesita evitar el commit/tag automático de git:
```bash
  npm version patch --no-git-tag-version
```

### Manejo del CHANGELOG.md

- Todo cambio relevante debe reflejarse en `CHANGELOG.md`, siguiendo el formato [Keep a Changelog](https://keepachangelog.com).
- Estructura obligatoria por versión:
```markdown
  ## [X.Y.Z] - YYYY-MM-DD
  ### Added
  - ...
  ### Changed
  - ...
  ### Fixed
  - ...
  ### Removed
  - ...
```
- Los cambios no liberados aún deben ir bajo la sección `## [Unreleased]` en la parte superior del archivo.
- Al hacer un release, mover el contenido de `[Unreleased]` a una nueva sección con el número de versión y la fecha correspondiente.
- Usa únicamente estas categorías: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`.

### Commits

- Usa el formato de **Conventional Commits** para que el historial sea legible y, si se automatiza en el futuro, compatible con herramientas de release:
  - `feat: ...` para nuevas funcionalidades.
  - `fix: ...` para correcciones de errores.
  - `chore: ...` para tareas de mantenimiento y configuración.
  - `docs: ...` para cambios de documentación.
  - `refactor: ...` para refactorizaciones sin cambio funcional.
  - `perf: ...` para mejoras de rendimiento.

## Manejo de specs de modificaciones

- Las specs de modificaciones (como `*.spec.md`) se encuentran en la carpeta `docs/specs/specs_backlog`.
- Al implementar completamente una spec (todos sus puntos aplicados y verificados en el código), el agente debe:
  1. Confirmar que todos los cambios listados en la spec fueron aplicados correctamente.
  2. Mover el archivo de la spec a la carpeta `docs/specs/specs_done/` (crear la carpeta si no existe).
  3. Si algún punto de la spec no pudo aplicarse (por ejemplo, texto "Actual" no encontrado exactamente), dejar constancia de ello en un comentario al final del archivo antes de moverlo, indicando qué se aplicó al texto equivalente más cercano.
  4. No mover specs parcialmente implementadas: solo se mueven a `docs/specs/specs_done/` cuando el 100% de los puntos fue resuelto (aplicado o reportado explícitamente como no encontrado).
- Nomenclatura sugerida al mover: mantener el nombre original del archivo, sin renombrar, para preservar trazabilidad.

### Flujo de trabajo por spec

1. **Apuntes iniciales:** El usuario agrega sus apuntes/ideas iniciales directamente en el archivo de la spec dentro de `docs/specs/specs_backlog`.
2. **Redacción de la spec:** Cuando el usuario lo solicite, el agente redacta la spec de forma clara y correcta, editando el archivo.
3. **Revisión de la spec:** El usuario revisa la redacción. El agente **no debe avanzar** a la planeación hasta que el usuario indique explícitamente que la revisión fue exitosa.
4. **Rama de trabajo:** Antes de iniciar el plan de implementación, crear una nueva rama de tipo `feature` (ej. `feature/nombre-de-la-spec`).
5. **Planeación:** Con la spec ya revisada y aprobada, generar un plan específico de implementación (qué archivos/componentes se van a modificar y cómo). Presentar este plan como resultado antes de escribir código.
6. **Revisión del plan:** El usuario revisa el plan de implementación. El agente **no debe iniciar** la implementación hasta que el usuario esté de acuerdo con el plan.
7. **Implementación:** Una vez aprobado el plan, proceder con la implementación de los cambios descritos en la spec.
8. **Confirmación de cambios:** Al finalizar la implementación, preguntar al usuario si los cambios se aplicaron correctamente.
   - Si el usuario **confirma** que todo está correcto:
     a. Hacer commit de los cambios de código en la rama `feature`, subir (`push`) esa rama al repositorio remoto y abrir el **primer Pull Request** (solo código funcional) hacia la rama principal.
     b. Inmediatamente después, crear una **segunda rama** de tipo `chore` (ej. `chore/cierre-nombre-de-la-spec`) para el cierre documental de la spec, que incluya únicamente: mover el archivo de la spec a `docs/specs/specs_done/`, subir (incrementar) la versión en `package.json` (`npm version`) y la actualización correspondiente de `CHANGELOG.md`.
     c. Hacer commit de esos cambios de cierre, subir (`push`) la rama `chore` y abrir el **segundo Pull Request**, independiente del primero.
   - Si el usuario **no confirma** o reporta problemas, no mover la spec ni actualizar la versión; realizar los ajustes necesarios y volver a preguntar.
9. **Reporte de excepciones:** Si algún punto de la spec no pudo aplicarse tal cual (por ejemplo, texto "Actual" no encontrado exactamente), dejar constancia de ello en un comentario al final del archivo de spec antes de moverlo, indicando qué se aplicó al texto equivalente más cercano.
10. **Nomenclatura al mover:** Mantener el nombre original del archivo de spec, sin renombrar, para preservar trazabilidad.
11. **Cierre de ramas:** Una vez que cada Pull Request (el de código y el de cierre documental) sea aprobado y mergeado a la rama principal, borrar su rama correspondiente tanto en local (`git branch -d`) como en el remoto (`git push origin --delete`), para mantener el repositorio limpio. No borrar una rama mientras su PR no haya sido aprobado y mergeado.

### Reglas adicionales

- No mover specs parcialmente implementadas: solo se mueven a `docs/specs/specs_done/` cuando el 100% de los puntos fue resuelto (aplicado o reportado explícitamente como no encontrado) **y** el usuario confirmó los cambios.
- Cada spec finalizada exitosamente debe resultar en **exactamente dos Pull Requests independientes**: uno con el código funcional (rama `feature`) y otro con el cierre documental (rama `chore`, con el movimiento de la spec a `specs_done`, el bump de versión en `package.json` y la entrada en `CHANGELOG.md`). Nunca se deben mezclar en un mismo PR/rama.
- Los cambios que sean exclusivamente de documentación (por ejemplo, edición de `AGENTS.md`, `CLAUDE.md`, `README.md`, `DESIGN.md` u otros archivos `.md`) **nunca** deben mezclarse en la misma rama que cambios de código funcional. Siempre deben ir en una rama separada (ej. `docs/nombre-del-cambio` o `chore/nombre-del-cambio`), con su propio commit, push y Pull Request independiente.
