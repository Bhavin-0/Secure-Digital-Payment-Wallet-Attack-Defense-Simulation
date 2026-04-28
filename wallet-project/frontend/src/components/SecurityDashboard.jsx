import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const SecurityDashboard = () => {
  const [data, setData] = useState({
    stats: {
      totalRequestsToday: 0,
      blockedAttempts: 0,
      activeSessions: 0,
    },
    chartData: [],
    logs: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSecurityData = async () => {
    try {
      // In a real implementation, ensure the fetch includes credentials/JWT header
      const response = await fetch('/api/admin/security-events');
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      const result = await response.json();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial fetch on mount
    fetchSecurityData();

    // Set up polling interval for real-time updates (5 seconds)
    const intervalId = setInterval(() => {
      fetchSecurityData();
    }, 5000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Helper to determine row color styling based on status
  const getRowStyle = (status) => {
    const normalizedStatus = status ? status.toLowerCase() : '';
    
    if (normalizedStatus === 'blocked' || normalizedStatus === 'attack') {
      return 'bg-red-50 hover:bg-red-100 text-red-900';
    }
    if (normalizedStatus === 'suspicious') {
      return 'bg-yellow-50 hover:bg-yellow-100 text-yellow-900';
    }
    if (normalizedStatus === 'normal') {
      return 'bg-green-50 hover:bg-green-100 text-green-900';
    }
    
    return 'bg-white hover:bg-gray-50 text-gray-900';
  };

  if (loading && data.logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg font-medium text-gray-500 animate-pulse">
          Loading Security Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-sans bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 tracking-tight">Security Monitoring</h1>
        {error && (
          <div className="px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium shadow-sm">
            Connection Error: {error}
          </div>
        )}
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Requests Today</h2>
          <p className="text-4xl font-extrabold text-gray-800 mt-2">
            {data.stats.totalRequestsToday.toLocaleString()}
          </p>
        </div>
        <div className="bg-red-50 p-6 rounded-xl shadow-sm border border-red-200 flex flex-col justify-center">
          <h2 className="text-xs font-bold text-red-600 uppercase tracking-wider">Blocked Attempts</h2>
          <p className="text-4xl font-extrabold text-red-700 mt-2">
            {data.stats.blockedAttempts.toLocaleString()}
          </p>
        </div>
        <div className="bg-blue-50 p-6 rounded-xl shadow-sm border border-blue-200 flex flex-col justify-center">
          <h2 className="text-xs font-bold text-blue-600 uppercase tracking-wider">Active Sessions</h2>
          <p className="text-4xl font-extrabold text-blue-700 mt-2">
            {data.stats.activeSessions.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Line Chart Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-bold text-gray-800 mb-6">Requests Per Hour</h2>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis 
                dataKey="time" 
                stroke="#9ca3af" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#9ca3af" 
                fontSize={12} 
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '0.5rem', 
                  border: '1px solid #e5e7eb', 
                  boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' 
                }}
              />
              <Line 
                type="monotone" 
                dataKey="requests" 
                stroke="#4f46e5" 
                strokeWidth={3} 
                dot={{ r: 4, strokeWidth: 2 }} 
                activeDot={{ r: 6, strokeWidth: 0 }} 
                animationDuration={500}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Log Table Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-white">
          <h2 className="text-lg font-bold text-gray-800">Real-Time Event Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Event Type</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">IP Address</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.logs.length > 0 ? (
                data.logs.map((log, index) => (
                  <tr key={log.id || index} className={`transition-colors duration-150 ${getRowStyle(log.status)}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                      {log.eventType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono opacity-80">
                      {log.ip}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm truncate max-w-[150px]">
                      {log.user || 'Unauthenticated'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm uppercase tracking-wider font-bold text-xs">
                      {log.status}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-sm text-gray-500">
                    Listening for security events...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
