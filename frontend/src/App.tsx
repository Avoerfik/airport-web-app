import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { TicketTab } from './components/TicketTab';
import { AdminTab } from './components/AdminTab';
import { AnalyticsTab } from './components/AnalyticsTab';

const API = 'http://' + window.location.hostname + ':8000';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(localStorage.getItem('role'));
  const [fullName, setFullName] = useState<string | null>(localStorage.getItem('fullName'));

  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [regForm, setRegForm] = useState({
    username: '',
    password: '',
    surname: '',
    name: '',
    patronymic: '',
    birthdate: '1998-05-15',
    passport: '',
    phone: '',
  });
  const [error, setError] = useState('');

  const [tab, setTab] = useState<'schedule' | 'tickets' | 'admin' | 'analytics'>('schedule');
  const [selectedFlightId, setSelectedFlightId] = useState<string>('');
  const [flights, setFlights] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [aircrafts, setAircrafts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const [filterOrigin, setFilterOrigin] = useState('');
  const [filterDest, setFilterDest] = useState('');

  const authHeaders = { headers: { Authorization: 'Bearer ' + token } };

  const saveSession = (data: any) => {
    localStorage.setItem('token', data.access_token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('fullName', data.full_name);
    setToken(data.access_token);
    setRole(data.role);
    setFullName(data.full_name);
    setTab('schedule');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(API + '/auth/login', { username, password });
      saveSession(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка входа');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await axios.post(API + '/auth/register', regForm);
      saveSession(res.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Ошибка регистрации');
    }
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setRole(null);
    setFullName(null);
    setSelectedFlightId('');
  };

  const loadAll = async () => {
    try {
      const schedRes = await axios.get(API + '/schedule', {
        params: {
          origin: filterOrigin || undefined,
          destination: filterDest || undefined,
        },
      });
      setFlights(schedRes.data);

      if (!token) return;

      if (role !== 'dispatcher') {
        const tRes = await axios.get(API + '/tickets', authHeaders);
        setTickets(tRes.data);
      }

      if (role === 'cashier' || role === 'admin' || role === 'dispatcher') {
        const refRes = await axios.get(API + '/references', authHeaders);
        setPassengers(refRes.data.passengers);
        setAircrafts(refRes.data.aircrafts);
      }

      if (role === 'admin') {
        const [anRes, uRes] = await Promise.all([
          axios.get(API + '/analytics', authHeaders),
          axios.get(API + '/admin/users', authHeaders),
        ]);
        setAnalytics(anRes.data.analytics);
        setLogs(anRes.data.logs);
        setUsers(uRes.data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (token) {
      loadAll();
    }
  }, [token]);

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-center text-blue-700">ИС «Аэропорт»</h1>
          <div className="flex border-b">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(''); }}
              className={authMode === 'login' ? 'w-1/2 py-2 border-b-2 border-blue-600 font-semibold text-blue-700' : 'w-1/2 py-2 text-gray-500'}
            >
              Вход в систему
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(''); }}
              className={authMode === 'register' ? 'w-1/2 py-2 border-b-2 border-blue-600 font-semibold text-blue-700' : 'w-1/2 py-2 text-gray-500'}
            >
              Регистрация пассажира
            </button>
          </div>

          {error && <div className="p-2 bg-red-100 text-red-700 text-sm rounded">{error}</div>}

          {authMode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Логин</label>
                <input className="w-full border rounded p-2" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="Введите логин" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Пароль</label>
                <input type="password" className="w-full border rounded p-2" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Введите пароль" />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700">Войти</button>
              <div className="text-xs text-gray-400 border-t pt-2">
                Демо: admin/admin123 | dispatcher/disp123 | cashier/cashier123 | passenger/pass123
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded p-2" required placeholder="Логин" value={regForm.username} onChange={(e) => setRegForm({ ...regForm, username: e.target.value })} />
                <input className="border rounded p-2" type="password" required placeholder="Пароль" value={regForm.password} onChange={(e) => setRegForm({ ...regForm, password: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input className="border rounded p-2" required placeholder="Фамилия" value={regForm.surname} onChange={(e) => setRegForm({ ...regForm, surname: e.target.value })} />
                <input className="border rounded p-2" required placeholder="Имя" value={regForm.name} onChange={(e) => setRegForm({ ...regForm, name: e.target.value })} />
                <input className="border rounded p-2" placeholder="Отчество" value={regForm.patronymic} onChange={(e) => setRegForm({ ...regForm, patronymic: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className="border rounded p-2" type="date" required value={regForm.birthdate} onChange={(e) => setRegForm({ ...regForm, birthdate: e.target.value })} />
                <input className="border rounded p-2" required placeholder="Паспорт: 4500 123456" value={regForm.passport} onChange={(e) => setRegForm({ ...regForm, passport: e.target.value })} />
              </div>
              <input className="w-full border rounded p-2" placeholder="Телефон (+79991112233)" value={regForm.phone} onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })} />
              <button type="submit" className="w-full bg-green-600 text-white py-2 rounded font-semibold hover:bg-green-700">Зарегистрироваться</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white px-6 py-4 flex flex-wrap justify-between items-center shadow">
        <div>
          <h1 className="text-xl font-bold">Аэропорт: Расписание и продажа билетов</h1>
          <span className="text-xs text-blue-200">Пользователь: {fullName} | Роль: {role}</span>
        </div>
        <div className="flex gap-2 items-center mt-2 sm:mt-0">
          <button onClick={() => setTab('schedule')} className={tab === 'schedule' ? 'px-3 py-1 rounded bg-white text-blue-700 font-semibold' : 'px-3 py-1 rounded bg-blue-600'}>
            Табло рейсов
          </button>
          {role !== 'dispatcher' && (
            <button onClick={() => setTab('tickets')} className={tab === 'tickets' ? 'px-3 py-1 rounded bg-white text-blue-700 font-semibold' : 'px-3 py-1 rounded bg-blue-600'}>
              {role === 'passenger' ? 'Мои билеты и покупка' : 'Касса и пассажиры'}
            </button>
          )}
          {(role === 'admin' || role === 'dispatcher') && (
            <button onClick={() => setTab('admin')} className={tab === 'admin' ? 'px-3 py-1 rounded bg-white text-blue-700 font-semibold' : 'px-3 py-1 rounded bg-blue-600'}>
              {role === 'admin' ? 'Управление и пользователи' : 'Управление рейсами'}
            </button>
          )}
          {role === 'admin' && (
            <button onClick={() => setTab('analytics')} className={tab === 'analytics' ? 'px-3 py-1 rounded bg-white text-blue-700 font-semibold' : 'px-3 py-1 rounded bg-blue-600'}>
              Аналитика и аудит
            </button>
          )}
          <button onClick={logout} className="ml-4 px-3 py-1 bg-red-500 rounded text-sm hover:bg-red-600">Выход</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6">
        {tab === 'schedule' && (
          <div>
            <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-wrap gap-3 items-end">
              <div>
                <label className="block text-xs text-gray-500">Откуда</label>
                <input className="border rounded p-2 text-sm" value={filterOrigin} onChange={(e) => setFilterOrigin(e.target.value)} placeholder="Москва" />
              </div>
              <div>
                <label className="block text-xs text-gray-500">Куда</label>
                <input className="border rounded p-2 text-sm" value={filterDest} onChange={(e) => setFilterDest(e.target.value)} placeholder="Париж" />
              </div>
              <button onClick={loadAll} className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium">Найти</button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {flights.map((f) => (
                <div key={f.flight_id} className="bg-white p-5 rounded-lg shadow border-l-4 border-blue-600 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xl font-bold">{f.flight_number}</span>
                      <span className="px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800 font-semibold">{f.status}</span>
                    </div>
                    <div className="text-lg font-medium mb-2">{f.origin} - {f.destination}</div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Вылет: {new Date(f.departure_time).toLocaleString('ru-RU')}</p>
                      <p>Прилёт: {new Date(f.arrival_time).toLocaleString('ru-RU')}</p>
                      <p>Борт: {f.aircraft_model} ({f.aircraft_reg_number})</p>
                      <p className="font-semibold text-green-700">Свободных мест: {f.free_seats} из {f.capacity} | База: {f.base_price} руб.</p>
                    </div>
                  </div>
                  {role === 'passenger' && f.status === 'Регистрация' && (
                    <button onClick={() => { setSelectedFlightId(String(f.flight_id)); setTab('tickets'); }} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-sm font-medium">
                      Купить билет на рейс
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'tickets' && (
          <TicketTab role={role} flights={flights} tickets={tickets} passengers={passengers} selectedFlightId={selectedFlightId} authHeaders={authHeaders} onRefresh={loadAll} />
        )}

        {tab === 'admin' && (
          <AdminTab role={role} flights={flights} aircrafts={aircrafts} users={users} passengers={passengers} authHeaders={authHeaders} onRefresh={loadAll} />
        )}

        {tab === 'analytics' && <AnalyticsTab analytics={analytics} logs={logs} />}
      </main>
    </div>
  );
}

