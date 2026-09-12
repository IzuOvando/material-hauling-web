export const whiteLabelConfig = {
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || "SEDENA: Trucks",
    shortName: process.env.NEXT_PUBLIC_APP_SHORT_NAME || "SEDENA",
    tagline: process.env.NEXT_PUBLIC_APP_TAGLINE || "Sistema de Acarreos SEDENA",
    locale: process.env.NEXT_PUBLIC_LOCALE || "es",
  },
  branding: {
    logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || "/images/logos/logo_mexico.svg",
    primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || "#133223",
    secondaryColor: process.env.NEXT_PUBLIC_SECONDARY_COLOR || "#bc955c",
    accentColor: process.env.NEXT_PUBLIC_ACCENT_COLOR || "#9d2449",
  },
  auth: {
    loginTitle: process.env.NEXT_PUBLIC_LOGIN_TITLE || "Iniciar Sesión",
    loginSubtitle: process.env.NEXT_PUBLIC_LOGIN_SUBTITLE || "Ingresa Credenciales",
    welcomeLabel: process.env.NEXT_PUBLIC_WELCOME_LABEL || "Bienvenido",
  },
};

export default whiteLabelConfig;
