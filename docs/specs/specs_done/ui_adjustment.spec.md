# Especificación de Requerimientos de Software (ERS)

## Documento de Cambios y Mejoras — Sitio Web

---

## 1. Módulo: Inicio

### RF-1.1 — Visibilidad del texto descriptivo en cards de categorías destacadas
**Descripción:** El texto descriptivo de los cards de categorías destacadas debe permanecer siempre visible, sin depender de estados de hover u otra interacción del usuario.
**Criterios de aceptación:**
- El texto descriptivo es visible por defecto en todos los dispositivos (desktop, tablet, móvil).
- No requiere hover, click ni ninguna acción para mostrarse.

### RF-1.2 — Actualización de icono del botón "Agendar cita por WhatsApp"
**Descripción:** Reemplazar el icono actual del botón "AGENDAR CITA POR WHATSAPP" por un nuevo icono desde https://react-icons.github.io/react-icons/.
**Criterios de aceptación:**
- Se diseña o incorpora un nuevo asset de icono de WhatsApp.
- El botón refleja el nuevo icono en todas las vistas donde aparece.

### RF-1.3 — Navegación filtrada desde categorías destacadas
**Descripción:** Al hacer clic sobre un card de categoría destacada, el sistema debe redirigir a la página de Catálogo aplicando automáticamente el filtro correspondiente a dicha categoría.
**Criterios de aceptación:**
- Se realiza una consulta a Supabase filtrando los productos por la categoría seleccionada.
- La página de Catálogo carga con el filtro de categoría ya aplicado.
- Los resultados mostrados corresponden únicamente a la categoría seleccionada.

---

## 2. Módulo: Catálogo

### RF-2.1 — Consistencia entre tallas y disfraces mostrados
**Descripción:** El filtro/selector de tallas debe reflejar únicamente las tallas disponibles para los disfraces actualmente visibles en el listado.
**Criterios de aceptación:**
- Las tallas mostradas corresponden a los productos filtrados en pantalla.
- No se muestran tallas de productos que no están presentes en el resultado actual.

### RF-2.2 — Actualización de icono del botón "Agendar por WhatsApp"
**Descripción:** Reemplazar el icono actual del botón "Agendar por WhatsApp" por el nuevo icono de WhatsApp definido en RF-1.2.
**Criterios de aceptación:**
- El botón utiliza el mismo asset de icono creado para el módulo de Inicio, manteniendo consistencia visual.

### RF-2.3 — Eliminación del filtro "Solo Disponibles"
**Descripción:** Remover la opción de filtro "Solo Disponibles" de la página de Catálogo.
**Criterios de aceptación:**
- El filtro "Solo Disponibles" ya no aparece en la interfaz.
- El catálogo muestra todos los productos, independientemente de su disponibilidad, salvo que otro filtro lo restrinja.

---

## 3. Módulo: Servicios

### RF-3.1 — Actualización de icono del botón "Agendar cita por WhatsApp"
**Descripción:** Reemplazar el icono actual del botón "AGENDAR CITA POR WHATSAPP" por el nuevo icono de WhatsApp definido en RF-1.2.
**Criterios de aceptación:**
- El botón utiliza el mismo asset de icono creado para los módulos anteriores, manteniendo consistencia visual en todo el sitio.

---

## 4. Módulo: Contacto

### RF-4.1 — Actualización de icono del botón "Chatear por WhatsApp"
**Descripción:** Reemplazar el icono actual del botón "CHATEAR POR WHATSAPP" por el nuevo icono de WhatsApp definido en RF-1.2.
**Criterios de aceptación:**
- El botón utiliza el mismo asset de icono creado para los módulos anteriores, manteniendo consistencia visual en todo el sitio.

---

## 5. Consideraciones Generales
- Todos los botones relacionados con WhatsApp deben usar un único icono estandarizado en todo el sitio.
- Las consultas a Supabase deben optimizarse para filtrar por categoría de forma eficiente.
- Se recomienda validar la experiencia responsiva (mobile-first) en todos los módulos afectados.