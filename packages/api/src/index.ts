import { NowRequest, NowResponse } from "@now/node";
import { ID, isResult } from "@huckleberryai/core";
import { EVENTS_ENDPOINT } from "@huckleberryai/text";
import { HTTPAccessEvent } from "./events";
import { deserializer } from "./event-deserializer";
import { bus } from "./event-bus";

export default async (req: NowRequest, res: NowResponse) => {
  const NODE_ID = new ID("c7e384c3-697f-4ccf-a514-d54a452acfac");

  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") {
    // Send response to OPTIONS requests
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Max-Age", "3600");
    res.status(204).send("");
    return;
  }
  if (!req.url) {
    throw new Error("Request Not Possible");
  }
  // Access Event
  const accessEvent = new HTTPAccessEvent(req, NODE_ID);
  bus.emit(accessEvent);

  // Routing Request
  try {
    const { pathname } = new URL(req.url);
    if (pathname === EVENTS_ENDPOINT) {
      const event = deserializer.deserialize(req.body);
      const result = bus.emit(event);
      if (isResult(result)) {
        res.status(200).send(result);
      }
    } else {
      throw new Error("Invalid API Endpoint");
    }
  } catch (error) {
    res.status(400).send(error.toString());
  }
};
