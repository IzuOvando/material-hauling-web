import CONSTANTS from './constants';
import VARIABLES from './variables';

const BRANDING = {
  appName: process.env.NEXT_PUBLIC_APP_NAME || "FleetOps",
  shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "FleetOps",
  tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Operations dashboard",
  locale: process.env.NEXT_PUBLIC_LOCALE || "en",
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "",
  loginTitle: process.env.NEXT_PUBLIC_LOGIN_TITLE || "Sign in",
  loginSubtitle: process.env.NEXT_PUBLIC_LOGIN_SUBTITLE || "Access your workspace",
  welcomeLabel: process.env.NEXT_PUBLIC_WELCOME_LABEL || "Welcome",
};

const CONFIG = {
  ...CONSTANTS,
  ...VARIABLES,
  branding: BRANDING,
};

export default CONFIG;
