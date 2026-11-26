INSERT INTO aircraft_PAG8 (aircraft_reg_number_PAG8, aircraft_model_PAG8, aircraft_capacity_PAG8) VALUES
('RA-73021', 'Airbus A320', 180),
('VP-BQG',   'Boeing 737-800', 189),
('RA-89011', 'Sukhoi Superjet 100', 98);

INSERT INTO editor_PAG8 (editor_fio_PAG8, editor_position_PAG8, editor_phone_PAG8) VALUES
('Сидоров А. В.', 'Старший кассир', '+79020010101'),
('Кузнецова Е. Н.', 'Диспетчер расписания', '+79020020202');

CALL sp_register_passenger_PAG8('Иванов', 'Пётр', 'Сергеевич', '1990-01-15', '4501 234567', '+79161234567');
CALL sp_register_passenger_PAG8('Петрова', 'Мария', 'Ивановна', '1995-05-25', '4510 987654', '+79039876543');
CALL sp_register_passenger_PAG8('Смирнов', 'Алексей', 'Дмитриевич', '1988-11-11', '4532 112233', '+79997778899');

CALL sp_create_flight_PAG8('SU-1234', 'Москва', 'Париж', '2026-12-01 08:30:00', '2026-12-01 11:30:00', 'RA-73021');
CALL sp_create_flight_PAG8('S7-5678', 'Москва', 'Новосибирск', '2026-12-02 14:00:00', '2026-12-02 19:00:00', 'VP-BQG');
CALL sp_create_flight_PAG8('A4-1111', 'Москва', 'Сочи', '2026-12-03 10:00:00', '2026-12-03 12:00:00', 'RA-89011');

CALL sp_issue_ticket_PAG8(1, 1, 1, '12A', 'Эконом', 20000.00);
CALL sp_issue_ticket_PAG8(2, 1, 1, '1C',  'Бизнес', 20000.00);
CALL sp_issue_ticket_PAG8(3, 2, 1, '15B', 'Эконом', 15000.00);

