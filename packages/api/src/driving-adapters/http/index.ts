import { isLeft } from "fp-ts/lib/Either";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import {
  StatusCode,
  HTTP,
  Results,
  NonEmptyString,
  UUID,
  Errors,
} from "@huckleberrylabs/core";
import * as WidgetTrackingUseCases from "../../domain/widget/tracking/use-cases";
import * as Ping from "@huckleberrylabs/ping";
import Container from "../../container";
import Codecs, { Names } from "../../codecs";
import { IAMService } from "../../driven-ports";
import * as WidgetTrackingRepository from "../../domain/widget/tracking/repository";
import { FireStore } from "../../driven-adapters";

const iamMaybe = IAMService.C();
if (isLeft(iamMaybe)) throw new Error("iam private key missing");
const iam = iamMaybe.right;

export const C = () => {
  const ports = Container();

  const maybeFireStore = FireStore.C();
  if (isLeft(maybeFireStore)) throw new Error("firestore credentials missing");
  const fireStore = maybeFireStore.right;

  const widgetTrackingRepository = WidgetTrackingRepository.C(fireStore);

  const app = express();

  app.use(
    express.json({
      type: ["*/json", "text/plain"],
    })
  );

  // Security
  app.use(helmet());
  app.use(cookieParser());
  app.use(cors());

  // Logging
  app.use(morgan("tiny"));

  // Authenticate
  app.use(async (req, res, next) => {
    const token = req.cookies["auth"];
    if (NonEmptyString.Is(token)) {
      const authenticatedMaybe = iam.authenticateToken(token);
      if (isLeft(authenticatedMaybe)) {
        res
          .clearCookie("auth")
          .status(StatusCode.UNAUTHORIZED)
          .send();
        return;
      }
    }
    next();
  });

  // Login
  app.post(
    HTTP.PathNameFromType(Ping.Account.UseCases.LoginWithToken.Command.Name),
    async (req, res) => {
      const commandMaybe = Ping.Account.UseCases.LoginWithToken.Command.Codec.decode(
        req.body
      );
      if (isLeft(commandMaybe)) {
        console.log("Bad DTO: ", req.body);
        res.status(StatusCode.BAD_REQUEST).send(null);
        return;
      }
      const command = commandMaybe.right;
      console.log("Log in Command: ", command);
      const authenticatedMaybe = iam.authenticateToken(command.token);
      let result;
      if (isLeft(authenticatedMaybe)) {
        switch (authenticatedMaybe.left.type) {
          case Errors.Unauthenticated.Name:
            result = Results.Unauthorized.C(command);
            break;
          default:
            result = Results.BadRequest.C(command);
        }
      } else {
        const handler = ports.get(command.type);
        result = handler ? await handler(command) : Results.Error.C(command);
        if (Results.OKWithData.Codec(UUID.Codec).is(result)) {
          const sessionToken = iam.generateToken(result.data);
          res.cookie("auth", sessionToken);
        }
      }
      let resultCodec = Codecs.get(result.type);
      if (resultCodec === undefined) {
        console.log("Result Codec Not Found", result);
        res.status(StatusCode.INTERNAL_SERVER_ERROR).send(null);
        return;
      }
      if (resultCodec === null) {
        const innerCodec = Codecs.get((result as any).dataType);
        if (!innerCodec) {
          console.log("Inner Codec Not Found", (result as any).dataType);
          res.status(StatusCode.INTERNAL_SERVER_ERROR).send(null);
          return;
        }
        resultCodec = Results.OKWithData.Codec(innerCodec);
      }

      console.log("Log in Result: ", result);
      res.status(result.status).send(resultCodec.encode(result));
    }
  );

  // Logout
  app.post(
    HTTP.PathNameFromType(Ping.Account.UseCases.Logout.Command.Name),
    async (req, res) => {
      const commandMaybe = Ping.Account.UseCases.Logout.Command.Codec.decode(
        req.body
      );
      if (isLeft(commandMaybe)) {
        console.log("Bad DTO: ", req.body);
        res.status(StatusCode.BAD_REQUEST).send(null);
        return;
      }
      const command = commandMaybe.right;
      const handler = ports.get(command.type);
      const result = handler
        ? await handler(command)
        : Results.Error.C(command);
      console.log("Log out Result: ", result);
      res
        .clearCookie("auth")
        .status(result.status)
        .send(result);
    }
  );
  // Health
  app.get("/ping", (req, res) => {
    res.status(StatusCode.OK).send(null);
  });

  app.post(
    WidgetTrackingUseCases.Close.Route,
    WidgetTrackingUseCases.Close.Controller(
      WidgetTrackingUseCases.Close.Handler(widgetTrackingRepository)
    )
  );

  app.post(
    WidgetTrackingUseCases.Load.Route,
    WidgetTrackingUseCases.Load.Controller(
      WidgetTrackingUseCases.Load.Handler(widgetTrackingRepository)
    )
  );

  app.post(
    WidgetTrackingUseCases.Open.Route,
    WidgetTrackingUseCases.Open.Controller(
      WidgetTrackingUseCases.Open.Handler(widgetTrackingRepository)
    )
  );
  app.post(
    WidgetTrackingUseCases.Unload.Route,
    WidgetTrackingUseCases.Unload.Controller(
      WidgetTrackingUseCases.Unload.Handler(widgetTrackingRepository)
    )
  );

  // Handlers
  app.use(async (req, res) => {
    const maybeType = HTTP.TypeFromPathName(req.url.split("?")[0]);
    if (isLeft(maybeType)) {
      res.status(StatusCode.BAD_REQUEST).send(null);
      return;
    }
    const type = maybeType.right;
    console.log("request type: ", type);
    const dtoCodec = Codecs.get(type as Names);
    if (!dtoCodec) {
      console.log("Codec Not Found", type);
      res.status(StatusCode.NOT_FOUND).send(null);
      return;
    }
    const maybeDto = dtoCodec.decode(req.body);
    if (isLeft(maybeDto)) {
      console.log("Bad DTO: ", req.body);
      res.status(StatusCode.BAD_REQUEST).send(null);
      return;
    }
    const dto = maybeDto.right;
    const port = ports.get(type);
    if (!port) {
      console.log("Port Not Found", type);
      res.status(StatusCode.NOT_FOUND).send(null);
      return;
    }
    console.log("request: ", dto);
    const result = await port(dto);
    console.log("result: ", result);
    let resultCodec = Codecs.get(result.type);
    if (resultCodec === undefined) {
      console.log("Result Codec Not Found", result);
      res.status(StatusCode.INTERNAL_SERVER_ERROR).send(null);
      return;
    }
    if (resultCodec === null) {
      const innerCodec = Codecs.get((result as any).dataType);
      if (!innerCodec) {
        console.log("Inner Codec Not Found", (result as any).dataType);
        res.status(StatusCode.INTERNAL_SERVER_ERROR).send(null);
        return;
      }
      resultCodec = Results.OKWithData.Codec(innerCodec);
    }

    res.status(result.status).send(resultCodec.encode(result));
  });
  return app;
};
