# Rutas Puebla - API CRUD y Gestión de Paradas

Sistema web y API REST desarrollada con **FastAPI** y **Redis Cloud** para la administración (Crear, Consultar, Actualizar y Eliminar) de paradas de transporte público en la zona metropolitana de Puebla[cite: 1, 5, 9, 12].

---

## Requisitos Previos

* **Python 3.10** o superior.
* Una cuenta y base de datos activa en **Redis Cloud**[cite: 3].
* **Git** instalado en el equipo.

---

## Instalación y Configuración

1. **Clonar el repositorio:**
   ```bash
   git clone [https://github.com/Mon447/rutas-puebla.git](https://github.com/Mon447/rutas-puebla.git)
   cd rutas-puebla
   ```[cite: 23]

2. **Crear y activar el entorno virtual:**
   * En Windows (PowerShell):
     ```powershell
     python -m venv venv
     .\venv\Scripts\Activate.ps1
     ```[cite: 3]
   * En Linux/Mac:
     ```bash
     python3 -m venv venv
     source venv/bin/activate
     ```

3. **Instalar las dependencias del proyecto:**
   ```bash
   pip install -r requirements.txt
   ```[cite: 3]

4. **Configurar las variables de entorno:**
   Crea un archivo llamado `.env` en la raíz del proyecto y agrega tu cadena de conexión proporcionada por Redis Cloud[cite: 3]:
   ```env
   REDIS_URL=redis://default:TU_CONTRASEÑA@TU_HOST:TU_PUERTO
   ```[cite: 3]

5. **Cargar datos iniciales de prueba (Opcional):**
   ```bash
   python seed.py
   ```[cite: 8]

---

## Ejecución del Proyecto

1. **Iniciar el servidor de desarrollo con Uvicorn:**
   ```bash
   uvicorn app.main:app --reload
   ```[cite: 6]

2. **Acceder a las vistas del sistema en tu navegador:**
   * **Interfaz Web (Front End):** `http://127.0.0.1:8000`[cite: 6, 9]
   * **Documentación interactiva (Swagger UI):** `http://127.0.0.1:8000/docs`[cite: 1, 6]

---

## Endpoints Principales

* `GET /paradas` — Listar todas las paradas registradas[cite: 5].
* `POST /paradas` — Crear una nueva parada[cite: 5].
* `GET /paradas/{parada_id}` — Obtener el detalle de una parada específica[cite: 5].
* `PUT /paradas/{parada_id}` — Actualizar los datos de una parada existente[cite: 5].
* `DELETE /paradas/{parada_id}` — Eliminar una parada de la base de datos[cite: 5].

---

## Autora

* **Montserrat Hernández Moreno** — Ingeniería en Tecnologías de la Información e Innovación Digital (UTP)[cite: 2].
