-- ============================================
-- Diaz Lara - Schema MySQL
-- Ejecutar en orden, una sola vez
-- ============================================

CREATE DATABASE IF NOT EXISTS diazlara CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE diazlara;

-- --------------------------------------------
-- 1. CLIENTES
-- Leads que llegan desde el sitio web
-- --------------------------------------------
CREATE TABLE CLIENTES (
  id                 CHAR(36)      NOT NULL DEFAULT (UUID()),
  nombre             VARCHAR(100)  NOT NULL,
  apellido           VARCHAR(100),
  email              VARCHAR(255)  NOT NULL,
  telefono_whatsapp  VARCHAR(20),
  empresa            VARCHAR(150),
  puesto             VARCHAR(100),
  origen             VARCHAR(50)   DEFAULT 'web',  -- 'web' | 'masterclass' | 'referido'
  created_at         TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_email (email)
) ENGINE=InnoDB;

-- --------------------------------------------
-- 2. CONSULTORES
-- Equipo interno de Diaz Lara
-- --------------------------------------------
CREATE TABLE CONSULTORES (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  nombre       VARCHAR(100) NOT NULL,
  apellido     VARCHAR(100),
  email        VARCHAR(255) NOT NULL,
  especialidad VARCHAR(150),
  activo       TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_consultor_email (email)
) ENGINE=InnoDB;

-- --------------------------------------------
-- 3. DISPONIBILIDAD
-- Horarios recurrentes por consultor
-- dia_semana: 0=domingo ... 6=sábado
-- --------------------------------------------
CREATE TABLE DISPONIBILIDAD (
  id            CHAR(36)   NOT NULL DEFAULT (UUID()),
  consultor_id  CHAR(36)   NOT NULL,
  dia_semana    TINYINT    NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio   TIME       NOT NULL,
  hora_fin      TIME       NOT NULL,
  activo        TINYINT(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (id),
  CONSTRAINT fk_disp_consultor FOREIGN KEY (consultor_id) REFERENCES CONSULTORES(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------
-- 4. BLOQUEOS
-- Vacaciones, días sin citas, etc.
-- --------------------------------------------
CREATE TABLE BLOQUEOS (
  id            CHAR(36)     NOT NULL DEFAULT (UUID()),
  consultor_id  CHAR(36)     NOT NULL,
  inicio        TIMESTAMP    NOT NULL,
  fin           TIMESTAMP    NOT NULL,
  motivo        VARCHAR(255),
  PRIMARY KEY (id),
  CONSTRAINT fk_bloqueo_consultor FOREIGN KEY (consultor_id) REFERENCES CONSULTORES(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- --------------------------------------------
-- 5. CITAS
-- Sesiones estratégicas agendadas
-- estado: 'pendiente' | 'confirmada' | 'completada' | 'cancelada' | 'no_show'
-- --------------------------------------------
CREATE TABLE CITAS (
  id                  CHAR(36)     NOT NULL DEFAULT (UUID()),
  cliente_id          CHAR(36)     NOT NULL,
  consultor_id        CHAR(36)     NOT NULL,
  fecha_hora_inicio   TIMESTAMP    NOT NULL,
  fecha_hora_fin      TIMESTAMP    NOT NULL,
  estado              VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
  meet_link           VARCHAR(500),
  notas_cliente       TEXT,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_cita_cliente    FOREIGN KEY (cliente_id)   REFERENCES CLIENTES(id),
  CONSTRAINT fk_cita_consultor  FOREIGN KEY (consultor_id) REFERENCES CONSULTORES(id)
) ENGINE=InnoDB;

-- --------------------------------------------
-- 6. CALIFICACIONES
-- El consultor califica el lead después de la cita
-- resultado: 'caliente' | 'tibio' | 'frio' | 'no_aplica'
-- score_interes: 'alto' | 'medio' | 'bajo'
-- --------------------------------------------
CREATE TABLE CALIFICACIONES (
  id                  CHAR(36)    NOT NULL DEFAULT (UUID()),
  cita_id             CHAR(36)    NOT NULL,
  consultor_id        CHAR(36)    NOT NULL,
  resultado           VARCHAR(20),
  notas_internas      TEXT,
  score_interes       VARCHAR(10),
  exportado_hubspot   TINYINT(1)  NOT NULL DEFAULT 0,
  hubspot_export_at   TIMESTAMP   NULL,
  created_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_calificacion_cita (cita_id),
  CONSTRAINT fk_calif_cita      FOREIGN KEY (cita_id)      REFERENCES CITAS(id),
  CONSTRAINT fk_calif_consultor FOREIGN KEY (consultor_id) REFERENCES CONSULTORES(id)
) ENGINE=InnoDB;

-- --------------------------------------------
-- 7. PLANTILLAS
-- Mensajes de email / WhatsApp reutilizables
-- canal: 'email' | 'whatsapp'
-- tipo_evento: 'confirmacion' | 'recordatorio' | 'seguimiento' | 'cancelacion'
-- --------------------------------------------
CREATE TABLE PLANTILLAS (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  canal        VARCHAR(20)  NOT NULL,
  tipo_evento  VARCHAR(50)  NOT NULL,
  nombre       VARCHAR(150) NOT NULL,
  contenido    TEXT         NOT NULL,
  activa       TINYINT(1)   NOT NULL DEFAULT 1,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

-- --------------------------------------------
-- 8. NOTIFICACIONES
-- Registro de cada mensaje enviado
-- estado: 'pendiente' | 'enviado' | 'fallido'
-- --------------------------------------------
CREATE TABLE NOTIFICACIONES (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  cita_id      CHAR(36)     NOT NULL,
  canal        VARCHAR(20)  NOT NULL,
  tipo         VARCHAR(50)  NOT NULL,
  estado       VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
  contenido    TEXT,
  enviado_at   TIMESTAMP    NULL,
  created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_notif_cita FOREIGN KEY (cita_id) REFERENCES CITAS(id)
) ENGINE=InnoDB;

-- ============================================
-- Datos iniciales de prueba
-- ============================================

-- Un consultor para empezar
INSERT INTO CONSULTORES (nombre, apellido, email, especialidad) VALUES
  ('Diaz', 'Lara', 'contacto@diazlara.mx', 'Fiscal y contabilidad');

-- Disponibilidad lunes a viernes 9am - 6pm
INSERT INTO DISPONIBILIDAD (consultor_id, dia_semana, hora_inicio, hora_fin)
SELECT id, dia, '09:00:00', '18:00:00'
FROM CONSULTORES, (SELECT 1 AS dia UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5) dias
WHERE email = 'contacto@diazlara.mx';

-- Plantilla de confirmación por email
INSERT INTO PLANTILLAS (canal, tipo_evento, nombre, contenido) VALUES
  ('email', 'confirmacion', 'Confirmación de sesión estratégica',
   'Hola {{nombre}}, tu sesión con Diaz Lara está confirmada para el {{fecha}} a las {{hora}}. Tu enlace de reunión: {{meet_link}}');
