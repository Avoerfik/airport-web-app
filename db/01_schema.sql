CREATE EXTENSION IF NOT EXISTS plpython3u;

CREATE TYPE flight_status_type_PAG8 AS ENUM (
    'Регистрация', 'Вылетел', 'Задержан', 'Прибыл', 'Отменен'
);

CREATE TYPE ticket_class_type_PAG8 AS ENUM (
    'Эконом', 'Бизнес', 'Первый'
);

-- 1. Справочник самолётов
CREATE TABLE aircraft_PAG8 (
    aircraft_reg_number_PAG8 VARCHAR(20) PRIMARY KEY,
    aircraft_model_PAG8      VARCHAR(50) NOT NULL,
    aircraft_capacity_PAG8   SMALLINT    NOT NULL CHECK (aircraft_capacity_PAG8 > 0)
);

-- 2. Справочник кассиров / диспетчеров
CREATE TABLE editor_PAG8 (
    editor_id_PAG8       SERIAL PRIMARY KEY,
    editor_fio_PAG8      VARCHAR(100) NOT NULL,
    editor_position_PAG8 VARCHAR(50)  NOT NULL,
    editor_phone_PAG8    VARCHAR(16)  NOT NULL UNIQUE
);

-- 3. Справочник пассажиров
CREATE TABLE passenger_PAG8 (
    passenger_id_PAG8         SERIAL PRIMARY KEY,
    passenger_surname_PAG8    VARCHAR(50) NOT NULL,
    passenger_name_PAG8       VARCHAR(50) NOT NULL,
    passenger_patronymic_PAG8 VARCHAR(50),
    passenger_birthdate_PAG8  DATE        NOT NULL,
    passenger_passport_PAG8   VARCHAR(20) NOT NULL UNIQUE,
    passenger_phone_PAG8      VARCHAR(16)
);

-- 4. Рейсы
CREATE TABLE flight_PAG8 (
    flight_id_PAG8             SERIAL PRIMARY KEY,
    flight_number_PAG8         VARCHAR(10)             NOT NULL,
    flight_origin_PAG8         VARCHAR(100)            NOT NULL,
    flight_destination_PAG8    VARCHAR(100)            NOT NULL,
    flight_departure_time_PAG8 TIMESTAMP               NOT NULL,
    flight_arrival_time_PAG8   TIMESTAMP               NOT NULL,
    flight_status_PAG8         flight_status_type_PAG8 NOT NULL DEFAULT 'Регистрация',
    flight_base_price_PAG8     NUMERIC(10, 2)          NOT NULL DEFAULT 15000.00 CHECK (flight_base_price_PAG8 > 0),
    aircraft_reg_number_PAG8   VARCHAR(20)             NOT NULL REFERENCES aircraft_PAG8(aircraft_reg_number_PAG8) ON DELETE RESTRICT ON UPDATE CASCADE,
    CHECK (flight_arrival_time_PAG8 > flight_departure_time_PAG8)
);

-- 5. Бронирования
CREATE TABLE booking_PAG8 (
    booking_id_PAG8   SERIAL PRIMARY KEY,
    passenger_id_PAG8 INT  NOT NULL REFERENCES passenger_PAG8(passenger_id_PAG8) ON DELETE RESTRICT ON UPDATE CASCADE,
    booking_date_PAG8 DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 6. Билеты
CREATE TABLE ticket_PAG8 (
    ticket_id_PAG8            SERIAL PRIMARY KEY,
    booking_id_PAG8           INT                    NOT NULL REFERENCES booking_PAG8(booking_id_PAG8) ON DELETE CASCADE ON UPDATE CASCADE,
    flight_id_PAG8            INT                    NOT NULL REFERENCES flight_PAG8(flight_id_PAG8) ON DELETE RESTRICT ON UPDATE CASCADE,
    editor_id_PAG8            INT                    NOT NULL REFERENCES editor_PAG8(editor_id_PAG8) ON DELETE RESTRICT ON UPDATE CASCADE,
    ticket_number_PAG8        VARCHAR(15)            NOT NULL UNIQUE,
    ticket_class_PAG8         ticket_class_type_PAG8 NOT NULL,
    ticket_price_PAG8         NUMERIC(10, 2)         NOT NULL CHECK (ticket_price_PAG8 >= 0),
    seat_number_PAG8          VARCHAR(5)             NOT NULL,
    ticket_purchase_date_PAG8 DATE                   NOT NULL DEFAULT CURRENT_DATE,
    ticket_status_PAG8        VARCHAR(20)            NOT NULL DEFAULT 'Оплачен',
    UNIQUE (flight_id_PAG8, seat_number_PAG8)
);

-- 7. Журнал аудита (для триггеров)
CREATE TABLE audit_log_PAG8 (
    log_id_PAG8      SERIAL PRIMARY KEY,
    table_name_PAG8  VARCHAR(50) NOT NULL,
    operation_PAG8   VARCHAR(10) NOT NULL,
    record_info_PAG8 TEXT        NOT NULL,
    changed_at_PAG8  TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ИНДЕКСЫ
CREATE INDEX idx_flight_route_time_PAG8 ON flight_PAG8 (flight_origin_PAG8, flight_destination_PAG8, flight_departure_time_PAG8);
CREATE INDEX idx_ticket_flight_status_PAG8 ON ticket_PAG8 (flight_id_PAG8, ticket_status_PAG8);
CREATE INDEX idx_passenger_surname_PAG8 ON passenger_PAG8 (passenger_surname_PAG8);

