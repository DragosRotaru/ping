import * as iots from "io-ts";
import { some, none } from "fp-ts/lib/Option";
import { UUID, OptionFromNullable } from "@huckleberryai/core";
import { Event } from "../../base";
import * as FingerPrint from "../../fingerprint";
import * as Logging from "../../logging";

export const Name = "web-analytics:client:unload";

export const Codec = iots.intersection(
  [
    iots.type({
      type: iots.literal(Name),
      log: Logging.Log.Codec,
      fingerprint: OptionFromNullable.Codec(FingerPrint.Codec),
    }),
    Event.Codec,
  ],
  Name
);

export type T = iots.TypeOf<typeof Codec>;

export const C = (
  log: Logging.Log.T,
  fingerprint?: FingerPrint.T,
  app?: UUID.T,
  corr?: UUID.T,
  parent?: UUID.T
): T => ({
  ...Event.C(app, corr, parent),
  type: Name,
  fingerprint: fingerprint ? some(fingerprint) : none,
  log,
});