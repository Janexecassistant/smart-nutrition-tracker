import { NextPageContext } from "next";

function ErrorPage({ statusCode }: { statusCode: number }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "system-ui, sans-serif",
        backgroundColor: "#0f172a",
        color: "#e2e8f0",
      }}
    >
      <h1 style={{ fontSize: "4rem", margin: 0 }}>{statusCode}</h1>
      <p style={{ fontSize: "1.25rem", color: "#94a3b8" }}>
        {statusCode === 404
          ? "This page could not be found."
          : "An unexpected error has occurred."}
      </p>
      <a
        href="/"
        style={{
          marginTop: "1rem",
          color: "#38bdf8",
          textDecoration: "none",
        }}
      >
        Go back home
      </a>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode: statusCode || 500 };
};

export default ErrorPage;
