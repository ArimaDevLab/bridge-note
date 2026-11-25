import Link from "next/link";
import type { WorkSummary } from "@/lib/types";
import { deviceLabel, platformText, stageLabel, tint } from "@/lib/labels";
import { DeviceFrame } from "./DeviceFrame";
import { HeartIcon } from "./icons";

export function WorkCard({ work, categoryName }: { work: WorkSummary; categoryName: string }) {
  const t = tint(work.category_slug);
  const platform = platformText(work);
  const stage = stageLabel(work.stage);
  return (
    <Link href={`/works/${work.slug}`} className="card">
      <div className="card__shot" style={{ background: t.bg }}>
        {work.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- 投稿者の画像URLは事前に分からない
          <img className="card__thumb" src={work.thumbnail_url} alt={`${work.name}の紹介画像`} loading="lazy" />
        ) : (
          <DeviceFrame device={work.device} shot={work.screenshots?.[0]} alt={`${work.name}の画面`} />
        )}
        <span className="card__badges">
          <span className="badge">{categoryName}</span>
          {work.audience === "business" && <span className="badge badge--dark">法人向け</span>}
          {stage && <span className="badge badge--stage">{stage}</span>}
        </span>
      </div>
      <div className="card__body">
        <div className="card__title">
          <h3 className="card__name">{work.name}</h3>
          <span className="card__cheer" aria-label={`応援 ${work.cheer_count}`}>
            <HeartIcon size={14} />
            {work.cheer_count}
          </span>
        </div>
        <p className="card__tagline">{work.tagline}</p>
        <p className="card__meta">
          {[deviceLabel(work.device), platform, work.author?.display_name].filter(Boolean).join(" ・ ")}
        </p>
      </div>
    </Link>
  );
}
