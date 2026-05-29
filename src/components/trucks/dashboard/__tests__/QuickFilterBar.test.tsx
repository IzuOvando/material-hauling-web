import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuickFilterBar } from "../QuickFilterBar";
import { useDashboardStore } from "@/store/dashboardStore";

beforeEach(() => {
  useDashboardStore.setState({
    period: { type: "week", weekStart: "2026-05-25" },
    selectedMaterial: null,
  });
});

describe("QuickFilterBar", () => {
  it("renders 3 filter buttons", () => {
    render(<QuickFilterBar />);
    expect(screen.getByText("Semana")).toBeInTheDocument();
    expect(screen.getByText("Mes")).toBeInTheDocument();
    expect(screen.getByText("Año")).toBeInTheDocument();
  });

  it("clicking Mes sets month period in store", () => {
    render(<QuickFilterBar />);
    fireEvent.click(screen.getByText("Mes"));
    const period = useDashboardStore.getState().period;
    expect(period.type).toBe("month");
  });

  it("clicking Año sets year period in store", () => {
    render(<QuickFilterBar />);
    fireEvent.click(screen.getByText("Año"));
    const period = useDashboardStore.getState().period;
    expect(period.type).toBe("year");
  });

  it("clicking a period clears selectedMaterial", () => {
    useDashboardStore.setState({ selectedMaterial: "arena" });
    render(<QuickFilterBar />);
    fireEvent.click(screen.getByText("Mes"));
    expect(useDashboardStore.getState().selectedMaterial).toBeNull();
  });
});
