import "@testing-library/jest-dom";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ActiveTrucksCard } from "../ActiveTrucksCard";

const FRENTE = "TPCDMXP-F1";

beforeEach(() => {
  jest.useFakeTimers();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

function mockFetchResponse(count: number) {
  (global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ inTransitNow: count }),
  });
}

describe("ActiveTrucksCard", () => {
  it("shows skeleton while loading", () => {
    mockFetchResponse(5);
    render(<ActiveTrucksCard frente={FRENTE} />);
    expect(screen.getByText("En tránsito")).toBeInTheDocument();
    expect(screen.queryByText("5")).not.toBeInTheDocument();
  });

  it("displays count after fetch resolves", async () => {
    mockFetchResponse(7);
    render(<ActiveTrucksCard frente={FRENTE} />);
    await waitFor(() => expect(screen.getByText("7")).toBeInTheDocument());
    expect(screen.getByText("En tránsito")).toBeInTheDocument();
  });

  it("shows dash on fetch error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("network"));
    render(<ActiveTrucksCard frente={FRENTE} />);
    await waitFor(() => expect(screen.getByText("—")).toBeInTheDocument());
  });

  it("polls again after 30s", async () => {
    mockFetchResponse(3);
    render(<ActiveTrucksCard frente={FRENTE} />);
    await waitFor(() => expect(screen.getByText("3")).toBeInTheDocument());

    mockFetchResponse(10);
    act(() => jest.advanceTimersByTime(30_000));
    await waitFor(() => expect(screen.getByText("10")).toBeInTheDocument());

    expect(global.fetch).toHaveBeenCalledTimes(2);
  });

  it("fetches with the correct frente param", async () => {
    mockFetchResponse(0);
    render(<ActiveTrucksCard frente={FRENTE} />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const url = (global.fetch as jest.Mock).mock.calls[0][0] as string;
    expect(url).toContain(`frente=${encodeURIComponent(FRENTE)}`);
  });
});
