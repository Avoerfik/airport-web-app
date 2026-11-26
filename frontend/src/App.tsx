import { useEffect, useState } from 'react';
import axios from 'axios';

interface Aircraft {
  model: string;
  reg_number: string;
}

interface Flight {
  id: number;
  flight_number: string;
  origin: string;
  destination: string;
  departure_time: string;
  status: string;
  aircraft: Aircraft;
}

function App() {
  const [flights, setFlights] = useState<Flight[]>([]);

  useEffect(() => {
    axios.get('http://localhost:8000/flights')
      .then(res => setFlights(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div className="min-h-screen p-8">
      <header className="mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-blue-600">?? Аэропорт: Табло рейсов</h1>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {flights.map(flight => (
          <div key={flight.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{flight.flight_number}</h2>
              <span className={`px-2 py-1 rounded text-sm font-semibold ${
                flight.status === 'По расписанию' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {flight.status}
              </span>
            </div>
            
            <div className="text-lg mb-2">
              <span className="font-semibold">{flight.origin}</span> 
              <span className="mx-2 text-gray-400">?</span> 
              <span className="font-semibold">{flight.destination}</span>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Вылет: {new Date(flight.departure_time).toLocaleString('ru-RU')}</p>
              <p className="mt-2">Самолет: {flight.aircraft.model} ({flight.aircraft.reg_number})</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;