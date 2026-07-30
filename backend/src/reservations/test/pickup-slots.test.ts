import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findMatchingPickupSlot, generatePickupSlots } from "@resqplate/shared";

// Make sure that the tests do not depend on the running pc's timezone.
const at = (iso: string): Date => new Date(`2026-07-26T${iso}:00Z`);
const iso = (date: Date): string => date.toISOString();

//reference time before the pickup time starts
const BEFORE_WINDOW = at("00:00");

describe("generatePickupSlots", () => {
  it("splits an even window into consecutive one-hour slots", () => {
    const slots = generatePickupSlots(at("10:00"), at("13:00"), BEFORE_WINDOW);

    assert.equal(slots.length, 3);
    assert.deepEqual(
      slots.map((slot) => iso(slot.start)),
      [
        "2026-07-26T10:00:00.000Z",
        "2026-07-26T11:00:00.000Z",
        "2026-07-26T12:00:00.000Z",
      ],
    );
    assert.equal(iso(slots[2]!.end), "2026-07-26T13:00:00.000Z");
    //there are 1 hrs in each slot
    assert.equal(
      (slots[0]!.end.getTime() - slots[0]!.start.getTime()) / 60000,
      60,
    );
  });

  it("clamps the final practical slot to the window end", () => {
    const slots = generatePickupSlots(at("10:00"), at("11:30"), BEFORE_WINDOW);

    assert.equal(slots.length, 2);
    assert.equal(iso(slots[1]!.start), "2026-07-26T11:00:00.000Z");
    assert.equal(iso(slots[1]!.end), "2026-07-26T11:30:00.000Z");
  });

  it("returns asingle slot for the sub-hour window", () => {
    const slots = generatePickupSlots(at("10:00"), at("10:30"), BEFORE_WINDOW);

    assert.equal(slots.length, 1);
    // assert.equal(iso(slots[0]!.start), "2026-07-26T10:00:00.000Z");
    assert.equal(iso(slots[0]!.end), "2026-07-26T10:30:00.000Z");
  });

  it("hides the slots that have been completed but keeps the ones curently open", () => {
    //basically if the time is 11:30 then the 10 to 11 slot has ended but the 11-12 slot is still open
    const slots = generatePickupSlots(at("10:00"), at("13:00"), at("11:30"));

    assert.equal(slots.length, 2);
    assert.equal(iso(slots[0]!.start), "2026-07-26T11:00:00.000Z");
  });

  it("treats the slots ending now as finished", () => {
    const slots = generatePickupSlots(at("10:00"), at("12:00"), at("11:00"));

    assert.equal(slots.length, 1);
    assert.equal(iso(slots[0]!.start), "2026-07-26T11:00:00.000Z");
  });

  it("returns no slot when the whole window is in the past", () => {
    const slots = generatePickupSlots(at("10:00"), at("12:00"), at("13:00"));
    assert.deepEqual(slots, []);
  });

  it("returns no slot for an inverteted window", () => {
    const slots = generatePickupSlots(at("12:00"), at("10:00"), BEFORE_WINDOW);
    assert.deepEqual(slots, []);
  });

  it("returns no slot for a zero-length window", () => {
    const slots = generatePickupSlots(at("10:00"), at("10:00"), BEFORE_WINDOW);
    assert.deepEqual(slots, []);
  });

  it("returns no slot when the date is invalid", () => {
    const slots = generatePickupSlots("not-a-date", at("13:00"), BEFORE_WINDOW);
    assert.deepEqual(slots, []);
  });

  it("accepts the ISO date string as the window bounds", () => {
    const slots = generatePickupSlots(
      "2026-07-26T10:00:00Z",
      "2026-07-26T13:00:00Z",
      BEFORE_WINDOW,
    );
    assert.equal(slots.length, 3);
  });
});

describe("findMatchingPickupSlot", () => {
  it("returns the slots who have the same start time as the aligned boundry", () => {
    const slot = findMatchingPickupSlot(
      at("10:00"),
      at("13:00"),
      at("11:00"),
      BEFORE_WINDOW,
    );
    assert.ok(slot);
    assert.equal(iso(slot.start), "2026-07-26T11:00:00.000Z");
    assert.equal(iso(slot.end), "2026-07-26T12:00:00.000Z");
  });

  it("returns a undefined error when the start boundry is not ther in the slot boundry", () => {
    const slot = findMatchingPickupSlot(
      at("10:00"),
      at("13:00"),
      at("10:30"),
      BEFORE_WINDOW,
    );
    assert.equal(slot, undefined);
  });

  it("returns undefined when the slot has already passed", () => {
    const slot = findMatchingPickupSlot(
      at("10:00"),
      at("13:00"),
      at("10:00"),
      at("11:30"),
    );
    assert.equal(slot, undefined);
  });
});
