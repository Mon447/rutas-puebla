from app.database import redis_client
from app.models import Parada

paradas = [
    {"id": "pue-001", "nombre": "Parada Zócalo", "colonia": "Centro", "latitud": 19.0431, "longitud": -98.1937, "rutas": ["Ruta 1", "Ruta 15", "Ruta 72"]},
    {"id": "pue-002", "nombre": "Parada CAPU", "colonia": "Rancho Colorado", "latitud": 19.0577, "longitud": -98.2087, "rutas": ["Ruta 4", "Ruta 20"]},
    {"id": "pue-003", "nombre": "Parada Angelópolis", "colonia": "Lomas de Angelópolis", "latitud": 19.0236, "longitud": -98.2493, "rutas": ["Ruta 8", "Ruta 33"]},
    {"id": "pue-004", "nombre": "Parada Estrella de Puebla", "colonia": "Zona Angelópolis", "latitud": 19.0268, "longitud": -98.2331, "rutas": ["Ruta 8", "Ruta 61"]},
    {"id": "pue-005", "nombre": "Parada Africam", "colonia": "La Calera", "latitud": 19.0090, "longitud": -98.1650, "rutas": ["Ruta 15", "Ruta 40"]},
]

for datos in paradas:
    p = Parada(**datos)
    redis_client.set(f"parada:{p.id}", p.model_dump_json())
    print("Guardada:", p.id)