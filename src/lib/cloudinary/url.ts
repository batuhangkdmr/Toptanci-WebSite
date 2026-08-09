/**
 * Gösterim URL'si: WebP + agresif kalite + istenen boyut.
 * Depolanan dosya zaten küçültülmüş olsa da CDN tarafında ek optimize edilir.
 */
export function getOptimizedImageUrl(
  secureUrl: string,
  options?: { width?: number; height?: number },
): string {
  if (!secureUrl.includes("res.cloudinary.com")) {
    return secureUrl;
  }

  const transforms = [
    "f_webp",
    "q_auto:eco",
    "fl_lossy",
  ];

  if (options?.width && options?.height) {
    transforms.push(`c_fill`, `w_${options.width}`, `h_${options.height}`);
  } else if (options?.width) {
    transforms.push(`c_limit`, `w_${options.width}`);
  } else if (options?.height) {
    transforms.push(`c_limit`, `h_${options.height}`);
  }

  const transformStr = transforms.join(",");
  return secureUrl.replace("/upload/", `/upload/${transformStr}/`);
}
