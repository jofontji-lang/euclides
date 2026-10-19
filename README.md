# Euclides · Los Elementos

Edición digital interactiva de los *Elementos* de Euclides.
Web: https://euclides.matematicasjosepfont.es

## Estructura

```
data/libros.json     Los 13 libros (título, nº de proposiciones, si están disponibles)
data/libro-1.json    Libro I: definiciones, postulados, nociones comunes y 48 proposiciones
src/style.css        Diseño de toda la web
src/figures.js       Figuras interactivas (I.1, I.32, I.47)
src/site.js          Menú, pestañas y buscador
src/og.png           Imagen de vista previa al compartir (se genera desde src/og.html)
build.mjs            Genera la web a partir de los datos
.github/workflows/   Publicación automática en GitHub Pages
```

## Cómo se publica

Cada vez que se sube un cambio a la rama `main`, GitHub ejecuta `node build.mjs` y publica el resultado.
No hay que hacer nada más: en uno o dos minutos la web está actualizada.
El progreso se ve en la pestaña *Actions* del repositorio.

## Cambiar contenidos

- **Textos**: edita `data/libro-1.json` (se puede hacer desde la propia web de GitHub, con el lápiz).
- **Diseño**: `src/style.css`.
- **Nueva figura**: dibújala en `src/figures.js` y añade a esa proposición en `data/libro-1.json` los campos `figura`, `pasos`, `usa` y, si quieres, `nota` (copia el formato de la proposición 47).

Para ver la web en tu ordenador antes de subirla: `node build.mjs` y abre `_site/index.html`.
