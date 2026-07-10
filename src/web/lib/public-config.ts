import { fetchShared } from "./shared-query";

export type PublicConfig = {
  googleAuthEnabled?: boolean;
  registrationEnabled?: boolean;
  captchaEnabled?: boolean;
  [key: string]: unknown;
};

const CACHE_KEY = "public:config";

export function loadPublicConfig(): Promise<PublicConfig> {
  return fetchShared(
    CACHE_KEY,
    async () => {
      const res = await fetch("/api/public/config");
      if (!res.ok) return {};
      return (await res.json()) as PublicConfig;
    },
    { staleTime: 300_000 }
  );
}
