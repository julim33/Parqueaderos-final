

-- db/init.sql
DO $$
BEGIN
    -- Crear extensión PostGIS si no existe
    CREATE EXTENSION IF NOT EXISTS postgis;
    
    -- Verificar si la tabla ya existe
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'aparcaderos') THEN
        -- Crear tabla
        CREATE TABLE aparcaderos (
            id SERIAL PRIMARY KEY,
            municipio VARCHAR(255) NOT NULL,
            coordenadas GEOGRAPHY(POINT, 4326) NOT NULL,
            capacidad_maxima INT NOT NULL
        );
        
               -- Inserta los datos
 INSERT INTO aparcaderos (municipio, coordenadas, capacidad_maxima) VALUES
('Chocontá', ST_SetSRID(ST_MakePoint(-73.687044, 5.146678), 4326), 2),
('Tibiritá', ST_SetSRID(ST_MakePoint(-73.504577, 5.051490), 4326), 3),
('Jerusalén', ST_SetSRID(ST_MakePoint(-74.695855, 4.562677), 4326), 2),
('Ricaurte', ST_SetSRID(ST_MakePoint(-74.767717, 4.282114), 4326), 3),
('Puerto Salgar', ST_SetSRID(ST_MakePoint(-74.654130, 5.466157), 4326), 2),
('La Vega', ST_SetSRID(ST_MakePoint(-74.338211, 4.992574), 4326), 3),
('Útica', ST_SetSRID(ST_MakePoint(-74.481177, 5.185815), 4326), 2),
('Villeta', ST_SetSRID(ST_MakePoint(-74.470477, 5.013166), 4326), 4),
('Guasca', ST_SetSRID(ST_MakePoint(-73.874693, 4.869582), 4326), 3),
('Choachí', ST_SetSRID(ST_MakePoint(-73.924819, 4.526448), 4326), 2),
('Pacho', ST_SetSRID(ST_MakePoint(-74.159068, 5.140074), 4326), 2),
('Yacopí', ST_SetSRID(ST_MakePoint(-74.338550, 5.463235), 4326), 2),
('Cogua', ST_SetSRID(ST_MakePoint(-73.979012, 5.066298), 4326), 2),
('Cota', ST_SetSRID(ST_MakePoint(-74.109258, 4.807059), 4326), 3),
('Sopó', ST_SetSRID(ST_MakePoint(-73.941829, 4.913516), 4326), 4),
('Tocancipá', ST_SetSRID(ST_MakePoint(-73.905176, 4.967864), 4326), 4),
('Facatativá', ST_SetSRID(ST_MakePoint(-74.366498, 4.819769), 4326), 4),
('El Colegio', ST_SetSRID(ST_MakePoint(-74.443732, 4.582815), 4326), 2),
('Simijaca', ST_SetSRID(ST_MakePoint(-73.848055, 5.507497), 4326), 2),
('Ubaté', ST_SetSRID(ST_MakePoint(-73.819161, 5.310340), 4326), 3),
('Bogotá D.C.', ST_SetSRID(ST_MakePoint(-74.147794, 4.677584), 4326), 8);
        
        RAISE NOTICE 'Tabla aparcaderos creada exitosamente';
    ELSE
        RAISE NOTICE 'La tabla aparcaderos ya existe';
    END IF;
END $$;