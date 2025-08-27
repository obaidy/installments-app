import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddComplexScreen from '../app/complexes/add';
import { ToastProvider } from '../components/Toast';
import { insertComplexesFromInput } from '../lib/complexes';

  jest.mock('../Config', () => ({
    SUPABASE_URL: 'http://localhost',
    SUPABASE_ANON_KEY: 'anon',
  }));

  jest.mock('../lib/complexes', () => ({
    insertComplexesFromInput: jest.fn(),
  }));

  describe('AddComplexScreen', () => {
  beforeEach(() => {
    (insertComplexesFromInput as jest.Mock).mockResolvedValue(null);
  });

  it('submits codes to supabase', async () => {
    const { getByPlaceholderText, getByText } = render(
      <ToastProvider>
        <AddComplexScreen />
      </ToastProvider>,
    );

    fireEvent.changeText(
      getByPlaceholderText('Complex Code(s), comma separated'),
      'ABC,DEF',
    );
    fireEvent.press(getByText('Add'));

    await waitFor(() => {
     expect(insertComplexesFromInput).toHaveBeenCalledWith('ABC,DEF');
    });
  });
});
