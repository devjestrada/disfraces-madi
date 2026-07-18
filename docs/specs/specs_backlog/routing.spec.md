# SPEC — Routing con URLs reales

## Contexto
Actualmente la navegación de la SPA se resuelve 100% en memoria: `App.tsx` mantiene un estado `currentView` (string) y un `switch` que decide qué vista renderizar. No existe ninguna librería de enrutamiento (no hay `react-router-dom` en `package.json`). La única excepción es el panel admin, accesible solo vía el hash `#admin` leído una vez en un `useEffect` (`App.tsx:33-37`).

Esto implica que:
- Ninguna vista tiene una URL propia (todo vive en `/`).
- No se puede compartir un link directo al catálogo, a una ficha de disfraz o al panel admin.
- El botón "atrás/adelante" del navegador no funciona como se espera.
- Refrescar la página (`F5`) siempre vuelve a Inicio (excepto `#admin`, que sí sobrevive por estar en el hash).

El objetivo de esta spec es introducir routing real basado en URLs (`/catalogo`, `/admin`, etc.) sin romper el flujo de conversión ni el diseño existente.

---

## 1. Dependencia y configuración base

### 1.1 Incorporar `react-router-dom`
- **Requisito:** agregar `react-router-dom` como dependencia (compatible con React 19) y envolver la aplicación con `<BrowserRouter>`.
- **Criterio de aceptación:** `npm install` y `npm run build` corren sin errores con la nueva dependencia.

### 1.2 Reemplazar el switch de `currentView` por `<Routes>`
- **Requisito:** sustituir el `renderCurrentView()` de `src/App.tsx` por definiciones de `<Route>` declarativas, manteniendo el layout común (`Navbar`, `Footer`, `WhatsAppButton`, `PublicDataProvider`) fuera del área que cambia por ruta.
- **Criterio de aceptación:** el layout (navbar, footer, botón flotante de WhatsApp) permanece montado y visible al navegar entre todas las rutas.

---

## 2. Mapa de rutas

| Vista actual (`currentView`) | Ruta nueva | Notas |
|---|---|---|
| `inicio` | `/` | — |
| `catalogo` | `/catalogo` | Filtro de categoría vía query param, ver 2.1 |
| `catalogo-detail` | `/catalogo/:costumeId` | Usar `id` del disfraz (no existe `slug` en el modelo público `Costume`, ver `src/types.ts:1-19`) |
| `servicios` | `/servicios` | — |
| `historia` | `/nuestra-historia` | — |
| `contacto` | `/contacto` | — |
| `admin` | `/admin` | Reemplaza el hash `#admin`; ver 2.3 |
| *(sin match)* | `*` | Página 404 o redirect a `/`, ver 2.4 |

### 2.1 Filtro de categoría del catálogo como query param
- **Requisito:** cuando el usuario selecciona una categoría (`onCategoryChange` en `Catalogo.tsx`), reflejarla en la URL como `/catalogo?categoria=Marimonda` en vez de solo estado interno.
- **Criterio de aceptación:** compartir/recargar un link `/catalogo?categoria=Marimonda` abre el catálogo con ese filtro ya aplicado.

### 2.2 Ficha de producto por `id`
- **Requisito:** `/catalogo/:costumeId` debe resolver el mismo disfraz que hoy resuelve `costumeId` en `CatalogoDetail.tsx:15`.
- **Criterio de aceptación:** entrar directo a `/catalogo/<id-valido>` (sin pasar antes por `/catalogo`) muestra la ficha correcta.
- **Fuera de alcance:** URLs "amigables" por `slug` (ej. `/catalogo/marimonda-real`) — el modelo público `Costume` no tiene ese campo hoy. Si se desea a futuro, requiere agregar `slug` a `src/types.ts` y `src/data.ts`/Supabase.

### 2.3 Panel admin en `/admin`
- **Requisito:** el panel admin (`src/views/Admin.tsx`) debe ser accesible en `/admin` como ruta real, no como hash.
- **Compatibilidad:** si un usuario entra con el hash legado `#admin` (bookmarks existentes), redirigir automáticamente a `/admin`.
- **Criterio de aceptación:** la lógica de auth/rol admin (`supabaseAdmin.auth`, tabla `admin_users`) sigue funcionando igual; solo cambia cómo se llega a la vista.

### 2.4 Ruta no encontrada
- **Requisito:** definir comportamiento para rutas inexistentes (`*`). Recomendado: redirigir a `/` o mostrar un estado simple "Página no encontrada" con CTA para volver a Inicio, sin romper el tono de marca.
- **Criterio de aceptación:** entrar a una URL arbitraria no rompe la app ni muestra una pantalla en blanco.

---

## 3. Componentes a actualizar

### 3.1 `Navbar.tsx`
- **Requisito:** reemplazar `onNavigate(view)` por navegación real (`Link`/`useNavigate` de `react-router-dom`). El estado "activo" del ítem (`isActive`, líneas 60 y 106) debe derivarse de `useLocation()` en vez de comparar contra `currentView`.
- **Criterio de aceptación:** el subrayado/resaltado del ítem activo sigue funcionando igual que hoy, incluido el caso especial de "Catálogo" activo también en la ficha de detalle.

### 3.2 `Footer.tsx` y cualquier otro componente con `onNavigate`
- **Requisito:** actualizar todos los llamados a `onNavigate` (CTAs internos en `Inicio`, `Servicios`, `NuestraHistoria`, `CatalogoDetail`, etc.) para usar `Link`/`useNavigate`.
- **Criterio de aceptación:** ningún botón interno de navegación queda roto tras el cambio.

### 3.3 Scroll y transiciones
- **Requisito:** preservar el comportamiento actual de `window.scrollTo({ top: 0, behavior: 'smooth' })` (`App.tsx:54`) y las animaciones de `AnimatePresence`/`motion` entre vistas (`App.tsx:105-116`), ahora disparadas por cambio de ruta (`useLocation().pathname` como `key`) en vez de `currentView`.
- **Criterio de aceptación:** la transición visual entre vistas se ve igual que antes del cambio.

---

## 4. Infraestructura de despliegue (SPA fallback)

- **Problema:** con rutas reales, refrescar en `/catalogo` o `/admin` requiere que el servidor devuelva `index.html` para cualquier ruta (fallback SPA). Hoy no hay `vercel.json`, `_redirects` ni servidor Express configurado en el repo para esto.
- **Requisito:** agregar la configuración de rewrite correspondiente al hosting real del sitio (pendiente confirmar proveedor: Vercel, Netlify, otro).
- **Criterio de aceptación:** recargar el navegador en cualquier ruta interna (`/catalogo`, `/servicios/`, `/admin`, etc.) carga la app correctamente y no un 404 del servidor.

> ⚠️ **Nota para el agente:** este punto no se puede validar solo con `npm run dev`/`npm run build`; requiere saber dónde se despliega el sitio en producción. Si no se puede confirmar, dejarlo documentado como pendiente explícito antes de mover la spec a `specs_done`.

---

## 5. Fuera de alcance / no tocar

- No introducir precios, direcciones exactas ni mapas en ninguna URL, título de página o breadcrumb (ver reglas de negocio en `AGENTS.md`).
- No cambiar el flujo ni las opciones del botón flotante de WhatsApp.
- No renombrar rutas de categorías del carnaval (`Cumbia`, `Garabato`, `Mapalé`, etc.) — deben viajar tal cual en el query param.

---

## Notas para el agente de implementación
- Priorizar 1.1–1.2 y 2.3 (admin) primero, ya que son la base estructural; 2.1 (query param de categoría) puede ir en un segundo commit dentro de la misma rama.
- Confirmar con el usuario el proveedor de hosting antes de cerrar el punto 4, o dejarlo reportado como excepción según el flujo de specs de `AGENTS.md`.
- Validar manualmente: navegación por click en Navbar/Footer, entrada directa por URL a cada ruta, refresh en cada ruta, y botón atrás/adelante del navegador.
