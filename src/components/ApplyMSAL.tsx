import { config, loginScope } from "@/services/msal";
import { ApplyMSALProps } from "@/types/props";
import { InteractionType, PublicClientApplication } from "@azure/msal-browser";
import { MsalAuthenticationTemplate, MsalProvider } from "@azure/msal-react";
// import LoadingCenter from "./LoadingCenter";

/**
 * MSALを適用するコンポーネント
 * @param children 子コンポーネント
 * @returns MSALを適用した子コンポーネント(localhost環境の場合は適用せず、子コンポーネントをそのまま返す)
 */
function ApplyMSAL({ children }: ApplyMSALProps) {
  const msalInstance = new PublicClientApplication(config);

  // localhost環境の場合はMSALを使用しない
  return import.meta.env.DEV ? (
    <>{children}</>
  ) : (
    <MsalProvider instance={msalInstance}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={loginScope}
        // loadingComponent={LoadingCenter}
      >
        <>{children}</>
      </MsalAuthenticationTemplate>
    </MsalProvider>
  );
}

export default ApplyMSAL;
