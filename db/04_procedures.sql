CREATE OR REPLACE PROCEDURE sp_create_flight_PAG8(
    p_flight_number VARCHAR,
    p_origin VARCHAR,
    p_destination VARCHAR,
    p_departure TIMESTAMP,
    p_arrival TIMESTAMP,
    p_reg_number VARCHAR,
    p_base_price NUMERIC DEFAULT 15000.00
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO flight_PAG8 (
        flight_number_PAG8, flight_origin_PAG8, flight_destination_PAG8,
        flight_departure_time_PAG8, flight_arrival_time_PAG8, aircraft_reg_number_PAG8, flight_base_price_PAG8
    ) VALUES (
        p_flight_number, p_origin, p_destination, p_departure, p_arrival, p_reg_number, p_base_price
    );
END;
$$;

CREATE OR REPLACE PROCEDURE sp_update_flight_price_PAG8(
    p_flight_id INT,
    p_new_price NUMERIC
)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE flight_PAG8
    SET flight_base_price_PAG8 = p_new_price
    WHERE flight_id_PAG8 = p_flight_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Рейс с ID % не найден', p_flight_id;
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_update_flight_status_PAG8(p_flight_id INT, p_new_status VARCHAR)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE flight_PAG8
    SET flight_status_PAG8 = p_new_status::flight_status_type_PAG8
    WHERE flight_id_PAG8 = p_flight_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Рейс с ID % не найден', p_flight_id;
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_delete_flight_PAG8(p_flight_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM flight_PAG8 WHERE flight_id_PAG8 = p_flight_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Рейс с ID % не найден', p_flight_id;
    END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_register_passenger_PAG8(
    p_surname VARCHAR, p_name VARCHAR, p_patronymic VARCHAR,
    p_birthdate DATE, p_passport VARCHAR, p_phone VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
    INSERT INTO passenger_PAG8 (
        passenger_surname_PAG8, passenger_name_PAG8, passenger_patronymic_PAG8,
        passenger_birthdate_PAG8, passenger_passport_PAG8, passenger_phone_PAG8
    ) VALUES (p_surname, p_name, p_patronymic, p_birthdate, p_passport, p_phone);
END;
$$;

CREATE OR REPLACE PROCEDURE sp_issue_ticket_PAG8(
    p_passenger_id INT,
    p_flight_id INT,
    p_editor_id INT,
    p_seat_number VARCHAR,
    p_ticket_class VARCHAR DEFAULT NULL,
    p_custom_base_price NUMERIC DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    v_booking_id INT;
    v_ticket_num VARCHAR(15);
    v_load_pct NUMERIC;
    v_base_price NUMERIC(10, 2);
    v_actual_class TEXT;
    v_final_price NUMERIC(10, 2);
BEGIN
    -- Берём базовый тариф рейса из БД, если кассир/админ не передал ручную цену
    SELECT flight_base_price_PAG8 INTO v_base_price
    FROM flight_PAG8
    WHERE flight_id_PAG8 = p_flight_id;

    IF p_custom_base_price IS NOT NULL AND p_custom_base_price > 0 THEN
        v_base_price := p_custom_base_price;
    END IF;

    -- Определяем класс места строго по ряду салона (1 = Первый, 2-4 = Бизнес, 5+ = Эконом)
    v_actual_class := fn_py_get_seat_class_PAG8(p_seat_number);

    SELECT COALESCE(load_percent, 0) INTO v_load_pct
    FROM fn_flights_analytics_PAG8()
    WHERE flight_id = p_flight_id;

    v_final_price := fn_py_calc_dynamic_price_PAG8(v_base_price, v_actual_class, v_load_pct);

    INSERT INTO booking_PAG8 (passenger_id_PAG8)
    VALUES (p_passenger_id)
    RETURNING booking_id_PAG8 INTO v_booking_id;

    v_ticket_num := 'TKT-' || LPAD(nextval('ticket_pag8_ticket_id_pag8_seq')::text, 5, '0');

    INSERT INTO ticket_PAG8 (
        booking_id_PAG8, flight_id_PAG8, editor_id_PAG8,
        ticket_number_PAG8, ticket_class_PAG8, ticket_price_PAG8, seat_number_PAG8
    ) VALUES (
        v_booking_id, p_flight_id, p_editor_id,
        v_ticket_num, v_actual_class::ticket_class_type_PAG8, v_final_price, UPPER(p_seat_number)
    );
END;
$$;

CREATE OR REPLACE PROCEDURE sp_cancel_ticket_PAG8(p_ticket_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE ticket_PAG8 SET ticket_status_PAG8 = 'Аннулирован' WHERE ticket_id_PAG8 = p_ticket_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Билет с ID % не найден', p_ticket_id; END IF;
END;
$$;

CREATE OR REPLACE PROCEDURE sp_delete_ticket_PAG8(p_ticket_id INT)
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM ticket_PAG8 WHERE ticket_id_PAG8 = p_ticket_id;
    IF NOT FOUND THEN RAISE EXCEPTION 'Билет с ID % не найден', p_ticket_id; END IF;
END;
$$;

