import React from 'react';

export function AnalyticsTab({ analytics, logs }: any) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-lg shadow space-y-2">
        <h2 className="font-bold text-lg border-b pb-2">Финансовая аналитика рейсов (fn_flights_analytics_PAG8)</h2>
        {analytics.map((a: any, idx: number) => (
          <div key={idx} className="flex flex-wrap justify-between items-center border-b py-2 text-sm">
            <div>
              <span className="font-bold mr-2">{a.flight_number}</span>
              <span>{a.route}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Билетов: {a.tickets_sold}</span>
              <span>Загрузка: {a.load_percent}%</span>
              <span className="font-semibold text-green-700">Выручка: {a.total_revenue} руб.</span>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white p-5 rounded-lg shadow space-y-2">
        <h2 className="font-bold text-lg border-b pb-2">Журнал триггерного аудита (v_audit_log_PAG8)</h2>
        {logs.map((l: any) => (
          <div key={l.id} className="border-b py-2 text-xs font-mono">
            <span className="text-gray-500 mr-2">[{new Date(l.changed_at).toLocaleString('ru-RU')}]</span>
            <span className="font-bold text-blue-700 mr-2">{l.table_name} ({l.operation}):</span>
            <span>{l.record_info}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

