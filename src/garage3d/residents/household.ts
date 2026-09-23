import {planPoint} from '../areas.ts';
/** Shared floor positions for the authored chores and their lightweight props. */
export const HOUSEHOLD = {
  kitchen: planPoint(366,630),
  laundry: planPoint(301,688),
  guitar: planPoint(975,688),
  garden: planPoint(242,570),
  living: planPoint(506,472),
};
export type HouseholdSpot=keyof typeof HOUSEHOLD;
