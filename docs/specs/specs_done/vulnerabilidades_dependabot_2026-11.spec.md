# SPEC — Remediación de vulnerabilidades reportadas por Dependabot (segunda ronda)

## Contexto y alcance

GitHub Dependabot reporta **16 alertas abiertas** en el repositorio. Las 16 corresponden a 8 paquetes, todos **transitivos/indirectos** salvo `sharp` y `vite` (dependencias directas), y las 16 tienen parche disponible dentro de los rangos semver ya declarados en `package.json` — se resuelven con `npm update`, **sin tocar `package.json` ni requerir `overrides`**, igual que en la spec precedente (`docs/specs/specs_done/vulnerabilidades_dependabot.spec.md`).

Diagnóstico de aplicabilidad real, verificado contra el código (no solo "hay una alerta"):

| # | Paquete(s) | Alertas | Severidad | Vía | ¿Aplica al proyecto? |
|---|---|---|---|---|---|
| 1 | `body-parser`, `proxy-addr`, `qs` (×3) | [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828), [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h), [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx), [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g), [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) | High / **Critical** / Moderate ×3 | dependencias de `express` (`^4.21.2`) | **Sin exposición.** `express` está declarado como dependencia auxiliar pero no está cableado en `src/` ni en ningún servidor en producción (confirmado: `README.md` línea 175, cero imports de `express` en el código). Se corrige igual por higiene de cadena de suministro. |
| 2 | `browserslist` (×2), `baseline-browser-mapping` | [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx), [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g), [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) | High / High / Moderate | dependencia de `autoprefixer` (`^10.4.21`) y Babel (build) | **Sin exposición.** Solo se usa en build-time sobre nuestro propio CSS/config, nunca procesa input de terceros. |
| 3 | `source-map-js` | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | High | dependencia de `postcss`/`@tailwindcss/node` (build) | **Sin exposición.** Mismo caso que el punto 2. |
| 4 | `sharp` | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) (libheif), [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) (librsvg) | High / High | dependencia directa (`^0.35.3`) | **Baja exposición.** Se usa solo en `scripts/optimize-existing-images.ts`, un script manual de un solo uso (`npm run optimize-images`), nunca automático, que procesa únicamente imágenes que el propio negocio ya subió a su Supabase Storage — no contenido de terceros sin confianza. |
| 5 | `vite` (×5) | [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv), [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw), [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm), [GHSA-9jrq-w75r-8gcw](https://github.com/advisories/GHSA-9jrq-w75r-8gcw), [GHSA-rq7h-c2jc-7f22](https://github.com/advisories/GHSA-rq7h-c2jc-7f22) | Moderate ×2 / High / Low / Moderate | dependencia directa (`^6.2.3`), servidor de desarrollo | **Exposición moderada.** `npm run dev` corre con `--host=0.0.0.0` (`package.json`), por lo que el dev server queda expuesto a toda la red local mientras se trabaja, no solo a `localhost`. Ninguna afecta el build de producción (son del dev server). Se corrige por higiene y porque hay exposición real, aunque acotada a la ventana de `npm run dev`. |

Ninguna de las 16 alertas tiene explotabilidad demostrable crítica en el código actual del sitio (la de mayor exposición real es el grupo de `vite`, acotado al dev server en red local), pero las 16 se cierran en esta spec por buena práctica de cadena de suministro y porque Dependabot las seguirá reportando como abiertas hasta que el lockfile se actualice.

Instrucciones generales para el agente que implemente esta spec:
- Cambio puramente de dependencias (lockfile). No debe alterar `DESIGN.md`, copy, reglas de negocio de `AGENTS.md` ni ningún archivo de `src/`.
- No usar `npm audit fix --force` (puede forzar majors no deseados, ej. saltar `express` a 5.x, `sharp` a 1.x o `vite` a 7.x); usar los comandos puntuales indicados abajo.

---

## 1. `express` — actualizar a `4.22.3`

- **Actual:** `package-lock.json` resuelve `express@4.22.2`, que fija internamente `body-parser: ~1.20.5` (resuelve a `1.20.6`, vulnerable), `proxy-addr: ~2.0.7` (resuelve a `2.0.7`, vulnerable) y `qs: ~6.15.1` (resuelve a `6.15.3`, vulnerable).
- **Requisito:** ejecutar `npm update express`. La versión `4.22.3` (dentro del rango `^4.21.2` ya declarado) actualiza sus pines internos a `body-parser: ~1.20.5` → resuelve `1.20.9`+, `proxy-addr: ~2.0.7` → resuelve `2.0.8`, y `qs: ~6.16.0` → resuelve `6.16.x` parchado. Esto cierra las 5 alertas del grupo 1 de una sola vez.
- **Criterio de aceptación:** `npm ls body-parser proxy-addr qs` muestra `body-parser@>=1.20.9`, `proxy-addr@2.0.8`, `qs@>=6.16.1` (la versión `6.16.0` exacta sigue dentro del rango vulnerable de un tercer advisory — debe resolver por encima).

## 2. `browserslist` — actualizar a `>=4.28.7`

- **Actual:** `package-lock.json` resuelve `browserslist@4.28.6` (dependencia de `autoprefixer@10.5.2`, que declara `"browserslist": "^4.28.4"`, y de `@babel/helper-compilation-targets`, que declara `"browserslist": "^4.24.0"`), y `baseline-browser-mapping@2.10.43` (dependencia de `browserslist`, que declara `^2.11.33` en versiones más nuevas).
- **Requisito:** ejecutar `npm update browserslist`. Resuelve a la última `4.29.x`, dentro de ambos rangos ya declarados por sus padres, y arrastra `baseline-browser-mapping` a `2.11.x`+ (fix para las 3 alertas del grupo 2).
- **Criterio de aceptación:** `npm ls browserslist baseline-browser-mapping` muestra `browserslist@>=4.28.7` y `baseline-browser-mapping@>=2.11.0`.

## 3. `source-map-js` — actualizar a `1.2.2`

- **Actual:** `package-lock.json` resuelve `source-map-js@1.2.1` (dependencia de `postcss@8.5.26` y `@tailwindcss/node@4.3.2`, ambos con rango `^1.2.1`).
- **Requisito:** ejecutar `npm update source-map-js`. Resuelve a `1.2.2`, dentro del rango ya declarado por ambos padres.
- **Criterio de aceptación:** `npm ls source-map-js` muestra `1.2.2` en todas las rutas.

## 4. `sharp` — actualizar a `0.35.5`

- **Actual:** `package.json` declara `"sharp": "^0.35.3"`; el lockfile resuelve `0.35.3`.
- **Requisito:** ejecutar `npm update sharp`. Resuelve a `0.35.5`, dentro del rango `^0.35.3` ya declarado — no requiere editar `package.json`.
- **Criterio de aceptación:** `npm ls sharp` muestra `0.35.5`.

## 5. `vite` — actualizar a `6.4.6`

- **Actual:** `package.json` declara `"vite": "^6.2.3"`; el lockfile resuelve `6.4.3`.
- **Requisito:** ejecutar `npm update vite`. Resuelve a `6.4.6`, dentro del rango `^6.2.3` ya declarado — no requiere editar `package.json`. Cierra las 5 alertas del grupo 5.
- **Criterio de aceptación:** `npm ls vite` muestra `6.4.6`.

---

## 6. Validación general post-actualización

- **Requisito:** tras aplicar los 5 `npm update`, correr `npm run lint` (`tsc --noEmit`) y `npm run build` para confirmar que no se rompió la compilación por el bump de versiones.
- **Requisito:** correr `npm audit --json` y confirmar que ninguna de las 16 alertas originales queda abierta (0 vulnerabilidades reportadas, o documentar cualquier remanente y por qué).
- **Nota de proceso:** este cambio no modifica ninguna regla de negocio ni UI, por lo que el checklist de `AGENTS.md` sección 3 (precios, WhatsApp, tono, mapas) no aplica; se deja constancia aquí de que fue revisado y no aplica, en vez de omitirlo.

---

## 7. Checklist de validación específico de esta spec

- [ ] `express` resuelto en `>=4.22.3`, con `body-parser>=1.20.9`, `proxy-addr@2.0.8`, `qs>=6.16.1` en `package-lock.json` (sección 1).
- [ ] `browserslist` resuelto en `>=4.28.7` y `baseline-browser-mapping` en `>=2.11.0` en `package-lock.json` (sección 2).
- [ ] `source-map-js` resuelto en `1.2.2` en `package-lock.json` (sección 3).
- [ ] `sharp` resuelto en `0.35.5` en `package-lock.json`, sin cambiar `package.json` (sección 4).
- [ ] `vite` resuelto en `6.4.6` en `package-lock.json`, sin cambiar `package.json` (sección 5).
- [ ] `npm run lint` y `npm run build` pasan sin errores tras las actualizaciones (sección 6).
- [ ] `npm audit` confirma 0 vulnerabilidades abiertas de las 16 originales (sección 6).
- [ ] No se modificó código de `src/`, `DESIGN.md` ni reglas de negocio de `AGENTS.md` — cambio acotado a `package-lock.json`.
