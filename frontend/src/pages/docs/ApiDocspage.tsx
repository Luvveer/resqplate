import SwaggerUI from "swagger-ui-react";
import "swagger-ui-react/swagger-ui.css";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

export function ApiDocsPage() {
  return (
    <main>
      <SwaggerUI
        url={`${API_URL}/openapi.json`}
        docExpansion="list"
        defaultModelExpandDepth={1}
        persistAuthorization
        requestInterceptor={(request) => {
          request.credentials = "include";
          return request;
        }}
      />
    </main>
  );
}
