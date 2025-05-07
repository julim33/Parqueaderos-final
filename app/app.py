import logging
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from psycopg2 import connect, sql
from fastapi.middleware.cors import CORSMiddleware
from math import radians, cos, sin, asin, sqrt
from datetime import datetime, timedelta
import requests

# Configuración del logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Base de datos de conexión
def get_db_connection():
    try:
        return connect(
            dbname="parqueaderos_db", 
            user="postgres", 
            password="password", 
            host="localhost", 
            port="5432"
        )
    except Exception as e:
        logger.error("Error al conectar a la base de datos: %s", e)
        raise HTTPException(status_code=500, detail="Error al conectar a la base de datos")

# Modelos
class Aparcadero(BaseModel):
    id: int
    municipio: str
    capacidad_maxima: int
    coordenadas: str

class UbicacionBus(BaseModel):
    latitud: float
    longitud: float

class Registro(BaseModel):
    bus_id: int
    aparcadero_id: int
    destino: str
    hora_salida: Optional[str] = None

# Funciones de utilidad
def haversine(lat1, lon1, lat2, lon2):
    """Calcula la distancia en línea recta entre dos puntos (fórmula Haversine)"""
    R = 6371  # Radio de la Tierra en km
    dlat = radians(lat2 - lat1)
    dlon = radians(lon2 - lon1)
    a = sin(dlat/2)**2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))
    return R * c

def calcular_distancia_ruta(lat1, lon1, lat2, lon2):
    """Calcula la distancia de ruta real usando OSRM con manejo de errores"""
    try:
        url = f"http://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false"
        response = requests.get(url, timeout=5)
        data = response.json()
        
        if response.status_code != 200 or data.get('code') != 'Ok':
            logger.warning("OSRM no disponible, usando Haversine")
            return haversine(lat1, lon1, lat2, lon2)
        
        return data['routes'][0]['distance'] / 1000  # Convertir a km
    
    except requests.exceptions.RequestException as e:
        logger.error(f"Error de conexión con OSRM: {e}")
        return haversine(lat1, lon1, lat2, lon2)
    except Exception as e:
        logger.error(f"Error inesperado al calcular ruta: {e}")
        return haversine(lat1, lon1, lat2, lon2)

# Endpoints
@app.get("/aparcamientos", response_model=List[dict])
def obtener_aparcaderos():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(""" 
            SELECT a.id, a.municipio, a.capacidad_maxima, ST_AsGeoJSON(a.coordenadas),
                   COUNT(r.bus_id) AS capacidad_actual,
                   json_agg(json_build_object('bus_id', r.bus_id, 'hora_llegada', r.hora_llegada, 'destino', r.destino)) 
                       FILTER (WHERE r.hora_salida IS NULL) AS buses_presentes
            FROM aparcaderos a
            LEFT JOIN registros r ON a.id = r.aparcadero_id AND r.hora_salida IS NULL
            GROUP BY a.id
        """)

        aparcaderos = cursor.fetchall()
        return [
            {
                "id": a[0],
                "municipio": a[1],
                "capacidad_maxima": a[2],
                "coordenadas": a[3],
                "capacidad_actual": a[4],
                "buses": a[5] if a[5] != [None] else []
            }
            for a in aparcaderos
        ]
    
    except Exception as e:
        logger.error("Error al obtener los aparcaderos: %s", e)
        raise HTTPException(status_code=500, detail="Error al obtener los aparcaderos")
    finally:
        conn.close()

@app.get("/aparcamientos/{id}", response_model=Aparcadero)
def obtener_aparcadero(id: int):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute(""" 
            SELECT id, municipio, capacidad_maxima, ST_AsGeoJSON(coordenadas) 
            FROM aparcaderos WHERE id = %s
        """, (id,))

        aparcadero = cursor.fetchone()
        if aparcadero:
            return {
                "id": aparcadero[0],
                "municipio": aparcadero[1],
                "capacidad_maxima": aparcadero[2],
                "coordenadas": aparcadero[3]
            }
        raise HTTPException(status_code=404, detail="Aparcadero no encontrado")
    except Exception as e:
        logger.error("Error al obtener el aparcadero con id %s: %s", id, e)
        raise HTTPException(status_code=500, detail="Error al obtener el aparcadero")
    finally:
        conn.close()

@app.post("/registros")
def registrar_bus(registro: Registro):
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        # 1. Verificar que el bus existe
        cursor.execute("SELECT id FROM buses WHERE id = %s", (registro.bus_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Bus no encontrado")

        # 2. Verificar que el aparcadero existe
        cursor.execute("SELECT id, capacidad_maxima FROM aparcaderos WHERE id = %s", (registro.aparcadero_id,))
        aparcadero = cursor.fetchone()
        if not aparcadero:
            raise HTTPException(status_code=404, detail="Aparcadero no encontrado")

        capacidad_maxima = aparcadero[1]
        
        # 3. Verificar la capacidad actual del aparcadero
        cursor.execute("""
            SELECT COUNT(*) FROM registros WHERE aparcadero_id = %s AND hora_salida IS NULL
        """, (registro.aparcadero_id,))
        capacidad_actual = cursor.fetchone()[0]
        
        if capacidad_actual >= capacidad_maxima:
            raise HTTPException(status_code=400, detail="Capacidad máxima del aparcadero alcanzada")
        
        # 4. Obtener coordenadas del bus (origen)
        cursor.execute(""" 
            SELECT ST_X(coordenadas::geometry), ST_Y(coordenadas::geometry)
            FROM buses WHERE id = %s
        """, (registro.bus_id,))
        bus_coord = cursor.fetchone()

        # 5. Obtener coordenadas del aparcadero (destino)
        cursor.execute("""
            SELECT ST_X(coordenadas::geometry), ST_Y(coordenadas::geometry), coordenadas
            FROM aparcaderos WHERE id = %s
        """, (registro.aparcadero_id,))
        ap_coord = cursor.fetchone()

        # 6. Calcular distancia y tiempo estimado
        distancia_km = calcular_distancia_ruta(
            bus_coord[1], bus_coord[0],  # lat, lon del bus
            ap_coord[1], ap_coord[0]     # lat, lon del aparcadero
        )
        tiempo_horas = distancia_km / 60  # 60 km/h velocidad promedio
        hora_llegada = datetime.utcnow() + timedelta(hours=tiempo_horas)

        # 7. Formatear hora de salida para PostgreSQL
        hora_salida_sql = None
        if registro.hora_salida:
            try:
                hora_salida_sql = datetime.fromisoformat(registro.hora_salida.replace('Z', ''))
            except ValueError as e:
                logger.error(f"Error al parsear hora_salida: {e}")
                raise HTTPException(status_code=400, detail="Formato de hora de salida inválido")

        # 8. Actualizar ubicación del bus (moverlo al aparcadero)
        cursor.execute("""
            UPDATE buses 
            SET coordenadas = %s,
                destino = %s
            WHERE id = %s
        """, (ap_coord[2], registro.destino, registro.bus_id))

        # 9. Registrar la llegada
        cursor.execute("""
            INSERT INTO registros 
            (bus_id, aparcadero_id, hora_llegada, hora_salida, destino) 
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id
        """, (
            registro.bus_id,
            registro.aparcadero_id,
            hora_llegada,
            hora_salida_sql,
            registro.destino
        ))

        registro_id = cursor.fetchone()[0]
        conn.commit()

        return {
            "mensaje": "Registro creado con éxito",
            "registro_id": registro_id,
            "distancia_km": round(distancia_km, 2),
            "tiempo_estimado_horas": round(tiempo_horas, 2),
            "hora_llegada": hora_llegada.isoformat(),
            "hora_salida": registro.hora_salida
        }

    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error("Error al registrar el bus: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        conn.close()


@app.put("/buses/{bus_id}/ubicacion")
def actualizar_ubicacion(bus_id: int, ubicacion: UbicacionBus):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # 1. Verificar que el bus existe
        cursor.execute("SELECT id FROM buses WHERE id = %s", (bus_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Bus no encontrado")

        # 2. Actualizar ubicación
        cursor.execute("""
            UPDATE buses 
            SET coordenadas = ST_SetSRID(ST_MakePoint(%s, %s), 4326)
            WHERE id = %s
            RETURNING id, placa
        """, (ubicacion.longitud, ubicacion.latitud, bus_id))
        
        updated_bus = cursor.fetchone()
        conn.commit()
        
        return {
            "mensaje": "Ubicación actualizada correctamente",
            "bus_id": updated_bus[0],
            "placa": updated_bus[1],
            "nueva_ubicacion": {
                "latitud": ubicacion.latitud,
                "longitud": ubicacion.longitud
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.error("Error al actualizar ubicación: %s", e)
        raise HTTPException(status_code=500, detail="Error al actualizar ubicación")
    finally:
        conn.close()

@app.get("/registros")
def obtener_registros():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT r.id, r.bus_id, b.placa, r.aparcadero_id, a.municipio, 
                   r.hora_llegada, r.hora_salida, r.destino
            FROM registros r
            JOIN buses b ON r.bus_id = b.id
            JOIN aparcaderos a ON r.aparcadero_id = a.id
            ORDER BY r.hora_llegada DESC
        """)
        
        registros = []
        for r in cursor.fetchall():
            registro = {
                "id": r[0],
                "bus_id": r[1],
                "bus_placa": r[2],
                "aparcadero_id": r[3],
                "aparcadero_municipio": r[4],
                "hora_llegada": r[5].isoformat() if r[5] else None,
                "hora_salida": r[6].isoformat() if r[6] else None,
                "destino": r[7]
            }
            registros.append(registro)
        
        return registros
        
    except Exception as e:
        logger.error("Error al obtener registros: %s", e)
        raise HTTPException(status_code=500, detail="Error al obtener registros")
    finally:
        conn.close()

@app.get("/buses", response_model=List[dict])
def obtener_buses():
    conn = get_db_connection()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, placa, ST_AsGeoJSON(coordenadas), destino 
            FROM buses
            ORDER BY id
        """)
        
        buses = []
        for b in cursor.fetchall():
            bus = {
                "id": b[0],
                "placa": b[1],
                "coordenadas": b[2],
                "destino": b[3]
            }
            buses.append(bus)
            
        return buses
        
    except Exception as e:
        logger.error("Error al obtener buses: %s", e)
        raise HTTPException(status_code=500, detail="Error al obtener buses")
    finally:
        conn.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)