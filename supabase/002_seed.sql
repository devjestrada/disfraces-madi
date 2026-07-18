-- Seed data for Disfraces Madi

-- Categories
insert into categories (id, name, slug, sort_order)
values
  ('00000000-0000-0000-0000-000000000001', 'Cumbia', 'cumbia', 1),
  ('00000000-0000-0000-0000-000000000002', 'Fantasía', 'fantasia', 2),
  ('00000000-0000-0000-0000-000000000003', 'Marimonda', 'marimonda', 3),
  ('00000000-0000-0000-0000-000000000004', 'Garabato', 'garabato', 4),
  ('00000000-0000-0000-0000-000000000005', 'Congo', 'congo', 5),
  ('00000000-0000-0000-0000-000000000006', 'Muerte', 'muerte', 6),
  ('00000000-0000-0000-0000-000000000017', 'Joselito Carnavalero', 'joselito-carnavalero', 7);

-- Designers
insert into designers (id, name)
values
  ('00000000-0000-0000-0000-000000000011', 'Sra. Madi (Alta Costura)'),
  ('00000000-0000-0000-0000-000000000012', 'Disfraces Madi'),
  ('00000000-0000-0000-0000-000000000013', 'Tradición Madi'),
  ('00000000-0000-0000-0000-000000000014', 'Sra. Madi (Bordados Ancestrales)'),
  ('00000000-0000-0000-0000-000000000015', 'Diseño de Fantasía Madi'),
  ('00000000-0000-0000-0000-000000000016', 'Artesanos de la Tradición Atlántico'),
  ('00000000-0000-0000-0000-000000000017', 'Sra. Madi y Atelier');

-- Costumes
insert into costumes (id, slug, name, category_id, description, designer_id, rental_price, sale_price, deposit_price, is_available, featured, rating, reviews_count)
values
  ('00000000-0000-0000-0000-000000000101', 'gala-cumbia-real', 'Gala de Cumbia Real', '00000000-0000-0000-0000-000000000001', 'Nuestra obra maestra. Una pollera de cumbia de gama alta, elaborada con encajes de bolillo importados, finas arandelas de encaje y adornos dorados hechos a mano. Diseñada para lucir imponente en desfiles, coronaciones y eventos de gala.', '00000000-0000-0000-0000-000000000011', 280000, 1200000, 300000, true, true, 4.9, 38),
  ('00000000-0000-0000-0000-000000000102', 'marimonda-barrio-abajo', 'Marimonda de Barrio Abajo', '00000000-0000-0000-0000-000000000003', 'El disfraz más alegre, irreverente y tradicional del Carnaval de Barranquilla. Diseñado en retazos de colores sumamente llamativos y vibrantes. Incluye la clásica máscara con nariz larga y orejas gigantes que encarnan la burla y el gozo barranquillero.', '00000000-0000-0000-0000-000000000012', 140000, 480000, 150000, true, true, 4.8, 45),
  ('00000000-0000-0000-0000-000000000103', 'pollera-cumbia-tradicional', 'Pollera de Cumbia Tradicional', '00000000-0000-0000-0000-000000000001', 'La pollera clásica a cuadros rojos y blancos que identifica al folclor colombiano. Sencilla pero imponente, confeccionada con tules que le otorgan volumen natural y ligereza. Perfecta para bailadoras y cumbiambas completas.', '00000000-0000-0000-0000-000000000013', 160000, 550000, 180000, true, false, 4.7, 24),
  ('00000000-0000-0000-0000-000000000104', 'garabato-elegancia', 'Garabato Elegancia', '00000000-0000-0000-0000-000000000004', 'La indumentaria de la Danza del Garabato que escenifica la lucha entre la vida y la muerte. Chaleco negro suntuosamente bordado con hilos de oro y lentejuelas, pantalón bombacho amarillo y capa roja señorial con cintas multicolor.', '00000000-0000-0000-0000-000000000014', 210000, 850000, 220000, true, true, 4.9, 19),
  ('00000000-0000-0000-0000-000000000105', 'guacamaya-carnavalera', 'Guacamaya de Fantasía', '00000000-0000-0000-0000-000000000002', 'Un traje espectacular inspirado en la fauna del Caribe colombiano. Confeccionado en una paleta de colores arcoíris con plumas sintéticas de alta calidad dispuestas en degradé, lentejuelas brillantes y apliques de cristales facetados.', '00000000-0000-0000-0000-000000000015', 350000, 1600000, 400000, true, true, 5.0, 15),
  ('00000000-0000-0000-0000-000000000106', 'congo-real-de-barranquilla', 'Congo Real de Barranquilla', '00000000-0000-0000-0000-000000000005', 'La danza de negros congos es la más antigua del carnaval. Este atuendo cuenta con el turbante cilíndrico imponente adornado con flores artificiales, mariposas de colores y un largo velo posterior de encaje que llega a los talones.', '00000000-0000-0000-0000-000000000016', 190000, 720000, 200000, true, false, 4.8, 22),
  ('00000000-0000-0000-0000-000000000107', 'jose-lito-carnavalero', 'Jose Lito Carnavalero', '00000000-0000-0000-0000-000000000006', 'Inspirado en el mítico "Joselito Carnaval", personaje que muere de tanto gozar y resucita al año siguiente. Un frac o esmoquin carnavalero desestructurado con remiendos alegres, sombrero de paja florido y pañuelo fúnebre jocoso.', '00000000-0000-0000-0000-000000000017', 150000, 500000, 160000, false, false, 4.6, 11),
  ('00000000-0000-0000-0000-000000000108', 'reina-de-fantasia-esmeralda', 'Reina de Fantasía Esmeralda', '00000000-0000-0000-0000-000000000002', 'Un majestuoso e imponente vestido de comparsa o coronación inspirado en las gemas y orfebrería de Colombia. Con un plumaje verde esmeralda y turquesa deslumbrante, miles de canutillos brillantes cosidos a mano y un esplendoroso tocado real.', '00000000-0000-0000-0000-000000000015', 390000, 2200000, 450000, true, false, 4.9, 31);

-- Costume details
insert into costume_details (costume_id, detail, sort_order)
values
  ('00000000-0000-0000-0000-000000000101', 'Costuras reforzadas de alta costura para soportar el baile intenso.', 0),
  ('00000000-0000-0000-0000-000000000101', 'Faldón amplio de 12 metros de ruedo para el perfecto vuelo de cumbia.', 1),
  ('00000000-0000-0000-0000-000000000101', 'Diseño ergonómico con pretina ajustable en la cintura.', 2),
  ('00000000-0000-0000-0000-000000000101', 'Aplicaciones de pedrería fina y lentejuelas cosidas a mano en el corpiño.', 3),
  ('00000000-0000-0000-0000-000000000102', 'Chaleco y pantalón elaborados en tela satinada de alta resistencia.', 0),
  ('00000000-0000-0000-0000-000000000102', 'Máscara transpirable con forro interior de algodón suave para mayor comodidad.', 1),
  ('00000000-0000-0000-0000-000000000102', 'Acabados con costuras dobles para resistir saltos y piruetas.', 2),
  ('00000000-0000-0000-0000-000000000102', 'Corbata gigante rellena de plumón liviano que mantiene la forma.', 3),
  ('00000000-0000-0000-0000-000000000103', 'Cuadros de 1.5cm perfectamente alineados en las costuras.', 0),
  ('00000000-0000-0000-0000-000000000103', 'Vuelo completo de 8 metros para un movimiento fluido del faldón.', 1),
  ('00000000-0000-0000-0000-000000000103', 'Blusa de escote amplio de hombro a hombro (palangana) con arandelas.', 2),
  ('00000000-0000-0000-0000-000000000103', 'Cierre ajustable trasero con ojales y cordón tradicional.', 3),
  ('00000000-0000-0000-0000-000000000104', 'Chaleco con bordado barroco en hilos dorados metálicos.', 0),
  ('00000000-0000-0000-0000-000000000104', 'Capa roja de satín satinado con remates de borlas y cintas colgantes.', 1),
  ('00000000-0000-0000-0000-000000000104', 'Bombacho de satín amarillo brillante con el elástico en rodillas.', 2),
  ('00000000-0000-0000-0000-000000000104', 'Camisa blanca de cuello alto de algodón italiano.', 3),
  ('00000000-0000-0000-0000-000000000105', 'Estructura de espaldar (alas) ultra ligera y desmontable.', 0),
  ('00000000-0000-0000-0000-000000000105', 'Corpiño ajustable tipo corset con copas prehormadas bordadas.', 1),
  ('00000000-0000-0000-0000-000000000105', 'Falda asimétrica de plumas escalonadas.', 2),
  ('00000000-0000-0000-0000-000000000105', 'Ajustes cómodos con forros de lycra fresca.', 3),
  ('00000000-0000-0000-0000-000000000106', 'Gorra (turbante) con armazón rígido liviano de cartón y alambre.', 0),
  ('00000000-0000-0000-0000-000000000106', 'Peto bordado con lentejuelas, cuentas y encaje.', 1),
  ('00000000-0000-0000-0000-000000000106', 'Pantalón satinado con parches laterales y cintas colgantes.', 2),
  ('00000000-0000-0000-0000-000000000106', 'Camisa de manga larga de satín de colores brillantes.', 3),
  ('00000000-0000-0000-0000-000000000107', 'Chaqueta tipo frac cortada con apliques asimétricos de colores.', 0),
  ('00000000-0000-0000-0000-000000000107', 'Pantalón remendado artísticamente con parches de flores y carnaval.', 1),
  ('00000000-0000-0000-0000-000000000107', 'Camisa manga sisa ultra transpirable para el calor caribe.', 2),
  ('00000000-0000-0000-0000-000000000107', 'Tejidos elásticos cómodos para bailar sin restricciones.', 3),
  ('00000000-0000-0000-0000-000000000108', 'Corset con base de satín reforzado y varillas moldeadoras.', 0),
  ('00000000-0000-0000-0000-000000000108', 'Cientos de plumas sintéticas premium dispuestas simétricamente en el espaldar.', 1),
  ('00000000-0000-0000-0000-000000000108', 'Mallas invisibles color piel de alta durabilidad.', 2),
  ('00000000-0000-0000-0000-000000000108', 'Apliques de cristal que destellan intensamente bajo las luces del desfile.', 3);

-- Fabrics
insert into fabrics (id, name)
values
  ('00000000-0000-0000-0000-000000000201', 'Encaje de Bolillo'),
  ('00000000-0000-0000-0000-000000000202', 'Raso Satín Real'),
  ('00000000-0000-0000-0000-000000000203', 'Tul Cristal'),
  ('00000000-0000-0000-0000-000000000204', 'Gipiur'),
  ('00000000-0000-0000-0000-000000000205', 'Satín Licrado'),
  ('00000000-0000-0000-0000-000000000206', 'Seda Lustrillo'),
  ('00000000-0000-0000-0000-000000000207', 'Algodón Sanforizado (forros)'),
  ('00000000-0000-0000-0000-000000000208', 'Dacrón Hilo'),
  ('00000000-0000-0000-0000-000000000209', 'Terlenka Carnavalera'),
  ('00000000-0000-0000-0000-000000000210', 'Cinta Hilera'),
  ('00000000-0000-0000-0000-000000000211', 'Tul de Nylon'),
  ('00000000-0000-0000-0000-000000000212', 'Seda Satín'),
  ('00000000-0000-0000-0000-000000000213', 'Terciopelo Suave'),
  ('00000000-0000-0000-0000-000000000214', 'Brocado Imperial'),
  ('00000000-0000-0000-0000-000000000215', 'Lycra Metalizada'),
  ('00000000-0000-0000-0000-000000000216', 'Plumas de Fantasía Recicladas'),
  ('00000000-0000-0000-0000-000000000217', 'Satín Fluorescente'),
  ('00000000-0000-0000-0000-000000000218', 'Lino caribeño'),
  ('00000000-0000-0000-0000-000000000219', 'Satín Raso'),
  ('00000000-0000-0000-0000-000000000220', 'Algodón Fresco'),
  ('00000000-0000-0000-0000-000000000221', 'Chifón de Seda'),
  ('00000000-0000-0000-0000-000000000222', 'Malla Elástica Nude'),
  ('00000000-0000-0000-0000-000000000223', 'Lycra Foil Esmeralda');

-- Costume fabrics
insert into costume_fabrics (costume_id, fabric_id)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000202'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000203'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000204'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000205'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000206'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000207'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000208'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000209'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000210'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000211'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000212'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000213'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000214'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000215'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000216'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000217'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000218'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000219'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000220'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000221'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000222'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000223');

-- Accessories
insert into accessories (id, name)
values
  ('00000000-0000-0000-0000-000000000301', 'Tocado de flores rojas hechas a mano para el cabello.'),
  ('00000000-0000-0000-0000-000000000302', 'Juego de candongas barranquilleras de filigrana dorada.'),
  ('00000000-0000-0000-0000-000000000303', 'Manojo de velas decorativas con goteo falso.'),
  ('00000000-0000-0000-0000-000000000304', 'Collares dorados de tres hilos tradicionales.'),
  ('00000000-0000-0000-0000-000000000305', 'Pito de millo tradicional decorativo.'),
  ('00000000-0000-0000-0000-000000000306', 'Guantes blancos de etiqueta carnavalera.'),
  ('00000000-0000-0000-0000-000000000307', 'Tirantes elásticos ajustables bicolor.'),
  ('00000000-0000-0000-0000-000000000308', 'Pañolón rojo para el cuello o cintura.'),
  ('00000000-0000-0000-0000-000000000309', 'Flor de cayena roja natural o artificial para la cabeza.'),
  ('00000000-0000-0000-0000-000000000310', 'Sandalias de tres puntas de cuero artesanal (abarcas).'),
  ('00000000-0000-0000-0000-000000000311', 'Sombrero blanco decorado con flores artificiales, cintas y una gran cinta negra.'),
  ('00000000-0000-0000-0000-000000000312', 'Bastón del Garabato tallado en madera pintado con cintas de colores.'),
  ('00000000-0000-0000-0000-000000000313', 'Maquillaje artístico blanco y negro tradicional (guía incluida).'),
  ('00000000-0000-0000-0000-000000000314', 'Corona imperial de plumas y pedrería fina.'),
  ('00000000-0000-0000-0000-000000000315', 'Brazaletes metalizados decorados.'),
  ('00000000-0000-0000-0000-000000000316', 'Gargantilla suntuosa con cristales de imitación.'),
  ('00000000-0000-0000-0000-000000000317', 'Turbante tradicional decorado con mariposas y flores.'),
  ('00000000-0000-0000-0000-000000000318', 'Gafas de sol oscuras retro.'),
  ('00000000-0000-0000-0000-000000000319', 'Vejiga inflable de cuero tradicional.'),
  ('00000000-0000-0000-0000-000000000320', 'Peto bordado decorativo.'),
  ('00000000-0000-0000-0000-000000000321', 'Sombrero de paja "vueltiao" decorado con cintas rojas.'),
  ('00000000-0000-0000-0000-000000000322', 'Frasco de "suero medicinal" de carnaval.'),
  ('00000000-0000-0000-0000-000000000323', 'Pañuelo grande de lágrimas impreso.'),
  ('00000000-0000-0000-0000-000000000324', 'Hombreras y brazaletes de orfebrería repujada de fantasía.'),
  ('00000000-0000-0000-0000-000000000325', 'Collar gargantilla maximalista con incrustaciones verdes.');

-- Costume accessories
insert into costume_accessories (costume_id, accessory_id)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000301'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000302'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000303'),
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000304'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000305'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000306'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000307'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000308'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000309'),
  ('00000000-0000-0000-0000-000000000103', '00000000-0000-0000-0000-000000000310'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000311'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000312'),
  ('00000000-0000-0000-0000-000000000104', '00000000-0000-0000-0000-000000000313'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000314'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000315'),
  ('00000000-0000-0000-0000-000000000105', '00000000-0000-0000-0000-000000000316'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000317'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000318'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000319'),
  ('00000000-0000-0000-0000-000000000106', '00000000-0000-0000-0000-000000000320'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000321'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000322'),
  ('00000000-0000-0000-0000-000000000107', '00000000-0000-0000-0000-000000000323'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000324'),
  ('00000000-0000-0000-0000-000000000108', '00000000-0000-0000-0000-000000000325');

-- Costume sizes
insert into costume_sizes (costume_id, size)
values
  ('00000000-0000-0000-0000-000000000101', 'S'),
  ('00000000-0000-0000-0000-000000000101', 'M'),
  ('00000000-0000-0000-0000-000000000101', 'L'),
  ('00000000-0000-0000-0000-000000000101', 'XL'),
  ('00000000-0000-0000-0000-000000000102', 'XS'),
  ('00000000-0000-0000-0000-000000000102', 'S'),
  ('00000000-0000-0000-0000-000000000102', 'M'),
  ('00000000-0000-0000-0000-000000000102', 'L'),
  ('00000000-0000-0000-0000-000000000102', 'XL'),
  ('00000000-0000-0000-0000-000000000102', 'XXL'),
  ('00000000-0000-0000-0000-000000000103', 'S'),
  ('00000000-0000-0000-0000-000000000103', 'M'),
  ('00000000-0000-0000-0000-000000000103', 'L'),
  ('00000000-0000-0000-0000-000000000103', 'XL'),
  ('00000000-0000-0000-0000-000000000104', 'M'),
  ('00000000-0000-0000-0000-000000000104', 'L'),
  ('00000000-0000-0000-0000-000000000104', 'XL'),
  ('00000000-0000-0000-0000-000000000105', 'XS'),
  ('00000000-0000-0000-0000-000000000105', 'S'),
  ('00000000-0000-0000-0000-000000000105', 'M'),
  ('00000000-0000-0000-0000-000000000105', 'L'),
  ('00000000-0000-0000-0000-000000000106', 'S'),
  ('00000000-0000-0000-0000-000000000106', 'M'),
  ('00000000-0000-0000-0000-000000000106', 'L'),
  ('00000000-0000-0000-0000-000000000106', 'XL'),
  ('00000000-0000-0000-0000-000000000107', 'M'),
  ('00000000-0000-0000-0000-000000000107', 'L'),
  ('00000000-0000-0000-0000-000000000107', 'XL'),
  ('00000000-0000-0000-0000-000000000108', 'S'),
  ('00000000-0000-0000-0000-000000000108', 'M'),
  ('00000000-0000-0000-0000-000000000108', 'L');

-- Costume images (with storage paths / URLs)
insert into costume_images (costume_id, storage_path, is_primary, sort_order, alt_text)
values
  ('00000000-0000-0000-0000-000000000101', 'gala_cumbia.jpg', true, 0, 'Gala de Cumbia Real principal'),
  ('00000000-0000-0000-0000-000000000101', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80', false, 1, 'Gala de Cumbia Real 2'),
  ('00000000-0000-0000-0000-000000000101', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80', false, 2, 'Gala de Cumbia Real 3'),
  ('00000000-0000-0000-0000-000000000102', 'marimonda.jpg', true, 0, 'Marimonda de Barrio Abajo principal'),
  ('00000000-0000-0000-0000-000000000102', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80', false, 1, 'Marimonda de Barrio Abajo 2'),
  ('00000000-0000-0000-0000-000000000103', 'https://images.unsplash.com/photo-1569154941061-e231b4725ef1?auto=format&fit=crop&w=800&q=80', true, 0, 'Pollera de Cumbia Tradicional principal'),
  ('00000000-0000-0000-0000-000000000103', 'https://images.unsplash.com/photo-1590073844006-33379778ae09?auto=format&fit=crop&w=800&q=80', false, 1, 'Pollera de Cumbia Tradicional 2'),
  ('00000000-0000-0000-0000-000000000104', 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&w=800&q=80', true, 0, 'Garabato Elegancia principal'),
  ('00000000-0000-0000-0000-000000000105', 'https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=800&q=80', true, 0, 'Guacamaya de Fantasía principal'),
  ('00000000-0000-0000-0000-000000000105', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80', false, 1, 'Guacamaya de Fantasía 2'),
  ('00000000-0000-0000-0000-000000000106', 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80', true, 0, 'Congo Real de Barranquilla principal'),
  ('00000000-0000-0000-0000-000000000107', 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80', true, 0, 'Jose Lito Carnavalero principal'),
  ('00000000-0000-0000-0000-000000000108', 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=800&q=80', true, 0, 'Reina de Fantasía Esmeralda principal'),
  ('00000000-0000-0000-0000-000000000108', 'https://images.unsplash.com/photo-1551085254-e96b210db58a?auto=format&fit=crop&w=800&q=80', false, 1, 'Reina de Fantasía Esmeralda 2');

-- Reviews
insert into reviews (id, costume_id, author_name, author_role, rating, comment, avatar_storage_path, review_date, is_published)
values
  ('00000000-0000-0000-0000-000000000401', '00000000-0000-0000-0000-000000000101', 'Camila Torres', 'Reina de la Comparsa Tambores del Caribe', 5, 'Alquilé el traje "Gala de Cumbia Real" para la Gran Parada de Tradición y fue un rotundo éxito. La comodidad del corpiño y la amplitud del faldón me permitieron bailar los 4 kilómetros de la Vía 40 sin ninguna molestia. Los encajes son una obra de arte. ¡Sra. Madi es una leyenda!', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80', 'Febrero, 2026', true),
  ('00000000-0000-0000-0000-000000000402', '00000000-0000-0000-0000-000000000102', 'Juan Carlos Restrepo', 'Caporal de la comparsa de Marimondas', 5, 'Los trajes de Marimonda de Disfraces Madi son los mejores de Barranquilla. Las telas no acaloran, la máscara se mantiene fresca y el diseño es el más alegre de la comparsa. Se nota el amor y la herencia de carnaval en cada costura.', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80', 'Febrero, 2026', true),
  ('00000000-0000-0000-0000-000000000403', '00000000-0000-0000-0000-000000000108', 'Isabella Chams', 'Bailarina e Invitada de Honor de Caimán', 5, 'Hacerse un traje sobre medidas con la Sra. Madi es una experiencia mágica. Entendió exactamente lo que quería para mi coronación de comparsa de fantasía. El brillo, el movimiento y el encaje esmeralda capturaron todas las miradas. ¡100% recomendado!', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80', 'Enero, 2026', true);

-- Site stats
insert into site_stats (id, years_of_tradition, carnivals_lived, costumes_rented, happy_hearts)
values (true, '25+', '25', '12K+', '5K+');

-- Contact info
insert into contact_info (id, address, city, phone, whatsapp, email)
values (true, 'Visitas exclusivas con cita previa', 'Barranquilla, Atlántico, Colombia', '+57 (301) 726-3172', '573017263172', 'contacto@disfracesmadi.com');

-- Working hours
insert into working_hours (days, hours, sort_order)
values
  ('Lunes a Viernes', '8:00 AM - 7:00 PM', 0),
  ('Sábados', '9:00 AM - 6:00 PM', 1),
  ('Domingos (Temporada)', '10:00 AM - 4:00 PM', 2);

-- Site assets
insert into site_assets (key, storage_path)
values
  ('heroBanner', 'heroBanner.jpg'),
  ('atelierMadi', 'atelierMadi.jpg'),
  ('galaCumbia', 'galaCumbia.jpg'),
  ('marimonda', 'marimonda.jpg');
