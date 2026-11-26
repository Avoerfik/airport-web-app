import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API = 'http://' + window.location.hostname + ':8000';

export function TicketTab({ role, flights, tickets, passengers, selectedFlightId, authHeaders, onRefresh }: any) {
  const [ticketForm, setTicketForm] = useState({
    passenger_id: '',
    flight_id: selectedFlightId || '',
    seat_class: '',
    seat_number: '',
    custom_price: '',
  });

  const [availableSeats, setAvailableSeats] = useState<any[]>([]);

  const loadSeats = async (fid: string) => {
    if (!fid) {
      setAvailableSeats([]);
      return;
    }
    try {
      const res = await axios.get(API + '/flights/' + fid + '/seats');
      setAvailableSeats(Array.isArray(res.data) ? res.data : []);
    } catch (e) {
      console.error(e);
      setAvailableSeats([]);
    }
  };

  useEffect(() => {
    if (role !== 'passenger') {
      setTicketForm({ passenger_id: '', flight_id: '', seat_class: '', seat_number: '', custom_price: '' });
      setAvailableSeats([]);
      return;
    }
    if (selectedFlightId) {
      const fid = String(selectedFlightId);
      setTicketForm((prev) => ({ ...prev, flight_id: fid, seat_class: '', seat_number: '' }));
      loadSeats(fid);
    }
  }, [selectedFlightId]);

  useEffect(() => {
    if (ticketForm.flight_id && availableSeats.length === 0) {
      loadSeats(String(ticketForm.flight_id));
    }
  }, [ticketForm.flight_id]);

  const [passForm, setPassForm] = useState({
    surname: '',
    name: '',
    patronymic: '',
    birthdate: '1995-01-01',
    passport: '',
    phone: '',
  });

  const availableFlights = flights.filter((f: any) => f.status === 'Регистрация' && f.free_seats > 0);
  const filteredSeats = ticketForm.seat_class
    ? availableSeats.filter((s) => s.seat_class === ticketForm.seat_class)
    : [];
  const selectedSeatObj = filteredSeats.find((s) => s.seat_number === ticketForm.seat_number);

  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        API + '/tickets',
        {
          passenger_id: role === 'passenger' ? null : Number(ticketForm.passenger_id),
          flight_id: Number(ticketForm.flight_id),
          seat_number: ticketForm.seat_number,
          base_price: role !== 'passenger' && ticketForm.custom_price ? Number(ticketForm.custom_price) : null,
        },
        authHeaders
      );
      alert('Билет успешно оформлен на место ' + ticketForm.seat_number + '!');
      setTicketForm((prev) => ({ ...prev, seat_number: '' }));
      loadSeats(ticketForm.flight_id);
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка оформления');
    }
  };

  const handleRegisterPassenger = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(API + '/passengers', passForm, authHeaders);
      alert('Пассажир зарегистрирован!');
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка регистрации');
    }
  };


  return (
    <div className="space-y-6">
      <div className={role === 'passenger' ? 'max-w-xl mx-auto' : 'grid md:grid-cols-2 gap-6'}>
        <form className="bg-white p-5 rounded-lg shadow space-y-3" onSubmit={handleIssueTicket}>
          <h2 className="font-bold text-lg border-b pb-2">
            {role === 'passenger' ? 'Купить авиабилет онлайн' : 'Оформить билет пассажиру'}
          </h2>

          {role !== 'passenger' && (
            <select
              className="w-full border p-2 rounded"
              required
              value={ticketForm.passenger_id}
              onChange={(e) => setTicketForm({ ...ticketForm, passenger_id: e.target.value })}
            >
              <option value="">-- Выберите пассажира --</option>
              {passengers.map((p: any) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          )}

          <select
            className="w-full border p-2 rounded"
            required
            value={ticketForm.flight_id}
            onChange={(e) => {
              const fid = e.target.value;
              setTicketForm({ ...ticketForm, flight_id: fid, seat_class: '', seat_number: '' });
              loadSeats(fid);
            }}
          >
            <option value="">-- Выберите рейс (открыта регистрация) --</option>
            {availableFlights.map((f: any) => (
              <option key={f.flight_id} value={f.flight_id}>
                {f.flight_number}: {f.origin} - {f.destination} (база {f.base_price} руб., свободно: {f.free_seats})
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="border p-2 rounded disabled:bg-gray-100 disabled:text-gray-400"
              required
              disabled={!ticketForm.flight_id}
              value={ticketForm.seat_class}
              onChange={(e) => {
                const cls = e.target.value;
                const seatsOfClass = availableSeats.filter((s) => s.seat_class === cls);
                const firstSeat = seatsOfClass.length > 0 ? (seatsOfClass.find(() => true)?.seat_number || '') : '';
                setTicketForm({ ...ticketForm, seat_class: cls, seat_number: firstSeat });
              }}
            >
              <option value="">-- Выберите класс --</option>
              <option value="Первый">Первый класс (1 ряд, x2.5)</option>
              <option value="Бизнес">Бизнес-класс (2–4 ряды, x1.8)</option>
              <option value="Эконом">Эконом-класс (5+ ряды, x1.0)</option>
            </select>

            <select
              className="border p-2 rounded disabled:bg-gray-100 disabled:text-gray-400"
              required
              disabled={!ticketForm.flight_id || !ticketForm.seat_class}
              value={ticketForm.seat_number}
              onChange={(e) => setTicketForm({ ...ticketForm, seat_number: e.target.value })}
            >
              <option value="">-- Выберите место --</option>
              {filteredSeats.map((s) => (
                <option key={s.seat_number} value={s.seat_number}>
                  Место {s.seat_number} ({s.final_price} руб.)
                </option>
              ))}
            </select>
          </div>

          {role !== 'passenger' && (
            <input
              className="w-full border p-2 rounded text-sm"
              type="number"
              placeholder="Ручной базовый тариф (необязательно)"
              value={ticketForm.custom_price}
              onChange={(e) => setTicketForm({ ...ticketForm, custom_price: e.target.value })}
            />
          )}

          {selectedSeatObj && (
            <div className="text-xs bg-blue-50 text-blue-800 p-2.5 rounded flex justify-between items-center">
              <span>Класс: <b>{selectedSeatObj.seat_class}</b> | Место: <b>{selectedSeatObj.seat_number}</b></span>
              <span>Итого к оплате: <b>{selectedSeatObj.final_price} руб.</b></span>
            </div>
          )}

          <button
            disabled={!ticketForm.seat_number}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-2 rounded font-semibold"
          >
            {role === 'passenger' ? 'Оплатить билет' : 'Продать билет'}
          </button>
        </form>

        {role !== 'passenger' && (
          <form className="bg-white p-5 rounded-lg shadow space-y-3" onSubmit={handleRegisterPassenger}>
            <h2 className="font-bold text-lg border-b pb-2">Новый пассажир (в справочник БД)</h2>
            <div className="grid grid-cols-3 gap-2">
              <input className="border p-2 rounded" required placeholder="Фамилия" value={passForm.surname} onChange={(e) => setPassForm({ ...passForm, surname: e.target.value })} />
              <input className="border p-2 rounded" required placeholder="Имя" value={passForm.name} onChange={(e) => setPassForm({ ...passForm, name: e.target.value })} />
              <input className="border p-2 rounded" placeholder="Отчество" value={passForm.patronymic} onChange={(e) => setPassForm({ ...passForm, patronymic: e.target.value })} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input className="border p-2 rounded" type="date" required value={passForm.birthdate} onChange={(e) => setPassForm({ ...passForm, birthdate: e.target.value })} />
              <input className="border p-2 rounded" required placeholder="Паспорт: 4500 123456" value={passForm.passport} onChange={(e) => setPassForm({ ...passForm, passport: e.target.value })} />
              <input className="border p-2 rounded" placeholder="+79991112233" value={passForm.phone} onChange={(e) => setPassForm({ ...passForm, phone: e.target.value })} />
            </div>
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-semibold">
              Зарегистрировать пассажира
            </button>
          </form>
        )}
      </div>

      <div className="bg-white p-5 rounded-lg shadow space-y-2">
        <h2 className="font-bold text-lg border-b pb-2">
          {role === 'passenger' ? 'Мои купленные билеты' : 'Реестр оформленных билетов'}
        </h2>
        {tickets.length === 0 && <p className="text-sm text-gray-500">Билетов пока нет.</p>}
        {tickets.map((t: any) => (
          <div key={t.ticket_id} className="flex flex-wrap justify-between items-center border-b py-2 text-sm">
            <div>
              <span className="font-mono font-bold mr-2">{t.ticket_number}</span>
              <span>{t.flight_number} ({t.route}) — {t.passenger_fio}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Место: {t.seat_number} ({t.ticket_class})</span>
              <span className="font-semibold">{t.price} руб.</span>
              <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{t.ticket_status}</span>
              {t.ticket_status === 'Оплачен' && (
                <button
                  onClick={async () => {
                    await axios.patch(API + '/tickets/' + t.ticket_id + '/cancel', {}, authHeaders);
                    loadSeats(ticketForm.flight_id);
                    onRefresh();
                  }}
                  className="text-red-600 hover:underline text-xs"
                >
                  Вернуть билет
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

