import { Text, View } from "react-native";
import Svg, { Circle, G, Line, Path, Circle as SvgCircle, Text as SvgText } from "react-native-svg";
import { useTheme } from "../theme/useTheme";
import { semaphoreColor, type SemaphoreStatus } from "../theme/colors";

interface DonutSlice {
  name: string;
  color: string;
  amount: number;
  percent: number;
}

export function DonutChart({
  data,
  centerLabel,
  centerSubLabel,
  size = 150,
}: {
  data: DonutSlice[];
  centerLabel: string;
  centerSubLabel: string;
  size?: number;
}) {
  const { colors } = useTheme();
  const r = size * 0.44;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G rotation={-90} originX={cx} originY={cy}>
        {data.length === 0 ? (
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={colors.grid} strokeWidth={size * 0.125} />
        ) : (
          data.map((slice, i) => {
            const len = (slice.percent / 100) * circumference;
            const offset = -((cumulative / 100) * circumference);
            cumulative += slice.percent;
            return (
              <Circle
                key={i}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={slice.color}
                strokeWidth={size * 0.125}
                strokeDasharray={`${len} ${circumference - len}`}
                strokeDashoffset={offset}
              />
            );
          })
        )}
      </G>
      <SvgText x={cx} y={cy - 4} fontSize={size * 0.115} fontWeight="800" fill={colors.text1} textAnchor="middle">
        {centerLabel}
      </SvgText>
      <SvgText x={cx} y={cy + 14} fontSize={size * 0.065} fontWeight="600" fill={colors.muted} textAnchor="middle">
        {centerSubLabel}
      </SvgText>
    </Svg>
  );
}

export function BarChartMonthly({
  data,
  width = 320,
  height = 150,
}: {
  data: { label: string; total: number; isCurrent: boolean }[];
  width?: number;
  height?: number;
}) {
  const { colors } = useTheme();
  const max = Math.max(...data.map((d) => d.total), 1);
  const chartH = height - 26;
  const gap = 12;
  const barW = (width - gap * (data.length - 1)) / data.length;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {data.map((d, i) => {
        const h = Math.max(4, (d.total / max) * chartH);
        const x = i * (barW + gap);
        const y = chartH - h;
        return (
          <G key={i}>
            <Path
              d={`M${x},${y + 6} a6,6 0 0 1 6,-6 h${barW - 12} a6,6 0 0 1 6,6 v${h - 6} h${-barW} z`}
              fill={d.isCurrent ? colors.brand : colors.brand}
              opacity={d.isCurrent ? 1 : 0.32}
            />
            <SvgText
              x={x + barW / 2}
              y={height - 4}
              fontSize={10}
              fontWeight={d.isCurrent ? "800" : "600"}
              fill={d.isCurrent ? colors.brandStrong : colors.muted}
              textAnchor="middle"
            >
              {d.label}
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

export function BalanceLineChart({
  data,
  width = 320,
  height = 140,
}: {
  data: { label: string; balance: number }[];
  width?: number;
  height?: number;
}) {
  const { colors } = useTheme();
  if (data.length === 0) return null;
  const values = data.map((d) => d.balance);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 1);
  const range = max - min || 1;
  const chartH = height - 24;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;

  const points = data.map((d, i) => ({
    x: data.length > 1 ? i * stepX : width / 2,
    y: chartH - ((d.balance - min) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${points[points.length - 1].x},${chartH} L${points[0].x},${chartH} Z`;
  const last = points[points.length - 1];

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <Line x1={0} y1={chartH * 0.25} x2={width} y2={chartH * 0.25} stroke={colors.grid} strokeWidth={1} />
      <Line x1={0} y1={chartH * 0.75} x2={width} y2={chartH * 0.75} stroke={colors.grid} strokeWidth={1} />
      <Path d={areaPath} fill={colors.brand} opacity={0.12} />
      <Path d={linePath} fill="none" stroke={colors.brand} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.slice(0, -1).map((p, i) => (
        <SvgCircle key={i} cx={p.x} cy={p.y} r={3} fill={colors.brand} />
      ))}
      <SvgCircle cx={last.x} cy={last.y} r={5} fill={colors.surface} stroke={colors.brand} strokeWidth={2.5} />
      {data.map((d, i) => (
        <SvgText
          key={i}
          x={data.length > 1 ? i * stepX : width / 2}
          y={height - 4}
          fontSize={9.5}
          fontWeight="600"
          fill={colors.muted}
          textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"}
        >
          {d.label}
        </SvgText>
      ))}
    </Svg>
  );
}

export function GaugeArc({ percent, status, size = 92 }: { percent: number; status: SemaphoreStatus; size?: number }) {
  const { colors } = useTheme();
  const w = size;
  const h = size * 0.6;
  const r = size * 0.46;
  const cx = w / 2;
  const cy = h - 4;
  const arcLen = Math.PI * r;
  const filled = Math.min(100, Math.max(0, percent));
  const dash = (filled / 100) * arcLen;
  const color = semaphoreColor(colors, status);

  return (
    <Svg width={w} height={h + 4} viewBox={`0 0 ${w} ${h + 4}`}>
      <Path
        d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke={colors.grid}
        strokeWidth={size * 0.135}
        strokeLinecap="round"
      />
      <Path
        d={`M${cx - r},${cy} A${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke={color}
        strokeWidth={size * 0.135}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${arcLen}`}
      />
      <SvgText x={cx} y={cy - h * 0.12} fontSize={size * 0.19} fontWeight="800" fill={color} textAnchor="middle">
        {`${Math.round(percent)}%`}
      </SvgText>
    </Svg>
  );
}

export function CircularProgress({
  percent,
  size = 104,
  color,
  trackColor,
  label,
  sublabel,
}: {
  percent: number;
  size?: number;
  color: string;
  trackColor: string;
  label: string;
  sublabel?: string;
}) {
  const { colors } = useTheme();
  const r = size * 0.43;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const filled = Math.min(100, Math.max(0, percent));
  const dash = (filled / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: "absolute" }}>
        <G rotation={-90} originX={cx} originY={cy}>
          <Circle cx={cx} cy={cy} r={r} fill="none" stroke={trackColor} strokeWidth={size * 0.095} />
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={size * 0.095}
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference - dash}`}
          />
        </G>
      </Svg>
      <Text style={{ fontSize: size * 0.19, fontWeight: "800", color: colors.text1 }}>{label}</Text>
      {sublabel ? <Text style={{ fontSize: size * 0.1, color: colors.muted, fontWeight: "600" }}>{sublabel}</Text> : null}
    </View>
  );
}
