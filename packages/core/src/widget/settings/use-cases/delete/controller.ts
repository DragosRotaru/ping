import { Request, Response } from "express";
import { isLeft } from "fp-ts/lib/Either";
import { StatusCode, Errors } from "../../../../values";
import * as Command from "./command";
import { IHandler } from "./handler";
import { IAuthorizationService } from "../../../../interfaces";

export default (auth: IAuthorizationService, handler: IHandler) => async (
  req: Request,
  res: Response
) => {
  // Decode
  const commandMaybe = Command.Decode(req.body);
  if (isLeft(commandMaybe)) {
    res
      .status(StatusCode.BAD_REQUEST)
      .send(
        Errors.Validation.Encode(
          Errors.Validation.C(
            Command.Name,
            `DTO decode error: ${commandMaybe.left.toString()}`
          )
        )
      );
    return;
  }
  const command = commandMaybe.right;

  // Check Authorization
  if (!req.authenticatedID) {
    res
      .status(StatusCode.UNAUTHORIZED)
      .send(
        Errors.Unauthenticated.Encode(Errors.Unauthenticated.C(Command.Name))
      );
    return;
  }
  const authMaybe = await auth.check({
    account: req.authenticatedID,
    entity: command.widget,
    action: command.type,
  });
  if (isLeft(authMaybe)) {
    switch (authMaybe.left.type) {
      case Errors.Unauthorized.Name:
        res
          .status(StatusCode.FORBIDDEN)
          .send(Errors.Unauthorized.Encode(authMaybe.left));
        return;
      case Errors.Adapter.Name:
        res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .send(Errors.Adapter.Encode(authMaybe.left));
        return;
      default:
        res.status(StatusCode.INTERNAL_SERVER_ERROR).send();
        return;
    }
  }

  // Handle
  const result = await handler(command);

  // Encode
  if (isLeft(result)) {
    switch (result.left.type) {
      case Errors.NotFound.Name:
        res
          .status(StatusCode.NOT_FOUND)
          .send(Errors.NotFound.Encode(result.left));
        return;
      case Errors.Adapter.Name:
        res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .send(Errors.Adapter.Encode(result.left));
        return;
      default:
        res
          .status(StatusCode.INTERNAL_SERVER_ERROR)
          .send(Errors.Adapter.Encode(result.left));
        return;
    }
  }
  res.status(StatusCode.OK).send(result.right);
  return;
};
