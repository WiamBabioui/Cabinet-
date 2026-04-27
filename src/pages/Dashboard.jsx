import React from 'react';
import { 
  Users, 
  User,
  Calendar, 
  Clock, 
  TrendingUp, 
  ArrowUpRight, 
  MoreHorizontal,
  Plus
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import Card from '../components/dashboard/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import { useData } from '../context/DataContext';

const Dashboard = () => {
  const { patients, appointments } = useData();

  const kpis = [
    { title: 'Total Patients', value: '1,284', trend: '+12%', icon: Users, color: 'bg-blue-500' },
    { title: 'Appointments', value: '42', trend: '+18%', icon: Calendar, color: 'bg-green-500' },
    { title: 'Wait Period', value: '14 min', trend: '-5%', icon: Clock, color: 'bg-amber-500' },
    { title: 'Revenue', value: '$8,420', trend: '+10%', icon: TrendingUp, color: 'bg-primary' },
  ];

  const chartData = [
    { name: 'Mon', value: 400 },
    { name: 'Tue', value: 300 },
    { name: 'Wed', value: 600 },
    { name: 'Thu', value: 800 },
    { name: 'Fri', value: 500 },
    { name: 'Sat', value: 900 },
    { name: 'Sun', value: 400 },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Clinic Overview</h1>
          <p className="text-slate-500 mt-1">Good morning, Dr. House. Here's what's happening today.</p>
        </div>
        <Button icon={Plus}>New Appointment</Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="p-4 border-none shadow-premium bg-white">
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-2xl ${kpi.color} text-white`}>
                <kpi.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-xs font-bold ${kpi.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {kpi.trend}
                <ArrowUpRight size={14} />
              </div>
            </div>
            <div className="mt-4">
              <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{kpi.title}</p>
              <h2 className="text-2xl font-black text-slate-800 mt-1">{kpi.value}</h2>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <Card title="Appointment Trends" subtitle="Daily patient traffic for the last 7 days" className="lg:col-span-2">
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  cursor={{ stroke: '#2563eb', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Notifications */}
        <Card title="Recent Activity" subtitle="Updates from the clinic staff">
          <div className="space-y-6 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-slate-100 flex-shrink-0 flex items-center justify-center text-slate-400">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm text-slate-700">
                    <span className="font-bold">Nurse Taylor</span> updated medical history for <span className="font-bold">John Doe</span>
                  </p>
                  <span className="text-xs text-slate-400 mt-1 block">2 hours ago</span>
                </div>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-8 text-sm">View All Activity</Button>
        </Card>
      </div>

      {/* Recent Patients Table */}
      <Card 
        title="Today's Appointments" 
        subtitle="List of patients scheduled for today"
        headerAction={<Button variant="ghost" size="sm" icon={MoreHorizontal}></Button>}
      >
        <div className="overflow-x-auto mt-4">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left rounded-l-xl">Patient Name</th>
                <th className="px-6 py-4 text-left">Time</th>
                <th className="px-6 py-4 text-left">Type</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right rounded-r-xl">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold text-sm">
                        {apt.patientName.charAt(0)}
                      </div>
                      <span className="font-bold text-slate-700 text-sm">{apt.patientName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 font-medium">{apt.time}</td>
                  <td className="px-6 py-4 text-sm text-slate-500">{apt.type}</td>
                  <td className="px-6 py-4">
                    <Badge variant={apt.status === 'Confirmed' ? 'success' : apt.status === 'Pending' ? 'warning' : 'error'}>
                      {apt.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="text-slate-400 hover:text-primary transition-colors">
                      <MoreHorizontal size={20} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
