/** Public ownership tags issued for this exact production origin. Not credentials. */
export const verifiedProductionOrigin = "https://sajinmatchum-tools.pages.dev";

const confirmedOwnership = {
  google: "OHdM0gNiN40AS5fbbgnB8ypUor7BGI4CPb3H2Djh1ws",
  naver: "f199c49445d16e90de0a50e30fba2839f9e3e0d2",
};

export function siteVerificationFor(origin: string | undefined, environment: Record<string, string | undefined> = process.env) {
  const confirmed = origin === verifiedProductionOrigin ? confirmedOwnership : undefined;
  return {
    google: environment.GOOGLE_SITE_VERIFICATION?.trim() || confirmed?.google,
    naver: environment.NAVER_SITE_VERIFICATION?.trim() || confirmed?.naver,
  };
}
