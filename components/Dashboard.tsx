import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Task, TaskStatus } from '../types';
import { CheckCircle, AlertCircle, Clock, Calendar as CalendarIcon, PieChart, TrendingUp, Activity, Filter } from 'lucide-react';

const chartColors = {
  created: '#2563eb',
  createdArea: 'rgba(37,99,235,0.10)',
  completed: '#10b981',
  notStarted: '#e2e8f0',
  inProgress: '#60a5fa',
  grid: 'rgba(148,163,184,0.28)',
  forecast: 'rgba(59,130,246,0.08)'
};

interface DashboardProps {
  tasks: Task[];
  currentDate: Date;
}

export const Dashboard: React.FC<DashboardProps> = ({ tasks, currentDate }) => {
  const [timeRange, setTimeRange] = useState<'all' | '7d' | '30d' | 'week' | 'custom'>('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [hoveredLinePoint, setHoveredLinePoint] = useState<null | { x: number; y: number; date: string; created: number; completed: number }>(null);
  const [hoveredPieSlice, setHoveredPieSlice] = useState<null | { label: string; value: number; percent: number; color: string; cx: number; cy: number }>(null);
  const lineChartRef = useRef<HTMLDivElement | null>(null);
  const pieWrapperRef = useRef<HTMLDivElement | null>(null);

  // Filter tasks based on range
  const filteredTasks = useMemo(() => {
    if (timeRange === 'all') return tasks;

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    let startStr = '';
    let endStr = '';

    if (timeRange === '7d') {
      const start = new Date();
      start.setDate(now.getDate() - 6);
      startStr = start.toISOString().split('T')[0];
      endStr = todayStr;
    } else if (timeRange === '30d') {
      const start = new Date();
      start.setDate(now.getDate() - 29);
      startStr = start.toISOString().split('T')[0];
      endStr = todayStr;
    } else if (timeRange === 'week') {
      const day = now.getDay();
      const start = new Date();
      start.setDate(now.getDate() - day);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      startStr = start.toISOString().split('T')[0];
      endStr = end.toISOString().split('T')[0];
    } else if (timeRange === 'custom') {
      if (!customStart || !customEnd) return tasks;
      startStr = customStart;
      endStr = customEnd;
    }

    return tasks.filter(t => t.date >= startStr && t.date <= endStr);
  }, [tasks, timeRange, customStart, customEnd]);

  // Aggregated maps for reuse across KPIs and charts
  const aggregates = useMemo(() => {
    const byCreatedDate = new Map<string, number>();
    const byDateStatus = new Map<string, { [key in TaskStatus]?: number }>();
    const statusTotals: Record<TaskStatus, number> = {
      [TaskStatus.NOT_STARTED]: 0,
      [TaskStatus.IN_PROGRESS]: 0,
      [TaskStatus.COMPLETED]: 0,
    };

    filteredTasks.forEach((task) => {
      const createdKey = new Date(task.createdAt).toISOString().split('T')[0];
      byCreatedDate.set(createdKey, (byCreatedDate.get(createdKey) || 0) + 1);

      const statusMap = byDateStatus.get(task.date) || {};
      statusMap[task.status] = (statusMap[task.status] || 0) + 1;
      byDateStatus.set(task.date, statusMap);

      statusTotals[task.status] += 1;
    });

    return { byCreatedDate, byDateStatus, statusTotals };
  }, [filteredTasks]);

  // --- 1. KPI Calculations ---
  const kpis = useMemo(() => {
    const currentTasks = filteredTasks;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Start/End of current week
    const dayOfWeek = now.getDay(); // 0 (Sun) - 6 (Sat)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - dayOfWeek);
    startOfWeek.setHours(0,0,0,0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23,59,59,999);

    const total = currentTasks.length;
    const byStatus = { ...aggregates.statusTotals };

    let overdue = 0;
    let todayCount = 0;
    let weekCount = 0;

    currentTasks.forEach(task => {
      // Overdue: Due date is before today AND not completed
      if (task.date < todayStr && task.status !== TaskStatus.COMPLETED) {
        overdue++;
      }

      // Today
      if (task.date === todayStr) {
        todayCount++;
      }

      // This Week
      const [y, m, d] = task.date.split('-').map(Number);
      const tDate = new Date(y, m - 1, d);
      
      if (tDate >= startOfWeek && tDate <= endOfWeek) {
        weekCount++;
      }
    });

    return { total, byStatus, overdue, todayCount, weekCount };
  }, [filteredTasks, aggregates.statusTotals]);

  // --- 2. Chart Data Preparation ---

  // Pie Chart Data
  const pieData = [
    { label: 'Not Started', value: kpis.byStatus[TaskStatus.NOT_STARTED], color: chartColors.notStarted },
    { label: 'In Progress', value: kpis.byStatus[TaskStatus.IN_PROGRESS], color: chartColors.inProgress },
    { label: 'Completed', value: kpis.byStatus[TaskStatus.COMPLETED], color: chartColors.completed },
  ].filter(d => d.value > 0);

  const totalForPie = pieData.reduce((acc, cur) => acc + cur.value, 0);
  const pieRadius = 92;
  const pieCircumference = 2 * Math.PI * pieRadius;
  let pieOffset = 0;
  const pieSegments = useMemo(() => {
    let offset = 0;
    return pieData.map((d) => {
      const percent = totalForPie === 0 ? 0 : d.value / totalForPie;
      const length = percent * pieCircumference;
      const segment = { ...d, percent: percent * 100, length, offset };
      offset += length;
      return segment;
    });
  }, [pieData, pieCircumference, totalForPie]);
  
  // Line Chart Data (Dynamic Range)
  const lineChartData = useMemo(() => {
    let start = new Date();
    let daysToGenerate = 14; // Default for 'all'

    const now = new Date();

    if (timeRange === '7d') {
      daysToGenerate = 7;
      start.setDate(now.getDate() - 6);
    } else if (timeRange === '30d') {
      daysToGenerate = 30;
      start.setDate(now.getDate() - 29);
    } else if (timeRange === 'week') {
      daysToGenerate = 7;
      const day = now.getDay();
      start.setDate(now.getDate() - day);
    } else if (timeRange === 'custom') {
      if (customStart && customEnd) {
        start = new Date(customStart);
        const end = new Date(customEnd);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        daysToGenerate = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; 
      } else {
        start.setDate(now.getDate() - 13);
      }
    } else {
        // 'all' - default 14 days ending today
        start.setDate(now.getDate() - 13);
    }

    const data = [];
    
    for (let i = 0; i < daysToGenerate; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const dateStr = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

      const createdCount = aggregates.byCreatedDate.get(dateStr) || 0;
      const completedCount = aggregates.byDateStatus.get(dateStr)?.[TaskStatus.COMPLETED] || 0;

      data.push({ date: displayDate, dateKey: dateStr, created: createdCount, completed: completedCount });
    }
    return data;
  }, [aggregates.byCreatedDate, aggregates.byDateStatus, filteredTasks, timeRange, customStart, customEnd]);

  // SVG Chart Helpers
  const chartHeight = 240;
  const chartWidth = 660;
  const padding = 32;
  const maxVal = Math.max(
    ...lineChartData.map(d => d.created), 
    ...lineChartData.map(d => d.completed), 
    5 // Minimum scale
  );

  const yTicks = useMemo(() => {
    const step = Math.max(1, Math.ceil(maxVal / 4));
    return [0, step, step * 2, step * 3, step * 4].filter(v => v <= maxVal + step);
  }, [maxVal]);

  const getY = (val: number) => chartHeight - padding - (val / maxVal) * (chartHeight - padding * 2);
  const getX = (index: number) => {
    if (lineChartData.length <= 1) return chartWidth / 2;
    return padding + (index / (lineChartData.length - 1)) * (chartWidth - padding * 2);
  };

  const handleLineHover = useCallback(
    (d: { date: string; created: number; completed: number }, e: React.MouseEvent<SVGElement, MouseEvent>) => {
      const container = lineChartRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      setHoveredLinePoint({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        date: d.date,
        created: d.created,
        completed: d.completed,
      });
    },
    []
  );

  const handlePieHover = useCallback(
    (seg: { label: string; value: number; percent: number; color: string }, e: React.MouseEvent<SVGElement, MouseEvent>) => {
      const wrapper = pieWrapperRef.current;
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      setHoveredPieSlice({
        label: seg.label,
        value: seg.value,
        percent: seg.percent,
        color: seg.color,
        cx: e.clientX - rect.left,
        cy: e.clientY - rect.top,
      });
    },
    []
  );

  const pointsCreated = useMemo(
    () => lineChartData.map((d, i) => `${getX(i)},${getY(d.created)}`).join(' '),
    [lineChartData]
  );
  const pointsCompleted = useMemo(
    () => lineChartData.map((d, i) => `${getX(i)},${getY(d.completed)}`).join(' '),
    [lineChartData]
  );

  // Area fill under the created line for the primary series
  const areaPathCreated = useMemo(() => {
    if (!lineChartData.length) return '';
    const start = `M ${getX(0)} ${chartHeight - padding}`;
    const linePoints = lineChartData.map((d, i) => `L ${getX(i)} ${getY(d.created)}`).join(' ');
    const end = `L ${getX(lineChartData.length - 1)} ${chartHeight - padding} Z`;
    return `${start} ${linePoints} ${end}`;
  }, [lineChartData, getX, getY]);

  // Forecast shading window uses the last 3 points when available
  const forecastBand = useMemo(() => {
    if (lineChartData.length < 2) return null;
    const bandSize = Math.min(3, lineChartData.length - 1);
    const startIdx = lineChartData.length - bandSize;
    const x1 = getX(startIdx - 1 < 0 ? 0 : startIdx - 1);
    const x2 = getX(lineChartData.length - 1);
    return { x1, x2 };
  }, [lineChartData, getX]);

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-6 lg:p-8 bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 transition-colors duration-200">
      
      {/* Header */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-400">Dashboard</p>
            <h2 className="text-3xl font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Activity className="text-sky-600 dark:text-sky-400" />
              Prognose & Trends
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Nominale index over tijd met statusverdeling.</p>
          </div>

          {/* Timeframe Filter */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm">
              <Filter size={16} className="mr-2 text-slate-400" />
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as any)}
                className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer pr-6"
              >
                <option value="all">Hele periode</option>
                <option value="7d">Laatste 7 dagen</option>
                <option value="30d">Laatste 30 dagen</option>
                <option value="week">Deze week</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            {timeRange === 'custom' && (
              <div className="flex items-center gap-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 px-3 py-2 shadow-sm">
                <input 
                  type="date" 
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  max={customEnd}
                  className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 focus:ring-0"
                />
                <span className="text-slate-400">-</span>
                <input 
                  type="date" 
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  className="bg-transparent border-none text-sm text-slate-700 dark:text-slate-200 focus:ring-0"
                />
              </div>
            )}
          </div>
        </div>

        {/* Tabs removed per request: always show primary dashboard view */}
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Tasks */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
            <PieChart size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Total Tasks</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{kpis.total}</h3>
          </div>
        </div>

        {/* Overdue */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
            <AlertCircle size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Overdue</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{kpis.overdue}</h3>
          </div>
        </div>

        {/* Today */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Due Today</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{kpis.todayCount}</h3>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-4">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <CalendarIcon size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">This Week</p>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 leading-tight">{kpis.weekCount}</h3>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Task Status Distribution (Pie / Donut) */}
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-400" />
            Statusverdeling
          </h3>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 relative">
            {/* SVG Pie / Donut */}
            <div className="relative w-56 h-56 flex items-center justify-center pie-wrapper" ref={pieWrapperRef}>
              {totalForPie === 0 ? (
                <div className="w-48 h-48 rounded-full bg-slate-100 dark:bg-slate-700/50 flex items-center justify-center">
                  <span className="text-slate-400 text-sm">No data</span>
                </div>
              ) : (
                <svg viewBox="0 0 220 220" className="w-full h-full">
                  <g transform="rotate(-90 110 110)">
                    {pieSegments.map((seg, idx) => (
                      <circle
                        key={idx}
                        cx={110}
                        cy={110}
                        r={pieRadius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth={30}
                        strokeDasharray={`${seg.length} ${pieCircumference - seg.length}`}
                        strokeDashoffset={-seg.offset}
                        className="transition-transform duration-200 cursor-pointer"
                        style={{ opacity: hoveredPieSlice && hoveredPieSlice.label !== seg.label ? 0.55 : 1, transformOrigin: '110px 110px', transform: hoveredPieSlice?.label === seg.label ? 'scale(1.02)' : 'scale(1)' }}
                        onMouseEnter={(e) => handlePieHover(seg, e)}
                        onMouseLeave={() => setHoveredPieSlice(null)}
                      />
                    ))}
                  </g>
                  {/* Subtle background ring */}
                  <circle cx={110} cy={110} r={96} fill="transparent" stroke="rgba(148,163,184,0.2)" strokeWidth={2} />
                  {/* Donut hole */}
                  <circle cx={110} cy={110} r={55} fill="currentColor" className="text-white dark:text-slate-800" />
                  <circle cx={110} cy={110} r={51} fill="white" className="dark:fill-slate-800" />
                  <g fill="currentColor" className="text-slate-800 dark:text-slate-100" textAnchor="middle">
                    <text x={110} y={108} className="text-3xl font-bold" dominantBaseline="middle">{kpis.total}</text>
                    <text x={110} y={128} className="text-xs tracking-[0.15em] uppercase fill-slate-500 dark:fill-slate-400">Tasks</text>
                  </g>
                </svg>
              )}
            </div>

            {/* Legend */}
            <div className="space-y-3">
              {pieData.map((d, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-full border border-white shadow-sm dark:border-slate-700" style={{ backgroundColor: d.color }}></div>
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-300 w-24">{d.label}</span>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 tabular-nums">{d.value}</span>
                  <span className="text-xs text-slate-400 tabular-nums">({((d.value/totalForPie)*100 || 0).toFixed(0)}%)</span>
                </div>
              ))}
               {pieData.length === 0 && (
                 <p className="text-slate-400 text-sm">No tasks data available.</p>
               )}
            </div>

            {/* Pie Tooltip */}
            {hoveredPieSlice && (
              <div
                className="absolute z-20 pointer-events-none bg-slate-800 text-white text-xs rounded-lg shadow-lg px-3 py-2 border border-slate-700"
                style={{ left: hoveredPieSlice.cx, top: hoveredPieSlice.cy - 50 }}
              >
                <div className="font-semibold text-slate-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: hoveredPieSlice.color }}></span>
                  {hoveredPieSlice.label}
                </div>
                <div className="mt-1 text-slate-200">{hoveredPieSlice.value} tasks</div>
                <div className="text-slate-400">{hoveredPieSlice.percent.toFixed(1)}%</div>
              </div>
            )}
          </div>
        </div>

        {/* Productivity Trend (Line Chart) */}
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-7 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
            <div>
              <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-slate-400" />
                Productiviteitslijn
              </h3>
              <p className="text-xs text-slate-500">Taken aangemaakt vs. afgerond</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: chartColors.created }}></span>
                <span>Created</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full border border-dashed border-slate-300" style={{ backgroundColor: 'transparent' }}></span>
                <span className="flex items-center gap-1">
                  <span className="w-3 h-[2px] bg-[length:6px_2px] bg-repeat-x" style={{ backgroundImage: `linear-gradient(90deg, ${chartColors.completed} 50%, transparent 50%)` }}></span>
                  Completed
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex-1 min-h-[220px] w-full relative" ref={lineChartRef}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
               {/* Grid Lines */}
               <line 
                 x1={padding} y1={padding / 1.5} x2={padding} y2={chartHeight - padding} 
                 stroke={chartColors.grid} strokeWidth="1" strokeDasharray="2 4" />
               <line 
                 x1={padding} y1={chartHeight - padding} x2={chartWidth - padding / 1.5} y2={chartHeight - padding} 
                 stroke={chartColors.grid} strokeWidth="1" strokeDasharray="2 4" />

               {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
                 <line 
                   key={`g-${tick}`}
                   x1={padding} 
                   y1={chartHeight - padding - tick * (chartHeight - padding*2)} 
                   x2={chartWidth - padding} 
                   y2={chartHeight - padding - tick * (chartHeight - padding*2)} 
                   stroke={chartColors.grid}
                   strokeWidth="1"
                   strokeDasharray="3 5"
                 />
               ))}

               {/* Y Axis Labels */}
               {yTicks.map((tick) => {
                 const y = chartHeight - padding - (tick / Math.max(maxVal, 1)) * (chartHeight - padding * 2);
                 return (
                   <text
                     key={`y-${tick}`}
                     x={padding - 10}
                     y={y + 4}
                     className="text-[10px] fill-slate-400"
                     textAnchor="end"
                   >
                     {tick}
                   </text>
                 );
               })}

               {/* Forecast band */}
               {forecastBand && (
                 <rect
                   x={forecastBand.x1}
                   y={padding / 2}
                   width={forecastBand.x2 - forecastBand.x1}
                   height={chartHeight - padding}
                   fill={chartColors.forecast}
                 />
               )}

               {/* Area under created line */}
               {areaPathCreated && (
                 <path
                   d={areaPathCreated}
                   fill={chartColors.createdArea}
                 />
               )}

               {/* Line: Created */}
               <polyline 
                 fill="none" 
                 stroke={chartColors.created}
                 strokeWidth="4.5" 
                 points={pointsCreated} 
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 className="drop-shadow-sm"
               />
               
               {/* Line: Completed */}
               <polyline 
                 fill="none" 
                 stroke={chartColors.completed}
                 strokeWidth="3.5" 
                 points={pointsCompleted} 
                 strokeLinecap="round"
                 strokeLinejoin="round"
                 strokeDasharray="6 6"
                 className="drop-shadow-sm"
               />

               {/* Points & Hover Areas */}
               {lineChartData.map((d, i) => {
                 const cx = getX(i);
                 const hitStart = i === 0 ? padding : (getX(i - 1) + cx) / 2;
                 const hitEnd = i === lineChartData.length - 1 ? chartWidth - padding : (cx + getX(i + 1)) / 2;
                 return (
                   <g key={`pt-${i}`}>
                     <circle
                       cx={cx}
                       cy={getY(d.created)}
                       r={6}
                       fill={chartColors.created}
                       className="cursor-pointer"
                       onMouseEnter={(e) => handleLineHover(d, e)}
                       onMouseLeave={() => setHoveredLinePoint(null)}
                     />
                     <circle
                       cx={cx}
                       cy={getY(d.completed)}
                       r={6}
                       fill={chartColors.completed}
                       className="cursor-pointer"
                       onMouseEnter={(e) => handleLineHover(d, e)}
                       onMouseLeave={() => setHoveredLinePoint(null)}
                     />
                     <rect
                       x={hitStart}
                       y={0}
                       width={Math.max(hitEnd - hitStart, 12)}
                       height={chartHeight}
                       fill="transparent"
                       onMouseEnter={(e) => handleLineHover(d, e)}
                       onMouseLeave={() => setHoveredLinePoint(null)}
                     />
                   </g>
                 );
               })}

               {/* X-Axis Labels (Show every 3rd or end) */}
               {lineChartData.map((d, i) => {
                 if (i % 3 !== 0 && i !== lineChartData.length -1) return null;
                 return (
                   <text 
                     key={i} 
                     x={getX(i)} 
                     y={chartHeight - 6} 
                     className="text-[10px] fill-slate-500" 
                     textAnchor="middle"
                   >
                     {d.date}
                   </text>
                 );
               })}
            </svg>

            {/* Line Tooltip */}
            {hoveredLinePoint && (
              <div
                className="absolute z-10 pointer-events-none bg-slate-800 text-white text-xs rounded-lg shadow-lg px-3 py-2 border border-slate-700"
                style={{ left: hoveredLinePoint.x, top: hoveredLinePoint.y - 48 }}
              >
                <div className="font-semibold text-slate-100">{hoveredLinePoint.date}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors.created }}></span>Created: {hoveredLinePoint.created}</span>
                  <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: chartColors.completed }}></span>Completed: {hoveredLinePoint.completed}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: chartColors.created }}></span>
              <span>Created</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: chartColors.completed, borderColor: chartColors.completed }}></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-4 h-[2px] bg-slate-300 dark:bg-slate-600" style={{ boxShadow: '0 1px 0 rgba(0,0,0,0.05)' }}></span>
              <span>Forecast window</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
