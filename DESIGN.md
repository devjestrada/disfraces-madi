# Disfraces Madi — Especificación de marca

Documento de referencia técnica: paleta cromática, jerarquía tipográfica y especificación de iconografía.

---

## 1. Paleta cromática

### 1.1 Colores core

| Token | Nombre | HEX | RGB | HSL | Uso principal |
|---|---|---|---|---|---|
| `--color-primary` | Rojo Madi | `#A8001A` | 168, 0, 26 | 351°, 100%, 33% | Marca, CTA primario, acentos de alta jerarquía |
| `--color-secondary` | Oro Tradición | `#FDC003` | 253, 192, 3 | 45°, 98%, 50% | Acentos, badges, hover de CTA, destacados promocionales |
| `--color-canvas` | Lienzo Cálido | `#FFF8F5` | 255, 248, 245 | 18°, 100%, 98% | Fondo base de la interfaz (light mode) |

### 1.2 Tintas y sombras derivadas

Generadas por interpolación lineal (tint = mezcla con blanco; shade = mezcla con negro), en incrementos de 20%.

**Rojo Madi**
| Variante | HEX |
|---|---|
| Shade 40% | `#65000F` |
| Shade 20% | `#860015` |
| Base | `#A8001A` |
| Tint 20% | `#B93348` |
| Tint 40% | `#CB6676` |

**Oro Tradición**
| Variante | HEX |
|---|---|
| Shade 40% | `#987302` |
| Shade 20% | `#CA9A02` |
| Base | `#FDC003` |
| Tint 20% | `#FDCD35` |
| Tint 40% | `#FED968` |

### 1.3 Neutro funcional (no core, uso complementario)

La paleta de marca son estrictamente los 3 colores anteriores. Para texto legible sobre `Lienzo Cálido` se recomienda un neutro funcional (no forma parte del branding, solo utilidad de UI):

| Token | Nombre | HEX | Uso |
|---|---|---|---|
| `--color-ink` | Tinta funcional | `#1A1418` | Texto primario sobre fondos claros |
| `--color-ink-muted` | Tinta secundaria | `#5C5257` | Texto secundario, metadatos |

### 1.4 Contraste (WCAG 2.1)

| Combinación | Ratio | Nivel |
|---|---|---|
| Rojo Madi sobre Lienzo Cálido | 8.9:1 | AAA (texto normal y grande) |
| Oro Tradición sobre Tinta funcional | 8.1:1 | AAA |
| Oro Tradición sobre Lienzo Cálido | 1.6:1 | Falla — no usar oro como texto sobre lienzo; usar solo como superficie/badge con texto en Tinta funcional |
| Lienzo Cálido sobre Rojo Madi | 8.9:1 | AAA — válido para texto sobre botones primarios |

### 1.5 Reparto recomendado (regla 60/30/10)

- 60% — Lienzo Cálido (fondos, superficies)
- 30% — Tinta funcional / Rojo Madi (texto, estructura, navegación)
- 10% — Oro Tradición (acentos puntuales: badges, iconografía destacada, hover states)

---

## 2. Jerarquía tipográfica

### 2.1 Roles por familia

| Familia | Rol | Clasificación |
|---|---|---|
| Playfair Display | Titulares, identidad editorial, momentos de marca | Serif display |
| Inter | Interfaz, cuerpo de texto, formularios, botones | Sans UI |
| JetBrains Mono | Códigos de reserva, precios, fechas/horas, SKU de inventario | Monoespaciada |

### 2.2 Escala — Playfair Display

| Nivel | Tamaño | Line-height | Peso | Uso |
|---|---|---|---|---|
| Display | 56px | 1.1 | 700 | Hero de landing |
| H1 | 48px | 1.15 | 700 | Título de página |
| H2 | 36px | 1.2 | 600 | Sección principal |
| H3 | 28px | 1.25 | 600 | Subsección |
| H4 | 22px | 1.3 | 600 | Título de tarjeta/producto |

### 2.3 Escala — Inter

| Nivel | Tamaño | Line-height | Peso | Uso |
|---|---|---|---|---|
| Body L | 18px | 1.7 | 400 | Descripciones de producto |
| Body | 16px | 1.7 | 400 | Texto general |
| Body S | 14px | 1.6 | 400 | Texto secundario, ayudas de formulario |
| Caption | 12px | 1.5 | 500 | Etiquetas, metadatos, timestamps |
| Botón | 14–16px | 1.4 | 500 | CTA, controles interactivos |
| Nav | 14px | 1.4 | 500 | Menú de navegación |

### 2.4 Escala — JetBrains Mono

| Nivel | Tamaño | Peso | Letter-spacing | Uso |
|---|---|---|---|---|
| Código de reserva | 14px | 500 | 0.5px | Ej. `MADI-2026-0148` |
| Precio | 16–20px | 500 | 0px | Tarifas de alquiler, totales |
| Fecha/hora | 13px | 400 | 0.3px | Fechas de recogida/devolución |
| SKU inventario | 12px | 400 | 0.5px | Backoffice, panel de administración |

---

## 3. Voz y tono de marca

### 3.1 Personalidad de marca

Disfraces Madi habla como una vecina experta del Carnaval de Barranquilla: cercana, festiva y confiable. No es una marca corporativa ni distante — es la persona a la que le preguntas "¿y si me queda muy grande el disfraz de Marimonda?" y te responde con calidez y con experiencia real de calle.

| Rasgo | Es | No es |
|---|---|---|
| Festiva | Alegre, con energía de carnaval, celebra el detalle | Payasesca, exagerada al punto de restar seriedad al servicio |
| Cercana | Habla de tú/vos, cálida, usa el nombre del cliente cuando aplica | Informal al punto de perder profesionalismo (sin groserías, sin exceso de diminutivos) |
| Experta | Segura al hablar de tallas, materiales, tradición del disfraz | Condescendiente o técnica en exceso |
| Local / orgullosa | Reivindica el Carnaval de Barranquilla como patrimonio propio | Genérica o "folclor de postal" sin autenticidad |

### 3.2 Tono según contexto

El tono se ajusta según el momento del viaje del cliente; la personalidad de marca se mantiene constante.

| Contexto | Tono | Ejemplo |
|---|---|---|
| Landing / campañas | Festivo, invitante, con ritmo | "Este año no te quedas sin disfraz. Aparta el tuyo antes de que se acabe." |
| Ficha de producto | Cercano, descriptivo, útil | "Este traje de Garabato incluye sombrero y bastón. Ideal para quien quiere destacar sin cargar de más." |
| Confirmación de reserva | Cálido, tranquilizador, claro | "Listo, tu disfraz está apartado. Te esperamos el 14 de febrero para la entrega." |
| Soporte / reclamos | Empático primero, solución después, sin excusas largas | "Entiendo la molestia con la talla. Vamos a resolverlo hoy mismo, sin costo adicional." |
| Errores del sistema | Directo, humano, sin tecnicismos | "Algo no cargó bien. Intenta de nuevo o escríbenos, con gusto te ayudamos." |
| Redes sociales | Festivo, coloquial, con guiños locales | Uso de expresiones barranquilleras auténticas, sin caer en cliché |

### 3.3 Principios de escritura (voice writing guidelines)

- Frases cortas y directas; el ritmo de la escritura imita el ritmo del carnaval, no de un manual corporativo.
- Se usa "tú" o "vos" de forma consistente en todo el copy (definir uno solo y mantenerlo en toda la plataforma, no mezclar).
- Los términos propios del Carnaval de Barranquilla (Marimonda, Garabato, Congo, Torito, Monocuco, etc.) se usan con naturalidad, sin explicarlos como si fueran ajenos a la audiencia local; se ofrece contexto solo en contenido dirigido a visitantes de fuera de la región.
- Nunca ironía o sarcasmo hacia el cliente, ni en tono de soporte ni en errores.
- Los números y datos duros (precios, fechas, tallas) se comunican siempre en `JetBrains Mono` y con precisión — el tono festivo no debe restar claridad a la información transaccional.
- Emojis: uso opcional y moderado solo en redes sociales; no se usan en transaccionales (confirmaciones, correos de reserva, soporte).

### 3.4 Léxico — qué decir y qué evitar

| En vez de | Decir |
|---|---|
| "Producto" | "Disfraz" o el nombre propio del traje |
| "Usuario" | "Cliente" o su nombre |
| "Error en la transacción" | "Algo no salió bien con el pago" |
| "Realizar el pago" | "Pagar" o "Completar tu reserva" |
| "Política de devolución" | "Cómo funciona la devolución" |

---

## 4. Especificación de iconografía

### 4.1 Iconos de sistema (Lucide)

Todos los iconos Lucide usan `stroke` (no `fill`) por defecto, con `stroke-width` configurable.

| Icono (Lucide) | Uso en la app | Tamaño | Color por defecto | Stroke-width | Micro-interacción |
|---|---|---|---|---|---|
| `Calendar` | Selección de fechas de alquiler | 20px | `--color-ink` | 1.75 | Al hover: color pasa a `--color-primary`, 150ms ease |
| `ShoppingBag` | Carrito de reserva | 24px | `--color-ink` | 1.75 | Badge contador en `--color-secondary`; bounce de 200ms al agregar ítem |
| `Heart` | Guardar disfraz favorito | 20px | `--color-ink-muted` | 1.75 | Al activar: `fill` pasa a `--color-primary`, stroke a `--color-primary`, scale 1→1.15→1 en 250ms |
| `Search` | Buscador de catálogo | 20px | `--color-ink-muted` | 1.75 | Al focus del input: color a `--color-ink` |
| `MapPin` | Ubicación de tienda/entrega | 18px | `--color-primary` | 1.75 | Sin animación; estático |
| `Truck` | Estado de entrega/logística | 20px | `--color-ink` | 1.75 | Al estado "en camino": color a `--color-secondary` con pulso de opacidad 2s loop |
| `ShieldCheck` | Garantía / disfraz verificado | 18px | `--color-primary` | 2 | Ninguna |
| `Star` | Calificaciones | 16px | `--color-secondary` (fill) | — (fill sólido) | Ninguna, solo lectura |
| `Clock` | Duración del alquiler | 16px | `--color-ink-muted` | 1.75 | Ninguna |
| `User` | Perfil / cuenta | 22px | `--color-ink` | 1.75 | Al hover: fondo circular `--color-canvas` shade, transición 150ms |
| `Menu` | Navegación móvil | 24px | `--color-ink` | 1.75 | Transforma a `X` en 200ms al abrir menú |
| `X` | Cerrar modal/panel | 20px | `--color-ink-muted` | 1.75 | Al hover: color a `--color-primary`, rotate 90deg en 150ms |
| `Check` | Confirmación de acción | 18px | `--color-secondary`, fondo circular `--color-primary` | 2.5 | Scale-in 0→1 en 200ms al confirmarse |
| `PartyPopper` | Confirmación de reserva exitosa | 28px | `--color-secondary` | 1.75 | Scale-in con leve rotación (-8° a 0°) en 300ms |
| `Shirt` | Categoría "disfraces" en catálogo | 20px | `--color-ink` | 1.75 | Al seleccionar categoría: color a `--color-primary` |

### 4.2 Iconos de marca (SVG custom)

Iconos propios, no disponibles en Lucide, dibujados como SVG a medida para mantener la identidad carnavalera.

| Icono | ViewBox | Tamaño de render | Color por defecto | Stroke/Fill | Micro-interacción |
|---|---|---|---|---|---|
| Máscara (isotipo de marca) | `0 0 64 64` | 32px / 48px (favicon: 16px, 32px) | Fondo `#2B2138` (tono neutro de marca), ojos `--color-canvas` | Fill sólido | Estático; usado como marca de agua o favicon |
| Pluma decorativa | `0 0 32 96` | 24px / 40px | `--color-secondary`, quill en `--color-primary` | Fill + stroke 1.5px en el cañón | Al hover en tarjetas de producto destacado: rotate 3° + translateY(-2px), 200ms ease-out |
| Tambor de carnaval | `0 0 48 48` | 28px | Cuerpo `--color-primary`, aros `--color-secondary` | Fill sólido con stroke 1px | Ninguna; uso decorativo en sección "sobre nosotros" |
| Confeti (patrón) | `0 0 120 120` | Variable (background pattern) | Mezcla `--color-primary` / `--color-secondary` al 12% de opacidad | Fill sólido, patrón repetido | Estático, solo decorativo de fondo |

### 4.3 Reglas generales de uso de iconos

- Tamaño mínimo interactivo (área de toque): 40×40px, aunque el glifo visual sea de 20–24px.
- Nunca combinar `stroke-width` distinto dentro de un mismo grupo de iconos visible simultáneamente (ej. una barra de navegación).
- Iconos de estado (éxito, error, advertencia) heredan color semántico, no la paleta de marca: éxito en verde estándar, error en rojo estándar del sistema — **no** reutilizar `Rojo Madi` para errores, ya que se confundiría con la identidad de marca.
- Todas las micro-interacciones usan `ease-out` para entradas y `ease-in` para salidas, con duración entre 150–300ms; nunca superar 300ms para no percibirse lento.

---
