import { AuthProvider as OidcProvider } from "react-oidc-context";
import type { AuthProviderProps } from "react-oidc-context";
import type { ReactNode } from "react";

const oidcConfig: AuthProviderProps = {
  authority: "http://localhost:8080/realms/crash-game",
  client_id: "crash-game-client",
  redirect_uri: "http://localhost:3000/",
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

export function AuthProvider({ children }: { children: ReactNode }) {
  return <OidcProvider {...oidcConfig}>{children}</OidcProvider>;
}
