const LOGO_URL = "/__l5e/assets-v1/46715e6e-ecab-4d3c-96b5-e3e6c479cd8f/logo-40.png";

export function BrandLogo({ size = 40 }: { size?: number }) {
  return (
    <img
      src={LOGO_URL}
      alt="RESTAURANTE CHICKEN GARDEN"
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className="shrink-0 rounded-full bg-cream object-cover shadow-warm"
    />
  );
}
