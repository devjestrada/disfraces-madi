# SPEC — Visibilidad del botón de acceso administrativo (Navbar)

## Contexto
El link de acceso a `/admin` en el `Navbar` (desktop y mobile) es poco visible/descubrible para el personal que administra el sitio. Su estilo actual es deliberadamente discreto (bajo contraste, ícono pequeño) para no competir con el CTA principal de conversión (WhatsApp / agendar cita), pero eso mismo dificulta que quien sí necesita entrar al panel lo encuentre rápido — especialmente en mobile, donde el link queda al final del drawer, tras abrir el menú y desplazarse.

**Objetivo:** mejorar la descubribilidad funcional del botón de Admin para el personal autorizado, sin convertirlo en un elemento visualmente prominente ni competir con el flujo de conversión al público, y sin salirse del sistema de diseño documentado en `DESIGN.md`.

**Archivo afectado:** [`src/components/Navbar.tsx`](../../../src/components/Navbar.tsx)

---

## 1. Ícono y jerarquía visual (desktop)

- **Problema:** el ícono `User` se renderiza a 14px ([Navbar.tsx:85](../../../src/components/Navbar.tsx#L85)), por debajo del tamaño estándar de 22px que `DESIGN.md` define para el uso "Perfil/cuenta" del ícono `User` (sección 4, tabla de iconografía Lucide).
- **Requisito:** ajustar el ícono del botón de Admin (desktop) al tamaño estándar documentado (22px) o al tamaño inmediatamente compatible con el contenedor actual sin romper el layout del Navbar.
- **Requisito:** implementar la micro-interacción de hover que documenta `DESIGN.md` para `User` (fondo circular en tono `--color-canvas` al hover), en vez de solo transicionar color de texto/borde como ocurre hoy.
- **Criterio de aceptación:** el ícono y su comportamiento de hover coinciden con lo especificado en `DESIGN.md`; el botón sigue siendo visualmente secundario respecto a los CTA de conversión (WhatsApp, agendar cita), no un elemento prominente.

## 2. Estado "activo" al estar en `/admin`

- **Problema:** `isNavItemActive` ([Navbar.tsx:15-20](../../../src/components/Navbar.tsx#L15-L20)) no contempla la ruta `/admin`, por lo que el link de Admin nunca muestra el indicador de "página actual" que sí tienen el resto de los ítems del menú (línea inferior animada con `motion.div`/`layoutId="activeNavLine"`).
- **Requisito:** cuando `pathname` sea `/admin` (o cualquier subruta bajo `/admin`, si aplica), el link de Admin debe reflejar visualmente que es la sección activa, de forma consistente con el resto del Navbar.
- **Criterio de aceptación:** al navegar a `/admin`, el botón de Admin muestra un indicador visual de estado activo equivalente en tratamiento al de los demás ítems del menú.

## 3. Ubicación en el drawer mobile

- **Problema:** en mobile ([Navbar.tsx:129-136](../../../src/components/Navbar.tsx#L129-L136)), el link "Acceso administrativo" está al final del drawer, después de todos los `navItems`, requiriendo abrir el menú y desplazarse hasta el fondo para encontrarlo.
- **Requisito:** reubicar o resaltar el link de Admin dentro del drawer mobile para reducir la fricción de encontrarlo (ej. moverlo a una posición más alta dentro del drawer, o anclarlo de forma visualmente distinta cerca del encabezado del menú), sin convertirlo en el elemento más prominente del drawer.
- **Criterio de aceptación:** el personal admin puede localizar el acceso a `/admin` en el drawer mobile sin necesidad de desplazarse hasta el final del listado completo de ítems de navegación.

## 4. Restricciones (no negociables)

- El botón de Admin **no debe** volverse visualmente equivalente o más prominente que los CTA de conversión (WhatsApp flotante, "Agendar cita"), conforme a las prioridades de negocio en `AGENTS.md`.
- Cualquier color, tamaño de ícono, tipografía o patrón de interacción usado debe respetar estrictamente `DESIGN.md`; no se introducen valores fuera de esa guía.
- No se debe alterar la navegación pública (`navItems`) ni el comportamiento del resto del menú.

---

## Notas para el agente de implementación

- El tamaño exacto de reubicación en el drawer mobile (punto 3) queda abierto a criterio de implementación siempre que cumpla el criterio de aceptación; validar con el usuario si hay una preferencia visual concreta (ej. franja superior fija vs. simplemente mover el orden) antes de finalizar el estilo.
- Verificar que el ajuste de tamaño de ícono en desktop (punto 1) no rompa el alto de la barra de navegación (`h-20`) ni el espaciado del contenedor `pl-6 ml-2 border-l`.
- Revisar si `isNavItemActive` debe extenderse con un caso especial para `/admin`, o si conviene una función de activo separada dado que `/admin` no forma parte del arreglo `navItems`.

---

## Notas de implementación (post-mortem)

Spec implementada al 100% en la rama `feature/boton-admin-visibilidad`. Todos los puntos se aplicaron tal cual, sin ambigüedades pendientes:

- **Punto 3 (mobile):** se validó con el usuario (vía pregunta de opciones) que el enfoque preferido era mover el link al inicio del drawer, en lugar de agregar un ícono fijo junto al botón de menú hamburguesa. Se implementó como una función `isAdminActive = pathname.startsWith('/admin')` separada, en vez de extender `isNavItemActive` (que solo opera sobre `navItems`).
- **Punto 1 (ícono desktop):** el ajuste a 22px no afectó el alto de la barra (`h-20`) ni el espaciado del contenedor separador; se agregó un `<span>` circular adicional para el hover, sin tocar el resto del pill.
- Verificado visualmente con Playwright (desktop hover, estado activo en `/admin`, drawer mobile) y `npm run lint` (tsc --noEmit) sin errores.
