"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import CONFIG from "@/config";
import type {
  TrucksFilterState,
  PeriodPreset,
  StatusValue,
  TurnoValue,
  VoucherView,
} from "@/types/trucks-filters";
import {
  detectPreset,
  getDefaultRangeString,
  getPeriodRange,
  parseRange,
  rangeToString,
} from "@/actions/trucks/periods";

const DEFAULT_PERIOD: PeriodPreset = "yesterday";

type FilterMap = Record<string, string[]>;

function parseFilterString(input: string | null): FilterMap {
  const out: FilterMap = {};
  if (!input) return out;
  for (const part of input.split("|")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const field = part.slice(0, eq).trim();
    const vals = part
      .slice(eq + 1)
      .split("^")
      .map((v) => v.trim())
      .filter(Boolean);
    if (field && vals.length > 0) out[field] = vals;
  }
  return out;
}

function buildFilterString(map: FilterMap): string {
  return Object.entries(map)
    .filter(([, vals]) => vals.length > 0)
    .map(([f, vals]) => `${f}=${vals.join("^")}`)
    .join("|");
}

function deriveState(filtersString: string | null): TrucksFilterState {
  const parsed = parseFilterString(filtersString);

  let period: PeriodPreset = DEFAULT_PERIOD;
  let range: TrucksFilterState["range"] = null;
  if (parsed.voucherDatetimeRange?.[0]) {
    const parsedRange = parseRange(parsed.voucherDatetimeRange[0]);
    if (parsedRange) {
      range = parsedRange;
      period = detectPreset(parsedRange);
    }
  }

  const statusRaw = parsed.status?.[0] as StatusValue | undefined;
  const status: StatusValue =
    statusRaw === "IN_TRANSIT" || statusRaw === "ARRIVED" ? statusRaw : "ALL";

  const turnoRaw = parsed.turno?.[0];
  const turno: TurnoValue = turnoRaw === "1" || turnoRaw === "2" ? turnoRaw : "ALL";

  return {
    period,
    range,
    status,
    q: parsed.q?.[0] ?? "",
    material: parsed.material ?? [],
    checkerName: parsed.checkerName ?? [],
    arrivalCheckerName: parsed.arrivalCheckerName ?? [],
    turno,
    frenteNombre: parsed.frenteNombre ?? [],
  };
}

function stateToMap(state: TrucksFilterState): FilterMap {
  const map: FilterMap = {};

  if (state.period === "custom" && state.range) {
    map.voucherDatetimeRange = [rangeToString(state.range)];
  } else {
    const r = getPeriodRange(state.period as Exclude<PeriodPreset, "custom">);
    map.voucherDatetimeRange = [rangeToString(r)];
  }

  if (state.status !== "ALL") map.status = [state.status];
  if (state.turno !== "ALL") map.turno = [state.turno];
  if (state.q.trim()) map.q = [state.q.trim()];
  if (state.material.length) map.material = state.material;
  if (state.checkerName.length) map.checkerName = state.checkerName;
  if (state.arrivalCheckerName.length) map.arrivalCheckerName = state.arrivalCheckerName;
  if (state.frenteNombre.length) map.frenteNombre = state.frenteNombre;

  return map;
}

interface UseTrucksTableResult {
  state: TrucksFilterState;
  page: number;
  limit: number;
  sort: string | null;
  filtersString: string | null;
  /**
   * Filters string that mirrors what the server query actually used: falls back
   * to the default "yesterday" range when the URL has no filters, so Excel,
   * facets and data stay consistent with the displayed list.
   */
  effectiveFiltersString: string;
  view: VoucherView;
  setView: (view: VoucherView) => void;
  setPeriod: (preset: PeriodPreset, range?: { from: string; to: string }) => void;
  setStatus: (status: StatusValue) => void;
  setSearch: (q: string) => void;
  setMaterial: (values: string[]) => void;
  setCheckerName: (values: string[]) => void;
  setArrivalCheckerName: (values: string[]) => void;
  setTurno: (turno: TurnoValue) => void;
  setFrenteNombre: (values: string[]) => void;
  applyAdvanced: (partial: Partial<TrucksFilterState>) => void;
  clearAll: () => void;
  setSort: (field: string, desc: boolean) => void;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
}

export function useTrucksTable(): UseTrucksTableResult {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const filtersString = params.get("filters");
  const sort = params.get("sort");
  const page = Number(params.get("page")) || CONFIG.PAGINATION.DEFAULT_PAGE;
  const limit = Number(params.get("limit")) || CONFIG.PAGINATION.DEFAULT_LIMIT;
  const view: VoucherView = params.get("view") === "table" ? "table" : "cards";

  const state = useMemo(() => deriveState(filtersString), [filtersString]);

  const effectiveFiltersString =
    filtersString && filtersString.length > 0
      ? filtersString
      : `voucherDatetimeRange=${getDefaultRangeString()}`;

  const pushState = useCallback(
    (newState: TrucksFilterState, opts?: { resetPage?: boolean }) => {
      const map = stateToMap(newState);
      const newFilters = buildFilterString(map);
      const search = new URLSearchParams();
      const nextPage = opts?.resetPage ? CONFIG.PAGINATION.DEFAULT_PAGE : page;
      search.set("page", String(nextPage));
      search.set("limit", String(limit));
      if (sort) search.set("sort", sort);
      if (newFilters) search.set("filters", newFilters);
      if (view !== "cards") search.set("view", view);
      router.replace(`${pathname}?${search.toString()}`, { scroll: false });
    },
    [pathname, router, sort, page, limit, view]
  );

  const setPeriod = useCallback(
    (preset: PeriodPreset, range?: { from: string; to: string }) => {
      let next: TrucksFilterState;
      if (preset === "custom" && range) {
        next = { ...state, period: "custom", range };
      } else {
        next = { ...state, period: preset, range: null };
      }
      pushState(next, { resetPage: true });
    },
    [state, pushState]
  );

  const setStatus = useCallback(
    (status: StatusValue) => pushState({ ...state, status }, { resetPage: true }),
    [state, pushState]
  );

  const setSearch = useCallback(
    (q: string) => pushState({ ...state, q }, { resetPage: true }),
    [state, pushState]
  );

  const setMaterial = useCallback(
    (material: string[]) => pushState({ ...state, material }, { resetPage: true }),
    [state, pushState]
  );

  const setCheckerName = useCallback(
    (checkerName: string[]) => pushState({ ...state, checkerName }, { resetPage: true }),
    [state, pushState]
  );

  const setArrivalCheckerName = useCallback(
    (arrivalCheckerName: string[]) =>
      pushState({ ...state, arrivalCheckerName }, { resetPage: true }),
    [state, pushState]
  );

  const setTurno = useCallback(
    (turno: TurnoValue) => pushState({ ...state, turno }, { resetPage: true }),
    [state, pushState]
  );

  const setFrenteNombre = useCallback(
    (frenteNombre: string[]) =>
      pushState({ ...state, frenteNombre }, { resetPage: true }),
    [state, pushState]
  );

  const applyAdvanced = useCallback(
    (partial: Partial<TrucksFilterState>) =>
      pushState({ ...state, ...partial }, { resetPage: true }),
    [state, pushState]
  );

  const clearAll = useCallback(() => {
    const defaultState: TrucksFilterState = {
      period: DEFAULT_PERIOD,
      range: null,
      status: "ALL",
      q: "",
      material: [],
      checkerName: [],
      arrivalCheckerName: [],
      turno: "ALL",
      frenteNombre: [],
    };
    pushState(defaultState, { resetPage: true });
  }, [pushState]);

  const setSort = useCallback(
    (field: string, desc: boolean) => {
      const newSort = `${desc ? "-" : "+"}${field}`;
      const search = new URLSearchParams();
      search.set("page", String(page));
      search.set("limit", String(limit));
      search.set("sort", newSort);
      if (filtersString) search.set("filters", filtersString);
      if (view !== "cards") search.set("view", view);
      router.replace(`${pathname}?${search.toString()}`, { scroll: false });
    },
    [filtersString, limit, page, pathname, router, view]
  );

  const setPage = useCallback(
    (newPage: number) => {
      const search = new URLSearchParams();
      search.set("page", String(newPage));
      search.set("limit", String(limit));
      if (sort) search.set("sort", sort);
      if (filtersString) search.set("filters", filtersString);
      if (view !== "cards") search.set("view", view);
      router.replace(`${pathname}?${search.toString()}`, { scroll: false });
    },
    [filtersString, limit, pathname, router, sort, view]
  );

  const setLimit = useCallback(
    (newLimit: number) => {
      const search = new URLSearchParams();
      search.set("page", String(CONFIG.PAGINATION.DEFAULT_PAGE));
      search.set("limit", String(newLimit));
      if (sort) search.set("sort", sort);
      if (filtersString) search.set("filters", filtersString);
      if (view !== "cards") search.set("view", view);
      router.replace(`${pathname}?${search.toString()}`, { scroll: false });
    },
    [filtersString, pathname, router, sort, view]
  );

  const setView = useCallback(
    (newView: VoucherView) => {
      const search = new URLSearchParams();
      search.set("page", String(CONFIG.PAGINATION.DEFAULT_PAGE));
      search.set("limit", String(limit));
      if (sort) search.set("sort", sort);
      if (filtersString) search.set("filters", filtersString);
      if (newView !== "cards") search.set("view", newView);
      router.replace(`${pathname}?${search.toString()}`, { scroll: false });
    },
    [filtersString, limit, pathname, router, sort]
  );

  return {
    state,
    page,
    limit,
    sort,
    filtersString,
    effectiveFiltersString,
    view,
    setView,
    setPeriod,
    setStatus,
    setSearch,
    setMaterial,
    setCheckerName,
    setArrivalCheckerName,
    setTurno,
    setFrenteNombre,
    applyAdvanced,
    clearAll,
    setSort,
    setPage,
    setLimit,
  };
}
