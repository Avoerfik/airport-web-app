import React, { useState } from 'react';
import axios from 'axios';

const API = 'http://localhost:8000';

export function AdminTab({ flights, aircrafts, authHeaders, onRefresh }: any) {
  const [flightForm, setFlightForm] = useState({
    flight_number: '',
    origin: '',
    destination: '',
    departure_time: '',
    arrival_time: '',
    aircraft_reg_number: '',
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

  return (
    <div className="space-y-6">
      <form className="bg-white p-5 rounded-lg shadow grid md:grid-cols-3 gap-3" onSubmit={handleCreateFlight}>
        <h2 className="md:col-span-3 font-bold text-lg border-b pb-2">Добавить рейс (sp_create_flight)</h2>
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
    </div>
  );
}

