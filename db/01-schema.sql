-- Создание ENUM для статусов
CREATE TYPE flight_status AS ENUM ('По расписанию', 'Задержан', 'Вылетел', 'Прибыл', 'Отменен');
CREATE TYPE ticket_class AS ENUM ('Эконом', 'Бизнес', 'Первый');

-- Таблица Самолеты
CREATE TABLE aircraft (
    id SERIAL PRIMARY KEY,
    model VARCHAR(50) NOT NULL,
    reg_number VARCHAR(20) NOT NULL UNIQUE,
    capacity INT NOT NULL CHECK (capacity > 0)
);

-- Таблица Пассажиры
CREATE TABLE passenger (
    id SERIAL PRIMARY KEY,
    surname VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    patronymic VARCHAR(50),
    passport VARCHAR(20) NOT NULL UNIQUE,
    phone VARCHAR(16)
);

-- Таблица Рейсы
CREATE TABLE flight (
    id SERIAL PRIMARY KEY,
    flight_number VARCHAR(10) NOT NULL,
    origin VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    departure_time TIMESTAMP NOT NULL,
    arrival_time TIMESTAMP NOT NULL,
    status flight_status DEFAULT 'По расписанию',
    aircraft_id INT NOT NULL REFERENCES aircraft(id) ON DELETE RESTRICT
);

-- Таблица Билеты
CREATE TABLE ticket (
    id SERIAL PRIMARY KEY,
    flight_id INT NOT NULL REFERENCES flight(id) ON DELETE CASCADE,
    passenger_id INT NOT NULL REFERENCES passenger(id) ON DELETE CASCADE,
    seat_number VARCHAR(5) NOT NULL,
    ticket_class ticket_class NOT NULL,
    price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
    purchase_date DATE DEFAULT CURRENT_DATE,
    UNIQUE (flight_id, seat_number) -- Одно место на рейс - один билет
);