import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useVendor } from '../../context/VendorContext';
import { getDrawingRequestsByCompany } from '../../models/drawingRequestModel';
import { getQuotationsByCompany } from '../../models/quotationModel';
import { getTotalRevenueByVendor } from '../../models/paymentModel';

export default function DashboardPage() {
    const { vendorProfile } = useVendor();
    const [pipelineView, setPipelineView] = useState('weekly');
    const [metrics, setMetrics] = useState({
      totalRequests: 0,
      pendingQuotations: 0,
      approved: 0,
      revenue: '0'
    });
    const [statusDistribution, setStatusDistribution] = useState([
      { name: 'Approved', value: 0, color: '#0053db' },
      { name: 'Pending', value: 0, color: '#E67E22' },
      { name: 'Rejected', value: 0, color: '#B3261E' },
      { name: 'Quoted', value: 0, color: '#94A3B8' }
    ]);
    const [isLoading, setIsLoading] = useState(true);

    const [pipelineData, setPipelineData] = useState({
      weekly: [
        { name: 'MON', requests: 0 }, { name: 'TUE', requests: 0 }, { name: 'WED', requests: 0 },
        { name: 'THU', requests: 0 }, { name: 'FRI', requests: 0 }, { name: 'SAT', requests: 0 }, { name: 'SUN', requests: 0 }
      ],
      monthly: [
        { name: 'Week 1', requests: 0 }, { name: 'Week 2', requests: 0 },
        { name: 'Week 3', requests: 0 }, { name: 'Week 4', requests: 0 }
      ]
    });

    useEffect(() => {
      const fetchDashboardData = async () => {
        if (!vendorProfile?.company_id) {
          setIsLoading(false);
          return;
        }

        try {
          const [requestsRes, quotationsRes, revenueRes] = await Promise.all([
            getDrawingRequestsByCompany(vendorProfile.company_id),
            getQuotationsByCompany(vendorProfile.company_id),
            getTotalRevenueByVendor(vendorProfile.id)
          ]);
          
          if (requestsRes.error) console.error('Error fetching drawing requests:', requestsRes.error);
          if (quotationsRes.error) console.error('Error fetching quotations:', quotationsRes.error);
          if (revenueRes.error) console.error('Error fetching revenue:', revenueRes.error);

          const data = requestsRes.data || [];
          const quotesData = quotationsRes.data || [];
          const totalRevenue = revenueRes.data || 0;

          const total = data.length;
          
          // Compute dynamic status for each request, just like useDrawings does
          const requestsWithStatus = data.map(req => {
            let status = req.status;
            const myQuotes = quotesData.filter(q => q.drawing_request_id === req.id);
            if (myQuotes.length > 0) {
              const sorted = [...myQuotes].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
              status = sorted[0].status;
            }
            return { ...req, computedStatus: status };
          });

          const pending = requestsWithStatus.filter(req => req.computedStatus === 'pending').length;
          const approved = requestsWithStatus.filter(req => req.computedStatus === 'approved').length;
          const rejected = requestsWithStatus.filter(req => req.computedStatus === 'rejected').length;
          const quoted = requestsWithStatus.filter(req => req.computedStatus === 'submitted').length;

          setMetrics({
            totalRequests: total,
            pendingQuotations: pending, // Requests waiting to be quoted
            approved: approved,
            revenue: totalRevenue.toLocaleString()
          });

          setStatusDistribution([
            { name: 'Approved', value: approved, color: '#0053db' },
            { name: 'Pending', value: pending, color: '#E67E22' },
            { name: 'Rejected', value: rejected, color: '#B3261E' },
            { name: 'Quoted', value: quoted, color: '#94A3B8' }
          ]);

          // Group pipeline data dynamically based on created_at from drawing requests
          const now = new Date();
          const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
          
          // Build weekly base (last 7 days ending today)
          const weekly = Array.from({length: 7}).map((_, i) => {
            const d = new Date();
            d.setDate(now.getDate() - (6 - i));
            return { name: days[d.getDay()], date: d.toDateString(), requests: 0 };
          });

          // Build monthly base (last 4 weeks ending today)
          const monthly = [
            { name: 'Week 1', requests: 0 },
            { name: 'Week 2', requests: 0 },
            { name: 'Week 3', requests: 0 },
            { name: 'Week 4', requests: 0 }
          ];

          data.forEach(req => {
            if (!req.created_at) return;
            const d = new Date(req.created_at);
            const diffTime = now - d;
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            
            // Weekly check
            if (diffDays >= 0 && diffDays < 7) {
               const dayName = days[d.getDay()];
               const bucket = weekly.find(b => b.name === dayName);
               if (bucket) bucket.requests++;
            }

            // Monthly check
            if (diffDays >= 0 && diffDays < 28) {
              const weekIndex = 3 - Math.floor(diffDays / 7);
              if (weekIndex >= 0 && weekIndex < 4) {
                monthly[weekIndex].requests++;
              }
            }
          });

          setPipelineData({
            weekly: weekly.map(b => ({ name: b.name, requests: b.requests })),
            monthly
          });
        } catch (err) {
          console.error('Dashboard fetch error:', err);
        } finally {
          setIsLoading(false);
        }
      };

      fetchDashboardData();
    }, [vendorProfile]);
    
    const currentPipelineData = pipelineView === 'weekly' ? pipelineData.weekly : pipelineData.monthly;
    const totalStatus = statusDistribution.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="space-y-stack_space max-w-[1500px] mx-auto">
            {/* Greeting & Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end mb-8 gap-4 sm:gap-0">
                <div>
                    <h3 className="font-headline-lg text-display-metrics text-on-surface tracking-tight">System Overview</h3>
                    <p className="text-body-lg text-on-surface-variant mt-1 max-w-xl">Monitor your laser cutting requests, quotations, and revenue growth in real-time.</p>
                </div>

            </div>

            {/* Metric Cards Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-card_gap">
                {/* Total Requests */}
                <div className="bg-white p-7 rounded-xl border border-outline-variant/60 card-shadow hover:border-primary/20 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                        <span className="font-label-caps text-label-caps text-outline/80 tracking-widest uppercase">Total Requests</span>
                        <div className="p-2 rounded-lg bg-primary-container/10 text-primary">
                            <span className="material-symbols-outlined">receipt_long</span>
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="font-display-metrics text-display-metrics text-on-surface">{isLoading ? '...' : metrics.totalRequests}</span>
                        <div className="text-secondary text-sm flex items-center font-semibold bg-secondary-container/50 px-2 py-0.5 rounded">
                            <span className="material-symbols-outlined text-[16px] mr-1">trending_up</span>
                            +0%
                        </div>
                    </div>
                </div>

                {/* Pending Quotations */}
                <div className="bg-white p-7 rounded-xl border border-outline-variant/60 card-shadow hover:border-tertiary/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="font-label-caps text-label-caps text-outline/80 tracking-widest uppercase">Pending Quotations</span>
                        <div className="p-2 rounded-lg bg-tertiary-container/10 text-tertiary">
                            <span className="material-symbols-outlined">pending_actions</span>
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="font-display-metrics text-display-metrics text-on-surface">{isLoading ? '...' : metrics.pendingQuotations}</span>
                        {metrics.pendingQuotations > 0 && (
                            <div className="text-tertiary text-[12px] flex items-center font-bold px-2 py-0.5 bg-tertiary-fixed/30 rounded uppercase tracking-wider">
                                <span className="material-symbols-outlined text-[16px] mr-1">priority_high</span>
                                Action Required
                            </div>
                        )}
                    </div>
                </div>

                {/* Approved */}
                <div className="bg-white p-7 rounded-xl border border-outline-variant/60 card-shadow hover:border-secondary/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="font-label-caps text-label-caps text-outline/80 tracking-widest uppercase">Approved</span>
                        <div className="p-2 rounded-lg bg-secondary-container/50 text-secondary">
                            <span className="material-symbols-outlined">verified</span>
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="font-display-metrics text-display-metrics text-on-surface">{isLoading ? '...' : metrics.approved}</span>
                        <div className="text-secondary text-sm flex items-center font-semibold bg-secondary-container/50 px-2 py-0.5 rounded">
                            <span className="material-symbols-outlined text-[16px] mr-1">check_circle</span>
                            {metrics.totalRequests > 0 ? Math.round((metrics.approved / metrics.totalRequests) * 100) : 0}% Yield
                        </div>
                    </div>
                </div>

                {/* Revenue */}
                <div className="bg-white p-7 rounded-xl border border-outline-variant/60 card-shadow hover:border-primary/20 transition-all">
                    <div className="flex justify-between items-start mb-4">
                        <span className="font-label-caps text-label-caps text-outline/80 tracking-widest uppercase">Total Revenue</span>
                        <div className="p-2 rounded-lg bg-primary-container/10 text-primary">
                            <span className="material-symbols-outlined">payments</span>
                        </div>
                    </div>
                    <div className="flex items-end justify-between">
                        <span className="font-display-metrics text-display-metrics text-on-surface">₹ {isLoading ? '...' : metrics.revenue}</span>
                    </div>
                </div>
            </div>

            {/* Middle Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-card_gap pt-4">
                {/* Line Chart: Requests Overview */}
                <div className="lg:col-span-8 bg-white p-8 rounded-xl border border-outline-variant/60 card-shadow overflow-hidden flex flex-col">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 sm:gap-0">
                        <div>
                            <h4 className="font-headline-md text-headline-md text-on-surface mb-1">Requests Pipeline</h4>
                            <p className="text-body-md text-on-surface-variant opacity-70">Activity trends</p>
                        </div>
                        <div className="flex p-1 bg-surface-container-low rounded-lg w-full sm:w-auto">
                            <button 
                                onClick={() => setPipelineView('weekly')}
                                className={`flex-1 sm:flex-none px-4 py-1.5 text-label-caps font-label-caps rounded-md font-bold transition-all ${pipelineView === 'weekly' ? 'bg-white shadow-sm text-primary' : 'text-outline hover:text-on-surface'}`}>
                                WEEKLY
                            </button>
                            <button 
                                onClick={() => setPipelineView('monthly')}
                                className={`flex-1 sm:flex-none px-4 py-1.5 text-label-caps font-label-caps rounded-md font-bold transition-all ${pipelineView === 'monthly' ? 'bg-white shadow-sm text-primary' : 'text-outline hover:text-on-surface'}`}>
                                MONTHLY
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 w-full relative min-h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={currentPipelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0053db" stopOpacity={0.15}/>
                                        <stop offset="95%" stopColor="#0053db" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#737686', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em' }} 
                                    dy={10} 
                                />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '8px', border: '1px solid #E0E2EC', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' }}
                                    itemStyle={{ color: '#0053db', fontWeight: 600 }}
                                />
                                <Area 
                                    type="monotone" 
                                    dataKey="requests" 
                                    stroke="#0053db" 
                                    strokeWidth={2}
                                    fillOpacity={1} 
                                    fill="url(#colorRequests)" 
                                    activeDot={{ r: 6, strokeWidth: 0, fill: '#0053db' }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart: Request Status */}
                <div className="lg:col-span-4 bg-white p-8 rounded-xl border border-outline-variant/60 card-shadow flex flex-col">
                    <h4 className="font-headline-md text-headline-md text-on-surface mb-1">Status Distribution</h4>
                    <p className="text-body-md text-on-surface-variant opacity-70 mb-6">Real-time status breakdown</p>
                    <div className="flex flex-col items-center flex-1 justify-center">
                        <div className="relative w-48 h-48 mb-8">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={statusDistribution}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={4}
                                    >
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ borderRadius: '8px', border: '1px solid #E0E2EC', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                        itemStyle={{ fontWeight: 600 }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="font-display-metrics text-headline-lg text-on-surface">{totalStatus}</span>
                                <span className="text-label-caps text-outline/60 text-[9px] uppercase tracking-[0.2em]">Total</span>
                            </div>
                        </div>
                        {/* Legend */}
                        <div className="w-full grid grid-cols-2 gap-y-4 gap-x-6">
                            {statusDistribution.map((status) => (
                                <div key={status.name} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: status.color }}></div>
                                        <span className="text-body-md text-on-surface-variant group-hover:text-on-surface transition-colors">{status.name}</span>
                                    </div>
                                    <span className="text-body-md font-bold text-on-surface">{status.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom spacing */}
            <div className="h-12"></div>
        </div>
    );
}
