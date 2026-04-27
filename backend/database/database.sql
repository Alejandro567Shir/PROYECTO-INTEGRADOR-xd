DROP TABLE IF EXISTS documentos CASCADE;
DROP TABLE IF EXISTS comentarios CASCADE;
DROP TABLE IF EXISTS historial CASCADE;
DROP TABLE IF EXISTS repositorios CASCADE;
DROP TABLE IF EXISTS proyectos CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;

CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    correo VARCHAR(150) NOT NULL UNIQUE,
    clave VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    CONSTRAINT usuarios_rol_check CHECK (
        rol IN (
            'ALUMNO',
            'DOCENTE',
            'DIRECTOR_TITULACION',
            'SECRETARIA',
            'COORDINADOR_CARRERA'
        )
    )
);

CREATE UNIQUE INDEX unico_docente
ON usuarios (rol)
WHERE rol = 'DOCENTE';

CREATE UNIQUE INDEX unico_director
ON usuarios (rol)
WHERE rol = 'DIRECTOR_TITULACION';

CREATE UNIQUE INDEX unico_secretaria
ON usuarios (rol)
WHERE rol = 'SECRETARIA';

CREATE UNIQUE INDEX unico_coordinador
ON usuarios (rol)
WHERE rol = 'COORDINADOR_CARRERA';

CREATE TABLE proyectos (
    id SERIAL PRIMARY KEY,
    estudiante_id INT NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(100) NOT NULL DEFAULT 'BORRADOR',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT proyectos_estado_check CHECK (
        estado IN (
            'BORRADOR',
            'EN_REVISION_F1',
            'APROBADO_F1',
            'EN_REVISION_F2',
            'APROBADO_F2',
            'VALIDACION_LOCAL',
            'REVISION_SEDE_CENTRAL',
            'FINALIZADO'
        )
    ),
    CONSTRAINT fk_estudiante
        FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE historial (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL,
    accion TEXT NOT NULL,
    estado_nuevo VARCHAR(100),
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_historial_proyecto
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE comentarios (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    comentario TEXT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comentario_proyecto
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    CONSTRAINT fk_comentario_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE repositorios (
    id SERIAL PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_repositorio_proyecto
        FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
);

CREATE TABLE documentos (
    id SERIAL PRIMARY KEY,
    repositorio_id INT NOT NULL,
    usuario_id INT NOT NULL,
    nombre_archivo VARCHAR(255) NOT NULL,
    tipo_archivo VARCHAR(50),
    ruta_archivo VARCHAR(255) NOT NULL,
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documento_repositorio
        FOREIGN KEY (repositorio_id) REFERENCES repositorios(id) ON DELETE CASCADE,
    CONSTRAINT fk_documento_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

INSERT INTO usuarios (nombre, correo, clave, rol) VALUES
('María Gómez', 'alumno1@espoch.edu.ec', '1234', 'ALUMNO'),
('Juan Pérez', 'alumno2@espoch.edu.ec', 'juan2026', 'ALUMNO'),
('Carlos López', 'alumno3@espoch.edu.ec', 'carlos2026', 'ALUMNO'),
('Ana Ruiz', 'alumno4@espoch.edu.ec', 'ana2026', 'ALUMNO'),
('Ing. Ramiro Bonilla', 'docente@espoch.edu.ec', 'docente123', 'DOCENTE'),
('Ing. Roberto Basconez', 'director@espoch.edu.ec', 'director123', 'DIRECTOR_TITULACION'),
('Ing. Mariana Moposita', 'secretaria@espoch.edu.ec', 'secretaria123', 'SECRETARIA'),
('Ing. Coordinador TI', 'coordinador@espoch.edu.ec', 'coordinador123', 'COORDINADOR_CARRERA');

INSERT INTO proyectos (estudiante_id, titulo, descripcion, estado) VALUES
(1, 'Sistema Web IA para la Amazonía', 'Proyecto integrador orientado a la gestión de titulación.', 'BORRADOR'),
(2, 'Redes IoT para Agricultura', 'Monitoreo de variables ambientales en cultivos.', 'EN_REVISION_F1'),
(3, 'App Móvil de Turismo', 'Aplicación móvil para promoción turística.', 'EN_REVISION_F2'),
(4, 'Migración a IPv6', 'Plan de migración y validación de red institucional.', 'VALIDACION_LOCAL');

INSERT INTO historial (proyecto_id, accion, estado_nuevo) VALUES
(1, 'Proyecto creado por el estudiante', 'BORRADOR'),
(2, 'Proyecto enviado a revisión F1', 'EN_REVISION_F1'),
(3, 'Proyecto aprobado en F1 y enviado a F2', 'EN_REVISION_F2'),
(4, 'Proyecto validado por director y enviado a coordinación', 'VALIDACION_LOCAL');

INSERT INTO comentarios (proyecto_id, usuario_id, comentario) VALUES
(2, 5, 'Revisar la introducción y mejorar la justificación.'),
(3, 6, 'La rúbrica está completa, pendiente validación final.');

INSERT INTO repositorios (proyecto_id, nombre, descripcion) VALUES
(1, 'Repositorio Proyecto María', 'Documentos del proyecto Sistema Web IA para la Amazonía'),
(2, 'Repositorio Proyecto Juan', 'Documentos del proyecto Redes IoT para Agricultura'),
(3, 'Repositorio Proyecto Carlos', 'Documentos del proyecto App Móvil de Turismo'),
(4, 'Repositorio Proyecto Ana', 'Documentos del proyecto Migración a IPv6');

INSERT INTO documentos (repositorio_id, usuario_id, nombre_archivo, tipo_archivo, ruta_archivo) VALUES
(1, 1, 'anteproyecto_maria.pdf', 'pdf', '/uploads/anteproyectos/anteproyecto_maria.pdf'),
(2, 2, 'perfil_juan.pdf', 'pdf', '/uploads/perfiles/perfil_juan.pdf'),
(3, 3, 'anteproyecto_carlos.pdf', 'pdf', '/uploads/anteproyectos/anteproyecto_carlos.pdf'),
(4, 4, 'documentacion_ana.pdf', 'pdf', '/uploads/actas/documentacion_ana.pdf');