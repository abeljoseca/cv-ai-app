import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Chat from '@/components/Chat';

describe('Chat Component', () => {
  it('debe renderizar el componente de chat', () => {
    render(<Chat mode="perfil" />);
    expect(screen.getByText('Asistente IA')).toBeInTheDocument();
  });

  it('debe mostrar placeholder en el input', () => {
    render(<Chat mode="perfil" />);
    const input = screen.getByPlaceholderText('Escribe tu mensaje...');
    expect(input).toBeInTheDocument();
  });

  it('debe tener un botón de envío deshabilitado al inicio', () => {
    render(<Chat mode="perfil" />);
    const sendButton = screen.getByText('Enviar');
    expect(sendButton).toBeDisabled();
  });

  it('debe habilitar el botón de envío cuando hay texto', () => {
    render(<Chat mode="perfil" />);
    const input = screen.getByPlaceholderText('Escribe tu mensaje...') as HTMLInputElement;
    const sendButton = screen.getByText('Enviar');

    fireEvent.change(input, { target: { value: 'Hola' } });
    expect(sendButton).not.toBeDisabled();
  });

  it('debe limpiar el input después de enviar', async () => {
    // Mock del fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: 'Respuesta de IA' }),
      })
    ) as any;

    render(<Chat mode="perfil" />);
    const input = screen.getByPlaceholderText('Escribe tu mensaje...') as HTMLInputElement;
    const sendButton = screen.getByText('Enviar');

    fireEvent.change(input, { target: { value: 'Hola' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });
});
