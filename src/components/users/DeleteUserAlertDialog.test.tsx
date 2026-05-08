import "@testing-library/jest-dom";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DeleteUserAlertDialog } from "./DeleteUserAlertDialog";

jest.mock("@/components/ui/use-toast", () => ({
  useToast: () => ({ toast: jest.fn() }),
}));

const defaultProps = {
  username: "operador01",
  open: true,
  onOpenChange: jest.fn(),
  onDelete: jest.fn(),
};

describe("DeleteUserAlertDialog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("renders username and warning message", () => {
    render(<DeleteUserAlertDialog {...defaultProps} />);

    expect(screen.getByText(/operador01/)).toBeInTheDocument();
    expect(screen.getByText(/permanente/i)).toBeInTheDocument();
  });

  it("renders cancel and confirm buttons", () => {
    render(<DeleteUserAlertDialog {...defaultProps} />);

    expect(screen.getByRole("button", { name: /cancelar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /eliminar/i })).toBeInTheDocument();
  });

  it("calls DELETE /api/user/[username] on confirm", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<DeleteUserAlertDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /sí, eliminar/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/user/operador01",
        expect.objectContaining({ method: "DELETE" })
      );
    });
  });

  it("calls onDelete with username after successful deletion", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ ok: true }),
    });

    render(<DeleteUserAlertDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /sí, eliminar/i }));

    await waitFor(() => {
      expect(defaultProps.onDelete).toHaveBeenCalledWith("operador01");
    });
  });

  it("shows inline error if request fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ message: "User not found" }),
    });

    render(<DeleteUserAlertDialog {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: /sí, eliminar/i }));

    await waitFor(() => {
      expect(screen.getByText("User not found")).toBeInTheDocument();
    });
    expect(defaultProps.onDelete).not.toHaveBeenCalled();
  });
});
