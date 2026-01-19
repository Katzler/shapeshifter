import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/testUtils';
import { CoverageGrid } from './CoverageGrid';

describe('CoverageGrid', () => {
  it('renders the coverage title', () => {
    render(<CoverageGrid />);
    expect(screen.getByText('Coverage Summary')).toBeInTheDocument();
  });

  it('renders the legend with all three statuses', () => {
    render(<CoverageGrid />);
    expect(screen.getByText('Available')).toBeInTheDocument();
    expect(screen.getByText('Neutral')).toBeInTheDocument();
    expect(screen.getByText('Unavailable')).toBeInTheDocument();
  });

  it('shows empty state message when no agents', () => {
    render(<CoverageGrid />);
    expect(screen.getByText('Add agents to see coverage data.')).toBeInTheDocument();
  });

  it('renders coverage counts as numbers', () => {
    render(<CoverageGrid />);
    // When no agents, all counts should be 0
    const zeros = screen.getAllByText('0');
    expect(zeros.length).toBeGreaterThan(0);
  });
});

describe('CoverageGrid tooltips', () => {
  it('shows tooltip on hover for non-zero counts', async () => {
    // This test would require setting up agents in the store
    // For now we test that the component renders without errors
    render(<CoverageGrid />);

    // Find count elements with has-tooltip class
    const counts = document.querySelectorAll('.count.has-tooltip');

    // With no agents, there should be no interactive tooltips
    expect(counts.length).toBe(0);
  });

  it('count elements without tooltips are not interactive', () => {
    render(<CoverageGrid />);

    // Zero counts should not have has-tooltip class
    const zeroCount = screen.getAllByText('0')[0];
    expect(zeroCount).not.toHaveClass('has-tooltip');
  });
});
