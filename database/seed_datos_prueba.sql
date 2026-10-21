USE patitas_felices;

INSERT INTO rol (nombre) VALUES ('Administrador'), ('Veterinario'), ('Dueño de mascota');

INSERT INTO especialidad (nombre) VALUES ('Medicina General'), ('Cirugía'), ('Dermatología');

-- Contraseñas de prueba (en el sistema real se guardan cifradas con bcrypt)
INSERT INTO usuario (nombre, apellido, correo, contrasena, telefono, id_rol) VALUES
('Ana',   'Torres',  'admin@patitas.pe',   'hash_demo', '999111222', 1),
('Luis',  'Ramos',   'luis.ramos@patitas.pe', 'hash_demo', '999333444', 2),
('Carla', 'Mendoza', 'carla.mendoza@patitas.pe', 'hash_demo', '999555666', 2),
('Pedro', 'Quispe',  'pedro@correo.com',   'hash_demo', '988777111', 3),
('María', 'Salas',   'maria@correo.com',   'hash_demo', '988777222', 3);

INSERT INTO veterinario (id_usuario, numero_colegiatura, id_especialidad) VALUES
(2, 'CMVP-1021', 1),
(3, 'CMVP-2045', 2);

INSERT INTO mascota (nombre, especie, raza, peso, fecha_nacimiento, id_usuario) VALUES
('Firulais', 'Perro', 'Mestizo',   12.50, '2020-03-10', 4),
('Michi',    'Gato',  'Siamés',     4.20, '2021-07-22', 4),
('Luna',     'Perro', 'Labrador',  25.00, '2019-11-05', 5);

-- Lunes a viernes: Luis 08:00-13:00, Carla 14:00-19:00
INSERT INTO horario_veterinario (id_veterinario, dia_semana, hora_inicio, hora_fin) VALUES
(1,1,'08:00','13:00'),(1,2,'08:00','13:00'),(1,3,'08:00','13:00'),(1,4,'08:00','13:00'),(1,5,'08:00','13:00'),
(2,1,'14:00','19:00'),(2,2,'14:00','19:00'),(2,3,'14:00','19:00'),(2,4,'14:00','19:00'),(2,5,'14:00','19:00');

INSERT INTO cita (id_mascota, id_veterinario, fecha_hora, motivo, estado) VALUES
(1, 1, '2026-11-02 09:00:00', 'Vacunación anual',      'Programada'),
(2, 1, '2026-11-02 09:30:00', 'Control de peso',       'Programada'),
(3, 2, '2026-11-03 15:00:00', 'Revisión de la piel',   'Programada'),
(1, 1, '2026-10-10 10:00:00', 'Consulta por cojera',   'Atendida'),
(2, 2, '2026-10-15 16:00:00', 'Esterilización',        'Cancelada');
