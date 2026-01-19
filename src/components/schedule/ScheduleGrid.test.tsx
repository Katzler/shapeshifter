import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/testUtils';
import { ScheduleGrid } from './ScheduleGrid';

describe('ScheduleGrid', () => {
  it('renders the schedule title', () => {
    render(<ScheduleGrid />);
    expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();
  });

  it('renders the legend with Available and Neutral', () => {
    render(<ScheduleGrid />);

    // The schedule legend should show Available and Neutral
    const legendItems = document.querySelectorAll('.schedule-legend .legend-item');
    expect(legendItems.length).toBe(2);

    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<ScheduleGrid />);
    expect(screen.getByText('Autofill')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('shows empty state when no agents', () => {
    render(<ScheduleGrid />);
    expect(screen.getByText('Add agents to create a schedule.')).toBeInTheDocument();
  });

  it('disables Autofill button when no agents', () => {
    render(<ScheduleGrid />);
    const suggestButton = screen.getByText('Autofill');
    expect(suggestButton).toBeDisabled();
  });
});
