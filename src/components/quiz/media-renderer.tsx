import Image from "next/image";

interface MediaRendererProps {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}

export function MediaRenderer({
  src,
  alt,
  sizes,
  priority,
}: MediaRendererProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      sizes={sizes}
      priority={priority}
    />
  );
}
