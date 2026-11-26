import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://' + window.location.hostname + ':8000';

export function AdminTab({ flights, aircrafts, users, passengers, authHeaders, onRefresh }: any) {
  const [flightForm, setFlightForm] = useState({
    flight_number: '',
    origin: '',
    destination: '',
    departure_time: '',
    arrival_time: '',
    aircraft_reg_number: '',
  });

  const [userForm, setUserForm] = useState({
    username: '',
    password: '',
    role: 'cashier',
    full_name: '',
    passenger_id: '',
  });

  const handleCreateFlight = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(API + '/flights', flightForm, authHeaders);
      alert('Рейс добавлен!');
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка создания рейса');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        API + '/admin/users',
        {
          ...userForm,
          passenger_id: userForm.passenger_id ? Number(userForm.passenger_id) : null,
        },
        authHeaders
      );
      alert('Пользователь создан!');
      setUserForm({ username: '', password: '', role: 'cashier', full_name: '', passenger_id: '' });
      onRefresh();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Ошибка создания пользователя');
    }
  };

  return (
    <div className="space-y-6">
      <form className="bg-white p-5 rounded-lg shadow grid md:grid-cols-3 gap-3" onSubmit={handleCreateFlight}>
        <h2 className="md:col-span-3 font-bold text-lg border-b pb-2">Добавление нового рейса</h2>
        <input
          className="border p-2 rounded"
          required
          placeholder="Номер (SU-999)"
          value={flightForm.flight_number}
          onChange={(e) => setFlightForm({ ...flightForm, flight_number: e.target.value })}
        />
        <input
          className="border p-2 rounded"
          required
          placeholder="Откуда"
          value={flightForm.origin}
          onChange={(e) => setFlightForm({ ...flightForm, origin: e.target.value })}
        />
        <input
          className="border p-2 rounded"
          required
          placeholder="Куда"
          value={flightForm.destination}
          onChange={(e) => setFlightForm({ ...flightForm, destination: e.target.value })}
        />
        <input
          className="border p-2 rounded"
          type="datetime-local"
          required
          value={flightForm.departure_time}
          onChange={(e) => setFlightForm({ ...flightForm, departure_time: e.target.value })}
        />
        <input
          className="border p-2 rounded"
          type="datetime-local"
          required
          value={flightForm.arrival_time}
          onChange={(e) => setFlightForm({ ...flightForm, arrival_time: e.target.value })}
        />
        <select
          className="border p-2 rounded"
          required
          value={flightForm.aircraft_reg_number}
          onChange={(e) => setFlightForm({ ...flightForm, aircraft_reg_number: e.target.value })}
        >
          <option value="">-- Выберите самолёт --</option>
          {aircrafts.map((a: any) => (
            <option key={a.reg_number} value={a.reg_number}>
              {a.model} ({a.reg_number})
            </option>
          ))}
        </select>
        <button className="md:col-span-3 bg-blue-600 text-white py-2 rounded font-semibold">Создать рейс</button>
      </form>

      <div className="bg-white p-5 rounded-lg shadow space-y-2">
        <h2 className="font-bold text-lg border-b pb-2">Управление статусами и удаление рейсов</h2>
        {flights.map((f: any) => (
          <div key={f.flight_id} className="flex flex-wrap justify-between items-center border-b py-2 text-sm">
            <div>
              <span className="font-bold mr-2">{f.flight_number}</span>
              <span>{f.origin} - {f.destination}</span>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="border p-1 rounded text-xs"
                value={f.status}
                onChange={async (e) => {
                  await axios.patch(
                    API + '/flights/' + f.flight_id + '/status',
                    { status: e.target.value },
                    authHeaders
                  );
                  onRefresh();
                }}
              >
                <option value="Регистрация">Регистрация</option>
                <option value="Задержан">Задержан</option>
                <option value="Вылетел">Вылетел</option>
                <option value="Прибыл">Прибыл</option>
                <option value="Отменен">Отменен</option>
              </select>
              <button
                onClick={async () => {
                  try {
                    await axios.delete(API + '/flights/' + f.flight_id, authHeaders);
                    onRefresh();
                  } catch (err: any) {
                    alert(err.response?.data?.detail || 'Ошибка удаления');
                  }
                }}
                className="text-red-600 hover:underline text-xs"
              >
                Удалить
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-lg shadow space-y-4">
        <h2 className="font-bold text-lg border-b pb-2">Регистрация пользователей системы (Кассиры, Пассажиры, Админы)</h2>
        <form className="grid md:grid-cols-5 gap-2" onSubmit={handleCreateUser}>
          <input
            className="border p-2 rounded text-sm"
            required
            placeholder="Логин"
            value={userForm.username}
            onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
          />
          <input
            className="border p-2 rounded text-sm"
            type="password"
            required
            placeholder="Пароль"
            value={userForm.password}
            onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
          />
          <input
            className="border p-2 rounded text-sm"
            required
            placeholder="ФИО"
            value={userForm.full_name}
            onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })}
          />
          <select
            className="border p-2 rounded text-sm"
            value={userForm.role}
            onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
          >
            <option value="cashier">Кассир (cashier)</option>
            <option value="passenger">Пассажир (passenger)</option>
            <option value="admin">Администратор (admin)</option>
          </select>
          <button className="bg-green-600 text-white rounded px-3 py-2 text-sm font-semibold">Создать</button>
          {userForm.role === 'passenger' && (
            <select
              className="md:col-span-5 border p-2 rounded text-sm"
              required
              value={userForm.passenger_id}
              onChange={(e) => setUserForm({ ...userForm, passenger_id: e.target.value })}
            >
              <option value="">-- Привязать к карточке пассажира из БД --</option>
              {passengers.map((p: any) => (
                <option key={p.id} value={p.id}>{p.label}</option>
              ))}
            </select>
          )}
        </form>

        <div className="space-y-1 pt-2">
          {users.map((u: any) => (
            <div key={u.id} className="flex justify-between text-xs border-b py-1.5">
              <span><b>{u.username}</b> — {u.full_name}</span>
              <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold">{u.role}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
