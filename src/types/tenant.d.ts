declare module "@tenant" {
  const tenantOverrides: Record<string, unknown>;
  export default tenantOverrides;
}

declare module "@tenant-logo" {
  import type { StaticImageData } from "next/image";
  const tenantLogo: StaticImageData;
  export default tenantLogo;
}

declare module "@tenant-favicon" {
  import type { StaticImageData } from "next/image";
  const tenantFavicon: StaticImageData;
  export default tenantFavicon;
}
