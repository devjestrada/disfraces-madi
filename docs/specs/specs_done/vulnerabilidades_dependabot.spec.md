# SPEC — Remediación de vulnerabilidades reportadas por Dependabot

## Contexto y alcance

GitHub Dependabot reporta actualmente **3 alertas abiertas** en el repositorio (`gh api repos/devjestrada/disfraces-madi/dependabot/alerts`), todas sobre dependencias **transitivas/indirectas** (no aparecen como entradas directas en `package.json`, solo en `package-lock.json` como sub-dependencias de paquetes que sí usamos). Las tres tienen parche disponible ya publicado en npm y, verificado contra los rangos semver declarados por los paquetes padre, se resuelven con una simple actualización del lockfile (`npm update`), **sin tocar `package.json` ni requerir `overrides`**.

Diagnóstico de aplicabilidad real (no solo "hay una alerta", sino si el código del proyecto queda expuesto):

| # | Paquete | Alerta | Severidad | Vía | ¿Aplica al proyecto? |
|---|---|---|---|---|---|
| 1 | `nanoid` | [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) (CVE-2026-67213) | High | dependencia de `postcss` (`^3.3.12`) | Bajo impacto directo: `nanoid` no se usa en `src/` (`grep` sin resultados); el DoS requiere invocar `customAlphabet`/`customRandom` con `size: 0` controlado por atacante, algo que ni el proyecto ni `postcss` hacen. Se corrige igual por higiene de cadena de suministro. |
| 2 | `postcss` | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) (CVE-2026-69153) | Medium | dependencia de `autoprefixer` (build) y `vite` (build) | Solo se usa en build-time (Tailwind/autoprefixer vía Vite) sobre nuestro propio CSS, nunca procesa CSS de terceros/usuarios ni se expone `result.map` a un cliente externo. Sin exposición real, pero se corrige por higiene. |
| 3 | `react-router` | [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) | High | dependencia exacta de `react-router-dom` (`7.18.1`) | La nota de la advisory indica que **solo afecta a quien usa las APIs `unstable_RSC`**; el proyecto usa `react-router-dom` en modo SPA estándar (`grep unstable_` sin resultados en `src/`). Sin exposición real, pero se corrige por higiene y porque el parche no introduce breaking changes (mismo minor `7.18.x`). |

Ninguna de las tres alertas tiene explotabilidad demostrable en el código actual del sitio, pero las tres se cierran en esta spec por buena práctica de cadena de suministro y porque Dependabot las seguirá reportando como abiertas hasta que el lockfile se actualice.

Instrucciones generales para el agente que implemente esta spec:
- Cambio puramente de dependencias (lockfile). No debe alterar `DESIGN.md`, copy, reglas de negocio de `AGENTS.md` ni ningún archivo de `src/`.
- No usar `npm audit fix --force` (puede forzar majors no deseados, ej. saltar `react-router-dom` a 8.x o `express` a 5.x); usar los comandos puntuales indicados abajo.

---

## 1. `nanoid` — actualizar a `>=3.3.18`

- **Actual:** `package-lock.json` resuelve `nanoid@3.3.16` (dependencia transitiva de `postcss@8.5.18`, que declara `"nanoid": "^3.3.12"`).
- **Requisito:** ejecutar `npm update nanoid` (o `npm update postcss nanoid` junto con el punto 2, ya que van de la mano) para que el lockfile resuelva `nanoid@3.3.18` o superior, versión ya cubierta por el rango `^3.3.12` que declara `postcss`, sin necesidad de tocar `package.json`.
- **Criterio de aceptación:** `npm ls nanoid` muestra `3.3.18` o superior; la alerta Dependabot `#5` (GHSA-2v37-7h3g-55p8) pasa a estado resuelto tras el push.

## 2. `postcss` — actualizar a `>=8.5.23`

- **Actual:** `package-lock.json` resuelve `postcss@8.5.18` (dependencia transitiva de `autoprefixer@10.5.2` y de `vite@6.4.3`, ambos con rangos que ya permiten versiones parcheadas: `vite` declara `"postcss": "^8.5.3"`).
- **Requisito:** ejecutar `npm update postcss` para que el lockfile resuelva `postcss@8.5.26` (última disponible en el momento de redactar esta spec, o la más reciente `8.5.x`/`8.x` al momento de implementar), sin tocar `package.json`.
- **Criterio de aceptación:** `npm ls postcss` muestra `8.5.23` o superior en todas las rutas (`autoprefixer` y `vite`); la alerta Dependabot `#4` (GHSA-fxqj-rqcc-2cmp) pasa a estado resuelto tras el push.

## 3. `react-router` — actualizar `react-router-dom` a `7.18.2`

- **Actual:** `package.json` declara `"react-router-dom": "^7.18.1"`, y el lockfile resuelve exactamente `react-router-dom@7.18.1` + `react-router@7.18.1` (versión vulnerable más reciente de la serie 7.x; `react-router-dom` fija su dependencia interna de `react-router` a la misma versión exacta, no a un rango).
- **Requisito:** ejecutar `npm update react-router-dom` para que el lockfile resuelva `react-router-dom@7.18.2` (y con ello `react-router@7.18.2`), versión ya cubierta por el rango `^7.18.1` que ya tiene `package.json` — no requiere editar `package.json` ni implica breaking changes (mismo minor). **No** saltar a `react-router-dom@8.x`: es un major distinto, fuera del alcance de esta spec de seguridad, y el fix ya está disponible en la serie 7.x que usa el proyecto.
- **Criterio de aceptación:** `npm ls react-router-dom react-router` muestra `7.18.2` en ambos; `npm run build` y `npm run lint` pasan sin errores; navegación del sitio (rutas públicas y `/admin`) probada manualmente sin regresiones; la alerta Dependabot `#2` (GHSA-qwww-vcr4-c8h2) pasa a estado resuelto tras el push.

---

## 4. Validación general post-actualización

- **Requisito:** tras aplicar los tres `npm update`, correr `npm run lint` (`tsc --noEmit`) y `npm run build` para confirmar que no se rompió la compilación por el bump de versiones.
- **Requisito:** confirmar con `gh api repos/devjestrada/disfraces-madi/dependabot/alerts --paginate` (o la pestaña *Security → Dependabot* del repo) que las alertas `#2`, `#4` y `#5` pasan a `state: fixed` una vez el `package-lock.json` actualizado esté en la rama principal (Dependabot re-escanea automáticamente al hacer push/merge).
- **Nota de proceso:** este cambio no modifica ninguna regla de negocio ni UI, por lo que el checklist de `AGENTS.md` sección 3 (precios, WhatsApp, tono, mapas) no aplica; se deja constancia aquí de que fue revisado y no aplica, en vez de omitirlo.

---

## 5. Checklist de validación específico de esta spec

- [ ] `nanoid` resuelto en `>=3.3.18` en `package-lock.json` (sección 1).
- [ ] `postcss` resuelto en `>=8.5.23` en `package-lock.json` (sección 2).
- [ ] `react-router-dom` y `react-router` resueltos en `7.18.2` en `package-lock.json`, sin cambiar `package.json` (sección 3).
- [ ] `npm run lint` y `npm run build` pasan sin errores tras las actualizaciones (sección 4).
- [ ] Las 3 alertas de Dependabot (`#2`, `#4`, `#5`) verificadas como `fixed` tras el push a la rama principal (sección 4).
- [ ] No se modificó código de `src/`, `DESIGN.md` ni reglas de negocio de `AGENTS.md` — cambio acotado a `package-lock.json`.
