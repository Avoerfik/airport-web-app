import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://' + window.location.hostname + ':8000';

export function TicketTab({ role, flights, tickets, passengers, authHeaders, onRefresh }: any) {
  const [ticketForm, setTicketForm] = useState({
    passenger_id: '',
    flight_id: '',
    seat_number: '',
    ticket_class: 'Эконом',
    base_price: '15000',
  });

  const [passForm, setPassForm] = useState({
    surname: '',
    name: '',
    patronymic: '',
    birthdate: '1995-01-01',
    passport: '',
    phone: '',
  });

  const mult = ticketForm.ticket_class === 'Бизнес' ? 1.8 : ticketForm.ticket_class === 'Первый' ? 2.5 : 1.0;
  const previewPrice = Math.round(Number(ticketForm.base_price || 0) * mult);

  const handleIssueTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        API + '/tickets',
        {
          passenger_id: role === 'passenger' ? null : Number(ticketForm.passenger_id),
          flight_id: Number(ticketForm.flight_id),
          seat_number: ticketForm.seat_number,
          ticket_class: ticketForm.ticket_class,
          base_price: Number(ticketForm.base_price),
        },
        authHeaders
      );
      alert('Билет успешно оформлен!');
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
            onChange={(e) => setTicketForm({ ...ticketForm, flight_id: e.target.value })}
          >
            <option value="">-- Выберите рейс --</option>
            {flights.map((f: any) => (
              <option key={f.flight_id} value={f.flight_id}>
                {f.flight_number}: {f.origin} - {f.destination} (Свободно: {f.free_seats})
              </option>
            ))}
          </select>

          <div className="grid grid-cols-3 gap-2">
            <input
              className="border p-2 rounded"
              required
              placeholder="Место (14A)"
              value={ticketForm.seat_number}
              onChange={(e) => setTicketForm({ ...ticketForm, seat_number: e.target.value })}
            />
            <select
              className="border p-2 rounded"
              value={ticketForm.ticket_class}
              onChange={(e) => setTicketForm({ ...ticketForm, ticket_class: e.target.value })}
            >
              <option value="Эконом">Эконом (x1.0)</option>
              <option value="Бизнес">Бизнес (x1.8)</option>
              <option value="Первый">Первый (x2.5)</option>
            </select>
            <input
              className="border p-2 rounded"
              type="number"
              required
              placeholder="Базовый тариф"
              value={ticketForm.base_price}
              onChange={(e) => setTicketForm({ ...ticketForm, base_price: e.target.value })}
            />
          </div>

          <div className="text-xs bg-blue-50 text-blue-800 p-2 rounded">
            Итоговая стоимость с учётом класса ({ticketForm.ticket_class}, x{mult}): <b>{previewPrice} руб.</b>
          </div>

          <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-semibold">
            {role === 'passenger' ? 'Оплатить билет' : 'Продать билет'}
          </button>
        </form>

        {role !== 'passenger' && (
          <form className="bg-white p-5 rounded-lg shadow space-y-3" onSubmit={handleRegisterPassenger}>
            <h2 className="font-bold text-lg border-b pb-2">Новый пассажир (в справочник БД)</h2>
            <div className="grid grid-cols-3 gap-2">
              <input
                className="border p-2 rounded"
                required
                placeholder="Фамилия"
                value={passForm.surname}
                onChange={(e) => setPassForm({ ...passForm, surname: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                required
                placeholder="Имя"
                value={passForm.name}
                onChange={(e) => setPassForm({ ...passForm, name: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="Отчество"
                value={passForm.patronymic}
                onChange={(e) => setPassForm({ ...passForm, patronymic: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                className="border p-2 rounded"
                type="date"
                required
                value={passForm.birthdate}
                onChange={(e) => setPassForm({ ...passForm, birthdate: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                required
                placeholder="Паспорт: 4500 123456"
                value={passForm.passport}
                onChange={(e) => setPassForm({ ...passForm, passport: e.target.value })}
              />
              <input
                className="border p-2 rounded"
                placeholder="+79991112233"
                value={passForm.phone}
                onChange={(e) => setPassForm({ ...passForm, phone: e.target.value })}
              />
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
