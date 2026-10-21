-- =====================================================
-- Clínica Veterinaria "Patitas Felices"
-- Esquema de base de datos (MySQL 8 / MariaDB de XAMPP)
-- =====================================================
DROP DATABASE IF EXISTS patitas_felices;
CREATE DATABASE patitas_felices CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE patitas_felices;

CREATE TABLE rol (
  id_rol INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE usuario (
  id_usuario INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  apellido VARCHAR(60) NOT NULL,
  correo VARCHAR(100) NOT NULL UNIQUE,
  contrasena VARCHAR(255) NOT NULL,
  telefono VARCHAR(15),
  id_rol INT NOT NULL,
  CONSTRAINT fk_usuario_rol FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
) ENGINE=InnoDB;

CREATE TABLE mascota (
  id_mascota INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL,
  especie VARCHAR(30) NOT NULL,
  raza VARCHAR(60),
  peso DECIMAL(5,2) CHECK (peso > 0),
  fecha_nacimiento DATE,
  id_usuario INT NOT NULL,
  CONSTRAINT fk_mascota_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario)
) ENGINE=InnoDB;

CREATE TABLE especialidad (
  id_especialidad INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(60) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE veterinario (
  id_veterinario INT AUTO_INCREMENT PRIMARY KEY,
  id_usuario INT NOT NULL UNIQUE,
  numero_colegiatura VARCHAR(20) NOT NULL UNIQUE,
  id_especialidad INT NOT NULL,
  CONSTRAINT fk_vet_usuario FOREIGN KEY (id_usuario) REFERENCES usuario(id_usuario),
  CONSTRAINT fk_vet_especialidad FOREIGN KEY (id_especialidad) REFERENCES especialidad(id_especialidad)
) ENGINE=InnoDB;

CREATE TABLE horario_veterinario (
  id_horario INT AUTO_INCREMENT PRIMARY KEY,
  id_veterinario INT NOT NULL,
  dia_semana TINYINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7), -- 1=Lunes ... 7=Domingo
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  CONSTRAINT chk_horas CHECK (hora_fin > hora_inicio),
  CONSTRAINT fk_horario_vet FOREIGN KEY (id_veterinario) REFERENCES veterinario(id_veterinario)
) ENGINE=InnoDB;

CREATE TABLE cita (
  id_cita INT AUTO_INCREMENT PRIMARY KEY,
  id_mascota INT NOT NULL,
  id_veterinario INT NOT NULL,
  fecha_hora DATETIME NOT NULL,
  motivo VARCHAR(255) NOT NULL,
  estado ENUM('Programada','En atención','Atendida','Cancelada') NOT NULL DEFAULT 'Programada',
  fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cita_mascota FOREIGN KEY (id_mascota) REFERENCES mascota(id_mascota),
  CONSTRAINT fk_cita_vet FOREIGN KEY (id_veterinario) REFERENCES veterinario(id_veterinario),
  INDEX idx_cita_vet_fecha (id_veterinario, fecha_hora),
  INDEX idx_cita_mascota (id_mascota)
) ENGINE=InnoDB;
