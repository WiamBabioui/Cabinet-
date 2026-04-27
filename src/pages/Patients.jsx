import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  MoreVertical, 
  ExternalLink,
  Phone,
  Mail,
  Calendar as CalendarIcon
} from 'lucide-react';
import Card from '../components/dashboard/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import { useData } from '../context/DataContext';

const Patients = () => {
  const { patients } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Patients Directory</h1>
          <p className="text-slate-500 mt-1">Manage and view all registered patients.</p>
        </div>
        <Button icon={Plus}>Add New Patient</Button>
      </div>

      <Card>
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input 
              placeholder="Search by name, email or phone..." 
              icon={Search}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" icon={Filter} className="border border-slate-200">Filters</Button>
            <Button variant="ghost" className="border border-slate-200">Export CSV</Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 text-left rounded-l-xl">Patient</th>
                <th className="px-6 py-4 text-left">Contact Info</th>
                <th className="px-6 py-4 text-left">Last Visit</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-right rounded-r-xl">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-bold text-lg">
                        {p.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-sm">{p.name}</h4>
                        <p className="text-xs text-slate-500">{p.age} years • {p.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail size={12} className="text-slate-400" />
                        {p.email}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone size={12} className="text-slate-400" />
                        {p.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <CalendarIcon size={14} className="text-slate-400" />
                      {p.lastVisit}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={p.status === 'Healthy' ? 'success' : 'info'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all">
                        <ExternalLink size={18} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                        <MoreVertical size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredPatients.length === 0 && (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Search size={40} />
            </div>
            <h3 className="text-lg font-bold text-slate-800">No patients found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mt-1">Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Patients;
