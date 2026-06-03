import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { StatCardsRow } from "../StatCardsRow";
import type { SummaryResponse } from "@/types/dashboard";

const mockSummary: SummaryResponse = {
  totalTrips: 120,
  totalM3: 980.5,
  avgM3PerTrip: 8.17,
  arrivalRate: 85.5,
  turno1Arrived: 70,
  turno2Arrived: 50,
};

describe("StatCardsRow", () => {
  it("renders all 5 stat cards", () => {
    render(<StatCardsRow data={mockSummary} />);
    expect(screen.getByText("Viajes")).toBeInTheDocument();
    expect(screen.getByText("M³ acarreados")).toBeInTheDocument();
    expect(screen.getByText("M³ / viaje")).toBeInTheDocument();
    expect(screen.getByText("Arribo")).toBeInTheDocument();
    expect(screen.getByText("Turnos")).toBeInTheDocument();
  });

  it("displays correct values", () => {
    render(<StatCardsRow data={mockSummary} />);
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("980.50")).toBeInTheDocument();
    expect(screen.getByText("8.17")).toBeInTheDocument();
    expect(screen.getByText("85.5%")).toBeInTheDocument();
    expect(screen.getByText("T1: 70 · T2: 50")).toBeInTheDocument();
  });

  it("handles zero values without crashing", () => {
    const empty: SummaryResponse = {
      totalTrips: 0,
      totalM3: 0,
      avgM3PerTrip: 0,
      arrivalRate: 0,
      turno1Arrived: 0,
      turno2Arrived: 0,
    };
    render(<StatCardsRow data={empty} />);
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("0.0%")).toBeInTheDocument();
  });
});
