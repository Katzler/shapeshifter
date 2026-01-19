import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from './testUtils';
import userEvent from '@testing-library/user-event';
import App from '../App';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('App Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders the app with tabs', () => {
    render(<App />);

    // Only Schedule and Coverage tabs exist
    expect(screen.getByRole('button', { name: 'Schedule' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Coverage' })).toBeInTheDocument();
  });

  it('shows add agent button', () => {
    render(<App />);
    expect(screen.getByText('+ Add Agent')).toBeInTheDocument();
  });

  it('can add an agent', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Click add agent button
    await user.click(screen.getByText('+ Add Agent'));

    // Type agent name and submit
    const input = screen.getByPlaceholderText('Agent name');
    await user.type(input, 'Alice{enter}');

    // Agent should appear in the sidebar list
    await waitFor(() => {
      const agentListItem = document.querySelector('.agent-list-item .agent-name');
      expect(agentListItem).toHaveTextContent('Alice');
    });
  });

  it('switches between tabs', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Default view is Schedule
    expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();

    // Click Coverage tab
    await user.click(screen.getByRole('button', { name: 'Coverage' }));
    expect(screen.getByText('Coverage Summary')).toBeInTheDocument();

    // Click back to Schedule tab
    await user.click(screen.getByRole('button', { name: 'Schedule' }));
    expect(screen.getByText('Weekly Schedule')).toBeInTheDocument();
  });
});

describe('Coverage updates when agents change', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('shows zero coverage with no agents', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Go to Coverage tab
    await user.click(screen.getByText('Coverage'));

    // All counts should be 0
    const counts = screen.getAllByText('0');
    expect(counts.length).toBeGreaterThan(0);
  });
});

describe('Schedule functionality', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('shows empty schedule message with no agents', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Go to Schedule tab
    await user.click(screen.getByText('Schedule'));

    expect(screen.getByText('Add agents to create a schedule.')).toBeInTheDocument();
  });

  it('has legend with Available and Neutral', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Go to Schedule tab
    await user.click(screen.getByText('Schedule'));

    // Check for legend items
    const scheduleSection = screen.getByText('Weekly Schedule').closest('.schedule-grid-container');
    expect(scheduleSection).toBeInTheDocument();

    // The schedule should have Available and Neutral in its legend
    const legendItems = document.querySelectorAll('.schedule-legend .legend-item');
    expect(legendItems.length).toBe(2);
  });
});
