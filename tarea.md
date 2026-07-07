# Tarea: Agregar subida de imagenes al panel de contenido

## Contexto
El panel de aprobacion en /admin/content ya funciona. Los posts tienen un 
placeholder gris donde deberia ir la imagen. Necesitamos agregar la capacidad 
de subir una imagen por post directamente desde el panel a Supabase Storage.

## Paso 1 - Crear bucket en Supabase Storage

Crea un bucket publico llamado 'post-images' en Supabase Storage.
El bucket debe ser publico para que Make e Instagram puedan acceder a las URLs.

Ejecuta este SQL en Supabase para asegurar las politicas correctas:
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

CREATE POLICY post_images_public_read ON storage.objects
FOR SELECT USING (bucket_id = 'post-images');

CREATE POLICY post_images_upload ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'post-images');

## Paso 2 - Agregar boton de subida en cada card del panel

En la pagina /admin/content, en cada card de post:
- Si el post NO tiene image_url: mostrar el placeholder gris actual + boton 
  'Subir imagen' debajo del placeholder
- Si el post SI tiene image_url: mostrar la imagen normalmente

El boton 'Subir imagen' debe:
- Abrir el selector de archivos del sistema operativo
- Aceptar solo imagenes (jpg, png, webp)
- Maximo 8MB (limite de Instagram)
- Al seleccionar el archivo, subirlo a Supabase Storage en el bucket 
  'post-images' con el nombre: post-{id}-{timestamp}.jpg
- Mostrar barra de progreso mientras sube
- Al terminar, guardar la URL publica en el campo image_url del post en 
  la tabla scheduled_posts
- Mostrar la imagen inmediatamente en el card sin recargar la pagina

## Paso 3 - API route para actualizar image_url

Crea o modifica el endpoint PUT /api/admin/posts/[id] para que tambien 
acepte actualizacion de image_url.

## Paso 4 - Mostrar indicador de completitud

En cada card, mostrar un indicador visual de que tan completo esta el post:
- Sin imagen: badge amarillo 'Falta imagen'
- Con imagen pero sin aprobar: badge gris 'Listo para aprobar'
- Aprobado con imagen: badge verde 'Listo para publicar'

Solo los posts con imagen pueden ser aprobados. Si el usuario intenta 
aprobar sin imagen, mostrar mensaje de error: 'Agrega una imagen antes 
de aprobar'.

## Notas importantes
- Usar el cliente de Supabase que ya existe en el proyecto
- La URL publica de Supabase Storage tiene el formato:
  https://[project-id].supabase.co/storage/v1/object/public/post-images/[filename]
- No instalar librerias nuevas
- El upload debe funcionar directo desde el browser usando el cliente 
  de Supabase en el frontend