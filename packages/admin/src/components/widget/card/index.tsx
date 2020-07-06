import React from "react";
import { Link } from "react-router-dom";

// Card
import { Card, CardMedia, CardPrimaryAction } from "@rmwc/card";
import "@material/card/dist/mdc.card.css";

// Style
import "./style.css";

// Domain
import { Widget } from "@huckleberrylabs/ping-core";

type Props = {
  widget: Widget.Settings.Model.T;
};

export const WidgetCard = (props: Props) => (
  <Link to={`/widgets/${props.widget.id}`}>
    <Card className="widget-card-container">
      <CardPrimaryAction className="widget-card-action">
        <CardMedia className="widget-card-image" sixteenByNine />
        <div className="widget-card-description">
          <h2>{new URL(props.widget.homePage).host}</h2>
        </div>
      </CardPrimaryAction>
    </Card>
  </Link>
);
