-- Представление 1: Публичное табло рейсов (для Пассажиров — скрыты внутренние ID и кассиры)
CREATE OR REPLACE VIEW v_public_schedule_PAG8 AS
SELECT 
    f.flight_id_PAG8 AS flight_id,
    f.flight_number_PAG8 AS flight_number,
    f.flight_origin_PAG8 AS origin,
    f.flight_destination_PAG8 AS destination,
    f.flight_departure_time_PAG8 AS departure_time,
    f.flight_arrival_time_PAG8 AS arrival_time,
    f.flight_status_PAG8::text AS status,
    a.aircraft_model_PAG8 AS aircraft_model,
    a.aircraft_reg_number_PAG8 AS aircraft_reg_number,
    a.aircraft_capacity_PAG8 AS capacity,
    (a.aircraft_capacity_PAG8 - COUNT(t.ticket_id_PAG8) FILTER (WHERE t.ticket_status_PAG8 = 'Оплачен'))::int AS free_seats
FROM flight_PAG8 f
JOIN aircraft_PAG8 a ON a.aircraft_reg_number_PAG8 = f.aircraft_reg_number_PAG8
LEFT JOIN ticket_PAG8 t ON t.flight_id_PAG8 = f.flight_id_PAG8
GROUP BY f.flight_id_PAG8, a.aircraft_reg_number_PAG8;

-- Представление 2: Реестр проданных билетов (для Кассира и Администратора)
CREATE OR REPLACE VIEW v_tickets_registry_PAG8 AS
SELECT 
    t.ticket_id_PAG8 AS ticket_id,
    t.ticket_number_PAG8 AS ticket_number,
    f.flight_id_PAG8 AS flight_id,
    f.flight_number_PAG8 AS flight_number,
    f.flight_origin_PAG8 || ' -> ' || f.flight_destination_PAG8 AS route,
    f.flight_departure_time_PAG8 AS departure_time,
    p.passenger_id_PAG8 AS passenger_id,
    p.passenger_surname_PAG8 || ' ' || p.passenger_name_PAG8 || COALESCE(' ' || p.passenger_patronymic_PAG8, '') AS passenger_fio,
    p.passenger_passport_PAG8 AS passport,
    t.seat_number_PAG8 AS seat_number,
    t.ticket_class_PAG8::text AS ticket_class,
    t.ticket_price_PAG8 AS price,
    t.ticket_status_PAG8 AS ticket_status,
    e.editor_fio_PAG8 AS cashier_fio
FROM ticket_PAG8 t
JOIN booking_PAG8 b ON b.booking_id_PAG8 = t.booking_id_PAG8
JOIN passenger_PAG8 p ON p.passenger_id_PAG8 = b.passenger_id_PAG8
JOIN flight_PAG8 f ON f.flight_id_PAG8 = t.flight_id_PAG8
JOIN editor_PAG8 e ON e.editor_id_PAG8 = t.editor_id_PAG8;

-- Представление 3: Справочник пассажиров и самолётов для форм
CREATE OR REPLACE VIEW v_passengers_list_PAG8 AS
SELECT passenger_id_PAG8 AS id,
       passenger_surname_PAG8 || ' ' || passenger_name_PAG8 || ' (' || passenger_passport_PAG8 || ')' AS label,
       passenger_surname_PAG8 AS surname,
       passenger_name_PAG8 AS name,
       passenger_passport_PAG8 AS passport,
       passenger_phone_PAG8 AS phone
FROM passenger_PAG8;

CREATE OR REPLACE VIEW v_aircrafts_list_PAG8 AS
SELECT aircraft_reg_number_PAG8 AS reg_number,
       aircraft_model_PAG8 AS model,
       aircraft_capacity_PAG8 AS capacity
FROM aircraft_PAG8;

CREATE OR REPLACE VIEW v_audit_log_PAG8 AS
SELECT log_id_PAG8 AS id,
       table_name_PAG8 AS table_name,
       operation_PAG8 AS operation,
       record_info_PAG8 AS record_info,
       changed_at_PAG8 AS changed_at
FROM audit_log_PAG8
ORDER BY log_id_PAG8 DESC
LIMIT 50;

-- Роли на уровне СУБД (Пункт 6 ТР)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_passenger_pag8') THEN
        CREATE ROLE role_passenger_pag8 NOLOGIN;
    END IF;
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'role_cashier_pag8') THEN
        CREATE ROLE role_cashier_pag8 NOLOGIN;
    END IF;
END $$;

GRANT SELECT ON v_public_schedule_PAG8 TO role_passenger_pag8;
GRANT SELECT ON v_public_schedule_PAG8, v_tickets_registry_PAG8, v_passengers_list_PAG8, v_aircrafts_list_PAG8 TO role_cashier_pag8;

