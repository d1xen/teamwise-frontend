interface TeamWiseLogoProps {
  size?: number;
}

const GRADIENT = 'linear-gradient(90deg, #60A5FA, #6366F1, #A855F7)';

export default function TeamWiseLogo({ size = 64 }: TeamWiseLogoProps) {
  return (
    <span
      style={{
        fontFamily: "'Inter', sans-serif",
        fontWeight: 700,
        fontStyle: 'italic',
        fontSize: `${size}px`,
        lineHeight: 1,
      }}
      className="select-none"
    >
      <span style={{ color: '#FFFFFF' }}>team</span>
      <span
        style={{
          background: GRADIENT,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          paddingRight: '0.08em',
        }}
      >
        wise
      </span>
    </span>
  );
}
