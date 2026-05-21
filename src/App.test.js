import { render, screen } from '@testing-library/react';
import App from './App';

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => [],
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

test('renders the packing list app title', async () => {
  render(<App />);
  expect(await screen.findByText(/my packing list/i)).toBeInTheDocument();
});
