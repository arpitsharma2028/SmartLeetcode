import { useMemo } from 'react';

const COLOR_MAP = {
  'green': 'bg-green-500',
  'greenish-yellow': 'bg-lime-400',
  'yellow': 'bg-yellow-400',
  'red': 'bg-red-500',
};

const getTooltipText = (color) => {
  if (color === 'green') return 'Flawless (0 hints)';
  if (color === 'greenish-yellow') return 'Accepted (1 hint)';
  if (color === 'yellow') return 'Accepted (2 hints)';
  if (color === 'red') return 'Struggled (4+ hints or failed)';
  return 'No activity';
};

const Heatmap = ({ data }) => {
  // Generate the last 365 days
  const days = useMemo(() => {
    const dataMap = new Map();
    if (data) {
      data.forEach(item => dataMap.set(item.date, item.color));
    }

    const today = new Date();
    const result = [];
    
    // Create an array of exactly 365 days ending on today
    for (let i = 364; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      result.push({
        date: dateStr,
        color: dataMap.get(dateStr) || null
      });
    }
    return result;
  }, [data]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-lg mt-8">
      <h3 className="text-xl font-bold text-white mb-4">Contribution Heatmap</h3>
      
      <div className="overflow-x-auto pb-4">
        <div 
          className="grid gap-1"
          style={{
            gridTemplateRows: 'repeat(7, minmax(0, 1fr))',
            gridAutoFlow: 'column',
            gridAutoColumns: 'min-content'
          }}
        >
          {days.map((day, idx) => {
            const bgClass = day.color ? COLOR_MAP[day.color] : 'bg-gray-700';
            const tooltipText = `${day.date}: ${getTooltipText(day.color)}`;
            
            return (
              <div 
                key={day.date}
                className={`w-4 h-4 rounded-sm cursor-pointer hover:ring-2 hover:ring-white transition-all ${bgClass} group relative`}
              >
                {/* Custom Tooltip */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
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
      <div className="mt-4 flex items-center justify-end space-x-3 text-sm text-gray-400">
        <span>Less</span>
        <div className="w-4 h-4 rounded-sm bg-gray-700"></div>
        <div className="w-4 h-4 rounded-sm bg-red-500" title="Struggled"></div>
        <div className="w-4 h-4 rounded-sm bg-yellow-400" title="2 Hints"></div>
        <div className="w-4 h-4 rounded-sm bg-lime-400" title="1 Hint"></div>
        <div className="w-4 h-4 rounded-sm bg-green-500" title="Flawless"></div>
        <span>More</span>
      </div>
    </div>
  );
};

export default Heatmap;
