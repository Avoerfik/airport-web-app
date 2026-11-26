-- 1. Скалярная функция: расчёт общей выручки по конкретному рейсу (Пункт 8 ТР)
CREATE OR REPLACE FUNCTION fn_get_flight_revenue_PAG8(p_flight_id INT)
RETURNS NUMERIC(12, 2)
LANGUAGE sql
AS $$
    SELECT COALESCE(SUM(ticket_price_PAG8), 0.00)
    FROM ticket_PAG8
    WHERE flight_id_PAG8 = p_flight_id
      AND ticket_status_PAG8 = 'Оплачен';
$$;

-- 2. Табличная функция: финансовая аналитика по всем рейсам (Пункт 8 ТР)
CREATE OR REPLACE FUNCTION fn_flights_analytics_PAG8()
RETURNS TABLE (
    flight_id INT,
    flight_number VARCHAR,
    route TEXT,
    tickets_sold BIGINT,
    total_revenue NUMERIC(12, 2),
    load_percent NUMERIC(5, 2)
)
LANGUAGE sql
AS $$
    SELECT 
        f.flight_id_PAG8,
        f.flight_number_PAG8,
        f.flight_origin_PAG8 || ' -> ' || f.flight_destination_PAG8,
        COUNT(t.ticket_id_PAG8) FILTER (WHERE t.ticket_status_PAG8 = 'Оплачен'),
        fn_get_flight_revenue_PAG8(f.flight_id_PAG8),
        ROUND(
            (COUNT(t.ticket_id_PAG8) FILTER (WHERE t.ticket_status_PAG8 = 'Оплачен')::numeric / a.aircraft_capacity_PAG8) * 100,
            2
        )
    FROM flight_PAG8 f
    JOIN aircraft_PAG8 a ON a.aircraft_reg_number_PAG8 = f.aircraft_reg_number_PAG8
    LEFT JOIN ticket_PAG8 t ON t.flight_id_PAG8 = f.flight_id_PAG8
    GROUP BY f.flight_id_PAG8, a.aircraft_capacity_PAG8
    ORDER BY total_revenue DESC;
$$;

-- 3. Функция на PL/Python (plpython3u): валидация серии и номера паспорта РФ (Пункт 9 ТР)
CREATE OR REPLACE FUNCTION fn_py_validate_passport_PAG8(p_passport TEXT)
RETURNS BOOLEAN
LANGUAGE plpython3u
AS $$
import re
if not p_passport:
    return False
# Формат РФ: 4 цифры, пробел, 6 цифр (например, 4501 234567)
return bool(re.match(r'^\d{4}\s\d{6}$', p_passport.strip()))
$$;

-- 4. Функция на PL/Python (plpython3u): динамический расчёт цены билета по классу и загруженности (Пункт 9 ТР)
CREATE OR REPLACE FUNCTION fn_py_calc_dynamic_price_PAG8(
    p_base_price NUMERIC,
    p_ticket_class TEXT,
    p_load_percent NUMERIC
)
RETURNS NUMERIC(10, 2)
LANGUAGE plpython3u
AS $$
price = float(p_base_price)
if p_ticket_class == 'Бизнес':
    price *= 1.8
elif p_ticket_class == 'Первый':
    price *= 2.5

# Повышающий коэффициент при высокой заполняемости салона
if float(p_load_percent) >= 80.0:
    price *= 1.25
elif float(p_load_percent) >= 50.0:
    price *= 1.10

return round(price, 2)
$$;

