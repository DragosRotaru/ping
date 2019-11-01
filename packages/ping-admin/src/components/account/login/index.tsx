import React, { useState } from "react";
import { isLeft } from "fp-ts/lib/Either";

// Toast
import { toast } from "react-toastify";

// Button
import { Button } from "@rmwc/button";
import "@material/button/dist/mdc.button.css";

// Text Field
import { TextField } from "@rmwc/textfield";
import "@material/textfield/dist/mdc.textfield.css";
import "@material/form-field/dist/mdc.form-field.css";
import "@material/floating-label/dist/mdc.floating-label.css";
import "@material/notched-outline/dist/mdc.notched-outline.css";

// Loading
import { CircularProgress } from "@rmwc/circular-progress";
import "@rmwc/circular-progress/circular-progress.css";

// Style
import "./style.css";

// Domain
import { EmailAddress } from "@huckleberryai/core";
import { PrivateSDK } from "@huckleberryai/ping";
import { Link } from "react-router-dom";

type Stage = "idle" | "loading" | "sent" | "error";

export const Login = () => {
  const [email, setEmail] = useState<string>("");
  const [stage, setStage] = useState<Stage>("idle");

  const submitForm = async () => {
    if (!EmailAddress.Is(email)) {
      toast.warn("Valid email must be provided.", {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: true,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
      });
      return;
    }
    const loginMaybe = await PrivateSDK.C().Account.Login(email);
    isLeft(loginMaybe) ? setStage("error") : setStage("sent");
  };
  return (
    <div className="login-container">
      <div className="login-modal">
        <h1>Login</h1>
        {stage === "idle" ? (
          <div className="login-form">
            <TextField
              outlined
              label="Email"
              value={email}
              invalid={email !== "" && !EmailAddress.Is(email)}
              onChange={event =>
                setEmail((event.target as HTMLInputElement).value)
              }
              onKeyPress={event => {
                if (event.key === "Enter") submitForm();
              }}
            />
            <p>
              a{" "}
              <span role="img" aria-label="sparkles">
                ✨
              </span>
              magic{" "}
              <span role="img" aria-label="sparkles">
                ✨
              </span>{" "}
              link will be sent to you via email.
            </p>
            <Button onClick={submitForm} raised icon="keyboard_arrow_right">
              Send
            </Button>
            <p>
              dont have an account? register <Link to="/register">here</Link>
            </p>
          </div>
        ) : stage === "loading" ? (
          <div className="login-loader">
            <CircularProgress size="large" />
          </div>
        ) : stage === "sent" ? (
          <div>Success! Please check your inbox for our email.</div>
        ) : (
          <div className="login-error">
            <div>
              Looks like we had an issue on our end, please try again in a few
              minutes.
              <br />
              <br />
              If that doesn't work, please email our CTO at{" "}
              <a href="mail-to:bugs@ping.buzz">bugs@ping.buzz</a>
            </div>
            <Button
              onClick={() => {
                setStage("idle");
              }}
              raised
              icon="keyboard_arrow_left"
            >
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
