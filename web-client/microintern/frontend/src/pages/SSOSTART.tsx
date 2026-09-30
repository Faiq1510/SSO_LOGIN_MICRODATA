import { useEffect } from "react";
import { redirectToSSO } from "../utils/sso";

export default function SsoStart() {
  useEffect(() => {
    void redirectToSSO();
  }, []);

  return <p>Menghubungkan ke SSO...</p>;
}
