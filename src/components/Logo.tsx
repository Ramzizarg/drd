import Image from "next/image";
import Link from "next/link";

const LOGO_SRC = "/drd-logo.png";
const LOGO_WIDTH = 720;
const LOGO_HEIGHT = 542;

type LogoProps = {
  height?: number;
  className?: string;
  href?: string;
  priority?: boolean;
};

export function Logo({
  height = 44,
  className = "",
  href,
  priority = false,
}: LogoProps) {
  const width = Math.round((LOGO_WIDTH / LOGO_HEIGHT) * height);

  const image = (
    <Image
      src={LOGO_SRC}
      alt="DRD Fashion"
      width={width}
      height={height}
      className={`object-contain ${className}`}
      priority={priority}
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center">
        {image}
      </Link>
    );
  }

  return <span className="inline-flex items-center">{image}</span>;
}
