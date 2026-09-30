import { useEffect } from "react";
import { redirectToSSO } from "../utils/sso";

export default function SsoEntry() {
  useEffect(() => {
    void redirectToSSO();
  }, []);

  return <p>Menghubungkan ke SSO...</p>;
}
