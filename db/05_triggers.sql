-- Универсальная функция аудита
CREATE OR REPLACE FUNCTION trg_fn_audit_PAG8()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_info TEXT;
BEGIN
    IF TG_OP = 'DELETE' THEN
        v_info := row_to_json(OLD)::text;
    ELSE
        v_info := row_to_json(NEW)::text;
    END IF;

    INSERT INTO audit_log_PAG8 (table_name_PAG8, operation_PAG8, record_info_PAG8)
    VALUES (TG_TABLE_NAME, TG_OP, LEFT(v_info, 250));

    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$;

-- 1. Триггер на таблицу aircraft_PAG8 (аудит изменений парка ВС)
CREATE TRIGGER trg_aircraft_audit_PAG8
AFTER INSERT OR UPDATE OR DELETE ON aircraft_PAG8
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_PAG8();

-- 2. Триггер на таблицу editor_PAG8 (аудит кассиров)
CREATE TRIGGER trg_editor_audit_PAG8
AFTER INSERT OR UPDATE OR DELETE ON editor_PAG8
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_PAG8();

-- 3. Триггер на таблицу passenger_PAG8 (проверка паспорта через PL/Python перед вставкой/обновлением)
CREATE OR REPLACE FUNCTION trg_fn_validate_passenger_PAG8()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF NOT fn_py_validate_passport_PAG8(NEW.passenger_passport_PAG8) THEN
        RAISE EXCEPTION 'Неверный формат паспорта "%"! Ожидается формат: XXXX XXXXXX', NEW.passenger_passport_PAG8;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_passenger_validate_PAG8
BEFORE INSERT OR UPDATE ON passenger_PAG8
FOR EACH ROW EXECUTE FUNCTION trg_fn_validate_passenger_PAG8();

-- 4. Триггер на таблицу flight_PAG8 (запрет удаления вылетевшего или прибывшего рейса)
CREATE OR REPLACE FUNCTION trg_fn_protect_flight_PAG8()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF OLD.flight_status_PAG8 IN ('Вылетел', 'Прибыл') THEN
        RAISE EXCEPTION 'Нельзя удалить рейс %, так как он уже %!', OLD.flight_number_PAG8, OLD.flight_status_PAG8;
    END IF;
    RETURN OLD;
END;
$$;

CREATE TRIGGER trg_flight_protect_delete_PAG8
BEFORE DELETE ON flight_PAG8
FOR EACH ROW EXECUTE FUNCTION trg_fn_protect_flight_PAG8();

-- 5. Триггер на таблицу booking_PAG8 (аудит создания брони)
CREATE TRIGGER trg_booking_audit_PAG8
AFTER INSERT OR DELETE ON booking_PAG8
FOR EACH ROW EXECUTE FUNCTION trg_fn_audit_PAG8();

-- 6. Триггер на таблицу ticket_PAG8 (проверка вместимости самолёта + аудит)
CREATE OR REPLACE FUNCTION trg_fn_check_ticket_capacity_PAG8()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_capacity INT;
    v_sold INT;
BEGIN
    SELECT a.aircraft_capacity_PAG8 INTO v_capacity
    FROM flight_PAG8 f
    JOIN aircraft_PAG8 a ON a.aircraft_reg_number_PAG8 = f.aircraft_reg_number_PAG8
    WHERE f.flight_id_PAG8 = NEW.flight_id_PAG8;

    SELECT COUNT(*) INTO v_sold
    FROM ticket_PAG8
    WHERE flight_id_PAG8 = NEW.flight_id_PAG8
      AND ticket_status_PAG8 = 'Оплачен';

    IF v_sold >= v_capacity THEN
        RAISE EXCEPTION 'Все места на данном рейсе распроданы (вместимость: %)!', v_capacity;
    END IF;

    INSERT INTO audit_log_PAG8 (table_name_PAG8, operation_PAG8, record_info_PAG8)
    VALUES ('ticket_PAG8', 'INSERT', 'Оформлен билет ' || NEW.ticket_number_PAG8 || ' на место ' || NEW.seat_number_PAG8);

    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ticket_before_insert_PAG8
BEFORE INSERT ON ticket_PAG8
FOR EACH ROW EXECUTE FUNCTION trg_fn_check_ticket_capacity_PAG8();

-- 7. Триггер на таблицу audit_log_PAG8 (защита журнала аудита от удаления записей)
CREATE OR REPLACE FUNCTION trg_fn_protect_audit_PAG8()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Удаление записей из журнала аудита строго запрещено!';
END;
$$;

CREATE TRIGGER trg_audit_protect_delete_PAG8
BEFORE DELETE ON audit_log_PAG8
FOR EACH ROW EXECUTE FUNCTION trg_fn_protect_audit_PAG8();

