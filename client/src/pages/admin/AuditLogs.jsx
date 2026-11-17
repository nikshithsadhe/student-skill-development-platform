import React, { useState, useEffect } from 'react';
import {
  FileText,
  Shield,
  Clock,
  Search,
  Filter,
} from 'lucide-react';
import api from '../../services/api';
import Card from '../../components/Card';
import Badge from '../../components/Badge';
import Spinner from '../../components/Spinner';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/audit-logs');
      if (res.data?.success) {
        setLogs(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      log.action?.toLowerCase().includes(q) ||
      JSON.stringify(log.details || {}).toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-heading">Security & Administrative Audit Logs</h1>
          <p className="text-sm text-text-muted mt-1">
            Immutable log trail of administrative actions, credential operations, and faculty assignments.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-text-dim absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search actions or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-xl pl-10 pr-4 py-2 text-xs text-text placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="py-20 flex justify-center">
            <Spinner size="lg" label="Loading security audit records..." />
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-text-muted text-xs">
            No audit records found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-light text-text-dim">
                  <th className="p-4 font-semibold">Timestamp</th>
                  <th className="p-4 font-semibold">Action</th>
                  <th className="p-4 font-semibold">Operator ID</th>
                  <th className="p-4 font-semibold">Event Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface-light/50 transition-colors">
                    <td className="p-4 whitespace-nowrap text-text-dim font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold">
                      <Badge variant="purple" size="sm">
                        {log.action}
                      </Badge>
                    </td>
                    <td className="p-4 font-mono text-text-muted">{log.user_id}</td>
                    <td className="p-4 text-text-muted max-w-md">
                      <pre className="font-mono text-[11px] bg-surface-light p-2 rounded-lg overflow-x-auto">
                        {JSON.stringify(log.details || {}, null, 2)}
                      </pre>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
