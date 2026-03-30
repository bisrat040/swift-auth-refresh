import React, { useState } from 'react';
import { History, Search, Filter, Terminal } from 'lucide-react';
import { Input } from '../ui/input';
import { AuditLog } from '../../types';

interface LogSectionProps {
  logs: AuditLog[];
}

export const LogSection: React.FC<LogSectionProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         log.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || log.actionType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="bg-slate-900 rounded-2xl shadow-xl overflow-hidden border border-slate-800">
      <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600/20 p-2 rounded-lg">
            <Terminal className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 uppercase tracking-tight">Security & Control Logs</h3>
            <p className="text-xs text-slate-400 font-medium">Real-time system audit trail.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-9 bg-slate-900 border-slate-700 text-slate-200 text-xs focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="pl-10 pr-4 py-1.5 h-9 bg-slate-900 border-slate-700 text-slate-300 text-xs rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none appearance-none font-bold min-w-[140px]"
            >
              <option value="all">All Actions</option>
              <option value="Invitation">Invitations</option>
              <option value="Approval">Approvals</option>
              <option value="Denial">Denials</option>
              <option value="RoleChange">Role Changes</option>
              <option value="FailedLogin">Failed Logins</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-[500px] overflow-y-auto custom-scrollbar bg-slate-900">
        {filteredLogs.length === 0 ? (
          <div className="py-20 text-center">
            <History className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">No logs found matching your criteria.</p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="group flex items-start gap-4 p-3 rounded-lg hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-800"
              >
                <div className="mt-1 text-[10px] font-mono text-slate-500 whitespace-nowrap bg-slate-950 px-1.5 py-0.5 rounded">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-indigo-400">{log.adminName}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded uppercase">
                      {log.actionType}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {log.details}
                  </p>
                </div>
                <div className="text-[10px] font-bold text-slate-600 group-hover:text-slate-500">
                  {new Date(log.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-slate-950 p-3 flex items-center justify-between border-t border-slate-800">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Operational</span>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span className="text-[10px] font-bold text-slate-400">Live Audit Feed</span>
        </div>
      </div>
    </div>
  );
};