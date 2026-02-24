/**
 * Utility for conditionally joining class names
 * A simple alternative to clsx/classnames for NativeWind
 */

type ClassValue = string | undefined | null | false | ClassValue[];

/**
 * Combines class names, filtering out falsy values
 * @param classes - Class names to combine
 * @returns Combined class string
 */
export function cn(...classes: ClassValue[]): string {
  return classes
    .flat()
    .filter((cls): cls is string => typeof cls === "string" && cls.length > 0)
    .join(" ");
}
