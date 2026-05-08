import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ResetPasswordDialog } from "./ResetPasswordDialog";

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));
jest.mock("crypto-js/sha256", () => jest.fn(() => ({ toString: () => "sha256mockhash" })));

const defaultProps = {
  username: "operador01",
  open: true,
  onOpenChange: jest.fn(),
};

describe("ResetPasswordDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders username and both password fields", () => {
    render(<ResetPasswordDialog {...defaultProps} />);

    expect(screen.getByText(/operador01/)).toBeInTheDocument();
    expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
  });

  it("shows validation error when passwords are too short", async () => {
    render(<ResetPasswordDialog {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: "abc" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "abc" },
    });
    fireEvent.click(screen.getByRole("button", { name: /restablecer/i }));

    await waitFor(() => {
      expect(screen.getByText(/más de 6 caracteres/i)).toBeInTheDocument();
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("shows validation error when passwords do not match", async () => {
    render(<ResetPasswordDialog {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "different123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /restablecer/i }));

    await waitFor(() => {
      // Two "no coinciden" messages appear: real-time inline + form-level error
      expect(screen.getAllByText(/no coinciden/i).length).toBeGreaterThanOrEqual(1);
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("calls PUT /api/user/[username]/password with SHA256 hash on valid submit", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<ResetPasswordDialog {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: "validpassword" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "validpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /restablecer/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/operador01/password",
        expect.objectContaining({
          method: "PUT",
          body: JSON.stringify({ password: "sha256mockhash" }),
        })
      );
    });
  });

  it("shows inline error if request fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "User not found" }),
    });

    render(<ResetPasswordDialog {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: "validpassword" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "validpassword" },
    });
    fireEvent.click(screen.getByRole("button", { name: /restablecer/i }));

    await waitFor(() => {
      expect(screen.getByText(/no encontrado/i)).toBeInTheDocument();
    });
  });
});
