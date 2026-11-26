-- Тестовые данные
INSERT INTO aircraft (model, reg_number, capacity) VALUES 
('Airbus A320', 'RA-73021', 180),
('Boeing 737', 'VP-BQG', 189),
('SSJ-100', 'RA-89012', 100);

INSERT INTO passenger (surname, first_name, patronymic, passport, phone) VALUES 
('Иванов', 'Пётр', 'Сергеевич', '4501 123456', '+79161234567'),
('Петрова', 'Мария', 'Ивановна', '4510 987654', '+79039876543');

INSERT INTO flight (flight_number, origin, destination, departure_time, arrival_time, aircraft_id) VALUES 
('SU-1234', 'Москва', 'Сочи', '2026-09-01 08:30:00', '2026-09-01 11:30:00', 1),
('S7-5678', 'Москва', 'Новосибирск', '2026-09-02 14:00:00', '2026-09-02 19:00:00', 2);

INSERT INTO ticket (flight_id, passenger_id, seat_number, ticket_class, price) VALUES 
(1, 1, '12A', 'Эконом', 24500.00),
(2, 2, '1C', 'Бизнес', 48000.00);