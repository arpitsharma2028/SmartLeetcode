import { useMemo } from 'react';

const COLOR_MAP = {
  'green': 'bg-green-500',
  'greenish-yellow': 'bg-lime-400',
  'yellow': 'bg-yellow-400',
  'red': 'bg-red-500',
};

const getTooltipText = (color, totalSubmissions) => {
  const count = totalSubmissions || 0;
  const submissionsText = `${count} submission${count !== 1 ? 's' : ''}`;
  let statusText = 'No activity';
  
  if (color === 'green') statusText = 'Flawless (0 hints)';
  else if (color === 'greenish-yellow') statusText = 'Accepted (1 hint)';
  else if (color === 'yellow') statusText = 'Accepted (2-3 hints)';
  else if (color === 'red') statusText = 'Struggled (4+ hints or not accepted)';

  return count > 0 ? `${statusText} • ${submissionsText}` : statusText;
};

const Heatmap = ({ data }) => {
  // Generate the last 365 days
  const days = useMemo(() => {
    const dataMap = new Map();
    if (data) {
      data.forEach(item => dataMap.set(item.date, item));
    }

    const today = new Date();
    const result = [];
    
    // Create an array of exactly 365 days ending on today
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const dayData = dataMap.get(dateStr);
      result.push({
        date: dateStr,
        color: dayData?.color || null,
        totalSubmissions: dayData?.totalSubmissions || 0
      });
    }
    return result;
  }, [data]);

  return (
    <section className="theme-panel p-6" aria-label="Activity heatmap">
      <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold text-[#edece9]">Activity</h2><span className="theme-eyebrow">Past year</span></div>
      
      <div className="overflow-x-auto pb-3 pt-1">
        <div 
          className="grid gap-1"
          style={{
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
            gridAutoFlow: 'column',
            gridAutoColumns: 'min-content'
          }}
        >
          {days.map(day => {
            const bgClass = day.color ? COLOR_MAP[day.color] : 'bg-[#22252a]';
            const tooltipText = `${day.date}: ${getTooltipText(day.color, day.totalSubmissions)}`;
            
            return (
              <div 
                key={day.date}
                className={`h-3 w-3 rounded-[2px] cursor-pointer hover:opacity-75 transition-opacity ${bgClass} group relative`}
                title={tooltipText}
                aria-label={tooltipText}
              >
                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
                  <div className="bg-gray-900 text-gray-200 text-xs py-1 px-2 rounded whitespace-nowrap border border-gray-600 shadow-xl">
                    {tooltipText}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[#999da6]">
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-green-500" />No hints</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-yellow-400" />Hint use</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-red-500" />Struggled</span>
      </div>
    </section>
  );
};

export default Heatmap;
