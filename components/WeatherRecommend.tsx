"use client";

import { useEffect, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type DayWeather = {
  date: string;
  label: string;
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

type SeasonKey = "春" | "夏" | "秋" | "冬" | "四季经典";

type SpotEntry = {
  name: string;
  intro: string;
};

// ── 季节判断 ──────────────────────────────────────────────────────────────────

function getCurrentSeason(month: number): SeasonKey {
  if (month >= 3 && month <= 5) return "春";
  if (month >= 6 && month <= 8) return "夏";
  if (month >= 9 && month <= 11) return "秋";
  return "冬";
}

// ── 打卡地点数据 ──────────────────────────────────────────────────────────────

const SEASON_SPOTS: Record<SeasonKey, SpotEntry[]> = {
  春: [
    { name: "伯川玉兰", intro: "三月底至四月初玉兰盛开，伯川图书馆台阶前白色花海，是春季最短暂也最惊艳的机位。" },
    { name: "伯川二月兰", intro: "四月中旬二月兰成片开放，紫色小花铺满草坪，晨光下色彩柔和，适合低角度仰拍。" },
    { name: "二馆玉兰", intro: "建筑馆附近玉兰与建筑线条相映成趣，花期与伯川玉兰基本同步，人相对较少。" },
  ],
  夏: [
    { name: "情人路", intro: "夏季绿荫成拱，光斑透过叶隙洒落，上午光线最柔和，适合慢走、谈笑的自然抓拍。" },
    { name: "情人坡", intro: "坡上草坪郁郁葱葱，傍晚侧逆光勾勒轮廓，是夏季人像最经典的机位之一。" },
    { name: "凌水湖", intro: "傍晚湖面逆光倒影，夏季水草茂盛，色彩层次丰富，推荐黄金时段前往。" },
  ],
  秋: [
    { name: "二馆与建艺银杏", intro: "十月下旬银杏转黄，二馆与建筑馆周边是校内银杏密度最高的区域，推荐晴天上午前往。" },
    { name: "一馆银杏林道", intro: "一馆前的银杏林道形成金色隧道，人物穿行其中，竖构图极易出片。" },
    { name: "情人路", intro: "秋季暖色调叶片飘落，与夏季的青绿截然不同，适合捕捉落叶飘散的瞬间。" },
  ],
  冬: [
    { name: "情人坡雪景", intro: "降雪后情人坡白雪皑皑，是校内冬季最清透的人像场景，注意防滑，雪后48小时内最佳。" },
  ],
  四季经典: [
    { name: "南门", intro: "校园入口的标志性场景，开阔构图适合合影与开场照，任何季节都是路线首选开场。" },
    { name: "主席像", intro: "校园地标之一，严肃庄重，适合正式纪念照，建筑辨识度高，全年可拍。" },
    { name: "音乐喷泉", intro: "主楼前广场喷泉，傍晚开启时水雾与落日光线交汇，是全年都适合收尾的暖色机位。" },
    { name: "凌水湖", intro: "四季各有风景：春日花影、夏日绿荫、秋日金色、冬日雾气，是最全能的机位之一。" },
    { name: "花墙", intro: "色彩明亮的花卉背景墙，适合作为路线最后一个点位，留下轻快明亮的收尾画面。" },
  ],
};

// ── 天气代码分类 ──────────────────────────────────────────────────────────────

function isRain(code: number) { return [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(code); }
function isSnow(code: number) { return [71, 73, 75, 77, 85, 86].includes(code); }
function isSunny(code: number) { return code === 0 || code === 1; }
function isCloudy(code: number) { return [2, 3].includes(code); }
function isThunder(code: number) { return [95, 96, 99].includes(code); }
function isFoggy(code: number) { return [45, 48].includes(code); }

const WMO_ZH: Record<number, string> = {
  0: "晴", 1: "晴间多云", 2: "多云", 3: "阴",
  45: "有雾", 48: "雾凇",
  51: "小毛毛雨", 53: "毛毛雨", 55: "较强毛毛雨", 56: "轻微冻雨", 57: "冻雨",
  61: "小雨", 63: "中雨", 65: "大雨", 66: "轻微冻雨", 67: "较强冻雨",
  71: "小雪", 73: "中雪", 75: "大雪", 77: "米雪",
  80: "小阵雨", 81: "阵雨", 82: "强阵雨", 85: "小阵雪", 86: "强阵雪",
  95: "雷雨", 96: "雷雨伴冰雹", 99: "强雷雨伴冰雹",
};

// ── 推荐机位与时段 ────────────────────────────────────────────────────────────

type DayRec = {
  spots: string[];
  reason: string;
  timeSlot: string;
};

function buildDayRec(day: DayWeather, month: number): DayRec {
  const isSnowing = isSnow(day.weatherCode) || day.snowCM > 0;
  const isRaining = isRain(day.weatherCode) || day.precipMM > 3;
  const isWindy = day.windKmph > 35;
  const isThundering = isThunder(day.weatherCode);

  // 雷雨 / 大雨 / 大风
  if (isThundering || (isRaining && day.precipMM > 8) || isWindy) {
    return {
      spots: ["伯川图书馆内廊", "令希图书馆", "综合一号楼门厅"],
      reason: `${day.descZh}，风雨较大，建议选择室内或有遮挡的半室内机位拍摄，安全第一。`,
      timeSlot: "视天气间隙灵活安排",
    };
  }
  // 雪天
  if (isSnowing) {
    return {
      spots: ["情人坡雪景", "伯川台阶"],
      reason: `${day.descZh}，雪后情人坡白雪皑皑，是校内最清透的雪景人像机位；注意防滑，积雪后24小时内最佳。`,
      timeSlot: "上午 08:00–10:00（雪后光线最纯净）",
    };
  }
  // 小雨
  if (isRaining) {
    return {
      spots: ["伯川台阶（有屋檐遮挡）", "大活前廊"],
      reason: `${day.descZh}，小雨散射光柔和，可借助屋檐遮挡在半室内拍摄，雨幕背景也有独特氛围感。`,
      timeSlot: "上午或下午雨小时前往",
    };
  }
  // 大雾
  if (isFoggy(day.weatherCode)) {
    return {
      spots: ["凌水湖", "情人路"],
      reason: `${day.descZh}，雾气为画面增添朦胧感，凌水湖和情人路树荫内尤其出片，注意湖边地面湿滑。`,
      timeSlot: "早晨 07:30–09:00（雾最浓厚）",
    };
  }
  // 晴天
  if (isSunny(day.weatherCode)) {
    // 春季花期（3-4月）
    if (month >= 3 && month <= 4) {
      return {
        spots: ["伯川玉兰", "伯川二月兰", "二馆玉兰"],
        reason: `${day.descZh}，晴好天气正值春季花期，伯川玉兰与二月兰光线通透，请抓住短暂窗口期前往拍摄。`,
        timeSlot: "上午 08:30–10:30（侧光最美）",
      };
    }
    // 秋季银杏（10-11月）
    if (month >= 10 && month <= 11) {
      return {
        spots: ["二馆与建艺银杏", "一馆银杏林道", "情人路"],
        reason: `${day.descZh}，秋高气爽，银杏正值金黄期，上午侧光勾勒金色叶片，推荐尽早前往避开人流。`,
        timeSlot: "上午 09:00–11:00（侧光最佳）",
      };
    }
    // 夏季
    if (month >= 6 && month <= 8) {
      return {
        spots: ["情人路", "凌水湖", "情人坡"],
        reason: `${day.descZh}，夏季晴天绿荫浓郁，情人路光斑柔和，凌水湖傍晚逆光绝佳。`,
        timeSlot: "上午 08:00–10:00 或傍晚 17:00–19:00",
      };
    }
    // 冬季晴天
    return {
      spots: ["主席像", "伯川台阶", "一馆银杏林道"],
      reason: `${day.descZh}，冬季晴天光线明亮，建筑类机位对比清晰，推荐上午顺光方向拍摄正式纪念照。`,
      timeSlot: "上午 09:30–11:30（阳光充足）",
    };
  }
  // 阴天（散射光均匀）
  if (isCloudy(day.weatherCode)) {
    return {
      spots: ["主席像", "伯川", "主楼"],
      reason: `${day.descZh}，阴天散射光均匀柔和，无强烈反差，建筑感强的地标机位尤其出片，适合正式纪念照。`,
      timeSlot: "全天均可，上午人少优先",
    };
  }
  // 默认
  return {
    spots: ["南门", "凌水湖", "花墙"],
    reason: `${day.descZh}，综合天气状况，推荐经典地标路线，兼顾室外与遮挡备选。`,
    timeSlot: "上午或傍晚",
  };
}

// ── 季节后备推荐 ──────────────────────────────────────────────────────────────

type SeasonFallbackRec = {
  spots: string[];
  reason: string;
  timeSlot: string;
};

function getSeasonFallback(month: number): SeasonFallbackRec {
  const season = getCurrentSeason(month);
  const map: Record<SeasonKey, SeasonFallbackRec> = {
    春: {
      spots: ["伯川玉兰", "伯川二月兰", "二馆玉兰"],
      reason: "四月是大工最适合拍花的季节，伯川玉兰、二月兰与二馆玉兰相继开放，花期短暂，请抓住时机。",
      timeSlot: "上午 08:30–10:30",
    },
    夏: {
      spots: ["情人路", "情人坡", "凌水湖"],
      reason: "夏季情人路与情人坡绿荫成拱，凌水湖傍晚逆光效果绝佳，是全年步行体验最好的季节。",
      timeSlot: "上午 08:00–10:00 或傍晚 17:00–19:00",
    },
    秋: {
      spots: ["二馆与建艺银杏", "一馆银杏林道", "情人路"],
      reason: "秋季二馆与建艺附近银杏金黄，一馆银杏林道同样出片，情人路暖色调锦上添花。",
      timeSlot: "上午 09:00–11:00",
    },
    冬: {
      spots: ["情人坡雪景", "主席像", "伯川台阶"],
      reason: "冬季降雪后情人坡白雪皑皑，晴天主席像与伯川台阶光线明亮，是冬季首选机位。",
      timeSlot: "上午 09:00–11:00",
    },
    四季经典: {
      spots: ["南门", "主席像", "凌水湖"],
      reason: "经典地标全年可拍，适合任何季节。",
      timeSlot: "上午或傍晚",
    },
  };
  return map[season];
}

// ── 天气图标 ──────────────────────────────────────────────────────────────────

function weatherIcon(code: number, snowCM: number): string {
  if (snowCM > 0 || isSnow(code)) return "🌨";
  if (isThunder(code)) return "⛈";
  if (isRain(code)) return "🌧";
  if (isFoggy(code)) return "🌫";
  if (isSunny(code)) return "☀️";
  if (isCloudy(code)) return "☁️";
  return "🌤";
}

// ── 主组件 ────────────────────────────────────────────────────────────────────

type Props = {
  onAddSpot?: (name: string) => void;
};

export default function WeatherRecommend({ onAddSpot }: Props) {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState<Set<string>>(new Set());

  const month = new Date().getMonth() + 1;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => controller.abort(), 7000);
    const url = new URL("https://api.open-meteo.com/v1/forecast");
    url.searchParams.set("latitude", "38.914");
    url.searchParams.set("longitude", "121.614");
    url.searchParams.set("daily", "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum,wind_speed_10m_max");
    url.searchParams.set("timezone", "Asia/Shanghai");
    url.searchParams.set("forecast_days", "4");

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("weather unavailable");
        return response.json();
      })
      .then((json) => {
        const daily = json?.daily;
        if (!daily?.time?.length) throw new Error("weather unavailable");
        const labels = ["今天", "明天", "后天", "大后天"];
        const days: DayWeather[] = daily.time.slice(0, 4).map((date: string, index: number) => {
          const code = Number(daily.weather_code?.[index] ?? 0);
          return {
            date,
            label: labels[index] ?? date,
            descZh: WMO_ZH[code] ?? "天气变化",
            weatherCode: code,
            maxTempC: Math.round(Number(daily.temperature_2m_max?.[index] ?? 0)),
            minTempC: Math.round(Number(daily.temperature_2m_min?.[index] ?? 0)),
            precipMM: Number(daily.precipitation_sum?.[index] ?? 0),
            snowCM: Number(daily.snowfall_sum?.[index] ?? 0),
            windKmph: Math.round(Number(daily.wind_speed_10m_max?.[index] ?? 0)),
          };
        });
        setData({ error: false, days });
      })
      .catch(() => setData({ error: true }))
      .finally(() => {
        window.clearTimeout(timer);
        setLoading(false);
      });

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, []);

  if (loading) {
    return (
      <div className="gy-weather-section loading">
        <p className="gy-weather-loading">天气信息加载中…</p>
      </div>
    );
  }

  const isFallback = !data || data.error;
  const fallback = getSeasonFallback(month);

  // ── Fallback UI ──
  if (isFallback) {
    return (
      <div className="gy-weather-section">
        <div className="gy-weather-header">
          <span className="gy-weather-source-tag">按季节推荐</span>
          <span className="gy-weather-unavail">（天气接口暂不可用）</span>
        </div>
        <div className="gy-weather-fallback-card">
          <p className="gy-weather-reason">{fallback.reason}</p>
          <div className="gy-weather-spots-row">
            {fallback.spots.map((s) => (
              <span key={s} className="gy-weather-spot-tag">{s}</span>
            ))}
          </div>
          <p className="gy-weather-timeslot">⏱ 建议时段：{fallback.timeSlot}</p>
        </div>
      </div>
    );
  }

  const days = data.days.slice(0, 4);
  const today = days[0];
  const todayRec = today ? buildDayRec(today, month) : null;

  return (
    <div className="gy-weather-section">
      <div className="gy-weather-header">
        <h3 className="gy-weather-title">天气与拍摄推荐</h3>
        <span className="gy-weather-source-tag">未来四日 · 大连 · Open-Meteo</span>
      </div>

      {today && todayRec && (
        <div className="gy-weather-today">
          <div className="gy-weather-day-head">
            <span className="gy-weather-day-icon">{weatherIcon(today.weatherCode, today.snowCM)}</span>
            <div>
              <p className="gy-weather-day-label">今天 · {today.descZh}</p>
              <p className="gy-weather-day-desc">{today.minTempC}°–{today.maxTempC}°C · 风力 {today.windKmph}km/h</p>
            </div>
            {(today.precipMM > 0 || today.snowCM > 0) && (
              <div className="gy-weather-day-meta">
                {today.precipMM > 0 && <span>降水 {today.precipMM.toFixed(1)}mm</span>}
                {today.snowCM > 0 && <span>降雪 {today.snowCM.toFixed(1)}cm</span>}
              </div>
            )}
          </div>
          <div className="gy-weather-day-rec">
            <p className="gy-weather-rec-label">今日推荐机位</p>
            <div className="gy-weather-spots-row">
              {todayRec.spots.map((spotName) => (
                <button
                  key={spotName}
                  type="button"
                  className={`gy-weather-spot-tag is-button${added.has(spotName) ? " is-added" : ""}`}
                  onClick={() => {
                    onAddSpot?.(spotName);
                    setAdded((previous) => new Set(previous).add(spotName));
                  }}
                >
                  {added.has(spotName) ? "✓ 已加入 " : "＋ "}{spotName}
                </button>
              ))}
            </div>
            <p className="gy-weather-reason">{todayRec.reason}</p>
            <p className="gy-weather-timeslot">建议拍摄时段：{todayRec.timeSlot}</p>
          </div>
        </div>
      )}

      <div className="gy-weather-forecast" aria-label="未来三天天气">
        {days.slice(1).map((day) => {
          const rec = buildDayRec(day, month);
          return (
            <article key={day.date} className="gy-weather-forecast-card">
              <div className="gy-weather-forecast-head">
                <span>{weatherIcon(day.weatherCode, day.snowCM)}</span>
                <div><strong>{day.label}</strong><small>{day.descZh}</small></div>
                <b>{day.minTempC}°–{day.maxTempC}°</b>
              </div>
              <p>{day.precipMM > 0 ? `降水 ${day.precipMM.toFixed(1)}mm` : "无明显降水"} · 风力 {day.windKmph}km/h</p>
              <p className="gy-weather-forecast-rec">推荐：{rec.spots.slice(0, 2).join("、")}</p>
              <small>{rec.timeSlot}</small>
            </article>
          );
        })}
      </div>
    </div>
  );
}
