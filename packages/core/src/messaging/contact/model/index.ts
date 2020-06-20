import * as iots from "io-ts";
import {
  UUID,
  Phone,
  NameSpaceCaseString,
  PersonName,
  TimeStamp,
  OptionFromNullable,
} from "../../../values";
import { some, none } from "fp-ts/lib/Option";

export const Name = "messaging:model:contact" as NameSpaceCaseString.T;

export const Codec = iots.type(
  {
    id: UUID.Codec,
    createdAt: TimeStamp.Codec,
    account: UUID.Codec,
    phone: Phone.Codec,
    name: OptionFromNullable.Codec(PersonName.Codec),
  },
  Name
);

export type T = iots.TypeOf<typeof Codec>;

export const C = (account: UUID.T, phone: Phone.T, name?: PersonName.T) => ({
  id: UUID.C(),
  createdAt: TimeStamp.C(),
  account,
  phone,
  name: name ? some(name) : none,
});

export const Is = Codec.is;
