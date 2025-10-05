import React from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface ChartProps {
  data: DataPoint[];
  type: 'bar' | 'line' | 'donut';
  title?: string;
  height?: number;
}

export function Chart({ data, type, title, height = 300 }: ChartProps) {
  if (type === 'bar') {
    const maxValue = Math.max(...data.map(d => d.value));

    return (
      <div className="space-y-2">
        {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
        <div className="space-y-3" style={{ height }}>
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-24 text-sm text-gray-600 truncate">{point.label}</div>
              <div className="flex-1 bg-gray-100 rounded-full h-8 overflow-hidden">
                <div
                  className="h-full flex items-center justify-end px-3 text-sm font-medium text-white transition-all duration-500"
                  style={{
                    width: `${(point.value / maxValue) * 100}%`,
                    backgroundColor: point.color || '#3b82f6',
                  }}
                >
                  {point.value > 0 && point.value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'line') {
    const maxValue = Math.max(...data.map(d => d.value));
    const points = data.map((point, index) => {
      const x = (index / (data.length - 1)) * 100;
      const y = 100 - (point.value / maxValue) * 80;
      return `${x},${y}`;
    }).join(' ');

    return (
      <div className="space-y-2">
        {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
        <div className="relative bg-gradient-to-b from-blue-50 to-white border border-gray-200 rounded-lg p-4" style={{ height }}>
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <polyline
              points={points}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="0.5"
              className="drop-shadow-sm"
            />
            <polyline
              points={`0,100 ${points} 100,100`}
              fill="url(#gradient)"
              opacity="0.3"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute bottom-2 left-0 right-0 flex justify-between px-4 text-xs text-gray-500">
            {data.map((point, index) => (
              index % Math.ceil(data.length / 6) === 0 && (
                <span key={index}>{point.label}</span>
              )
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (type === 'donut') {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = 0;

    return (
      <div className="space-y-4">
        {title && <h3 className="font-semibold text-gray-900">{title}</h3>}
        <div className="flex items-center gap-8">
          <div className="relative" style={{ width: height, height }}>
            <svg viewBox="0 0 100 100" className="transform -rotate-90">
              {data.map((point, index) => {
                const percentage = (point.value / total) * 100;
                const angle = (percentage / 100) * 360;
                const startAngle = currentAngle;
                currentAngle += angle;

                const x1 = 50 + 40 * Math.cos((startAngle * Math.PI) / 180);
                const y1 = 50 + 40 * Math.sin((startAngle * Math.PI) / 180);
                const x2 = 50 + 40 * Math.cos((currentAngle * Math.PI) / 180);
                const y2 = 50 + 40 * Math.sin((currentAngle * Math.PI) / 180);
                const largeArc = angle > 180 ? 1 : 0;

                return (
                  <path
                    key={index}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={point.color || `hsl(${index * 60}, 70%, 60%)`}
                    className="hover:opacity-80 transition-opacity"
                  />
                );
              })}
              <circle cx="50" cy="50" r="25" fill="white" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-2xl font-bold text-gray-900">{total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((point, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: point.color || `hsl(${index * 60}, 70%, 60%)` }}
                  />
                  <span className="text-sm text-gray-700">{point.label}</span>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {point.value} ({((point.value / total) * 100).toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
