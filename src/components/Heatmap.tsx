"use client";

import React, { useEffect, useState } from 'react';
import CalendarHeatmap, { TooltipDataAttrs } from 'react-calendar-heatmap';
import { useSelection } from '@/lib/selectionContext';
import { Contribution } from '@/types';

interface HeatmapProps {
  startDate: Date;
  endDate: Date;
}

interface HeatmapValue {
  date: string;
  count: number;
}

export default function Heatmap({ startDate, endDate }: HeatmapProps) {
  const { selectedInstanceId, selectedUserId, loading: selectionLoading } = useSelection();
  const [contributions, setContributions] = useState<HeatmapValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      if (!selectedInstanceId || !selectedUserId) {
        setContributions([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/gitlab/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            instanceId: selectedInstanceId,
            userId: selectedUserId,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }

        const data = await response.json();
        
        // Aggregate events by date
        const eventsByDate = data.reduce((acc: { [key: string]: number }, event: any) => {
          const date = new Date(event.created_at).toISOString().split('T')[0];
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        // Convert to CalendarHeatmap format
        const contributions: HeatmapValue[] = Object.entries(eventsByDate).map(([date, count]) => ({
          date,
          count: count as number,
        }));

        setContributions(contributions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [selectedInstanceId, selectedUserId, startDate, endDate]);

  if (selectionLoading || loading) {
    return <div className="text-center text-muted-foreground">Loading...</div>;
  }

  if (error) {
    return <div className="text-center text-destructive">{error}</div>;
  }

  if (!selectedInstanceId || !selectedUserId) {
    return <div className="text-center text-muted-foreground">Select an instance and user to view contributions</div>;
  }

  return (
    <div className="heatmap-container">
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={contributions}
        classForValue={(value) => {
          if (!value) return 'color-empty';
          return `color-scale-${Math.min(value.count, 4)}`;
        }}
        tooltipDataAttrs={(value): TooltipDataAttrs => {
          if (!value) return { 'aria-label': 'No contributions' };
          return { 'aria-label': `${value.date}: ${value.count} contributions` };
        }}
        showWeekdayLabels
        titleForValue={(value) => {
          if (!value) return 'No contributions';
          return `${value.date}: ${value.count} contributions`;
        }}
      />
      <style jsx>{`
        .heatmap-container {
          padding: 1rem;
          background: var(--card-background);
          border-radius: 0.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        :global(.react-calendar-heatmap .color-empty) {
          fill: var(--muted);
        }
        :global(.react-calendar-heatmap .color-scale-1) {
          fill: var(--primary-light);
        }
        :global(.react-calendar-heatmap .color-scale-2) {
          fill: var(--primary);
        }
        :global(.react-calendar-heatmap .color-scale-3) {
          fill: var(--primary-dark);
        }
        :global(.react-calendar-heatmap .color-scale-4) {
          fill: var(--primary-darker);
        }
      `}</style>
    </div>
  );
} 