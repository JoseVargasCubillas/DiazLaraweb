interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  radius?: number | string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Shimmer skeleton block. Pure CSS animation — see `.ui-skeleton` in advisor.css.
 */
export const Skeleton = ({ width = '100%', height = 14, radius = 6, className = '', style }: SkeletonProps) => (
  <span
    className={`ui-skeleton ${className}`}
    aria-hidden
    style={{
      width,
      height,
      borderRadius: radius,
      display: 'inline-block',
      ...style,
    }}
  />
);
