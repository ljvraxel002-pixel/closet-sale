import os
import json
import uuid
from functools import wraps
from flask import (
    Flask, render_template, request, redirect,
    url_for, session, jsonify, send_from_directory
)
from werkzeug.utils import secure_filename

app = Flask(__name__)
app.secret_key = "closet_sale_2024_secret"   # Cambia esto en producción

# ── Configuración ──────────────────────────────────────────
BASE_DIR      = os.path.dirname(os.path.abspath(__file__))
PRODUCTOS_JSON = os.path.join(BASE_DIR, "productos.json")
UPLOAD_FOLDER  = os.path.join(BASE_DIR, "static", "uploads")
ALLOWED_EXT    = {"png", "jpg", "jpeg", "webp", "gif"}

ADMIN_USER     = "Axel Camacho"
ADMIN_PASSWORD = "Integral5"   # Cambia esto

WHATSAPP_NUMBER = "2201474100"   # Pon tu número aquí (con código de país, sin +)

app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ── Utilidades ─────────────────────────────────────────────
def leer_productos():
    with open(PRODUCTOS_JSON, "r", encoding="utf-8") as f:
        return json.load(f)

def guardar_productos(productos):
    with open(PRODUCTOS_JSON, "w", encoding="utf-8") as f:
        json.dump(productos, f, ensure_ascii=False, indent=2)

def siguiente_id(productos):
    return max((p["id"] for p in productos), default=0) + 1

def extension_permitida(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXT

def login_requerido(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if not session.get("admin"):
            return redirect(url_for("admin_login"))
        return f(*args, **kwargs)
    return decorated

# ── Rutas públicas ─────────────────────────────────────────
@app.route("/")
def index():
    return render_template("index.html", whatsapp=WHATSAPP_NUMBER)

@app.route("/api/productos")
def api_productos():
    productos = leer_productos()
    return jsonify(productos)

@app.route("/static/uploads/<filename>")
def uploaded_file(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)

# ── Admin: login ───────────────────────────────────────────
@app.route("/admin/login", methods=["GET", "POST"])
def admin_login():
    error = None
    if request.method == "POST":
        u = request.form.get("usuario", "")
        p = request.form.get("password", "")
        if u == ADMIN_USER and p == ADMIN_PASSWORD:
            session["admin"] = True
            return redirect(url_for("admin_panel"))
        error = "Usuario o contraseña incorrectos."
    return render_template("login.html", error=error)

@app.route("/admin/logout")
def admin_logout():
    session.pop("admin", None)
    return redirect(url_for("admin_login"))

# ── Admin: panel principal ─────────────────────────────────
@app.route("/admin")
@login_requerido
def admin_panel():
    productos = leer_productos()
    return render_template("admin.html", productos=productos)

# ── Admin: agregar producto ────────────────────────────────
@app.route("/admin/agregar", methods=["GET", "POST"])
@login_requerido
def admin_agregar():
    if request.method == "POST":
        productos = leer_productos()
        foto_nombre = ""
        foto = request.files.get("foto")
        if foto and foto.filename and extension_permitida(foto.filename):
            ext = foto.filename.rsplit(".", 1)[1].lower()
            foto_nombre = f"{uuid.uuid4().hex}.{ext}"
            foto.save(os.path.join(app.config["UPLOAD_FOLDER"], foto_nombre))

        nuevo = {
            "id":          siguiente_id(productos),
            "nombre":      request.form.get("nombre", "").strip(),
            "categoria":   request.form.get("categoria", "").strip(),
            "precio":      float(request.form.get("precio", 0)),
            "talla":       request.form.get("talla", "").strip(),
            "marca":       request.form.get("marca", "").strip(),
            "descripcion": request.form.get("descripcion", "").strip(),
            "foto":        foto_nombre,
            "estado":      request.form.get("estado", "disponible"),
        }
        productos.append(nuevo)
        guardar_productos(productos)
        return redirect(url_for("admin_panel"))
    return render_template("form_producto.html", producto=None, accion="Agregar")

# ── Admin: editar producto ─────────────────────────────────
@app.route("/admin/editar/<int:pid>", methods=["GET", "POST"])
@login_requerido
def admin_editar(pid):
    productos = leer_productos()
    producto = next((p for p in productos if p["id"] == pid), None)
    if not producto:
        return redirect(url_for("admin_panel"))

    if request.method == "POST":
        foto = request.files.get("foto")
        if foto and foto.filename and extension_permitida(foto.filename):
            # Borrar foto anterior si existe
            if producto.get("foto"):
                old = os.path.join(app.config["UPLOAD_FOLDER"], producto["foto"])
                if os.path.exists(old):
                    os.remove(old)
            ext = foto.filename.rsplit(".", 1)[1].lower()
            foto_nombre = f"{uuid.uuid4().hex}.{ext}"
            foto.save(os.path.join(app.config["UPLOAD_FOLDER"], foto_nombre))
            producto["foto"] = foto_nombre

        producto["nombre"]      = request.form.get("nombre", "").strip()
        producto["categoria"]   = request.form.get("categoria", "").strip()
        producto["precio"]      = float(request.form.get("precio", 0))
        producto["talla"]       = request.form.get("talla", "").strip()
        producto["marca"]       = request.form.get("marca", "").strip()
        producto["descripcion"] = request.form.get("descripcion", "").strip()
        producto["estado"]      = request.form.get("estado", "disponible")

        guardar_productos(productos)
        return redirect(url_for("admin_panel"))

    return render_template("form_producto.html", producto=producto, accion="Editar")

# ── Admin: cambiar estado rápido (AJAX) ───────────────────
@app.route("/admin/estado/<int:pid>", methods=["POST"])
@login_requerido
def admin_estado(pid):
    productos = leer_productos()
    producto = next((p for p in productos if p["id"] == pid), None)
    if not producto:
        return jsonify({"ok": False}), 404
    nuevo_estado = request.json.get("estado")
    if nuevo_estado in ("disponible", "apartado", "vendido"):
        producto["estado"] = nuevo_estado
        guardar_productos(productos)
        return jsonify({"ok": True, "estado": nuevo_estado})
    return jsonify({"ok": False}), 400

# ── Admin: eliminar producto ───────────────────────────────
@app.route("/admin/eliminar/<int:pid>", methods=["POST"])
@login_requerido
def admin_eliminar(pid):
    productos = leer_productos()
    producto = next((p for p in productos if p["id"] == pid), None)
    if producto:
        if producto.get("foto"):
            ruta = os.path.join(app.config["UPLOAD_FOLDER"], producto["foto"])
            if os.path.exists(ruta):
                os.remove(ruta)
        productos = [p for p in productos if p["id"] != pid]
        guardar_productos(productos)
    return redirect(url_for("admin_panel"))

if __name__ == "__main__":
    app.run(debug=True, port=5000)
