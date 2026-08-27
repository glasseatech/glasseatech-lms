import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { month: 'Jan', progress: 10 },
  { month: 'Feb', progress: 30 },
  { month: 'Mar', progress: 45 },
  { month: 'Apr', progress: 60 },
  { month: 'May', progress: 85 },
  { month: 'Jun', progress: 95 },
];

export default function Analytics() {
  return (
    <div className="mt-8 glass-panel p-6 rounded-2xl border border-white/[0.05]">
      <h2 className="text-sm font-mono font-bold tracking-widest text-neutral-medium uppercase mb-6">Learning Momentum (Last 6 Months)</h2>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }} />
            <Line type="monotone" dataKey="progress" stroke="#00D9FF" strokeWidth={3} dot={{ r: 4, fill: '#00D9FF' }} activeDot={{ r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
