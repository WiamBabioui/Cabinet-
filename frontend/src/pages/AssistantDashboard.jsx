import React from 'react';
import { 
  CreditCard, 
  Users, 
  Clock, 
  ArrowUpRight, 
  CheckCircle2, 
  DollarSign,
  TrendingUp,
  Search,
  Plus
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useTranslation } from 'react-i18next';

const AssistantDashboard = () => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">{t('assistant.title')}</h1>
          <p className="text-slate-500 mt-1">{t('assistant.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" icon={CreditCard}>{t('assistant.new_invoice')}</Button>
          <Button icon={Plus}>{t('assistant.add_queue')}</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary text-white border-none shadow-xl shadow-primary/20">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-white/20 rounded-2xl">
              <DollarSign size={24} />
            </div>
            <Badge variant="success" className="bg-green-400/20 text-green-100 border-none">{t('dashboard.live') || 'Live'}</Badge>
          </div>
          <div className="mt-6">
            <p className="text-sm text-white/70 font-semibold uppercase tracking-wider">{t('assistant.today_revenue')}</p>
            <h2 className="text-3xl font-black mt-1">$3,842.50</h2>
            <div className="mt-4 flex items-center gap-2 text-xs text-white/50">
              <TrendingUp size={14} />
              <span>{t('assistant.revenue_growth')}</span>
            </div>
          </div>
        </Card>

        <Card title={t('assistant.pending_payments')} className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">{t('assistant.overdue')} (5)</span>
              <span className="text-red-500 font-bold">$1,240</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-red-500 h-full w-[40%]"></div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-6">{t('assistant.view_billing')}</Button>
        </Card>

        <Card title={t('assistant.clinic_utilization')} className="flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">{t('assistant.room_usage')}</span>
              <span className="text-primary font-bold">85%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full w-[85%]"></div>
            </div>
          </div>
          <Button variant="ghost" size="sm" className="w-full mt-6">{t('assistant.optimize_schedule')}</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card title={t('assistant.live_queue')} subtitle={t('assistant.queue_subtitle')}>
          <div className="space-y-4 mt-4">
            {[
              { id: 1, name: 'Alice Walker', room: 'Consultation A', time: '10 min ago', status: 'in_room' },
              { id: 2, name: 'Bob Stevens', room: 'Waiting Area', time: '25 min ago', status: 'waiting' },
              { id: 3, name: 'Charlie Puth', room: 'Lab Test', time: '1 hr ago', status: 'lab' },
            ].map((p) => (
              <div key={p.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${p.status === 'in_room' ? 'bg-secondary' : 'bg-amber-400'} animate-pulse`}></div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                    <p className="text-xs text-slate-500 font-medium">{p.room} • {p.time}</p>
                  </div>
                </div>
                <Badge variant={p.status === 'in_room' ? 'success' : 'warning'}>{t(`assistant.status.${p.status}`)}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card title={t('assistant.billing_log')} subtitle={t('assistant.billing_subtitle')}>
          <div className="overflow-hidden mt-4">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left">{t('assistant.table.invoice')}</th>
                  <th className="px-4 py-3 text-left">{t('assistant.table.patient')}</th>
                  <th className="px-4 py-3 text-left">{t('assistant.table.amount')}</th>
                  <th className="px-4 py-3 text-right">{t('assistant.table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { id: '#INV-001', patient: 'John Doe', amount: '$45.00', status: 'paid' },
                  { id: '#INV-002', patient: 'Sarah Connor', amount: '$120.00', status: 'paid' },
                  { id: '#INV-003', patient: 'Tony Stark', amount: '$500.00', status: 'pending' },
                ].map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-700">{inv.id}</td>
                    <td className="px-4 py-3 text-slate-600">{inv.patient}</td>
                    <td className="px-4 py-3 font-black text-slate-800">{inv.amount}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>{t(`assistant.status.${inv.status}`)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AssistantDashboard;
