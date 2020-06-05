import { Either, left, isLeft, isRight, right } from "fp-ts/lib/Either";
import { UUID, Errors } from "@huckleberrylabs/core";
import { Interfaces, Message } from "@huckleberrylabs/ping";
import { FireStore } from "../../driven-adapters";
import { Codecs } from "../../codecs";

export const Name = "ping:message";

export const C = (store: FireStore.T): Interfaces.MessageRepository => ({
  get: async (
    id: UUID.T
  ): Promise<Either<Errors.Adapter.T | Errors.NotFound.T, Message.T>> => {
    try {
      const queryRef = await store
        .collection(Name)
        .where("message", "==", id)
        .get();
      if (queryRef.empty) return left(Errors.NotFound.C());
      const json = queryRef.docs.map(doc => doc.data());
      const maybeEvents = json.map(event => {
        if (!event.type) return left(Errors.Validation.C());
        const codec = Codecs.get(event.type);
        if (!codec) return left(Errors.Validation.C());
        const maybeDecoded = codec.decode(event);
        if (isLeft(maybeDecoded)) return left(Errors.Validation.C());
        return maybeDecoded;
      });
      if (maybeEvents.some(isLeft)) return left(Errors.Adapter.C());
      return right(maybeEvents.filter(isRight).map(event => event.right));
    } catch (error) {
      return left(Errors.Adapter.C());
    }
  },
  add: async (
    event: Message.Events
  ): Promise<Either<Errors.Adapter.T, null>> => {
    try {
      const codec = Codecs.get(event.type);
      if (!codec) {
        return left(Errors.Adapter.C());
      }
      await store
        .collection(Name)
        .doc(UUID.Codec.encode(event.id))
        .create(codec.encode(event));
      return right(null);
    } catch (error) {
      return left(Errors.Adapter.C());
    }
  },
  remove: async (id: UUID.T): Promise<Either<Errors.Adapter.T, null>> => {
    try {
      await store
        .collection(Name)
        .doc(UUID.Codec.encode(id))
        .delete();
      return right(null);
    } catch (error) {
      return left(Errors.Adapter.C());
    }
  },
});
