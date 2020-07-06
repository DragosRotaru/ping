import React, { useState } from "react";

// TextField
import { TextField } from "@rmwc/textfield";
import "@material/textfield/dist/mdc.textfield.css";
import "@material/floating-label/dist/mdc.floating-label.css";
import "@material/notched-outline/dist/mdc.notched-outline.css";
import "@material/line-ripple/dist/mdc.line-ripple.css";

// Style
import "./style.css";

// Domain
import { Billing } from "@huckleberrylabs/ping-core";

type Props = {
  label?: string;
  disabled?: boolean;
  required?: boolean;
  initialValue?: Billing.Values.PromoCode.T;
  onSelect: (input: Billing.Values.PromoCode.T) => void;
};

export const PromoCodeField = ({
  label,
  disabled,
  required,
  initialValue,
  onSelect,
}: Props) => {
  const [changed, updateChanged] = useState<boolean>(false);
  const [promoCode, updatePromoCode] = useState<string>(initialValue || "");
  return (
    <div className="promo-code-field">
      <TextField
        outlined
        label={label || "promo code"}
        disabled={disabled}
        value={promoCode}
        invalid={required && !Billing.Values.PromoCode.Is(promoCode) && changed}
        onChange={(event) => {
          const value = (event.target as HTMLInputElement).value;
          if (Billing.Values.PromoCode.Is(value)) {
            onSelect(value);
            setTimeout(() => {
              updatePromoCode(value);
              updateChanged(true);
            }, 500);
          } else {
            updatePromoCode(value);
            updateChanged(true);
          }
        }}
      />
      {Billing.Values.PromoCode.Is(promoCode) ? (
        <p>
          discount applied:{" "}
          {Billing.Values.PromoCode.ToCoupon[promoCode].description}{" "}
        </p>
      ) : (
        <p>don't have a promo code? Use {Billing.Values.PromoCode.Default}</p>
      )}
    </div>
  );
};
