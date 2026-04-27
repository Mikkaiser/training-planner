import { Skeleton } from "@/components/shared/skeletons";

export default function AppSegmentLoading() {
  return (
    <div aria-hidden className="mx-auto flex w-full max-w-[1400px] flex-col px-[45px] py-[40px]">
      <div className="flex flex-col gap-[18px]">
        <Skeleton width={240} height={28} borderRadius={10} />
        <Skeleton width={420} height={16} borderRadius={8} />
      </div>
      <div className="mt-7">
        <Skeleton width="100%" height={240} borderRadius={18} />
      </div>
    </div>
  );
}

