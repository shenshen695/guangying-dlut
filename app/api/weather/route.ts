import { NextResponse } from "next/server";

/**
 * GET /api/weather
 * 从 wttr.in 获取大连今日 + 未来三天天气，返回格式化摘要。
 * 若请求失败返回 { error: true }，前端自动回退到季节推荐。
 */

const WEATHER_CODE_ZH: Record<number, string> = {
  113: "晴",
  116: "晴间多云",
  119: "多云",
  122: "阴",
  143: "有雾",
  176: "局部小雨",
  179: "局部小雪",
  182: "雨夹雪",
  185: "冻雨",
  200: "雷阵雨",
  227: "大雪",
  230: "暴雪",
  248: "浓雾",
  260: "冻雾",
  263: "小阵雨",
  266: "小雨",
  281: "冻毛毛雨",
  284: "冻毛毛雨",
  293: "局部小雨",
  296: "小雨",
  299: "中雨",
  302: "中雨",
  305: "局部大雨",
  308: "大雨",
  311: "冻雨",
  314: "冻雨",
  317: "雨夹雪",
  320: "小雪夹雨",
  323: "局部小雪",
  326: "小雪",
  329: "局部中雪",
  332: "中雪",
  335: "局部大雪",
  338: "大雪",
  350: "冰雹",
  353: "阵雨",
  356: "中阵雨",
  359: "大阵雨",
  362: "阵性雨夹雪",
  365: "阵性雨夹雪",
  368: "阵雪",
  371: "大阵雪",
  374: "阵性冰雹",
  377: "中到大冰雹",
  386: "局部雷阵雨",
  389: "雷阵雨",
  392: "局部雷雪",
  395: "局部暴雪",
  398: "雷雪",
};

function translateDesc(code: number, fallback: string): string {
  return WEATHER_CODE_ZH[code] ?? (fallback.trim() || "未知天气");
}

type DayWeather = {
  date: string;         // YYYY-MM-DD
  label: string;        // 今天 / 明天 / 后天 / 大后天
  descZh: string;
  weatherCode: number;
  maxTempC: number;
  minTempC: number;
  precipMM: number;
  snowCM: number;
  windKmph: number;
};

type WeatherResponse =
  | { error: false; days: DayWeather[] }
  | { error: true };

function dayLabel(idx: number): string {
  return ["今天", "明天", "后天", "大后天"][idx] ?? `第${idx + 1}天`;
}

export async function GET(): Promise<NextResponse<WeatherResponse>> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(
      "https://wttr.in/%E5%A4%A7%E8%BF%9E?format=j1",
      { signal: controller.signal, next: { revalidate: 1800 } }
    );
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`wttr.in ${res.status}`);
    const data = await res.json();

    const weather: unknown[] = data.weather ?? [];
    if (!weather.length) throw new Error("No weather array");

    // wttr.in 的 weather 数组包含今天起 3 天（索引 0-2），我们取前 4 天（可能只有 3）
    const days: DayWeather[] = weather.slice(0, 4).map((day: unknown, idx) => {
      const d = day as Record<string, unknown>;
      const hourly = (d.hourly as Record<string, unknown>[])?.[4] ?? {}; // 正午时段
      const code = parseInt(String((hourly as Record<string, unknown>).weatherCode ?? d.weatherCode ?? "113"), 10);
      const engDesc = String(
        ((hourly as Record<string, unknown>).weatherDesc as { value?: string }[])?.[0]?.value ?? ""
      );
      return {
        date: String(d.date ?? ""),
        label: dayLabel(idx),
        descZh: translateDesc(code, engDesc),
        weatherCode: code,
        maxTempC: parseInt(String(d.maxtempC ?? "0"), 10),
        minTempC: parseInt(String(d.mintempC ?? "0"), 10),
        precipMM: parseFloat(String(d.hourly ? (d.hourly as Record<string, unknown>[])[4]?.precipMM ?? "0" : "0")),
        snowCM: parseFloat(String(d.totalSnow_cm ?? "0")),
        windKmph: parseInt(String((d.hourly as Record<string, unknown>[])?.[4]?.windspeedKmph ?? "0"), 10),
      };
    });

    return NextResponse.json({ error: false, days });
  } catch {
    return NextResponse.json({ error: true });
  }
}
