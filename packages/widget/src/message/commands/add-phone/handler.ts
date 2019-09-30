import { injectable } from "inversify";
import {
  IEventHandler,
  Result,
  StatusCode,
  OK,
  INTERNAL_SERVER_ERROR,
  IEventRepository,
} from "@huckleberryai/core";
import { IAddPhoneToWidgetMessageCommand } from "./command";

@injectable()
export class TextWidgetPhoneAddedCommandHandler implements IEventHandler {
  public origin = "753ed383-f71c-4eb5-8d28-4f71462611b7";
  constructor(private repository: IEventRepository) {}
  async handle(event: IAddPhoneToWidgetMessageCommand) {
    let status: StatusCode = OK;
    let data = null;
    try {
      await this.repository.add(event);
    } catch (error) {
      data = error.toString();
      status = INTERNAL_SERVER_ERROR;
    }
    return Result(data, status, this.origin, event.corr, event.id);
  }
}