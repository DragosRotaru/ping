// @ts-ignore
import * as iots from "io-ts";
import { Twilio } from "twilio";
import { left, right } from "fp-ts/lib/Either";
import { Phone, NonEmptyString, Errors, SMSClient } from "@huckleberryai/core";

export const Send = (client: Twilio): SMSClient => async (
  body: NonEmptyString.T,
  to: Phone.T
) => {
  const phone_number = process.env.TWILIO_PHONE_NUMBER;
  try {
    await client.messages.create({
      body,
      to,
      from: phone_number,
    });
    return right(null);
  } catch (error) {
    return left(Errors.Adapter.C());
  }
};