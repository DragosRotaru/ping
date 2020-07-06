import * as iots from "io-ts";
import {
  Event,
  Phone,
  NameSpaceCaseString,
  NonEmptyString,
} from "../../../values";

export const Name = "sms:command:receive" as NameSpaceCaseString.T;

export const Codec = iots.intersection(
  [
    iots.type({
      type: iots.literal(Name),
      content: NonEmptyString.Codec,
      twilio: Phone.Codec,
      from: Phone.Codec,
    }),
    Event.Codec,
  ],
  Name
);

export type T = iots.TypeOf<typeof Codec>;

export const C = (
  content: NonEmptyString.T,
  twilio: Phone.T,
  from: Phone.T
): T => ({
  ...Event.C(),
  type: Name,
  content,
  twilio,
  from,
});

export const Is = Codec.is;