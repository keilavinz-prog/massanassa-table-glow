const LOGO_URL = "/__l5e/assets-v1/3aeddd0c-e789-4f40-8a88-3513ba418e94/logo-40.png";

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
