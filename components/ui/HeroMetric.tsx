import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutChangeEvent } from 'react-native';
import { useThemeContext } from 'context/ThemeProvider';
import { typo, radius } from 'constants/design';
import Sparkline from './Sparkline';

interface HeroMetricProps {
  /** short eyebrow label, e.g. "NET PROFIT" */
  label: string;
  /** preformatted value, e.g. "£84,200" */
  value: string;
  /** small qualifier next to the number, e.g. "32% margin" */
  sublabel?: string;
  /** statement-style stamp, e.g. "as of 22 Jun, 14:30" */
  asOf?: string;
  /** trend series for the sparkline */
  series?: number[];
  /** caption for the trend, e.g. "Sales · last 7 days" */
  seriesCaption?: string;
  /** signed change; shown inline when there's no sparkline, else by the caption */
  delta?: { pct: number } | null;
  /** optional ledger line under the rule (e.g. a Gross / Expenses breakdown) */
  footer?: React.ReactNode;
  /** 'card' = filled slate surface; 'plain' = borderless on the screen background */
  variant?: 'card' | 'plain';
  onPress?: () => void;
}

/**
 * The single hero metric per screen — an extrabold tabular number with an optional
 * hairline "ledger rule" and trend. `plain` drops the surface for airy layouts.
 */
export default function HeroMetric({
  label,
  value,
  sublabel,
  asOf,
  series,
  seriesCaption,
  delta,
  footer,
  variant = 'card',
  onPress,
}: HeroMetricProps) {
  const { colors } = useThemeContext();
  const [chartW, setChartW] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setChartW(e.nativeEvent.layout.width);

  const plain = variant === 'plain';
  const up = (delta?.pct ?? 0) >= 0;
  const deltaColor = up ? colors.success : colors.error;
  const hasTrend = !!series && series.length > 1;
  const inlineDelta = !!delta && !hasTrend;

  const c = {
    label: plain ? colors.muted : 'rgba(255,255,255,0.7)',
    value: plain ? colors.text : '#FFFFFF',
    sub: plain ? colors.muted : 'rgba(255,255,255,0.6)',
    stamp: plain ? colors.muted : 'rgba(255,255,255,0.45)',
    rule: plain ? colors.border : 'rgba(255,255,255,0.15)',
    spark: plain ? colors.primary : '#FFFFFF',
    sparkFill: plain ? colors.primary + '14' : 'rgba(255,255,255,0.10)',
    caption: plain ? colors.muted : 'rgba(255,255,255,0.55)',
  };

  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper
      activeOpacity={0.9}
      onPress={onPress}
      style={plain ? undefined : { backgroundColor: colors.primary, borderRadius: radius.card }}
      className={plain ? '' : 'overflow-hidden p-5'}>
      <View className="flex-row items-center justify-between">
        <Text style={[typo.eyebrow, { color: c.label }]}>{label.toUpperCase()}</Text>
        {asOf ? <Text style={{ color: c.stamp, fontSize: 11 }}>{asOf}</Text> : null}
      </View>

      <View className="mt-2 flex-row items-baseline justify-between">
        <View className="flex-1 flex-row items-baseline">
          <Text style={[typo.display, { color: c.value }]} numberOfLines={1}>
            {value}
          </Text>
          {sublabel ? (
            <Text style={{ color: c.sub, fontSize: 15, marginLeft: 8, fontWeight: '600' }}>
              {sublabel}
            </Text>
          ) : null}
        </View>
        {inlineDelta ? (
          <Text
            style={{ color: deltaColor, fontSize: 13, marginLeft: 8, fontVariant: ['tabular-nums'] }}>
            {up ? '▲' : '▼'} {Math.abs(delta!.pct).toFixed(0)}%
          </Text>
        ) : null}
      </View>

      {hasTrend || footer ? (
        <>
          <View className="my-4 h-px" style={{ backgroundColor: c.rule }} onLayout={onLayout} />

          {hasTrend ? (
            <View>
              <Sparkline
                data={series!}
                width={chartW}
                height={40}
                color={c.spark}
                fillColor={c.sparkFill}
              />
              <View className="mt-2 flex-row items-center justify-between">
                <Text style={{ color: c.caption, fontSize: 13, fontWeight: '500' }}>
                  {seriesCaption}
                </Text>
                {delta ? (
                  <Text style={{ color: deltaColor, fontSize: 12, fontVariant: ['tabular-nums'] }}>
                    {up ? '▲' : '▼'} {Math.abs(delta.pct).toFixed(0)}%
                  </Text>
                ) : null}
              </View>
            </View>
          ) : null}

          {footer ? <View>{footer}</View> : null}
        </>
      ) : null}
    </Wrapper>
  );
}
