import { describe, expect, it } from "vitest";

import { pageRange } from "./feedback";
import { toastReducer } from "./toast";

describe("pageRange", () => {
  it("lists all pages when few", () => {
    expect(pageRange(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("collapses distant pages with ellipses", () => {
    expect(pageRange(6, 12)).toEqual([1, 2, "…", 5, 6, 7, "…", 11, 12]);
  });

  it("handles the first and last page", () => {
    expect(pageRange(1, 12)).toEqual([1, 2, "…", 11, 12]);
    expect(pageRange(12, 12)).toEqual([1, 2, "…", 11, 12]);
  });
});

describe("toastReducer", () => {
  it("pushes and caps visible toasts", () => {
    let state = toastReducer([], { type: "push", toast: { id: 1, message: "a", tone: "info" } });
    state = toastReducer(state, { type: "push", toast: { id: 2, message: "b", tone: "success" } });
    state = toastReducer(state, { type: "push", toast: { id: 3, message: "c", tone: "error" } });
    state = toastReducer(state, { type: "push", toast: { id: 4, message: "d", tone: "info" } });
    expect(state.map((t) => t.id)).toEqual([2, 3, 4]);
  });

  it("dismisses by id", () => {
    const state = toastReducer(
      [
        { id: 1, message: "a", tone: "info" },
        { id: 2, message: "b", tone: "info" },
      ],
      { type: "dismiss", id: 1 },
    );
    expect(state.map((t) => t.id)).toEqual([2]);
  });
});
