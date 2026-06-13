# Closet Sale — Catálogo Web de Ropa y Perfumes

Página web para vender artículos usados. Los vecinos entran desde Facebook,
ven los productos y envían su pedido por WhatsApp.

---

## Requisitos

- Python 3.9 o superior
- pip

---

## Instalación (primer uso)

```bash
# 1. Entra a la carpeta del proyecto
cd closet_sale

# 2. (Opcional pero recomendado) Crea un entorno virtual
python -m venv venv
source venv/bin/activate        # Mac/Linux
venv\Scripts\activate           # Windows

# 3. Instala las dependencias
pip install -r requirements.txt
```

---

## Configuración rápida (¡IMPORTANTE!)

Abre `app.py` y cambia estas 3 líneas al inicio del archivo:

```python
ADMIN_USER     = "admin"          # Tu usuario para el panel
ADMIN_PASSWORD = "closet2024"     # Tu contraseña (cámbiala)
WHATSAPP_NUMBER = "521XXXXXXXXXX" # Tu número con código de país (sin +)
                                  # Ejemplo: "5215512345678"
```

---

## Ejecutar el servidor

```bash
python app.py
```

Luego abre en tu navegador: **http://localhost:5000**

Para el panel de administración: **http://localhost:5000/admin**

---

## Estructura del proyecto

```
closet_sale/
├── app.py                  ← Servidor Flask (backend)
├── productos.json          ← Base de datos de productos
├── requirements.txt
├── templates/
│   ├── index.html          ← Página pública (catálogo)
│   ├── admin.html          ← Panel de administración
│   ├── form_producto.html  ← Formulario agregar/editar
│   └── login.html          ← Login del admin
└── static/
    ├── css/style.css       ← Estilos
    ├── js/app.js           ← Lógica del catálogo
    └── uploads/            ← Fotos de productos (se crea sola)
```

---

## Cómo usar el panel de administración

1. Ve a `http://localhost:5000/admin`
2. Inicia sesión con tu usuario y contraseña
3. Desde el panel puedes:
   - **Agregar** productos nuevos (con foto)
   - **Editar** nombre, precio, talla, descripción, foto
   - **Cambiar el estado** desde la tabla directamente (Disponible / Apartado / Vendido)
   - **Eliminar** productos

---

## Cómo marcar un producto como vendido

Desde el panel de administración, en la columna "Estado",
usa el menú desplegable de colores: cambia de **Disponible → Apartado → Vendido**.
El contador en la página pública se actualiza automáticamente.

---

## Agregar fotos a los productos

Desde el formulario de producto (Agregar o Editar), sube la foto directamente.
Las imágenes se guardan en `static/uploads/`.

También puedes usar URLs externas (imgbb.com, Google Fotos, etc.)
editando directamente el campo `"foto"` en `productos.json`.

---

## Compartir en Facebook

Para compartir el catálogo en Facebook tienes dos opciones:

**Opción A — Local (solo en tu WiFi):**
Ejecuta Flask y comparte tu IP local:
`http://192.168.x.x:5000`
(solo funciona si todos están en la misma red)

**Opción B — Internet (recomendado para Facebook):**
Usa [ngrok](https://ngrok.com) para exponer el servidor:
```bash
# Instala ngrok (gratis), luego:
ngrok http 5000
# Te dará una URL pública tipo https://abc123.ngrok.io
```
Pega esa URL en tu grupo de Facebook.

**Opción C — Hosting permanente:**
Sube el proyecto a [Railway](https://railway.app) o [Render](https://render.com)
(ambos tienen plan gratuito). El proyecto funciona sin cambios.

---

## Puntos de entrega

Para cambiar las opciones del menú "Punto de entrega",
edita el archivo `templates/index.html` y busca el `<select id="inp-entrega">`.

---

## Categorías disponibles

- `pantalon`
- `sudadera`
- `perfume`

Para agregar más categorías, edita los chips en `index.html`
y el `<select name="categoria">` en `form_producto.html`.
