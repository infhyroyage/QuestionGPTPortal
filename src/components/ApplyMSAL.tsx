import { config, loginScope } from "@/lib/msal";
import { ApplyMSALProps } from "@/types/props";
import { InteractionType, PublicClientApplication } from "@azure/msal-browser";
import { MsalAuthenticationTemplate, MsalProvider } from "@azure/msal-react";
import LoadingCenter from "./LoadingCenter";

/**
 * MSALを適用するコンポーネント
 * @returns MSALを適用した子コンポーネント(ローカル環境の場合は適用せず、子コンポーネントをそのまま返す)
 */
export default function ApplyMSAL({ children }: ApplyMSALProps) {
  const instance = new PublicClientApplication(config);

  // ローカル環境の場合はMSALを使用しない
  return import.meta.env.DEV ? (
    <>{children}</>
  ) : (
    <MsalProvider instance={instance}>
      <MsalAuthenticationTemplate
        interactionType={InteractionType.Redirect}
        authenticationRequest={loginScope}
        loadingComponent={LoadingCenter}
      >
        <>{children}</>
      </MsalAuthenticationTemplate>
    </MsalProvider>
  );
}
