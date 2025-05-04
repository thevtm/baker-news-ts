import React from "react";
import cslx from "clsx";

import * as proto from "../proto";

import { sprinkles } from "../css/sprinkles.css";
import { container } from "../css/styles.css";

// container mx-auto bg-orange-800 text-gray-200
const header_style = sprinkles({
  marginX: "auto",
  background: "orange-800",
  color: "gray-200",
});

const footer_style = sprinkles({
  display: "flex",
  justifyContent: "center",

  marginX: "auto",
  padding: 1,

  background: "orange-200",
});

export type PageLayoutProps = React.PropsWithChildren<{
  user: proto.User;
}>;

const PageLayout: React.FC<PageLayoutProps> = ({ user, children }) => {
  const username = user?.username ?? "Loading...";

  const current_year = new Date().getFullYear();

  return (
    <>
      <header className={cslx(container, header_style)}>
        <nav className={sprinkles({ display: "flex", paddingY: 1 })}>
          <div className={sprinkles({ display: "flex", flexGrow: 1 })}>
            <a
              className={sprinkles({ marginX: 1, fontWeight: "bold", textDecoration: "none" })}
              href="/"
              hx-get="/"
              hx-target="main"
              hx-push-url="true"
            >
              🥖
            </a>

            <a
              className={sprinkles({ marginX: 1, fontWeight: "bold", textDecoration: "none", color: "white" })}
              href="/"
              hx-get="/"
              hx-target="main"
              hx-push-url="true"
            >
              Backer News
            </a>
          </div>

          <span className={sprinkles({ marginX: 1 })}>{username}</span>
        </nav>
      </header>

      <main id="main">{children}</main>

      <footer className={cslx(container, footer_style)}>&copy; {current_year} Baker News Ltda.</footer>
    </>
  );
};

export default PageLayout;
