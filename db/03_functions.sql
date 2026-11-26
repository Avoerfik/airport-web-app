CREATE OR REPLACE FUNCTION fn_get_flight_revenue_PAG8(p_flight_id INT)
RETURNS NUMERIC(12, 2)
LANGUAGE sql
AS $$
    SELECT COALESCE(SUM(ticket_price_PAG8), 0.00)
    FROM ticket_PAG8
    WHERE flight_id_PAG8 = p_flight_id
      AND ticket_status_PAG8 = 'Оплачен';
$$;

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
        fn_get_flight_revenue_PAG8(f.flight_id_PAG8) AS total_revenue,
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

CREATE OR REPLACE FUNCTION fn_py_validate_passport_PAG8(p_passport TEXT)
RETURNS BOOLEAN
LANGUAGE plpython3u
AS $$
import re
if not p_passport:
    return False
return bool(re.match(r'^\d{4}\s\d{6}$', p_passport.strip()))
$$;

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

if float(p_load_percent) >= 80.0:
    price *= 1.25
elif float(p_load_percent) >= 50.0:
    price *= 1.10

return round(price, 2)
$$;

CREATE OR REPLACE FUNCTION fn_py_validate_seat_PAG8(p_seat TEXT, p_capacity INT)
RETURNS BOOLEAN
LANGUAGE plpython3u
AS $$
import re, math
if not p_seat:
    return False
seat = p_seat.strip().upper()
m = re.match(r'^(\d{1,2})([A-F])$', seat)
if not m:
    return False
row_num = int(m.group(1))
letter = m.group(2)
letters = ['A', 'C', 'D', 'E', 'F'] if int(p_capacity) < 120 else ['A', 'B', 'C', 'D', 'E', 'F']
if letter not in letters:
    return False
max_rows = math.ceil(int(p_capacity) / len(letters))
if row_num < 1 or row_num > max_rows:
    return False
seat_index = (row_num - 1) * len(letters) + letters.index(letter) + 1
return seat_index <= int(p_capacity)
$$;

CREATE OR REPLACE FUNCTION fn_py_get_seat_class_PAG8(p_seat TEXT)
RETURNS TEXT
LANGUAGE plpython3u
AS $$
import re
m = re.match(r'^(\d{1,2})([A-F])$', p_seat.strip().upper())
if not m:
    return 'Эконом'
row_num = int(m.group(1))
if row_num == 1:
    return 'Первый'
elif row_num <= 4:
    return 'Бизнес'
return 'Эконом'
$$;

DROP FUNCTION IF EXISTS fn_get_available_seats_PAG8(INT);
CREATE FUNCTION fn_get_available_seats_PAG8(p_flight_id INT)
RETURNS TABLE (seat_number VARCHAR, seat_class VARCHAR, final_price NUMERIC(10, 2))
LANGUAGE plpython3u
AS $$
res = plpy.execute(f"""
    SELECT a.aircraft_capacity_PAG8 AS cap, f.flight_base_price_PAG8 AS base_price
    FROM flight_PAG8 f
    JOIN aircraft_PAG8 a ON a.aircraft_reg_number_PAG8 = f.aircraft_reg_number_PAG8
    WHERE f.flight_id_PAG8 = {int(p_flight_id)}
""")
if not res:
    return []

cap = int(res['cap'])
base_price = float(res['base_price'])

occupied_res = plpy.execute(f"""
    SELECT seat_number_PAG8 AS seat
    FROM ticket_PAG8
    WHERE flight_id_PAG8 = {int(p_flight_id)} AND ticket_status_PAG8 = 'Оплачен'
""")
occupied = {r['seat'].upper() for r in occupied_res}

letters = ['A', 'C', 'D', 'E', 'F'] if cap < 120 else ['A', 'B', 'C', 'D', 'E', 'F']
seats = []
count = 0
row = 1
while count < cap:
    for l in letters:
        if count >= cap:
            break
        s = f"{row}{l}"
        if s not in occupied:
            s_class = 'Первый' if row == 1 else ('Бизнес' if row <= 4 else 'Эконом')
            mult = 2.5 if row == 1 else (1.8 if row <= 4 else 1.0)
            seats.append((s, s_class, round(base_price * mult, 2)))
        count += 1
    row += 1
return seats
$$;

