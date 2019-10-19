import axios from "axios";
import { isSome } from "fp-ts/lib/Option";
import { right, left, Either, isLeft } from "fp-ts/lib/Either";
import * as iots from "io-ts";
import * as Env from "../env";
import * as Json from "../json";
import * as Event from "../event";
import * as Errors from "../errors";
import * as Results from "../results";
import { Url, Type } from "../values";

export const GetAPIURL = () => {
  const env = Env.Get();
  if (isLeft(env)) return env;
  const APIURLS: {
    [P in Env.T]: Url.T;
  } = {
    development: "http://localhost:8000" as Url.T,
    staging: "https://staging.huckleberry.app" as Url.T,
    production: "https://api.huckleberry.app" as Url.T,
    test: "http://localhost:8000" as Url.T,
  };
  return right(APIURLS[env.right]);
};

export const GetEndpoint = (
  input: string
): Either<Errors.Parsing.T | Errors.Environment.T, Url.T> => {
  const api = GetAPIURL();
  if (isLeft(api)) return api;
  const url = new URL(api.right);
  url.pathname = input;
  return Url.C(url.toString());
};

export const EndpointFromEvent = (event: Event.T) => {
  const path = PathNameFromEvent(event);
  const endpoint = GetEndpoint(path);
  if (isLeft(endpoint)) return endpoint;
  return AddEventParamsToURL(endpoint.right, event);
};

export const PathNameFromEvent = (event: Event.T) =>
  "/" + event.type.replace(/:/g, "/");

export const TypeFromPathName = (input: string) =>
  Type.Codec.decode(input.slice(1).replace(/\//g, ":"));

export const AddEventParamsToURL = (url: Url.T, event: Event.T) => {
  const urlCopy = new URL(url);
  urlCopy.searchParams.append("corr_id", event.corr);
  if (isSome(event.parent))
    urlCopy.searchParams.append("parent_id", event.parent.value);
  return Url.C(urlCopy.toString());
};

export async function Post(
  url: Url.T,
  dto: Json.T
): Promise<Either<Errors.T, null>>;
export async function Post<T>(
  url: Url.T,
  dto: Json.T,
  decoder: iots.Decode<any, T>
): Promise<Either<Errors.T, T>>;
export async function Post<T>(
  url: Url.T,
  dto: Json.T,
  decoder?: iots.Decode<any, T>
) {
  try {
    const res = await axios.post(url, dto, {
      validateStatus: () => true,
    });
    if (!res.data.type) return left(Errors.Adapter.C());
    const responseType: Results.Names = res.data.type;
    const returnValue = Results.ReturnValues.get(responseType);
    if (decoder && returnValue) throw new Error("");
    if (returnValue) return returnValue;
    if (decoder) {
      const result = decoder(res.data);
      if (isLeft(result)) return left(Errors.Adapter.C());
      return result;
    }
    return left(Errors.Adapter.C());
  } catch (error) {
    return left(Errors.Adapter.C());
  }
}

export const Beacon = (url: Url.T, dto: Json.T) =>
  navigator.sendBeacon(url, JSON.stringify(dto));
