# Spec de Modificaciones — Sitio Disfraces Madi

## Instrucciones generales para el agente

- Todos los cambios de texto son reemplazos literales: buscar el texto "Actual" y sustituirlo exactamente por el texto "Nuevo".
- Los cambios de tipo "Ocultar" implican dejar el componente/sección en el código pero no visible en producción (feature flag o comentado), ya que se reactivará más adelante.
- Los cambios de tipo "Eliminar" implican remover la sección por completo.
- Mantener el resto del diseño, estilos y estructura de cada página sin alteraciones, salvo que se indique lo contrario.
- Si algún texto "Actual" no se encuentra exactamente igual en el código (por variaciones de espacios, mayúsculas o versión), aplicar el cambio al texto equivalente más cercano y reportarlo.

---

## 1. Página: Inicio

### 1.1 Texto introductorio
**Actual:**
> Cada danza del Carnaval de Barranquilla cuenta una historia diferente. Escoge la comparsa o tradición en la que deseas lucir imponente.

**Nuevo:**
> Cada danza del Carnaval de Barranquilla cuenta una historia diferente. Escoge la categoría de disfraz en la que deseas lucir imponente.

### 1.2 Categorías destacadas
Dejar únicamente las siguientes categorías destacadas (eliminar cualquier otra que no esté en esta lista):
- Cumbia
- Fantasía
- Mapalé
- Garabato

### 1.3 Tags a eliminar
Quitar los siguientes tags/etiquetas de la página de Inicio:
- Patrimonio
- Brillo
- Fiesta
- Infantil

### 1.4 Título sección "El Corazón de Madi"
**Actual:**
> El Corazón de Madi: Alta Costura para el Patrimonio

**Nuevo:**
> El Corazón de Madi: Diseños que honran al Patrimonio

### 1.5 Título sección "El Brillo de Nuestras Reinas"
**Actual:**
> El Brillo de Nuestras Reinas

**Nuevo:**
> El Brillo de Nuestras Reinas y Reyes

### 1.6 Texto de pasión/diseños
**Actual:**
> La mejor prueba de nuestra pasión es el regocijo de quienes visten nuestros diseños en el bordillo de la Vía 40.

**Nuevo:**
> La mejor prueba de nuestra pasión es el regocijo de quienes visten nuestros diseños en cada evento de Carnaval, desde el Palco hasta el Bordillo.

### 1.7 Sección de Testimonios
**Acción:** Ocultar la sección de Testimonios. Se habilitará en el futuro.

### 1.8 Texto sobre proceso de alquiler
**Actual:**
> Cada traje alquilado pasa por un estricto proceso de tintorería quirúrgica, desinfección y planchado profesional. Ajustamos el vestido a tu talle perfecto con sastrería dedicada incluida en el valor del alquiler.

**Nuevo:**
> Cada traje alquilado pasa por un estricto proceso de lavado y retoque profesional.

### 1.9 Call to action final
**Actual:**
> ¿Listo para brillar en la Vía 40?

**Nuevo:**
> ¿Listo para brillar en tu evento de Carnaval?

---

## 2. Página: Catálogo

### 2.1 Puntuación de estrellas
**Acción:** Ocultar la puntuación de estrellas en las tarjetas de producto. Se habilitará en el futuro.

### 2.2 Texto del buscador
**Actual:**
> Buscar Costume

**Nuevo:**
> Buscar Disfraz

### 2.3 Categorías del filtro
Las categorías disponibles deben ser exactamente:
- Cumbia
- Garabato
- Mapalé
- Marimonda
- Negrita Puloy
- Congo
- Monocuco
- Muerte
- Fantasía

### 2.4 Tallas del filtro
- **Niños:** Talla 4 hasta 16
- **Adultos:** Talla XS hasta XL

---

## 3. Página: Servicios

### 3.1 Puntuación de estrellas
**Acción:** Ocultar la puntuación de estrellas. Se habilitará en el futuro.

### 3.2 Texto del buscador
**Actual:**
> Buscar Costume

**Nuevo:**
> Buscar Disfraz

### 3.3 Sección a eliminar
**Acción:** Eliminar por completo la sección "Desinfección Hipoalergénica con Vapor Seco".

---

## 4. Página: Nuestra Historia

### 4.1 Puntuación de estrellas
**Acción:** Ocultar la puntuación de estrellas. Se habilitará en el futuro.

### 4.2 Título principal
**Actual:**
> La Sra. Madi y su Legado

**Nuevo:**
> La Sra. Madi: Nuestra Alma

### 4.3 Subtítulo/bajada
**Actual:**
> Una historia tejida con hilos de oro, lentejuelas, y la pasión inquebrantable de tres generaciones dedicadas a vestir los corazones del Carnaval de Barranquilla.

**Nuevo:**
> Más que un taller, somos el latido de una tradición que se viste de gala en cada Batalla de Flores.

### 4.4 Año de fundación
**Actual:**
> DESDE 1991 EN BARRANQUILLA

**Nuevo:**
> DESDE 2012 EN BARRANQUILLA

### 4.5 Título sección de raíces
**Actual:**
> Nuestras Raíces: De Barrio Abajo al Alto Prado

**Nuevo:**
> Herencia de Carnaval

### 4.6 Texto largo de historia
**Actual:**
> Sra. Madi creció mecida por los acordes de la flauta de millo y las risas de las tejedoras en los patios de Barrio Abajo. Desde pequeña, observaba con fascinación cómo las abuelas transformaban retazos de algodón rústico en las majestuosas polleras que inundaban las calles cada febrero.
>
> En 1991, convencida de que el patrimonio de Barranquilla merecía ser vestido con la suntuosidad de la alta costura europea pero sin perder el sudor y el gozo de la calle, adquirió su primera máquina de coser Singer manual. Así nació el Taller Madi.
>
> Con el paso de los años, lo que inició como un servicio íntimo de costura familiar se convirtió en el punto de encuentro obligatorio de Reinas de comparsas, bailarines dedicados y embajadores culturales de Colombia en el extranjero. Hoy, Disfraces Madi combina esa tradición intacta con una infraestructura moderna de lavado clínico, sastrería express y reservas virtuales.

**Nuevo:**
> El nombre Madi es un homenaje a Margarita, nuestra fundadora y madre de Diana. Desde niña, Diana vivió el carnaval en carne propia: fue bailarina y reina en incontables eventos de folclor, siempre acompañada por Margarita y toda la familia, quienes la apoyaron en cada paso.
>
> Hoy, cada diseño que nace de Disfraces Madi lleva ese sello familiar: raíces profundamente barranquilleras, vestidas con una mirada moderna. No copiamos el folclor, lo reinventamos — con respeto, con memoria y con corazón.
>
> Por eso, cuando alquilas con nosotras, no solo llevas un disfraz. Llevas una historia de familia, de tradición y de cariño hecho diseño.

### 4.7 Encabezado "Atelier"
**Actual:**
> Atelier de Alta Costura Madi
> Sede Alto Prado, Barranquilla

**Nuevo:**
> Alquiler de Disfraces Madi
> en Barranquilla

### 4.8 Título sección de valores
**Actual:**
> Los Hilos que Guían Nuestra Aguja

**Nuevo:**
> Los Hilos que Guían Nuestro Diseño

---

## 5. Página: Contacto

### 5.1 Nombre del taller
**Actual:**
> Atelier Madi

**Nuevo:**
> Disfraces Madi

### 5.2 Sección a eliminar
**Acción:** Eliminar por completo la sección "Medidas Sanitarias".

---

## Notas de la redacción

Al pasar las notas originales a esta spec corregí algunos detalles menores para que el agente no los replique por error:
- "categoria di disfraz" → "categoría de disfraz" (tilde y preposición correcta).
- "Costume" → se mantiene como estaba, ya que es el texto "Actual" a buscar (probablemente un error de origen en el sitio, no de la nota).
- "Mapale" → "Mapalé" (con tilde, en categorías destacadas y de catálogo).
- "evenrto" → "evento".
- "Difraces" → "Disfraces" (en el encabezado del Atelier).
- "Alquiler de Difraces Madi en Barranquilla" quedó en dos líneas, igual que el original que reemplaza.

Si alguno de estos textos "Actual" con errores (p. ej. "Costume") sí existe literalmente así en el código del sitio, indícamelo y ajusto la spec para que la búsqueda sea exacta.
